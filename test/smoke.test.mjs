/**
 * Smoke tests for dsh-provider-toolkit.
 *
 * Run against the *installed* copy so the package's real dependency
 * resolution is exercised:
 *
 *   pwsh> $env:PTK_ENTRY = "$env:DSH_HOME\profiles\web\node_modules\dsh-provider-toolkit\index.js"
 *   pwsh> node --test test/smoke.test.mjs
 *
 * With `PTK_ENTRY` unset the suite falls back to this checkout, which only
 * works when the bare imports resolve from here.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const entry = process.env.PTK_ENTRY ?? join(here, '..', 'index.js')
const pkgRoot = dirname(entry)

const { __testables } = await import(pathToFileURL(entry).href)
const { TYPERT } = await import(pathToFileURL(join(pkgRoot, 'typert.host.js')).href)

const {
  parseListing,
  listingUrls,
  chatUrl,
  responsesUrl,
  reasoningFromId,
  reasoningFieldsFor,
  sawReasoningIn,
  levelsNamedIn,
  connectOptionsOf,
  isEffective,
  hostMatches,
  hostOf,
  urlOf,
  buildProbeResult,
  resolveDefaults,
  defaultsForModel,
  isExcludedModel,
  SHIPPED_DEFAULTS,
} = __testables

test('an OpenRouter-style enriched listing yields capacity and reasoning', () => {
  const entries = parseListing({
    data: [
      {
        id: 'acme/think-1',
        name: 'Acme Think 1',
        context_length: 262144,
        top_provider: { context_length: 262144, max_completion_tokens: 65536 },
        supported_parameters: ['temperature', 'reasoning_effort'],
      },
    ],
  })
  assert.equal(entries.length, 1)
  assert.equal(entries[0].id, 'acme/think-1')
  assert.equal(entries[0].name, 'Acme Think 1')
  assert.equal(entries[0].contextWindow, 262144)
  assert.equal(entries[0].maxTokens, 65536)
  assert.deepEqual(entries[0].reasoning, { off: null, low: 'low', medium: 'medium', high: 'high' })
})

test('an enriched models map keeps the map key as the request id', () => {
  const entries = parseListing({
    models: {
      'vendor/key-1': { name: 'Canonical Name', context_window: 131072, max_output_tokens: 8192 },
    },
  })
  assert.equal(entries.length, 1)
  assert.equal(entries[0].id, 'vendor/key-1')
  assert.equal(entries[0].name, 'Canonical Name')
  assert.equal(entries[0].contextWindow, 131072)
  assert.equal(entries[0].maxTokens, 8192)
})

test('an Anthropic listing maps max_input_tokens and max_tokens', () => {
  const entries = parseListing({
    data: [{ id: 'claude-sonnet-4-5', display_name: 'Claude Sonnet 4.5', max_input_tokens: 200000, max_tokens: 64000 }],
  })
  assert.equal(entries[0].contextWindow, 200000)
  assert.equal(entries[0].maxTokens, 64000)
})

test('supported_efforts names the exact levels the endpoint offers', () => {
  const entries = parseListing({
    data: [{ id: 'x', reasoning: { supported: true, supported_efforts: ['low', 'high'] } }],
  })
  assert.deepEqual(entries[0].reasoning, { off: null, low: 'low', high: 'high' })
})

test('a metadata denial of reasoning is preserved as false', () => {
  const entries = parseListing({ data: [{ id: 'plain', reasoning: { supported: false } }] })
  assert.equal(entries[0].reasoning, false)
})

test('a bare id is the only field a minimal listing gives', () => {
  const entries = parseListing({ data: [{ id: 'local-model' }] })
  assert.deepEqual(entries[0], {
    id: 'local-model',
    name: 'local-model',
    contextWindow: undefined,
    maxTokens: undefined,
    reasoning: undefined,
  })
})

test('the id heuristic recognizes well-known reasoning families only', () => {
  assert.deepEqual(reasoningFromId('deepseek-r1'), { off: null, low: 'low', medium: 'medium', high: 'high' })
  assert.deepEqual(reasoningFromId('qwen3-32b'), { off: null, low: 'low', medium: 'medium', high: 'high' })
  assert.deepEqual(reasoningFromId('glm-4.6'), { off: null, low: 'low', medium: 'medium', high: 'high' })
  assert.equal(reasoningFromId('gpt-4o-mini'), undefined)
  assert.equal(reasoningFromId('llama-3.1-8b-instruct'), undefined)
})

test('listing URLs never double the version segment', () => {
  assert.deepEqual(listingUrls('https://api.example.com/v1', 'openai-completions'), ['https://api.example.com/v1/models'])
  assert.deepEqual(listingUrls('https://api.example.com', 'openai-completions'), [
    'https://api.example.com/v1/models',
    'https://api.example.com/models',
  ])
  assert.deepEqual(listingUrls('https://api.anthropic.com', 'anthropic-messages'), [
    'https://api.anthropic.com/v1/models?limit=1000',
    'https://api.anthropic.com/models?limit=1000',
  ])
})

test('connect options carry exactly the configured TLS facts', () => {
  assert.equal(isEffective({}), false)
  assert.equal(isEffective({ tls: 'verify' }), false)
  assert.equal(isEffective({ tls: 'insecure' }), true)
  assert.equal(isEffective({ skipProxy: true }), true)
  assert.deepEqual(connectOptionsOf({ tls: 'insecure' }), { rejectUnauthorized: false })
  const withCa = connectOptionsOf({
    tls: 'ca',
    caPem: '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----',
  })
  assert.equal(Array.isArray(withCa.ca), true)
  assert.equal(withCa.ca.length, 1)
})

test('host matching follows the configured suffix rule', () => {
  assert.equal(hostMatches('api.acme.internal', 'acme.internal'), true)
  assert.equal(hostMatches('acme.internal', 'acme.internal'), true)
  assert.equal(hostMatches('evil-acme.internal', 'acme.internal'), false)
  assert.equal(hostMatches('anything.example', '*'), true)
  assert.equal(hostOf('https://API.Acme.Internal/v1'), 'api.acme.internal')
  assert.equal(hostOf('not a url'), undefined)
})

test('fetch input shapes all resolve to a URL', () => {
  assert.equal(urlOf('https://a.example/x').hostname, 'a.example')
  assert.equal(urlOf(new URL('https://b.example/y')).hostname, 'b.example')
  assert.equal(urlOf({ url: 'https://c.example/z' }).hostname, 'c.example')
  assert.equal(urlOf(42), undefined)
})

test('an overview result matches its declared strict codec', () => {
  const invocation = TYPERT.invocations.find((entry) => entry.method === 'overview')
  const result = {
    ok: true,
    value: {
      providers: [
        {
          route: 'acme',
          displayName: 'Acme Gateway',
          api: 'openai-completions',
          baseURL: 'https://api.acme.internal/v1',
          host: 'api.acme.internal',
          apiKeyEnv: 'ACME_API_KEY',
          declaredModels: [{ id: 'acme-think', name: 'Acme Think', contextWindow: 262144, reasoningMode: 'levels' }],
        },
      ],
      live: [{ id: 'acme', name: 'Acme Gateway' }],
    },
  }
  assert.equal(invocation.result.schema.safeParse(result).success, true)
  assert.equal(invocation.result.schema.safeParse({ ok: false, error: { code: 'x', message: 'y' } }).success, true)
})

test('a probe result built from a real listing matches its declared strict codec', () => {
  const entries = parseListing({
    data: [
      { id: 'acme-think', context_length: 262144, top_provider: { max_completion_tokens: 32768 }, supported_parameters: ['reasoning_effort'] },
      { id: 'acme-plain', context_length: 8192, supported_parameters: [] },
    ],
  })
  const defaults = resolveDefaults(undefined)
  const value = buildProbeResult('acme', 'https://api.acme.internal/v1/models', 'openai-completions', entries, { models: [{ id: 'acme-think' }, { id: 'gone' }] }, false, defaults)
  const invocation = TYPERT.invocations.find((entry) => entry.method === 'probe')
  const parsed = invocation.result.schema.safeParse({ ok: true, value })
  assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues ?? []))
  assert.deepEqual(value.configuredIds, ['acme-think', 'gone'])
  assert.equal(value.models[1].reasoningEfforts, undefined)
  // Both models disclosed a context length, so nothing was defaulted.
  assert.equal(value.models[0].contextSource, 'endpoint')
  assert.equal(value.models[1].contextSource, 'endpoint')
  assert.equal(value.filtered, 0)
  assert.equal(value.notes.length, 1)

  const failure = invocation.result.schema.safeParse({ ok: false, error: { code: 'http-error', message: 'boom' } })
  assert.equal(failure.success, true)
})

test('the probe request codec accepts the client payload only', () => {
  const invocation = TYPERT.invocations.find((entry) => entry.method === 'probe')
  const codec = invocation.parameters[0].codec
  assert.equal(codec.mode, 'strict')
  assert.equal(codec.schema.safeParse({ route: 'acme' }).success, true)
  assert.equal(codec.schema.safeParse({ route: 42 }).success, false)
})

test('the manifest satisfies every loader constraint it can check', () => {
  assert.equal(TYPERT.package, 'dsh-provider-toolkit')
  assert.equal(TYPERT.face, 'host')
  assert.equal(Array.isArray(TYPERT.schemas), true)
  for (const invocation of TYPERT.invocations) {
    for (const key of ['id', 'service', 'namespace', 'method']) {
      assert.equal(typeof invocation[key] === 'string' && invocation[key].length > 0, true, `${invocation.method}.${key}`)
    }
    assert.equal(invocation.invocation.kind, 'direct')
    assert.equal(invocation.result.mode, 'strict')
    assert.equal(typeof invocation.result.typeSymbol, 'string')
    assert.equal(typeof invocation.result.schema === 'object' && invocation.result.schema !== null && '_zod' in invocation.result.schema, true)
    for (const parameter of invocation.parameters) {
      assert.equal(parameter.source, 'json')
      assert.equal(parameter.codec.mode, 'strict')
    }
  }
  const service = TYPERT.model.services[0]
  assert.equal(service.key, 'providerToolkit')
  assert.equal(service.exportName, 'ProviderToolkitService')
  const kinds = new Set(['property', 'method', 'getter', 'setter', 'call', 'construct', 'index'])
  for (const member of service.members) assert.equal(kinds.has(member.kind), true)
})

//#region live-verification wire reproduction

test('each thinking format reproduces the parameter pi-ai would send', () => {
  // The default arm: an unrecognized gateway is treated as OpenAI itself.
  assert.equal(JSON.stringify(reasoningFieldsFor('openai-completions', undefined, 'high', 'high')), JSON.stringify({ fields: { reasoning_effort: 'high' } }))
  assert.equal(
    JSON.stringify(reasoningFieldsFor('openai-completions', { thinkingFormat: 'deepseek' }, 'high', 'high')),
    JSON.stringify({ fields: { thinking: { type: 'enabled' }, reasoning_effort: 'high' } }),
  )
  assert.equal(
    JSON.stringify(reasoningFieldsFor('openai-completions', { thinkingFormat: 'openrouter' }, 'high', 'high')),
    JSON.stringify({ fields: { reasoning: { effort: 'high' } } }),
  )
  assert.equal(
    JSON.stringify(reasoningFieldsFor('openai-completions', { thinkingFormat: 'qwen' }, 'low', 'low')),
    JSON.stringify({ fields: { enable_thinking: true, reasoning_effort: 'low' } }),
  )
  assert.equal(
    JSON.stringify(reasoningFieldsFor('openai-completions', { thinkingFormat: 'zai' }, 'high', 'high')),
    JSON.stringify({ fields: { thinking: { type: 'enabled', clear_thinking: false }, reasoning_effort: 'high' } }),
  )
  assert.equal(
    JSON.stringify(reasoningFieldsFor('openai-completions', { thinkingFormat: 'together' }, 'high', 'high')),
    JSON.stringify({ fields: { reasoning: { enabled: true }, reasoning_effort: 'high' } }),
  )
  assert.equal(
    JSON.stringify(reasoningFieldsFor('openai-completions', { thinkingFormat: 'string-thinking' }, 'high', 'high')),
    JSON.stringify({ fields: { thinking: 'high' } }),
  )
  assert.equal(
    JSON.stringify(reasoningFieldsFor('openai-responses', undefined, 'high', 'high')),
    JSON.stringify({ fields: { reasoning: { effort: 'high', summary: 'auto' } } }),
  )
})

test('the declared wire spelling is what a verification sends, not the level name', () => {
  assert.equal(
    JSON.stringify(reasoningFieldsFor('openai-completions', undefined, 'max', 'ultra')),
    JSON.stringify({ fields: { reasoning_effort: 'ultra' } }),
  )
})

test('a chat-template format with no kwargs is reported unverifiable instead of guessed', () => {
  const result = reasoningFieldsFor('openai-completions', { thinkingFormat: 'chat-template' }, 'high', 'high')
  assert.equal(typeof result.unsupported, 'string')
  assert.equal(result.fields, undefined)
})

test('configured chat_template_kwargs placeholders resolve to the tested level', () => {
  const result = reasoningFieldsFor(
    'openai-completions',
    { thinkingFormat: 'chat-template', chatTemplateKwargs: { enable_thinking: { $var: 'thinking.enabled' }, effort: { $var: 'thinking.effort' } } },
    'high',
    'high',
  )
  assert.equal(JSON.stringify(result.fields), JSON.stringify({ chat_template_kwargs: { enable_thinking: true, effort: 'high' } }))
})

test('chat and responses URLs never double the version segment', () => {
  assert.equal(chatUrl('https://api.example.com/v1'), 'https://api.example.com/v1/chat/completions')
  assert.equal(chatUrl('https://api.example.com/v1/'), 'https://api.example.com/v1/chat/completions')
  assert.equal(chatUrl('https://api.example.com'), 'https://api.example.com/v1/chat/completions')
  assert.equal(responsesUrl('https://api.example.com/v1'), 'https://api.example.com/v1/responses')
  assert.equal(responsesUrl('https://api.example.com'), 'https://api.example.com/v1/responses')
})

test('reasoning output is detected in both wire shapes', () => {
  assert.equal(sawReasoningIn({ usage: { completion_tokens_details: { reasoning_tokens: 12 } } }), true)
  assert.equal(sawReasoningIn({ choices: [{ message: { reasoning_content: 'hmm' } }] }), true)
  assert.equal(sawReasoningIn({ output: [{ type: 'reasoning' }] }), true)
  assert.equal(sawReasoningIn({ choices: [{ message: { content: 'ping' } }] }), false)
  assert.equal(sawReasoningIn({ usage: { completion_tokens_details: { reasoning_tokens: 0 } } }), false)
  assert.equal(sawReasoningIn(undefined), false)
})

test('the levels an endpoint names are read back, in both punctuation styles', () => {
  assert.equal(
    JSON.stringify(levelsNamedIn('Invalid value: "medium". Supported values are: low, high')),
    JSON.stringify(['low', 'medium', 'high']),
  )
  assert.equal(
    JSON.stringify(levelsNamedIn('reasoning_effort must be one of "minimal", "max"')),
    JSON.stringify(['minimal', 'max']),
  )
  // A Chinese message is what a CNPC-style gateway actually sends.
  assert.equal(
    JSON.stringify(levelsNamedIn('The request is invalid: 该模型始终思考，不支持关闭思考；请使用 low、high 或 max。')),
    JSON.stringify(['low', 'high', 'max']),
  )
  assert.equal(JSON.stringify(levelsNamedIn('bad request')), JSON.stringify([]))
})

test('a verification result matches its declared strict codec', () => {
  const invocation = TYPERT.invocations.find((entry) => entry.method === 'verifyReasoning')
  const value = {
    route: 'acme',
    protocol: 'openai-completions',
    requests: 14,
    levels: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
    models: [
      {
        id: 'acme-think',
        accepted: ['low', 'high'],
        tested: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
        verdicts: [
          { level: 'baseline', status: 'accepted', wire: '', sawReasoning: false },
          { level: 'minimal', status: 'rejected', wire: 'minimal', sawReasoning: false, message: 'HTTP 400' },
          { level: 'low', status: 'accepted', wire: 'low', sawReasoning: true },
          { level: 'medium', status: 'rejected', wire: 'medium', sawReasoning: false, message: 'HTTP 400' },
          { level: 'high', status: 'accepted', wire: 'high', sawReasoning: true },
          { level: 'xhigh', status: 'unverifiable', wire: 'xhigh', sawReasoning: false, message: 'format not reproducible' },
          { level: 'max', status: 'inconclusive', wire: 'max', sawReasoning: false },
        ],
        capabilities: { developerRole: 'unsupported', imageInput: 'supported' },
      },
      { id: 'acme-plain', accepted: [], tested: [], verdicts: [], capabilities: {}, failure: { code: 'auth', message: 'no credential' } },
    ],
  }
  const parsed = invocation.result.schema.safeParse({ ok: true, value })
  assert.equal(parsed.success, true, JSON.stringify(parsed.error?.issues ?? []))

  const request = invocation.parameters[0].codec
  assert.equal(request.schema.safeParse({ route: 'acme' }).success, true)
  assert.equal(request.schema.safeParse({ route: 'acme', models: ['a', 'b'] }).success, true)
  assert.equal(request.schema.safeParse({}).success, false)
  assert.equal(request.schema.safeParse({ route: 42 }).success, false)
})

//#endregion

//#region capacity defaults and the non-chat filter

test('the shipped defaults are the single, editable knob', () => {
  const defaults = resolveDefaults(undefined)
  assert.equal(defaults.contextWindow, SHIPPED_DEFAULTS.contextWindow)
  assert.equal(defaults.maxTokens, SHIPPED_DEFAULTS.maxTokens)
  // No shipped family rule: one global default cannot be quietly overridden by
  // a pattern the panel does not show.
  assert.equal(defaults.patterns.length, 0)
  assert.deepEqual(defaults.levels, ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
})

test('a settings override replaces the default and a family pattern wins when present', () => {
  const defaults = resolveDefaults({
    defaults: {
      contextWindow: 262144,
      maxTokens: 8192,
      exclude: ['embed'],
      levels: ['low', 'high', 'nonsense'],
      patterns: [{ match: 'deepseek', contextWindow: 1000000, maxTokens: 32000 }, { match: '', contextWindow: 5 }],
    },
  })
  assert.equal(defaults.contextWindow, 262144)
  assert.equal(defaults.maxTokens, 8192)
  assert.deepEqual(defaults.exclude, ['embed'])
  // Unknown level names are dropped, not passed through to a request.
  assert.deepEqual(defaults.levels, ['low', 'high'])
  // A pattern with no match string is dropped rather than matching everything.
  assert.equal(defaults.patterns.length, 1)
  assert.equal(JSON.stringify(defaultsForModel('deepseek-v4.1-flash', defaults)), JSON.stringify({ contextWindow: 1000000, maxTokens: 32000, source: 'pattern' }))
  assert.equal(JSON.stringify(defaultsForModel('GLM-5.3', defaults)), JSON.stringify({ contextWindow: 262144, maxTokens: 8192, source: 'global' }))
})

test('a zero, negative, or non-numeric override falls back instead of writing nonsense', () => {
  const defaults = resolveDefaults({ defaults: { contextWindow: 0, maxTokens: -5, exclude: 'nope' } })
  assert.equal(defaults.contextWindow, SHIPPED_DEFAULTS.contextWindow)
  assert.equal(defaults.maxTokens, SHIPPED_DEFAULTS.maxTokens)
  assert.deepEqual(defaults.exclude, SHIPPED_DEFAULTS.exclude)
})

test('the filter recognizes the non-chat models a gateway advertises', () => {
  const exclude = resolveDefaults(undefined).exclude
  for (const id of ['bge-m3', 'bge-reranker-large', 'gte-large', 'jina-v3', 'nomic-embed-text-v2', 'tts', 'asr', 'fun-asr', 'qwen3-asr-flash', 'paraphrase-multilingual-MiniLM-L12-v2']) {
    assert.equal(isExcludedModel(id, exclude), true, id)
  }
  for (const id of ['deepseek-v4.1-flash', 'glm-5.3', 'kimi-k3', 'qwen3.8-max', 'MiniMax-M2.7', 'qwen2-7b-vl', 'kunlunllm-70b']) {
    assert.equal(isExcludedModel(id, exclude), false, id)
  }
})

test('a bare listing gets capacity defaults, tagged so the panel can say where they came from', () => {
  const entries = parseListing({ data: [{ id: 'deepseek-v4.1-flash' }, { id: 'acme-small' }] })
  const value = buildProbeResult('acme', 'https://api.acme.internal/v1/models', 'openai-completions', entries, { models: [{ id: 'deepseek-v4.1-flash' }] }, false, resolveDefaults(undefined))
  assert.equal(value.models[0].contextWindow, SHIPPED_DEFAULTS.contextWindow)
  assert.equal(value.models[0].maxTokens, SHIPPED_DEFAULTS.maxTokens)
  assert.equal(value.models[0].contextSource, 'global')
  assert.equal(value.models[0].maxTokensSource, 'global')
  assert.equal(value.models[1].contextSource, 'global')
  assert.equal(value.notes.some((note) => note.includes('已填入默认值')), true, JSON.stringify(value.notes))
})

test('non-chat models are filtered out of a listing, but a configured one is never hidden', () => {
  const entries = parseListing({
    data: [
      { id: 'deepseek-v4.1-flash' },
      { id: 'bge-m3' },
      { id: 'tts' },
      { id: 'acme-embed-x' },
    ],
  })
  // `acme-embed-x` is already configured, so it stays visible and keeps its row.
  const value = buildProbeResult('acme', 'https://api.acme.internal/v1/models', 'openai-completions', entries, { models: [{ id: 'acme-embed-x', contextWindow: 4096, maxTokens: 512 }] }, false, resolveDefaults(undefined))
  assert.deepEqual(value.models.map((model) => model.id), ['deepseek-v4.1-flash', 'acme-embed-x'])
  assert.equal(value.filtered, 2)
  assert.equal(value.notes.some((note) => note.includes('已过滤 2 个非对话模型')), true, JSON.stringify(value.notes))
})

//#endregion
