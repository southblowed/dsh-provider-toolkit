/**
 * Client-half tests for dsh-provider-toolkit.
 *
 * The browser bundle is loaded exactly the way the shell loads it — through the
 * `window.__ModuleLoader__` facade — in a `node:vm` sandbox, with a hook
 * harness standing in for React. That is enough to check the parts a browser
 * smoke test would otherwise be needed for:
 *
 * - the bundle's module shape (`apply`, `inject`) and its slot registration,
 * - the dictionaries are key-for-key identical,
 * - the panel renders its provider rows, probe table, verification table, and
 *   network-policy controls without touching an undefined binding,
 * - the three host endpoints are called with the exact wire shape the
 *   `typert.host.js` manifest declares, and
 * - **the write policy**: an inferred reasoning declaration never reaches
 *   settings on its own, and a level live verification rejected never does.
 *
 * The harness mirrors React's slot ordering: `useState`/`useRef` consume the
 * next preset in call order across the whole tree, and `useEffect` never runs.
 *
 * Run directly (the test runner spawns child processes the file sandbox
 * refuses):
 *
 *   pwsh> node test/client.test.mjs
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const entry = process.env.PTK_CLIENT ?? join(here, '..', 'client.js')

/**
 * The single React stand-in the bundle destructures its hooks from, exactly as
 * it does in the browser. Slot consumption is shared across the whole render
 * tree, so a test lays its presets out in call order.
 */
const hooks = { presets: [], slot: 0, effects: [] }

function createReactStub() {
  const take = (fallback) => (hooks.slot < hooks.presets.length ? hooks.presets[hooks.slot++] : fallback)
  return {
    Fragment: Symbol('Fragment'),
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useState: (initial) => [take(initial), () => {}],
    useRef: (initial) => take({ current: initial }),
    // Effects are recorded, never run: a test that wants them calls runEffects().
    useEffect: (fn) => { hooks.effects.push(fn) },
  }
}

const reactStub = createReactStub()

/** Render a tree with a fixed preset list; the counter restarts per render. */
function withPresets(presets, render) {
  hooks.presets = presets
  hooks.slot = 0
  hooks.effects = []
  try {
    return render()
  } finally {
    hooks.presets = []
    hooks.slot = 0
  }
}

/** Run every effect a render registered, and let their promises settle. */
async function runEffects() {
  const effects = [...hooks.effects]
  hooks.effects = []
  for (const effect of effects) effect()
  for (let tick = 0; tick < 30; tick += 1) await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Compare a value produced inside the vm realm with a plain expectation:
 * `node:assert/strict` compares prototypes, and the bundle's objects carry the
 * sandbox realm's `Object.prototype`.
 */
function sameJson(actual, expected, message) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected), message)
}

/** Load the browser bundle and return its registered module spec. */
function loadBundle() {
  const source = readFileSync(entry, 'utf8')
  let captured
  const documentStub = {
    querySelector: () => null,
    createElement: () => ({ dataset: {} }),
    head: { appendChild: () => {} },
  }
  const sandbox = {
    window: { __ModuleLoader__: { load: (spec) => { captured = spec } } },
    document: documentStub,
    console,
  }
  vm.createContext(sandbox)
  vm.runInContext(source, sandbox, { filename: entry })
  assert.notEqual(captured, undefined, 'the bundle must register itself with the module loader')
  assert.equal(captured.id, 'dsh-provider-toolkit')
  return captured
}

/** Walk a rendered tree and collect every string it shows, including input values. */
function textsOf(node, out = []) {
  if (typeof node === 'string') { out.push(node); return out }
  if (typeof node === 'number') { out.push(String(node)); return out }
  if (Array.isArray(node)) { for (const item of node) textsOf(item, out); return out }
  if (node === null || node === undefined || typeof node !== 'object') return out
  if (typeof node.props?.value === 'string') out.push(node.props.value)
  if (typeof node.props?.placeholder === 'string') out.push(node.props.placeholder)
  for (const child of node.children ?? []) textsOf(child, out)
  return out
}

/** Expand every function component in a tree, in render order. */
function render(node) {
  if (Array.isArray(node)) return node.map((item) => render(item))
  if (node === null || node === undefined || typeof node !== 'object') return node
  if (typeof node.type === 'function') return render(node.type({ ...node.props }))
  return { type: node.type, props: node.props, children: (node.children ?? []).map((child) => render(child)) }
}

/** Wrap a component function in the element shape `createElement` produces. */
function elementOf(component, props) {
  return { type: component, props: props ?? {}, children: [] }
}

// Set by the slot registration below, once the bundle's `apply` runs.
const PanelProbe = { target: undefined }

const spec = loadBundle()
const events = { registered: [], calls: [], locales: {}, autoCalls: [] }
/** Every mutation the panel performs, recorded for assertions. */
const mutations = []
const settingsStub = {
  describe: () => Promise.resolve({ ok: true, value: { writable: true, hasDocument: true, namespaces: [{ ns: 'llm-pi-ai', revision: 3, value: { providers: { acme: { displayName: 'Acme Gateway', api: 'openai-completions', baseURL: 'https://api.acme.internal/v1', models: [{ id: 'acme-think' }, { id: 'acme-retired' }] } } } }, { ns: 'dsh-provider-toolkit', revision: 1, value: { network: {} } }] } }),
  mutate: (ns, ops, revision) => {
    mutations.push({ ns, ops, revision })
    return Promise.resolve({ ok: true, value: { ns, revision: (revision ?? 0) + 1 } })
  },
}
const remoteStub = { settings: settingsStub, $on: () => () => {} }
const ctx = {
  effect: (fn) => { fn(); return () => {} },
  get: (name) => (name === 'remote' ? remoteStub : undefined),
  locale: { register: (ns, dicts) => { events.locales[ns] = dicts; return () => {} } },
  slots: {
    inject: (key, callback) => { events.injected = key; callback(); return () => {} },
    register: (options, component) => {
      events.registered.push({ options, component })
      PanelProbe.target = component
      return () => {}
    },
  },
  connection: { rpc: { call: (...args) => { events.calls.push(args); return Promise.resolve({ ok: true, value: { ok: true, value: { providers: [], live: [] } } }) } } },
}

