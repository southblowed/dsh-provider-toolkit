/**
 * Service-level tests for dsh-provider-toolkit.
 *
 * The host half is instantiated on a bare `@deepseek-ai/cordis` Context — no
 * DSH profile, no settings provider — with its two settings reads replaced by
 * fixtures. That is enough to exercise the parts that matter end to end:
 *
 * - `overview()` reports the configured providers,
 * - `probe()` performs a real HTTP interrogation and returns metadata that the
 *   declared strict codecs accept,
 * - the installed `globalThis.fetch` wrapper really does hand the configured
 *   host's request its own undici dispatcher, while leaving other hosts alone.
 *
 * Run directly (the test runner spawns child processes the file sandbox
 * refuses):
 *
 *   pwsh> $env:PTK_ENTRY = "$env:DSH_HOME\profiles\web\node_modules\dsh-provider-toolkit\index.js"
 *   pwsh> node test/service.test.mjs
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const entry = process.env.PTK_ENTRY ?? join(here, '..', 'index.js')
const pkgRoot = dirname(entry)
const profileRequire = createRequire(join(pkgRoot, 'package.json'))

const { Context } = await import(pathToFileURL(profileRequire.resolve('@deepseek-ai/cordis')).href)
const { ProviderToolkitService } = await import(pathToFileURL(entry).href)

/** Serve one OpenRouter-style listing on a free loopback port. */
async function startListingServer() {
  const server = createServer((request, response) => {
    if (request.url !== '/v1/models') {
      response.writeHead(404).end()
      return
    }
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({
      data: [
        {
          id: 'acme-think',
          name: 'Acme Think',
          context_length: 262144,
          top_provider: { max_completion_tokens: 32768 },
          supported_parameters: ['reasoning_effort'],
        },
        { id: 'acme-plain', context_length: 8192 },
      ],
    }))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return { baseURL: `http://127.0.0.1:${port}/v1`, close: () => new Promise((resolve) => server.close(resolve)) }
}

test('the host half reports providers, probes an endpoint, and applies the per-host dispatcher', async () => {
  const server = await startListingServer()
  const originalFetch = globalThis.fetch
  /** Requests the wrapper forwarded, with the init it chose. */
  const observed = []
  const spy = (input, init) => {
    observed.push({ url: String(typeof input === 'string' ? input : input.url), init })
    return originalFetch(input, init)
  }
  globalThis.fetch = spy

  const ctx = new Context()
  const service = new ProviderToolkitService(ctx, {})
  try {
    // `overview()` — the settings reads are replaced by fixtures.
    service.llmSection = () => ({
      providers: {
        acme: {
          displayName: 'Acme Gateway',
          api: 'openai-completions',
          baseURL: server.baseURL,
          apiKeyEnv: 'ACME_API_KEY',
          models: [{ id: 'acme-think', name: 'Acme Think' }, { id: 'acme-retired' }],
        },
      },
    })
    service.policySection = () => ({
      network: { acme: { host: '127.0.0.1', skipProxy: true } },
    })

    const overview = await service.overview()
    assert.equal(overview.ok, true)
    assert.equal(overview.value.providers.length, 1)
    assert.equal(overview.value.providers[0].route, 'acme')
    assert.equal(overview.value.providers[0].host, '127.0.0.1')
    assert.equal(overview.value.providers[0].declaredModels.length, 2)
    assert.deepEqual(overview.value.live, [])

    // `probe()` — a real request through the installed wrapper.
    const probe = await service.probe({ route: 'acme' })
    assert.equal(probe.ok, true, JSON.stringify(probe))
    assert.equal(probe.value.endpoint, `${server.baseURL}/models`)
    assert.deepEqual(probe.value.models.map((model) => model.id), ['acme-think', 'acme-plain'])
    assert.equal(probe.value.models[0].contextWindow, 262144)
    assert.equal(probe.value.models[0].maxTokens, 32768)
    assert.deepEqual(probe.value.models[0].reasoningEfforts, { off: null, low: 'low', medium: 'medium', high: 'high' })
    assert.equal(probe.value.models[0].reasoningSource, 'metadata')
    assert.deepEqual(probe.value.configuredIds, ['acme-think', 'acme-retired'])
    assert.equal(probe.value.notes.length, 2)

    // The policy for 127.0.0.1 reached the request as its own dispatcher.
    const listing = observed.find((record) => record.url.endsWith('/v1/models'))
    assert.notEqual(listing, undefined)
    assert.equal(listing.init.dispatcher !== undefined, true, 'the configured host must receive the plugin dispatcher')

    // An unconfigured host is left completely alone.
    observed.length = 0
    await originalFetch(server.baseURL.replace('/v1', '/v1/models'))
    assert.equal(observed.length, 0, 'a host without a policy must not be intercepted')
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
  }
})

test('a probe for an unknown or endpoint-less route fails with a stable code', async () => {
  const originalFetch = globalThis.fetch
  const ctx = new Context()
  const service = new ProviderToolkitService(ctx, {})
  try {
    service.llmSection = () => ({ providers: { catalog: { displayName: 'Catalog' } } })
    const unknown = await service.probe({ route: 'nope' })
    assert.equal(unknown.ok, false)
    assert.equal(unknown.error.code, 'unknown-route')
    const missing = await service.probe({ route: 'catalog' })
    assert.equal(missing.ok, false)
    assert.equal(missing.error.code, 'missing-endpoint')
    const invalid = await service.probe({})
    assert.equal(invalid.ok, false)
    assert.equal(invalid.error.code, 'invalid-route')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('a rejected endpoint reports the HTTP status and never throws', async () => {
  const originalFetch = globalThis.fetch
  const server = createServer((_request, response) => {
    response.writeHead(401).end('nope')
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const ctx = new Context()
  const service = new ProviderToolkitService(ctx, {})
  try {
    service.llmSection = () => ({ providers: { acme: { baseURL: `http://127.0.0.1:${port}`, api: 'openai-completions' } } })
    service.policySection = () => ({})
    const result = await service.probe({ route: 'acme' })
    assert.equal(result.ok, false)
    assert.equal(result.error.code, 'http-error')
    assert.match(result.error.message, /401/)
  } finally {
    globalThis.fetch = originalFetch
    await new Promise((resolve) => server.close(resolve))
  }
})

//#region live verification

/**
 * A fake OpenAI-compatible gateway that accepts `low` and `high` but refuses
 * `medium`, refuses the `developer` role the way the user's CNPC gateway does,
 * and only accepts inline images from models whose id ends in `-vision`.
 */
async function startChatServer() {
  const seen = []
  const server = createServer((request, response) => {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', () => {
      const parsed = body.length > 0 ? JSON.parse(body) : {}
      seen.push({ url: request.url, body: parsed, authorization: request.headers.authorization })
      const first = Array.isArray(parsed.messages) && parsed.messages.length > 0 ? parsed.messages[0] : undefined
      if (first !== undefined && first.role === 'developer') {
        response.writeHead(400, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ code: '400001', error: { message: "Failed to deserialize the JSON body into the target type: messages[0].role: unknown variant `developer`" } }))
        return
      }
      if (first !== undefined && Array.isArray(first.content)) {
        const hasImage = first.content.some((part) => typeof part === 'object' && part !== null && part.type === 'image_url')
        if (hasImage && typeof parsed.model === 'string' && parsed.model.endsWith('-vision') !== true) {
          response.writeHead(400, { 'content-type': 'application/json' })
          response.end(JSON.stringify({ error: { message: 'model does not support images' } }))
          return
        }
      }
      const effort = parsed.reasoning_effort
      if (effort === 'medium') {
        response.writeHead(400, { 'content-type': 'application/json' })
        response.end(JSON.stringify({ error: { message: 'Invalid value: "medium". Supported values are: low, high' } }))
        return
      }
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({
        choices: [{ message: { content: 'pong', ...(effort === undefined ? {} : { reasoning_content: 'thinking…' }) } }],
      }))
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return { baseURL: `http://127.0.0.1:${port}/v1`, seen, close: () => new Promise((resolve) => server.close(resolve)) }
}

test('verification reports one verdict per tested level and only accepts what the endpoint accepts', async () => {
  const server = await startChatServer()
  const originalFetch = globalThis.fetch
  const ctx = new Context()
  const service = new ProviderToolkitService(ctx, {})
  try {
    service.llmSection = () => ({
      providers: {
        acme: {
          api: 'openai-completions',
          baseURL: server.baseURL,
          models: [{ id: 'acme-think' }],
        },
      },
    })
    service.policySection = () => ({})

    const result = await service.verifyReasoning({ route: 'acme' })
    assert.equal(result.ok, true, JSON.stringify(result))
    assert.equal(result.value.protocol, 'openai-completions')
    assert.equal(result.value.requests, 9)
    assert.deepEqual(result.value.levels, ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
    assert.equal(result.value.models.length, 1)
    const [model] = result.value.models
    assert.deepEqual(model.tested, ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
    assert.deepEqual(model.accepted, ['minimal', 'low', 'high', 'xhigh', 'max'])
    const byLevel = Object.fromEntries(model.verdicts.map((verdict) => [verdict.level, verdict]))
    assert.equal(byLevel.baseline.status, 'accepted')
    assert.equal(byLevel.baseline.sawReasoning, false)
    assert.equal(byLevel.low.status, 'accepted')
    assert.equal(byLevel.low.sawReasoning, true)
    assert.equal(byLevel.medium.status, 'rejected')
    // The endpoint's own text names the values it accepts, and here it also
    // names the level it just refused — the plugin reports that contradiction.
    assert.match(byLevel.medium.message, /端点自称接受：low、medium、high/)
    assert.match(byLevel.medium.message, /端点自述与实测不一致/)
    assert.equal(byLevel.max.status, 'accepted')

    // Capability probes reproduce the two failure modes that matter.
    assert.equal(model.capabilities.developerRole, 'unsupported')
    assert.equal(model.capabilities.imageInput, 'unsupported')

    // The requests really ran in order: baseline, developer-role, image, then
    // the levels — each capped, on the right URL.
    assert.equal(server.seen.length, 9)
    for (const record of server.seen) assert.equal(record.url, '/v1/chat/completions')
    assert.equal(server.seen[0].body.reasoning_effort, undefined)
    assert.equal(server.seen[1].body.messages[0].role, 'developer')
    assert.equal(Array.isArray(server.seen[2].body.messages[0].content), true)
    assert.equal(server.seen[2].body.messages[0].content.some((part) => part.type === 'image_url'), true)
    assert.deepEqual(server.seen.slice(3).map((record) => record.body.reasoning_effort), ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
    assert.equal(server.seen[3].body.max_tokens, 16)
    assert.equal(server.seen[3].body.model, 'acme-think')
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
  }
})

test('a vision model reports image input as supported', async () => {
  const server = await startChatServer()
  const originalFetch = globalThis.fetch
  const ctx = new Context()
  const service = new ProviderToolkitService(ctx, {})
  try {
    service.llmSection = () => ({
      providers: {
        acme: {
          api: 'openai-completions',
          baseURL: server.baseURL,
          models: [{ id: 'acme-think-vision' }, { id: 'acme-think' }],
        },
      },
    })
    service.policySection = () => ({})
    const result = await service.verifyReasoning({ route: 'acme' })
    assert.equal(result.ok, true)
    const [vision, textOnly] = result.value.models
    assert.equal(vision.capabilities.imageInput, 'supported')
    assert.equal(vision.capabilities.developerRole, 'unsupported')
    assert.equal(textOnly.capabilities.imageInput, 'unsupported')
    assert.equal(result.value.requests, 18)
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
  }
})

test('verification sends the wire spelling a declaration already names', async () => {
  const server = await startChatServer()
  const originalFetch = globalThis.fetch
  const ctx = new Context()
  const service = new ProviderToolkitService(ctx, {})
  try {
    service.llmSection = () => ({
      providers: {
        acme: {
          api: 'openai-completions',
          baseURL: server.baseURL,
          models: [{ id: 'acme-think', reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'ultra' } }],
        },
      },
    })
    service.policySection = () => ({})
    const result = await service.verifyReasoning({ route: 'acme' })
    const high = result.value.models[0].verdicts.find((verdict) => verdict.level === 'high')
    assert.equal(high.wire, 'ultra')
    const sent = server.seen.filter((record) => record.body.reasoning_effort !== undefined).map((record) => record.body.reasoning_effort)
    assert.equal(sent.includes('ultra'), true, JSON.stringify(sent))
    assert.equal(high.status, 'accepted')
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
  }
})

test('verification refuses what it cannot speak, and reports a route-level refusal per model', async () => {
  const originalFetch = globalThis.fetch
  const ctx = new Context()
  const service = new ProviderToolkitService(ctx, {})
  try {
    service.policySection = () => ({})

    service.llmSection = () => ({ providers: { anth: { api: 'anthropic-messages', baseURL: 'http://127.0.0.1:1', models: [{ id: 'm' }] } } })
    const unsupported = await service.verifyReasoning({ route: 'anth' })
    assert.equal(unsupported.ok, false)
    assert.equal(unsupported.error.code, 'unsupported-protocol')

    service.llmSection = () => ({ providers: { acme: { api: 'openai-completions', baseURL: 'http://127.0.0.1:1' } } })
    const noModels = await service.verifyReasoning({ route: 'acme' })
    assert.equal(noModels.ok, false)
    assert.equal(noModels.error.code, 'no-models')

    const unknown = await service.verifyReasoning({ route: 'nope' })
    assert.equal(unknown.error.code, 'unknown-route')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('a route whose credential the endpoint refuses fails that model, not the whole call', async () => {
  const originalFetch = globalThis.fetch
  const server = createServer((_request, response) => {
    response.writeHead(401, { 'content-type': 'application/json' }).end(JSON.stringify({ error: { message: 'bad key' } }))
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const ctx = new Context()
  const service = new ProviderToolkitService(ctx, {})
  try {
    service.llmSection = () => ({ providers: { acme: { api: 'openai-completions', baseURL: `http://127.0.0.1:${port}`, models: [{ id: 'm' }] } } })
    service.policySection = () => ({})
    const result = await service.verifyReasoning({ route: 'acme' })
    assert.equal(result.ok, true)
    const [model] = result.value.models
    assert.deepEqual([...model.verdicts], [])
    assert.equal(model.failure.code, 'auth')
    assert.match(model.failure.message, /HTTP 401/)
  } finally {
    globalThis.fetch = originalFetch
    await new Promise((resolve) => server.close(resolve))
  }
})

test('the model list of a verification request can be narrowed', async () => {
  const server = await startChatServer()
  const originalFetch = globalThis.fetch
  const ctx = new Context()
  const service = new ProviderToolkitService(ctx, {})
  try {
    service.llmSection = () => ({
      providers: {
        acme: {
          api: 'openai-completions',
          baseURL: server.baseURL,
          models: [{ id: 'one' }, { id: 'two' }],
        },
      },
    })
    service.policySection = () => ({})
    const result = await service.verifyReasoning({ route: 'acme', models: ['two'] })
    assert.equal(result.ok, true)
    assert.deepEqual(result.value.models.map((model) => model.id), ['two'])
    assert.equal(result.value.requests, 9)
    assert.equal(server.seen.every((record) => record.body.model === 'two'), true)
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
  }
})

//#endregion