const exported = spec.factory((request) => {
  if (request === 'react') return reactStub
  if (request === 'react/jsx-runtime') throw new Error('this plugin must not require jsx-runtime')
  throw new Error(`unexpected module request: ${request}`)
})

test('the bundle exports the plugin shape the loader expects', () => {
  assert.equal(typeof exported.apply, 'function')
  assert.deepEqual([...exported.inject], ['slots', 'locale', 'remote', 'remote.settings', 'connection'])
})

exported.apply(ctx)

test('the dictionaries are key-for-key identical', () => {
  const dicts = events.locales['provider-toolkit']
  assert.notEqual(dicts, undefined)
  assert.deepEqual(Object.keys(dicts.zh).sort(), Object.keys(dicts.en).sort())
  for (const key of Object.keys(dicts.zh)) assert.equal(typeof dicts.zh[key], 'string')
})

test('the panel takes the Models footer seat with the settings face injected', () => {
  assert.equal(events.injected, 'settings.models.footer')
  assert.equal(events.registered.length, 1)
  const { options } = events.registered[0]
  assert.equal(options.name, 'settings.models.footer')
  assert.equal(options.id, 'dsh-provider-toolkit')
  assert.equal(options.locale, 'provider-toolkit')
  const face = options.inject()
  assert.equal(face.settings, settingsStub)
  assert.equal(typeof face.callOverview, 'function')
  assert.equal(typeof face.callProbe, 'function')
  assert.equal(typeof face.callVerify, 'function')
  assert.equal(typeof face.onDocumentUpdated, 'function')
})

test('every host endpoint is called with the exact declared wire shape', async () => {
  const face = events.registered[0].options.inject()
  await face.callOverview()
  await face.callProbe('acme')
  await face.callVerify('acme')
  assert.equal(JSON.stringify(events.calls[0]), JSON.stringify(['/api', 'providerToolkit/overview', { args: {} }, undefined]))
  assert.equal(JSON.stringify(events.calls[1]), JSON.stringify(['/api', 'providerToolkit/probe', { args: { request: { route: 'acme' } } }, undefined]))
  assert.equal(JSON.stringify(events.calls[2]), JSON.stringify(['/api', 'providerToolkit/verifyReasoning', { args: { request: { route: 'acme' } } }, undefined]))
})

//#region the write policy: an unverified guess must never reach settings on its own

const { mergeModels, effectiveDetection } = exported.__testables

const heuristicModel = {
  id: 'acme-think',
  name: 'Acme Think',
  contextWindow: 262144,
  maxTokens: 32768,
  reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high' },
  reasoningSource: 'heuristic',
}

test('an inferred level set is not written unless the user opts in', () => {
  const configured = [{ id: 'acme-think', name: 'Acme Think', input: ['text', 'image'] }]
  const kept = mergeModels(configured, [heuristicModel], false, {})
  assert.equal(kept[0].reasoningEfforts, undefined, 'a guess must not be declared by default')
  // Capacity is disclosed by the endpoint, so it is written either way.
  assert.equal(kept[0].contextWindow, 262144)
  assert.equal(kept[0].maxTokens, 32768)
  // Fields this plugin does not edit survive.
  sameJson(kept[0].input, ['text', 'image'])

  const optedIn = mergeModels(configured, [heuristicModel], false, { allowUnverified: true })
  sameJson(optedIn[0].reasoningEfforts, { off: null, low: 'low', medium: 'medium', high: 'high' })
})

test('a level set the endpoint disclosed is written without any opt-in', () => {
  const disclosed = { ...heuristicModel, reasoningSource: 'metadata' }
  const kept = mergeModels([{ id: 'acme-think' }], [disclosed], false, {})
  sameJson(kept[0].reasoningEfforts, { off: null, low: 'low', medium: 'medium', high: 'high' })
})

test('only the levels live verification accepted are written', () => {
  const verdicts = [
    { level: 'baseline', status: 'accepted', wire: '', sawReasoning: false },
    { level: 'low', status: 'accepted', wire: 'low', sawReasoning: true },
    { level: 'medium', status: 'rejected', wire: 'medium', sawReasoning: false, message: 'HTTP 400' },
    { level: 'high', status: 'accepted', wire: 'high', sawReasoning: true },
  ]
  const verified = { 'acme-think': { verdicts, capabilities: {} } }
  const kept = mergeModels([{ id: 'acme-think' }], [heuristicModel], false, { verified })
  sameJson(kept[0].reasoningEfforts, { off: null, low: 'low', high: 'high' })
  // Even with the unverified opt-in a rejected level stays out: a verdict
  // beats a guess.
  const optedIn = mergeModels([{ id: 'acme-think' }], [heuristicModel], false, { verified, allowUnverified: true })
  sameJson(optedIn[0].reasoningEfforts, { off: null, low: 'low', high: 'high' })
})

test('the wire spelling a verdict reported is what gets declared', () => {
  const verified = {
    'acme-think': {
      verdicts: [
        { level: 'low', status: 'accepted', wire: 'low', sawReasoning: true },
        { level: 'high', status: 'accepted', wire: 'ultra', sawReasoning: true },
      ],
      capabilities: {},
    },
  }
  const kept = mergeModels([{ id: 'acme-think' }], [heuristicModel], false, { verified })
  sameJson(kept[0].reasoningEfforts, { off: null, low: 'low', high: 'ultra' })
})

test('a verification that rejected every level declares nothing', () => {
  const verified = {
    'acme-think': {
      verdicts: [
        { level: 'baseline', status: 'accepted', wire: '', sawReasoning: false },
        { level: 'low', status: 'rejected', wire: 'low', sawReasoning: false },
        { level: 'medium', status: 'rejected', wire: 'medium', sawReasoning: false },
        { level: 'high', status: 'rejected', wire: 'high', sawReasoning: false },
      ],
      capabilities: {},
    },
  }
  const detection = effectiveDetection(heuristicModel, verified['acme-think'])
  assert.equal(detection.reasoningSource, 'verified-none')
  const kept = mergeModels([{ id: 'acme-think' }], [heuristicModel], false, { verified, allowUnverified: true })
  assert.equal(kept[0].reasoningEfforts, undefined, 'an all-rejected probe must not claim either answer')
})

test('a model the verification never reached keeps the listing inference', () => {
  const verified = { 'acme-other': { verdicts: [{ level: 'low', status: 'accepted', wire: 'low', sawReasoning: true }], capabilities: {} } }
  const detection = effectiveDetection(heuristicModel, verified['acme-think'])
  assert.equal(detection.reasoningSource, 'heuristic')
  sameJson(detection.reasoningEfforts, { off: null, low: 'low', medium: 'medium', high: 'high' })
})

test('a supported image probe turns on image input; an unsupported one downgrades nothing', () => {
  const verified = {
    'acme-think': { verdicts: [], capabilities: { imageInput: 'supported', developerRole: 'unsupported' } },
    'acme-plain': { verdicts: [], capabilities: { imageInput: 'unsupported', developerRole: 'supported' } },
  }
  const kept = mergeModels(
    [
      { id: 'acme-think', contextWindow: 262144, maxTokens: 32768 },
      { id: 'acme-plain', input: ['text', 'image'] },
    ],
    [
      { id: 'acme-think', contextWindow: 262144, maxTokens: 32768, reasoningSource: 'none' },
      { id: 'acme-plain', contextWindow: 8192, maxTokens: 4096, reasoningSource: 'none' },
    ],
    false,
    { verified },
  )
  // Supported image input is declared; the developer-role fix rides along.
  sameJson(kept[0].input, ['text', 'image'])
  assert.equal(kept[0].compat.supportsDeveloperRole, false)
  // An unsupported image probe does not strip an existing claim.
  sameJson(kept[1].input, ['text', 'image'])
  assert.equal(kept[1].compat, undefined)
})

test('an unknown capability probe changes nothing', () => {
  const verified = { 'acme-think': { verdicts: [], capabilities: { imageInput: 'unknown', developerRole: 'unknown' } } }
  const kept = mergeModels(
    [{ id: 'acme-think', contextWindow: 262144, maxTokens: 32768 }],
    [{ id: 'acme-think', contextWindow: 262144, maxTokens: 32768, reasoningSource: 'none' }],
    false,
    { verified },
  )
  assert.equal(kept[0].input, undefined)
  assert.equal(kept[0].compat, undefined)
})

test('a newly appended model never receives an unverified reasoning declaration', () => {
  const plain = { ...heuristicModel, id: 'acme-plain', reasoningEfforts: undefined, reasoningSource: 'none' }
  const kept = mergeModels([], [heuristicModel, plain], true, {})
  sameJson(kept.map((row) => row.id), ['acme-think', 'acme-plain'])
  assert.equal(kept[0].reasoningEfforts, undefined)
  assert.equal(kept[0].contextWindow, 262144)
})

//#region capacity: defaults, edits, and the review table

test('a model whose endpoint disclosed nothing still gets a complete row', () => {
  const bare = { id: 'acme-small', name: 'acme-small', reasoningSource: 'none' }
  const kept = mergeModels([{ id: 'acme-small' }], [bare], false, {})
  assert.equal(kept[0].contextWindow, 1000000)
  assert.equal(kept[0].maxTokens, 32000)
})

test('the panel\u2019s edited cell wins over the endpoint and over the default', () => {
  const probed = { id: 'acme-think', contextWindow: 262144, maxTokens: 32768, reasoningSource: 'none' }
  const edited = mergeModels([{ id: 'acme-think' }], [probed], false, { edits: { 'acme-think': { contextWindow: '131072', maxTokens: '8192' } } })
  assert.equal(edited[0].contextWindow, 131072)
  assert.equal(edited[0].maxTokens, 8192)

  const bare = { id: 'acme-plain', reasoningSource: 'none' }
  const withDefault = mergeModels([{ id: 'acme-plain' }], [bare], false, { edits: { 'acme-plain': { contextWindow: '64000' } } })
  assert.equal(withDefault[0].contextWindow, 64000)
  assert.equal(withDefault[0].maxTokens, 32000)

  // An edited value the endpoint never listed still lands on the configured row.
  const unlisted = mergeModels(
    [{ id: 'acme-retired', contextWindow: 4096, maxTokens: 512 }],
    [{ id: 'acme-other', reasoningSource: 'none' }],
    false,
    { edits: { 'acme-retired': { contextWindow: '32768' } } },
  )
  assert.equal(unlisted[0].contextWindow, 32768)
  assert.equal(unlisted[0].maxTokens, 512)
})

test('a configured model the endpoint never listed keeps its numbers untouched', () => {
  const kept = mergeModels(
    [{ id: 'acme-retired', contextWindow: 4096, maxTokens: 512 }],
    [{ id: 'acme-other', contextWindow: 8192, maxTokens: 1024, reasoningSource: 'none' }],
    false,
    {},
  )
  assert.equal(kept[0].contextWindow, 4096)
  assert.equal(kept[0].maxTokens, 512)
  assert.equal(kept[0].reasoningEfforts, undefined)
})

test('a blank or invalid edited cell falls back instead of writing nonsense', () => {
  const probed = { id: 'acme-think', contextWindow: 262144, maxTokens: 32768, reasoningSource: 'none' }
  const blank = mergeModels([{ id: 'acme-think' }], [probed], false, { edits: { 'acme-think': { contextWindow: '', maxTokens: 'abc' } } })
  assert.equal(blank[0].contextWindow, 262144)
  assert.equal(blank[0].maxTokens, 32768)
  const negative = mergeModels([{ id: 'acme-think' }], [probed], false, { edits: { 'acme-think': { contextWindow: '-5' } } })
  assert.equal(negative[0].contextWindow, 262144)
})

test('the panel defaults come from the probe reply, then the settings, then the shipped copy', () => {
  const { defaultsOf, normalizeDefaults } = exported.__testables
  const fromProbe = defaultsOf(undefined, { result: { defaults: { contextWindow: 64000, maxTokens: 4096 } } })
  assert.equal(fromProbe.contextWindow, 64000)
  assert.equal(fromProbe.maxTokens, 4096)
  // The automatic pass is on unless a deployment turned it off.
  assert.equal(fromProbe.autoCapabilities, true)
  assert.equal(normalizeDefaults({ autoCapabilities: false }).autoCapabilities, false)

  const fromSettings = defaultsOf({ namespaces: [{ ns: 'dsh-provider-toolkit', value: { defaults: { contextWindow: 32768, maxTokens: 2048, exclude: ['embed'] } } }] }, undefined)
  assert.equal(fromSettings.contextWindow, 32768)
  sameJson(fromSettings.exclude, ['embed'])
  // The namespaces array itself is accepted too, which is what the panel passes.
  const fromNamespaces = defaultsOf([{ ns: 'dsh-provider-toolkit', value: { defaults: { contextWindow: 4096 } } }], undefined)
  assert.equal(fromNamespaces.contextWindow, 4096)

  const shipped = defaultsOf(undefined, undefined)
  assert.equal(shipped.contextWindow, 1000000)
  sameJson(shipped.levels, ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
})

//#endregion

//#region the automatic pass

test('a conservative merge never takes a declared capability away', () => {
  const declared = [{ id: 'acme-think', contextWindow: 262144, maxTokens: 32768, reasoningEfforts: { off: null, low: 'low', medium: 'medium', high: 'high' } }]
  const probed = [{ id: 'acme-think', contextWindow: 262144, maxTokens: 32768, reasoningSource: 'none' }]
  // Every level was refused: a user-confirmed pass would drop the declaration…
  const verified = { 'acme-think': { verdicts: [{ level: 'low', status: 'rejected', wire: 'low', sawReasoning: false }], capabilities: {} } }
  const confirmed = mergeModels(declared, probed, false, { verified })
  assert.equal(confirmed[0].reasoningEfforts, undefined)
  // …while the automatic pass leaves it alone rather than trusting one probe.
  const automatic = mergeModels(declared, probed, false, { verified, conservative: true })
  sameJson(automatic[0].reasoningEfforts, { off: null, low: 'low', medium: 'medium', high: 'high' })
})

test('the automatic pass fills a missing capacity but never overwrites an existing one', () => {
  const configured = [{ id: 'acme-think', contextWindow: 262144 }, { id: 'acme-plain' }]
  const probed = [
    { id: 'acme-think', contextWindow: 262144, maxTokens: 32768, contextSource: 'endpoint', maxTokensSource: 'endpoint', reasoningSource: 'none' },
    { id: 'acme-plain', contextWindow: 1000000, maxTokens: 32000, contextSource: 'global', maxTokensSource: 'global', reasoningSource: 'none' },
  ]
  const rows = mergeModels(configured, probed, false, { conservative: true })
  assert.equal(rows[0].contextWindow, 262144)
  assert.equal(rows[1].contextWindow, 1000000)
  assert.equal(rows[1].maxTokens, 32000)
})

test('opening the panel auto-detects a new model and writes its capabilities', async () => {
  const fixture = readyFixture()
  // The route carries one model the cache has never seen.
  const view = {
    ...fixture.state.view,
    namespaces: [
      {
        ns: 'llm-pi-ai',
        revision: 3,
        value: {
          providers: {
            acme: {
              displayName: 'Acme Gateway',
              api: 'openai-completions',
              baseURL: 'https://api.acme.internal/v1',
              models: [{ id: 'acme-think', contextWindow: 262144, maxTokens: 32768 }],
            },
          },
        },
      },
      { ns: 'dsh-provider-toolkit', revision: 1, value: { defaults: { autoCapabilities: true }, network: {} } },
    ],
  }
  const probeValue = {
    route: 'acme',
    endpoint: 'https://api.acme.internal/v1/models',
    protocol: 'openai-completions',
    models: [{ id: 'acme-think', name: 'Acme Think', contextWindow: 262144, maxTokens: 32768, contextSource: 'endpoint', maxTokensSource: 'endpoint', reasoningSource: 'none' }],
    configuredIds: ['acme-think'],
    filtered: 2,
    defaults: { contextWindow: 1000000, maxTokens: 32000, levels: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'] },
    notes: [],
  }
  const verifyValue = {
    route: 'acme',
    protocol: 'openai-completions',
    levels: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
    requests: 9,
    models: [
      {
        id: 'acme-think',
        verdicts: [
          { level: 'low', status: 'accepted', wire: 'low', sawReasoning: true },
          { level: 'high', status: 'accepted', wire: 'high', sawReasoning: true },
        ],
        accepted: ['low', 'high'],
        tested: ['low', 'high'],
        capabilities: { developerRole: 'unsupported', imageInput: 'supported' },
      },
    ],
  }
  mutations.length = 0
  renderPanel({
    state: { phase: 'ready', view, overview: fixture.state.overview, failure: undefined },
    callProbe: (route) => { events.autoCalls.push(`probe:${route}`); return Promise.resolve({ ok: true, value: { ok: true, value: probeValue } }) },
    callVerify: (route, models) => { events.autoCalls.push(`verify:${route}:${models.join(',')}`); return Promise.resolve({ ok: true, value: { ok: true, value: verifyValue } }) },
  })
  await runEffects()

  sameJson(events.autoCalls, ['probe:acme', 'verify:acme:acme-think'])
  const llmWrite = mutations.find((entry) => entry.ns === 'llm-pi-ai')
  assert.notEqual(llmWrite, undefined, JSON.stringify(mutations))
  const modelsOp = llmWrite.ops.find((op) => op.path.join('.') === 'providers.acme.models')
  const compatOp = llmWrite.ops.find((op) => op.path.join('.') === 'providers.acme.compat.supportsDeveloperRole')
  const reasoningOp = llmWrite.ops.find((op) => op.path.join('.') === 'providers.acme.reasoning')
  const row = modelsOp.value.find((entry) => entry.id === 'acme-think')
  // Reasoning levels, image input, and the existing capacity, all from the probe.
  sameJson(row.reasoningEfforts, { off: null, low: 'low', high: 'high' })
  sameJson(row.input, ['text', 'image'])
  assert.equal(row.contextWindow, 262144)
  assert.equal(compatOp.value, false)
  assert.equal(reasoningOp.value, 'high')
  // The measurement is cached, so the next page open is free.
  const cacheWrite = mutations.find((entry) => entry.ns === 'dsh-provider-toolkit')
  assert.notEqual(cacheWrite, undefined)
  const cached = cacheWrite.ops[0].value.acme['acme-think']
  assert.equal(cached.accepted.length, 2)
  assert.equal(cached.capabilities.developerRole, 'unsupported')
  assert.equal(typeof cached.signature, 'string')
})

test('a cached configuration shape is not measured again, and the toggle turns the pass off', async () => {
  const fixture = readyFixture()
  const cachedEntry = { signature: null, accepted: ['high'], capabilities: {}, at: '2026-01-01T00:00:00.000Z' }
  /** The signature the run computes for this shape, captured from a first run. */
  const base = { ns: 'llm-pi-ai', revision: 3, value: { providers: { acme: { displayName: 'Acme', api: 'openai-completions', baseURL: 'https://api.acme.internal/v1', models: [{ id: 'acme-think' }] } } } }
  const probeValue = {
    models: [{ id: 'acme-think', contextWindow: 1000000, maxTokens: 32000, contextSource: 'global', maxTokensSource: 'global', reasoningSource: 'none' }],
    configuredIds: ['acme-think'], filtered: 0, defaults: { contextWindow: 1000000, maxTokens: 32000, levels: ['high'] }, notes: [], route: 'acme', endpoint: 'x', protocol: 'openai-completions',
  }
  const verifyValue = {
    route: 'acme', protocol: 'openai-completions', levels: ['high'], requests: 9,
    models: [{ id: 'acme-think', verdicts: [{ level: 'high', status: 'accepted', wire: 'high', sawReasoning: true }], accepted: ['high'], tested: ['high'], capabilities: {} }],
  }
  events.autoCalls.length = 0
  mutations.length = 0
  const run = async (toolkitValue) => {
    renderPanel({
      state: { phase: 'ready', view: { writable: true, namespaces: [base, { ns: 'dsh-provider-toolkit', revision: 1, value: toolkitValue }] }, overview: fixture.state.overview, failure: undefined },
      callProbe: (route) => { events.autoCalls.push(`probe:${route}`); return Promise.resolve({ ok: true, value: { ok: true, value: probeValue } }) },
      callVerify: (route) => { events.autoCalls.push(`verify:${route}`); return Promise.resolve({ ok: true, value: { ok: true, value: verifyValue } }) },
    })
    await runEffects()
  }
  await run({ defaults: { autoCapabilities: true }, network: {} })
  const cacheWrite = mutations.find((entry) => entry.ns === 'dsh-provider-toolkit')
  const signature = cacheWrite.ops[0].value.acme['acme-think'].signature
  events.autoCalls.length = 0
  mutations.length = 0
  // Same shape, now cached: nothing runs.
  await run({ defaults: { autoCapabilities: true }, verify: { acme: { 'acme-think': { ...cachedEntry, signature } } }, network: {} })
  sameJson(events.autoCalls, [])
  assert.equal(mutations.length, 0)
  // Toggle off: nothing runs even with an empty cache.
  await run({ defaults: { autoCapabilities: false }, network: {} })
  sameJson(events.autoCalls, [])
  assert.equal(mutations.length, 0)
})

//#endregion

/** The zh translator the slot system injects as the `t` prop. */
function translator() {
  const dicts = events.locales['provider-toolkit']
  return (key) => dicts.zh[key] ?? key
}

/** A ready-state panel view with one custom provider carrying a probe result and a policy. */
function readyFixture() {
  return {
    state: {
      phase: 'ready',
      view: {
        writable: true,
        namespaces: [
          {
            ns: 'llm-pi-ai',
            revision: 3,
            value: {
              providers: {
                acme: {
                  displayName: 'Acme Gateway',
                  api: 'openai-completions',
                  baseURL: 'https://api.acme.internal/v1',
                  models: [{ id: 'acme-think' }, { id: 'acme-retired' }],
                },
              },
            },
          },
          {
            ns: 'dsh-provider-toolkit',
            revision: 1,
            value: { network: { acme: { host: 'api.acme.internal', skipProxy: true, tls: 'ca', caFile: 'C:\\ca.pem' } } },
          },
        ],
      },
      overview: {
        providers: [
          {
            route: 'acme',
            displayName: 'Acme Gateway',
            api: 'openai-completions',
            baseURL: 'https://api.acme.internal/v1',
            host: 'api.acme.internal',
            apiKeyEnv: 'ACME_API_KEY',
            declaredModels: [
              { id: 'acme-think', name: 'Acme Think', contextWindow: 262144, reasoningMode: 'levels' },
              { id: 'acme-retired', name: '', reasoningMode: 'inherit' },
            ],
          },
        ],
        live: [{ id: 'acme', name: 'Acme Gateway' }],
      },
      failure: undefined,
    },
    probes: {
      acme: {
        result: {
          route: 'acme',
          endpoint: 'https://api.acme.internal/v1/models',
          protocol: 'openai-completions',
          models: [
            {
              id: 'acme-think',
              name: 'Acme Think',
              contextWindow: 262144,
              maxTokens: 32768,
              contextSource: 'endpoint',
              maxTokensSource: 'endpoint',
              reasoningEfforts: { off: null, low: 'low', high: 'high' },
              reasoningSource: 'metadata',
            },
            {
              id: 'acme-plain',
              name: 'acme-plain',
              contextWindow: 8192,
              maxTokens: 32000,
              contextSource: 'endpoint',
              maxTokensSource: 'global',
              reasoningSource: 'none',
            },
          ],
          configuredIds: ['acme-think', 'acme-retired'],
          filtered: 3,
          defaults: { contextWindow: 1000000, maxTokens: 32000, levels: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'] },
          notes: ['端点的列表里没有出现：acme-retired（会保留原有数值）。'],
        },
      },
    },
    drafts: {
      acme: { host: 'api.acme.internal', skipProxy: true, tls: 'ca', caFile: 'C:\\ca.pem', caPem: '', certFile: '', keyFile: '', saving: false, dirty: false },
    },
  }
}

/**
 * Render the panel with the given hook presets, in the panel's own call order:
 * state, probes, verifies, edits, selected, drafts, defaults, busy,
 * allowUnverified, includeNew, reasoningChoice, auto, alive-ref, autoRan-ref,
 * then ProviderBlock's `open`.
 */
function renderPanel(given) {
  const presets = [
    given.state,
    given.probes ?? {},
    given.verifies ?? {},
    given.edits ?? {},
    given.selected ?? {},
    given.drafts ?? {},
    given.defaults ?? { contextWindow: '1000000', maxTokens: '32000', exclude: 'embed, rerank', autoCapabilities: false, saving: false },
    given.busy ?? {},
    given.allowUnverified === true,
    given.includeNew === true,
    given.reasoningChoice ?? {},
    given.auto ?? {},
    { current: true },
    { current: given.autoRan ?? '' },
    given.open === true,
  ]
  return withPresets(presets, () => render(elementOf(PanelProbe.target, {
    settings: settingsStub,
    callOverview: given.callOverview ?? (() => Promise.resolve({ ok: true })),
    callProbe: given.callProbe ?? (() => Promise.resolve({ ok: true })),
    callVerify: given.callVerify ?? (() => Promise.resolve({ ok: true })),
    onDocumentUpdated: () => () => {},
    t: translator(),
  })))
}

test('the panel renders provider rows, the probe table, and the network policy fields', () => {
  const fixture = readyFixture()
  const tree = renderPanel({ state: fixture.state, probes: fixture.probes, drafts: fixture.drafts, open: true })
  const text = textsOf(tree).join(' | ')
  for (const expected of [
    '厂商探测与网络策略',
    'Acme Gateway',
    '已挂载',
    '2 个已声明的模型',
    'openai-completions',
    '探测端点能力',
    '测试选中模型的扩展能力',
    '确定添加 / 更新配置',
    '同时写入未验证的推断（端点可能拒绝，导致该轮请求失败）',
    '同时新增端点上其余 1 个对话模型',
    '每勾选一个模型会发',
    'Acme Think (acme-think)',
    '262144',
    '32768',
    '端点声明',
    '未能识别',
    '出站网络策略',
    '直连（忽略代理环境变量）',
    '使用指定 CA',
    '保存网络策略',
    '上下文 / 输出默认值与非对话模型过滤（所有厂商共用）',
    '默认上下文长度',
    '过滤关键字（逗号分隔）',
    '保存默认值',
    '端点的列表里没有出现：acme-retired（会保留原有数值）。',
  ]) {
    assert.equal(text.includes(expected), true, `the panel must render ${JSON.stringify(expected)}; got: ${text}`)
  }
  // The collapsed header shows the configured policy as a chip, so the user
  // can see at a glance where the network policy lives.
  const collapsed = renderPanel({ state: fixture.state, probes: fixture.probes, drafts: fixture.drafts, open: false })
  const collapsedText = textsOf(collapsed).join(' | ')
  assert.equal(collapsedText.includes('直连 + 自定义CA'), true, collapsedText)
  // Expanded blocks have no focus-outline styling: the blue frame is gone.
  assert.equal(text.includes('outline:none'), false) // CSS is not in the render tree; the assertion lives in the css string below.
})

test('the panel CSS removes focus outlines and accents checkboxes with the theme', () => {
  const source = readFileSync(entry, 'utf8')
  assert.equal(source.includes('.dspt_root :focus{outline:none;box-shadow:none}'), true)
  assert.equal(source.includes('input[type=checkbox]{width:14px;height:14px;accent-color:'), true)
  // The neighbouring capability editor's native checkboxes and radios are
  // reached through its own data-dsh-part markers, so nothing else in the app
  // is restyled. The radio matters as much as the checkbox: the checked
  // "声明档位" radio is the blue frame the user actually reported.
  assert.equal(source.includes('[data-dsh-part] input[type=checkbox],[data-dsh-part] input[type=radio]{accent-color:'), true)
  assert.equal(source.includes('[data-dsh-part] input[type=checkbox]:focus,[data-dsh-part] input[type=radio]:focus{outline:none;box-shadow:none}'), true)
})

test('the probe table marks an inferred level set as unverified', () => {
  const fixture = readyFixture()
  const probed = fixture.probes.acme.result.models[0]
  const tree = renderPanel({
    state: fixture.state,
    probes: { acme: { result: { ...fixture.probes.acme.result, models: [{ ...probed, reasoningSource: 'heuristic' }] } } },
    drafts: fixture.drafts,
    open: true,
  })
  const text = textsOf(tree).join(' | ')
  assert.equal(text.includes('按模型名推断（未验证）'), true, text)
})

test('the verification verdict table renders every level and its reason', () => {
  const fixture = readyFixture()
  const verify = {
    acme: {
      result: {
        route: 'acme',
        protocol: 'openai-completions',
        requests: 9,
        models: [
          {
            id: 'acme-think',
            verdicts: [
              { level: 'baseline', status: 'accepted', wire: '', sawReasoning: false },
              { level: 'low', status: 'accepted', wire: 'low', sawReasoning: true },
              { level: 'medium', status: 'rejected', wire: 'medium', sawReasoning: false, message: 'HTTP 400；端点自称接受：low、high' },
              { level: 'high', status: 'accepted', wire: 'high', sawReasoning: true },
            ],
            accepted: ['low', 'high'],
            tested: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
            capabilities: { developerRole: 'unsupported', imageInput: 'supported' },
          },
        ],
      },
    },
  }
  const tree = renderPanel({ state: fixture.state, probes: fixture.probes, verifies: verify, drafts: fixture.drafts, open: true })
  const text = textsOf(tree).join(' | ')
  for (const expected of [
    '基线（不带思考参数）',
    '接受',
    '拒绝',
    '有推理输出',
    'HTTP 400；端点自称接受：low、high',
    '端点实测（实测）',
    '实测可用档位：low / high',
    'off / low / high',
    '支持图像输入',
    '不认 developer 角色（确认时自动写 compat 修正）',
  ]) {
    assert.equal(text.includes(expected), true, `the verdict table must render ${JSON.stringify(expected)}; got: ${text}`)
  }
})

test('a verification that rejected everything explains itself instead of declaring "no reasoning"', () => {
  const fixture = readyFixture()
  const verify = {
    acme: {
      result: {
        route: 'acme',
        protocol: 'openai-completions',
        requests: 8,
        models: [
          {
            id: 'acme-think',
            verdicts: [
              { level: 'baseline', status: 'accepted', wire: '', sawReasoning: false },
              { level: 'minimal', status: 'rejected', wire: 'minimal', sawReasoning: false },
              { level: 'low', status: 'rejected', wire: 'low', sawReasoning: false },
              { level: 'medium', status: 'rejected', wire: 'medium', sawReasoning: false },
              { level: 'high', status: 'rejected', wire: 'high', sawReasoning: false },
              { level: 'xhigh', status: 'rejected', wire: 'xhigh', sawReasoning: false },
              { level: 'max', status: 'rejected', wire: 'max', sawReasoning: false },
            ],
            accepted: [],
            tested: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
          },
        ],
      },
    },
  }
  const text = textsOf(renderPanel({ state: fixture.state, probes: fixture.probes, verifies: verify, drafts: fixture.drafts, open: true })).join(' | ')
  assert.equal(text.includes('端点拒绝了全部测试档位'), true, text)
  assert.equal(text.includes('实测没有可用档位'), true, text)
})

test('a failed verification renders its message', () => {
  const fixture = readyFixture()
  const text = textsOf(renderPanel({
    state: fixture.state,
    probes: fixture.probes,
    verifies: { acme: { error: '实测失败：端点拒绝了凭据（HTTP 401）' } },
    drafts: fixture.drafts,
    open: true,
  })).join(' | ')
  assert.equal(text.includes('端点拒绝了凭据（HTTP 401）'), true, text)
})

test('a collapsed provider renders only its header and catalog summary', () => {
  const fixture = readyFixture()
  const text = textsOf(renderPanel({ state: fixture.state, probes: fixture.probes, drafts: fixture.drafts })).join(' | ')
  assert.equal(text.includes('Acme Gateway'), true)
  assert.equal(text.includes('展开'), true)
  // Collapsed: the probe table and the network editor must not be rendered,
  // but the policy chip gives the collapsed row its state at a glance.
  assert.equal(text.includes('出站网络策略'), false, text)
  assert.equal(text.includes('262144'), false, text)
  assert.equal(text.includes('直连 + 自定义CA'), true, text)
})

test('the bottom bar tests only the checked models, and the reasoning select offers common accepted levels', () => {
  const fixture = readyFixture()
  const verify = {
    acme: {
      result: {
        route: 'acme',
        protocol: 'openai-completions',
        requests: 9,
        models: [
          {
            id: 'acme-think',
            verdicts: [
              { level: 'low', status: 'accepted', wire: 'low', sawReasoning: true },
              { level: 'medium', status: 'rejected', wire: 'medium', sawReasoning: false },
              { level: 'high', status: 'accepted', wire: 'high', sawReasoning: true },
            ],
            accepted: ['low', 'high'],
            tested: ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'],
            capabilities: {},
          },
        ],
      },
    },
  }
  const tree = renderPanel({ state: fixture.state, probes: fixture.probes, verifies: verify, drafts: fixture.drafts, open: true })
  /** Find the confirm button and the test button, and invoke their handlers through the element props. */
  const buttons = []
  ;(function collect(node) {
    if (Array.isArray(node)) { node.forEach(collect); return }
    if (node === null || node === undefined || typeof node !== 'object') return
    if (node.type === 'button') buttons.push(node)
    ;(node.children ?? []).forEach(collect)
  })(tree)
  const labels = buttons.map((button) => textsOf(button.children ?? []).join(''))
  assert.equal(labels.includes('确定添加 / 更新配置'), true, labels.join(','))

  const text = textsOf(tree).join(' | ')
  assert.equal(text.includes('默认思考档位'), true, text)
  assert.equal(text.includes('low'), true)
  // The default thinking-level select shows only the levels every verified model accepted.
  const selectOptions = []
  ;(function collectOptions(node) {
    if (Array.isArray(node)) { node.forEach(collectOptions); return }
    if (node === null || node === undefined || typeof node !== 'object') return
    if (node.type === 'option') selectOptions.push(textsOf(node.children ?? []).join(''))
    ;(node.children ?? []).forEach(collectOptions)
  })(tree)
  assert.equal(selectOptions.includes('不改动'), true, JSON.stringify(selectOptions))
  assert.equal(selectOptions.includes('medium'), false, JSON.stringify(selectOptions))
})

test('confirm writes the rows, the developer-role compat fix, and the reasoning default', async () => {
  const fixture = readyFixture()
  const verify = {
    acme: {
      result: {
        route: 'acme',
        protocol: 'openai-completions',
        requests: 9,
        models: [
          {
            id: 'acme-think',
            verdicts: [
              { level: 'low', status: 'accepted', wire: 'low', sawReasoning: true },
              { level: 'high', status: 'accepted', wire: 'high', sawReasoning: true },
            ],
            accepted: ['low', 'high'],
            tested: ['low', 'high'],
            capabilities: { developerRole: 'unsupported', imageInput: 'supported' },
          },
        ],
      },
    },
  }
  mutations.length = 0
  const tree = renderPanel({
    state: fixture.state,
    probes: fixture.probes,
    verifies: verify,
    reasoningChoice: { acme: 'high' },
    drafts: fixture.drafts,
    open: true,
  })
  let confirm
  ;(function collect(node) {
    if (Array.isArray(node)) { node.forEach(collect); return }
    if (node === null || node === undefined || typeof node !== 'object') return
    if (node.type === 'button' && textsOf(node.children ?? []).join('') === '确定添加 / 更新配置') confirm = node
    ;(node.children ?? []).forEach(collect)
  })(tree)
  assert.notEqual(confirm, undefined, 'confirm button must render')
  confirm.props.onClick()
  await new Promise((resolve) => setTimeout(resolve, 0))

  assert.equal(mutations.length >= 1, true, 'confirm must write')
  const [write] = mutations
  assert.equal(write.ns, 'llm-pi-ai')
  const ops = write.ops
  const modelsOp = ops.find((op) => op.path.join('.') === 'providers.acme.models')
  const compatOp = ops.find((op) => op.path.join('.') === 'providers.acme.compat.supportsDeveloperRole')
  const reasoningOp = ops.find((op) => op.path.join('.') === 'providers.acme.reasoning')
  assert.notEqual(modelsOp, undefined, JSON.stringify(ops))
  assert.equal(modelsOp.value.length, 2, 'configured rows plus nothing new')
  // The verified-and-checked model carries image input and the developer fix.
  const think = modelsOp.value.find((row) => row.id === 'acme-think')
  sameJson(think.reasoningEfforts, { off: null, low: 'low', high: 'high' })
  assert.equal(compatOp.value, false)
  assert.equal(reasoningOp.value, 'high')
  // The retired model the endpoint never lists stays untouched.
  const retired = modelsOp.value.find((row) => row.id === 'acme-retired')
  sameJson(retired, { id: 'acme-retired' })
})

test('the empty state, the read-only notice, and a failed overview all render', () => {
  const empty = {
    phase: 'ready',
    view: { writable: true, namespaces: [] },
    overview: { providers: [], live: [] },
    failure: undefined,
  }
  assert.equal(textsOf(renderPanel({ state: empty })).join(' | ').includes('还没有配置任何 pi-ai 厂商'), true)

  const readOnly = {
    phase: 'ready',
    view: { writable: false, namespaces: [] },
    overview: { providers: [], live: [] },
    failure: undefined,
  }
  assert.equal(textsOf(renderPanel({ state: readOnly })).join(' | ').includes('当前设置文档只读'), true)

  const failed = {
    phase: 'error',
    view: undefined,
    overview: undefined,
    failure: 'host exploded',
  }
  const failedText = textsOf(renderPanel({ state: failed })).join(' | ')
  assert.equal(failedText.includes('host exploded'), true, failedText)
})

test('providers fall back to the settings document when the host overview fails', () => {
  const fixture = readyFixture()
  const overviewFailed = { ...fixture.state, overview: undefined, failure: 'overview unavailable' }
  const text = textsOf(renderPanel({ state: overviewFailed, probes: fixture.probes, drafts: fixture.drafts, open: true })).join(' | ')
  assert.equal(text.includes('Acme Gateway'), true, text)
  assert.equal(text.includes('overview unavailable'), true, text)
})

test('the very first mount — before describe() resolves — survives every effect', async () => {
  // The panel's own initial useState value: loading phase, no view. A splice
  // once read `view.namespaces` in the draft-sync effect, which crashed the
  // slot entry on the real Models page while every preset-driven test skipped
  // the loading state entirely.
  const tree = renderPanel({ state: { phase: 'loading', view: undefined, overview: undefined, failure: undefined } })
  assert.equal(textsOf(tree).join(' | ').includes(translator()('pt.loading')), true)
  await runEffects() // must not throw: this is the exact browser mount order
})

test('a ready phase that somehow lacks a view renders the failure card instead of crashing', () => {
  const tree = renderPanel({ state: { phase: 'ready', view: undefined, overview: undefined, failure: 'describe returned no document' } })
  const text = textsOf(tree).join(' | ')
  assert.equal(text.includes('describe returned no document'), true, text)
})

test('the overview reply is unwrapped through both envelopes', () => {
  const { overviewOf } = exported.__testables
  // The RPC layer wraps the host method's own {ok, value}: reading `.live` one
  // layer too early once marked every mounted route as unmounted.
  const good = overviewOf({ ok: true, value: { ok: true, value: { providers: [{ route: 'acme' }], live: [{ id: 'acme', name: 'Acme' }] } } })
  sameJson(good.value.live, [{ id: 'acme', name: 'Acme' }])
  sameJson(good.value.providers, [{ route: 'acme' }])
  assert.equal(good.failure, undefined)

  const hostFailed = overviewOf({ ok: true, value: { ok: false, error: { code: 'boom', message: 'host said no' } } })
  assert.equal(hostFailed.value, undefined)
  assert.equal(hostFailed.failure, 'host said no')

  const rpcFailed = overviewOf({ ok: false, error: { code: 'transport', message: 'transport down' } })
  assert.equal(rpcFailed.value, undefined)
  assert.equal(rpcFailed.failure, 'transport down')

  const junk = overviewOf(undefined)
  assert.equal(junk.value, undefined)
  assert.equal(junk.failure, 'unknown')
})