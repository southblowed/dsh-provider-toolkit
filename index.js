/**
 * dsh-provider-toolkit — host face.
 *
 * Two host-side jobs, both driven from the Models settings page's footer area:
 *
 * 1. **Endpoint interrogation** — the `providerToolkit/overview` and
 *    `providerToolkit/probe` Typert invocations let the browser half ask the
 *    host what a custom pi-ai provider actually serves: the model list, each
 *    model's input/output token capacity, and the reasoning-effort levels its
 *    endpoint advertises (falling back to an id heuristic). The reply is
 *    candidate metadata only — `settings.yaml` stays the only thing that
 *    decides what a route serves, exactly like the shipped discovery path.
 *
 * 2. **Per-provider outbound network policy** — pi-ai reaches the network
 *    through `globalThis.fetch`, which resolves undici's process-wide
 *    dispatcher (installed by `@deepseek-ai/dsh-http-proxy` from the launch
 *    environment). A provider profile has no field for "do not use the proxy"
 *    or "this intranet gateway has a private CA", so this plugin wraps
 *    `globalThis.fetch` and, for hosts the user configured, passes its own
 *    undici dispatcher: a direct connection when the proxy must be skipped,
 *    and a direct *or* proxied connection carrying custom TLS trust when the
 *    certificate is self-signed or signed by a private CA.
 *
 * The wrapper is installed on mount and removed on dispose, and it never
 * changes a request it does not recognize as a configured host.
 *
 * @module dsh-provider-toolkit
 */

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import s from '@deepseek-ai/schemastery'
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

/** This plugin's own settings namespace, holding every provider's network policy. */
const SETTINGS_NS = 'dsh-provider-toolkit'

/** The pi-ai settings namespace whose provider profiles this plugin reports on. */
const LLM_NS = 'llm-pi-ai'

/** Escalation order of the pi-ai thinking levels a detection may declare. */
const THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']

/** Every level name a metadata reply may carry and a declaration may therefore use. */
const LEVEL_SET = new Set(THINKING_LEVELS)

/** The reasoning declaration this plugin proposes when an endpoint confirms reasoning but names no levels. */
const COMMON_EFFORTS = { off: null, low: 'low', medium: 'medium', high: 'high' }

/** Hosts that must never be routed through a proxy, whatever a policy says. */
const LOOPBACK = [/^localhost$/i, /^127\./, /^\[?::1\]?$/, /^0\.0\.0\.0$/]

/** Interrogation timeout for one endpoint listing request. */
const PROBE_TIMEOUT_MS = 20000

/** Timeout for one live-verification chat request. */
const VERIFY_TIMEOUT_MS = 60000

/**
 * Protocols whose reasoning parameter this plugin can reproduce faithfully on
 * the wire, so a live probe meaningfully predicts the real request.
 *
 * `anthropic-messages` is deliberately absent: pi-ai chooses between adaptive
 * thinking, an explicit thinking budget, and mid-conversation effort from
 * catalog compat fields a hand-declared route does not carry, so a request this
 * plugin built could differ from the one the adapter would send — a verdict
 * from it would be worse than no verdict.
 */
const VERIFIABLE_PROTOCOLS = new Set(['openai-completions', 'openai-responses', 'azure-openai-responses'])

/** The levels a live verification tests, in escalation order. */
const VERIFY_LEVELS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max']

/** Every level a verification may be asked to test, plus `off` which needs no request. */
const VERIFY_LEVEL_SET = new Set(VERIFY_LEVELS)

/**
 * Ship-time defaults for a route whose endpoint discloses nothing.
 *
 * A gateway that answers `/v1/models` with bare ids (the common case for a
 * self-hosted proxy) leaves every capacity blank, and a blank capacity silently
 * becomes pi-ai's 262,144-token assumption — which is wrong for the million-token
 * models these gateways usually serve, and wrong in the direction that matters:
 * the harness would start compacting a long session far too late. Filling a
 * generous default that the user reviews is the smaller error, and every value
 * here is editable in the panel or in `settings.yaml`.
 */
const SHIPPED_DEFAULTS = {
  /** Capacity written for a model whose endpoint disclosed none. */
  contextWindow: 1000000,
  /** Output cap written for a model whose endpoint disclosed none. */
  maxTokens: 32000,
  /**
   * Per-family overrides, first match wins, tested as a substring of the model
   * id. Empty by default: one global default the panel can edit is the
   * predictable knob, and a shipped family rule would keep winning over a
   * default the user changed. A deployment that wants the extra automation
   * writes its own entries in `settings.yaml`.
   */
  patterns: [],
  /**
   * Substrings that mark a listing entry as not a chat model — embedders,
   * rerankers, speech models. A route's `/v1/models` routinely advertises
   * dozens of these beside the chat models, and adopting them into the model
   * list is never what the user meant.
   */
  exclude: ['embed', 'rerank', 'bge', 'bce', 'gte-', 'jina', 'nomic', 'paraphrase', 'minilm', 'asr', 'tts', 'whisper', 'ocr'],
  /** The levels a verification tests. */
  levels: VERIFY_LEVELS,
}

/** Cap on the models one `verifyReasoning` call may test, so a misclick cannot spend much. */
const VERIFY_MODEL_LIMIT = 20

/** Output-token cap for one verification request. */
const VERIFY_MAX_TOKENS = 16

/** A 1×1 transparent PNG, data-URL encoded, for the multimodality probe. */
const PROBE_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

/**
 * Messages a capability probe sends, as close to the real dispatch as possible.
 *
 * `developer` matters because pi-ai hands reasoning models their system prompt
 * with a `developer` role when the endpoint is believed to accept it — a hand
 * declared route gets that belief by default, and a gateway that does not know
 * the role answers `unknown variant 'developer'` exactly the way the user hit.
 * `image` does the same for multimodality with a real inline image.
 * @param mode - which probe to build.
 * @returns the messages array for the request body.
 */
function probeMessages(mode) {
  if (mode === 'developer') {
    return [
      { role: 'developer', content: 'You are a terse assistant.' },
      { role: 'user', content: 'Say ok.' },
    ]
  }
  if (mode === 'image') {
    return [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Reply with the single word ok.' },
          { type: 'image_url', image_url: { url: PROBE_PIXEL } },
        ],
      },
    ]
  }
  return [{ role: 'user', content: 'ping' }]
}

/** The input payload a responses-protocol image probe sends, when its shape differs. */
function probeInput(mode) {
  if (mode === 'image') {
    return [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Reply with the single word ok.' },
          { type: 'input_image', image_url: PROBE_PIXEL },
        ],
      },
    ]
  }
  return 'ping'
}

/** Fold one capability probe's outcome into a three-state verdict. */
function capabilityVerdict(outcome) {
  if (outcome.kind === 'accepted') return 'supported'
  if (outcome.kind === 'rejected') return 'unsupported'
  return 'unknown'
}

/** Plugin-level configuration; nothing tunable is required to use the plugin. */
const Config = s.object({
  /** Localised diagnostics this deployment wants to replace; unused by default. */
  probeTimeoutMs: s.number().step(1).min(1000).max(120000).default(PROBE_TIMEOUT_MS),
})

/** The settings section this plugin owns. */
const SectionSchema = s.object({
  /** One entry per provider route; a route outside this dict takes the process default. */
  network: s.any().default({}),
  /** Capacity defaults and listing filters applied when an endpoint discloses nothing. */
  defaults: s.any().default({}),
  /**
   * Measured capabilities, keyed by route then model, written by the browser half
   * so an automatic pass runs once per configuration shape instead of on every
   * page open. Value shape: `{ [route]: { [modelId]: { signature, accepted,
   * capabilities, at } } }`.
   */
  verify: s.any().default({}),
  /** Whether opening the Models page auto-detects and enables capabilities. */
  autoCapabilities: s.boolean().default(true),
})

/**
 * Normalize the plugin's defaults section over the shipped values.
 * @param section - the resolved `dsh-provider-toolkit` section, when registered.
 * @returns the effective defaults, with every field usable as-is.
 */
function resolveDefaults(section) {
  const raw = isRecord(section) && isRecord(section.defaults) ? section.defaults : {}
  const positive = (value, fallback) => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback)
  const patterns = []
  if (Array.isArray(raw.patterns)) {
    for (const entry of raw.patterns) {
      if (!isRecord(entry)) continue
      const match = firstString(entry.match)
      if (match === undefined) continue
      patterns.push({
        match: match.toLowerCase(),
        contextWindow: positive(entry.contextWindow, SHIPPED_DEFAULTS.contextWindow),
        maxTokens: positive(entry.maxTokens, SHIPPED_DEFAULTS.maxTokens),
      })
    }
  }
  const exclude = Array.isArray(raw.exclude)
    ? raw.exclude.filter((item) => typeof item === 'string' && item.length > 0).map((item) => item.toLowerCase())
    : [...SHIPPED_DEFAULTS.exclude]
  const levels = Array.isArray(raw.levels)
    ? raw.levels.filter((item) => typeof item === 'string' && VERIFY_LEVEL_SET.has(item))
    : [...SHIPPED_DEFAULTS.levels]
  return {
    /** Whether opening the Models page runs an automatic capability pass. Defaults on. */
    autoCapabilities: raw.autoCapabilities !== false,
    contextWindow: positive(raw.contextWindow, SHIPPED_DEFAULTS.contextWindow),
    maxTokens: positive(raw.maxTokens, SHIPPED_DEFAULTS.maxTokens),
    patterns,
    exclude,
    levels: levels.length > 0 ? levels : [...SHIPPED_DEFAULTS.levels],
  }
}

/**
 * The capacity defaults one model id resolves to.
 * @param id - the model id.
 * @param defaults - the effective defaults.
 * @returns the capacities and whether a family pattern chose them.
 */
function defaultsForModel(id, defaults) {
  const lower = typeof id === 'string' ? id.toLowerCase() : ''
  for (const pattern of defaults.patterns) {
    if (lower.includes(pattern.match)) return { contextWindow: pattern.contextWindow, maxTokens: pattern.maxTokens, source: 'pattern' }
  }
  return { contextWindow: defaults.contextWindow, maxTokens: defaults.maxTokens, source: 'global' }
}

/** Whether a listing entry is one of the non-chat models a route advertises. */
function isExcludedModel(id, exclude) {
  const lower = typeof id === 'string' ? id.toLowerCase() : ''
  return exclude.some((needle) => lower.includes(needle))
}

/** Whether a value is a plain data object. */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** First argument that is a non-empty string. */
function firstString(...values) {
  for (const value of values) if (typeof value === 'string' && value.length > 0) return value
  return undefined
}

/** First argument that is a positive finite number. */
function firstNumber(...values) {
  for (const value of values) if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.trunc(value)
  return undefined
}

/** Normalize an endpoint host into the form a policy matches. */
function hostOf(url) {
  if (typeof url !== 'string' || url.length === 0) return undefined
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return undefined
  }
}

/** Whether one request host matches a configured policy host (`*` matches every host). */
function hostMatches(requestHost, policyHost) {
  if (policyHost === '*') return true
  return requestHost === policyHost || requestHost.endsWith(`.${policyHost}`)
}

/** Whether a host is loopback, which never goes through a proxy. */
function isLoopback(host) {
  return LOOPBACK.some((pattern) => pattern.test(host))
}

/** Build a URL from every accepted `fetch` input shape. */
function urlOf(input) {
  if (typeof input === 'string') return new URL(input)
  if (input instanceof URL) return input
  if (isRecord(input) && typeof input.url === 'string') return new URL(input.url)
  return undefined
}

/** The proxy URL the process environment names for one scheme, if any. */
function proxyUrlFor(protocol) {
  const env = process.env
  const pick = (...names) => {
    for (const name of names) {
      const value = env[name]
      if (typeof value === 'string' && value.trim().length > 0) return value.trim()
    }
    return undefined
  }
  if (protocol === 'https:') return pick('https_proxy', 'HTTPS_PROXY', 'all_proxy', 'ALL_PROXY', 'http_proxy', 'HTTP_PROXY')
  return pick('http_proxy', 'HTTP_PROXY', 'all_proxy', 'ALL_PROXY')
}

/** Read one certificate file, returning undefined on any failure. */
function readTextFile(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return undefined
  }
}

/** The PEM blobs a policy's CA setting resolves to. */
function caMaterialOf(policy) {
  const out = []
  if (typeof policy.caPem === 'string' && policy.caPem.includes('BEGIN CERTIFICATE')) out.push(policy.caPem)
  if (typeof policy.caFile === 'string' && policy.caFile.length > 0) {
    const text = readTextFile(policy.caFile)
    if (text !== undefined) out.push(text)
  }
  return out
}

/** The undici `connect` options one policy asks for. */
function connectOptionsOf(policy) {
  const connect = {}
  if (policy.tls === 'insecure') connect.rejectUnauthorized = false
  if (policy.tls === 'ca') {
    const ca = caMaterialOf(policy)
    if (ca.length > 0) connect.ca = ca
  }
  if (typeof policy.certFile === 'string' && policy.certFile.length > 0) {
    const cert = readTextFile(policy.certFile)
    if (cert !== undefined) connect.cert = cert
  }
  if (typeof policy.keyFile === 'string' && policy.keyFile.length > 0) {
    const key = readTextFile(policy.keyFile)
    if (key !== undefined) connect.key = key
  }
  return connect
}

/** Whether one policy would change anything about how a request is sent. */
function isEffective(policy) {
  if (!isRecord(policy)) return false
  if (policy.skipProxy === true) return true
  if (policy.tls === 'insecure' || policy.tls === 'ca') return true
  return typeof policy.certFile === 'string' && policy.certFile.length > 0
}

/**
 * Resolve undici from the profile that loaded this package.
 *
 * A plugin installed by copying into the profile's `node_modules` resolves the
 * bare specifier directly; one mounted by `link:` keeps its real files outside
 * that tree, where the bare specifier does not resolve. The fallback anchors a
 * `createRequire` at the config-tree base the loader already handed the plugin
 * (`ctx.baseUrl`), which is the profile directory in both cases.
 * @param ctx - the plugin context supplying `baseUrl`.
 * @returns the undici module namespace.
 * @throws Error when undici cannot be resolved from either location.
 */
function loadUndici(ctx) {
  const require = createRequire(ctx.baseUrl ?? import.meta.url)
  return require('undici')
}

/** One model as the endpoint advertised it, plus what this plugin deduced. */
function normalizeListingEntry(raw, forcedId) {
  const id = firstString(forcedId, raw.id, raw.model, raw.slug, raw.name)
  return {
    id,
    name: firstString(raw.name, raw.display_name, raw.displayName, raw.title, id),
    contextWindow: firstNumber(
      raw.context_length,
      raw.context_window,
      raw.contextWindow,
      raw.max_context_length,
      raw.max_model_len,
      raw.max_input_tokens,
      isRecord(raw.top_provider) ? raw.top_provider.context_length : undefined,
      isRecord(raw.topProvider) ? raw.topProvider.context_length : undefined,
    ),
    maxTokens: firstNumber(
      raw.max_completion_tokens,
      raw.max_output_tokens,
      raw.maxTokens,
      raw.max_tokens,
      isRecord(raw.top_provider) ? raw.top_provider.max_completion_tokens : undefined,
      isRecord(raw.topProvider) ? raw.topProvider.max_completion_tokens : undefined,
    ),
    reasoning: reasoningFromMetadata(raw),
  }
}

/**
 * Read a reasoning declaration out of the metadata one listing entry carries.
 * @param raw - the entry as the endpoint sent it.
 * @returns a levels dict, `false` when the endpoint states the model does not reason, or undefined when the entry says nothing.
 */
function reasoningFromMetadata(raw) {
  const reasoning = raw.reasoning
  if (isRecord(reasoning)) {
    if (reasoning.supported === false) return false
    const efforts = Array.isArray(reasoning.supported_efforts)
      ? reasoning.supported_efforts
      : Array.isArray(reasoning.supportedEfforts)
        ? reasoning.supportedEfforts
        : undefined
    if (efforts !== undefined && efforts.length > 0) {
      const declared = { off: null }
      for (const level of efforts) if (typeof level === 'string' && LEVEL_SET.has(level)) declared[level] = level
      if (Object.keys(declared).length > 1) return declared
    }
    if (reasoning.supported === true) return { ...COMMON_EFFORTS }
  }
  const params = Array.isArray(raw.supported_parameters)
    ? raw.supported_parameters
    : Array.isArray(raw.supportedParameters)
      ? raw.supportedParameters
      : undefined
  if (params !== undefined) {
    if (params.includes('reasoning_effort')) return { ...COMMON_EFFORTS }
    if (params.includes('reasoning') || params.includes('include_reasoning') || params.includes('thinking')) return { ...COMMON_EFFORTS }
    if (params.includes('reasoning.max_tokens') || params.includes('thinking_token_budget')) return { ...COMMON_EFFORTS }
  }
  if (isRecord(raw.capabilities) && raw.capabilities.reasoning === false) return false
  return undefined
}

/**
 * Guess a reasoning declaration from a model id.
 *
 * A guess is offered only where the id names a family whose reasoning effort
 * parameter is well established; everything else stays undeclared so the
 * settings page keeps inheriting and nothing is written that the endpoint
 * would refuse.
 * @param id - the model id.
 * @returns a levels dict, or undefined when the id says nothing.
 */
function reasoningFromId(id) {
  if (typeof id !== 'string' || id.length === 0) return undefined
  const patterns = [
    /deepseek[-_/]?(r1|reasoner|v3\.[12]|v3-2|v4)/i,
    /qwq|qwen[-_]?3/i,
    /(^|[-_/])o[134]($|[-_./])|gpt[-_]?5|gpt[-_]?oss/i,
    /glm[-_]?(4\.[56]|z1)/i,
    /kimi[-_]?(k2|k1\.5|thinking)/i,
    /minimax[-_]?m[12]/i,
    /claude[-_].*(opus|sonnet|haiku)[-_]?4/i,
    /gemini[-_]?(2\.5|3)/i,
    /(^|[-_/])(thinking|reasoner)([-_/.]|$)/i,
  ]
  for (const pattern of patterns) if (pattern.test(id)) return { ...COMMON_EFFORTS }
  return undefined
}

/** Normalize one endpoint reply into listing entries. */
function parseListing(body) {
  const entries = []
  if (Array.isArray(body)) entries.push(...body)
  else if (isRecord(body)) {
    if (Array.isArray(body.data)) entries.push(...body.data)
    else if (isRecord(body.models)) {
      for (const [key, value] of Object.entries(body.models)) {
        if (isRecord(value)) entries.push({ ...value, id: key })
        else if (value !== null && value !== undefined) entries.push({ id: key, name: typeof value === 'string' ? value : key })
      }
    } else if (Array.isArray(body.models)) entries.push(...body.models)
  }
  const out = []
  const seen = new Set()
  for (const entry of entries) {
    if (!isRecord(entry)) continue
    const normalized = normalizeListingEntry(entry)
    if (normalized.id === undefined || seen.has(normalized.id)) continue
    seen.add(normalized.id)
    out.push(normalized)
  }
  return out
}

/**
 * Candidate listing URLs for one endpoint, most specific first.
 * @param baseURL - the route's configured endpoint.
 * @param api - the route's wire protocol, when it names one.
 * @returns absolute URLs to try in order.
 */
function listingUrls(baseURL, api) {
  const base = baseURL.replace(/\/+$/, '')
  const versioned = /\/v\d+(\.\d+)?$/i.test(base)
  if (api === 'anthropic-messages') {
    const root = versioned ? base : `${base}/v1`
    return [`${root}/models?limit=1000`, `${base}/models?limit=1000`]
  }
  return versioned ? [`${base}/models`] : [`${base}/v1/models`, `${base}/models`]
}

/** A failed invocation result carrying a stable code. */
function failure(code, message) {
  return { ok: false, error: { code, message } }
}

/** The chat-completions URL for one endpoint. */
function chatUrl(baseURL) {
  const base = baseURL.replace(/\/+$/, '')
  if (/\/v\d+(\.\d+)?$/i.test(base)) return `${base}/chat/completions`
  return `${base}/v1/chat/completions`
}

/** The responses URL for one endpoint. */
function responsesUrl(baseURL) {
  const base = baseURL.replace(/\/+$/, '')
  if (/\/v\d+(\.\d+)?$/i.test(base)) return `${base}/responses`
  return `${base}/v1/responses`
}

/** The request field pi-ai caps output with, for one route's compat. */
function maxTokensFieldOf(compat) {
  return compat !== undefined && compat.maxTokensField === 'max_completion_tokens' ? 'max_completion_tokens' : 'max_tokens'
}

/** Resolve one `chat_template_kwargs` placeholder the way pi-ai does. */
function resolveChatTemplateValue(value, level, budget) {
  if (Array.isArray(value)) return value.map((item) => resolveChatTemplateValue(item, level, budget))
  if (isRecord(value)) {
    if (typeof value.$var === 'string') {
      if (value.$var === 'thinking.enabled') return true
      if (value.$var === 'thinking.effort') return level
      if (value.$var === 'thinking.budget') return budget
      return undefined
    }
    const out = {}
    for (const [key, item] of Object.entries(value)) out[key] = resolveChatTemplateValue(item, level, budget)
    return out
  }
  return value
}

/** The reasoning token budget one level asks for, when the profile declares budgets. */
function budgetForLevel(budgets, level) {
  if (isRecord(budgets) && typeof budgets[level] === 'number' && Number.isFinite(budgets[level])) return Math.trunc(budgets[level])
  return undefined
}

/**
 * Reproduce the exact request-body fields pi-ai adds for one reasoning level.
 *
 * This mirrors the `openai-completions` and `openai-responses` dispatch tables
 * in `@earendil-works/pi-ai`, so a live probe sends the same parameter the real
 * call would. Reproducing it is the whole point: testing a different field
 * would produce a verdict about a request this harness never makes.
 * @param api - the route's wire protocol.
 * @param compat - the model's effective `compat` switches.
 * @param level - the thinking level being tested.
 * @param wire - the spelling dispatch would send for that level.
 * @param budgets - the route's or model's `thinkingBudgets`, when declared.
 * @returns `{ fields }`, or `{ unsupported }` when the format cannot be reproduced.
 */
function reasoningFieldsFor(api, compat, level, wire, budgets) {
  const effort = typeof wire === 'string' && wire.length > 0 ? wire : undefined
  if (api === 'openai-responses' || api === 'azure-openai-responses') {
    return { fields: { reasoning: { ...(effort === undefined ? {} : { effort }), summary: 'auto' } } }
  }
  const format = compat !== undefined && typeof compat.thinkingFormat === 'string' ? compat.thinkingFormat : 'openai'
  const budget = budgetForLevel(budgets, level)
  switch (format) {
    case 'zai':
      return { fields: { thinking: { type: 'enabled', clear_thinking: false }, ...(effort === undefined ? {} : { reasoning_effort: effort }) } }
    case 'qwen':
      return { fields: { enable_thinking: true, ...(effort === undefined ? {} : { reasoning_effort: effort }) } }
    case 'qwen-chat-template':
      return { fields: { chat_template_kwargs: { enable_thinking: true, preserve_thinking: true } } }
    case 'chat-template': {
      const template = compat !== undefined ? compat.chatTemplateKwargs : undefined
      if (!isRecord(template)) return { unsupported: '该厂商的 thinkingFormat=chat-template 但没有配置 chat_template_kwargs，无法复现真实请求' }
      const resolved = resolveChatTemplateValue(template, level, budget)
      const fields = resolved === undefined ? {} : { chat_template_kwargs: resolved }
      if (Object.keys(fields).length === 0) return { unsupported: 'chat_template_kwargs 的占位符无法解析为具体取值' }
      return { fields }
    }
    case 'baseten': {
      const template = compat !== undefined ? compat.chatTemplateArgs : undefined
      const resolved = isRecord(template) ? resolveChatTemplateValue(template, level, budget) : undefined
      return {
        fields: {
          ...(resolved === undefined || Object.keys(resolved).length === 0 ? {} : { chat_template_args: resolved }),
          ...(effort === undefined ? {} : { reasoning_effort: effort }),
        },
      }
    }
    case 'deepseek':
      return { fields: { thinking: { type: 'enabled' }, ...(effort === undefined ? {} : { reasoning_effort: effort }) } }
    case 'openrouter':
    case 'ant-ling':
      return { fields: effort === undefined ? {} : { reasoning: { effort } } }
    case 'together':
      return { fields: { reasoning: { enabled: true }, ...(effort === undefined ? {} : { reasoning_effort: effort }) } }
    case 'string-thinking':
      return { fields: effort === undefined ? {} : { thinking: effort } }
    default:
      return { fields: effort === undefined ? {} : { reasoning_effort: effort } }
  }
}

/** Whether the response body shows the model actually reasoned. */
function sawReasoningIn(body) {
  if (!isRecord(body)) return false
  const details = isRecord(body.usage) && isRecord(body.usage.completion_tokens_details) ? body.usage.completion_tokens_details : undefined
  if (details !== undefined && typeof details.reasoning_tokens === 'number' && details.reasoning_tokens > 0) return true
  const choices = Array.isArray(body.choices) ? body.choices : []
  for (const choice of choices) {
    if (!isRecord(choice) || !isRecord(choice.message)) continue
    if (typeof choice.message.reasoning_content === 'string' && choice.message.reasoning_content.length > 0) return true
    if (typeof choice.message.reasoning === 'string' && choice.message.reasoning.length > 0) return true
    if (Array.isArray(choice.message.reasoning)) return true
  }
  const output = Array.isArray(body.output) ? body.output : []
  for (const item of output) if (isRecord(item) && item.type === 'reasoning') return true
  return false
}

/** The endpoint's own error text, when it sent one. */
function errorTextOf(body) {
  if (!isRecord(body)) return undefined
  if (typeof body.error === 'string') return body.error
  if (isRecord(body.error)) return firstString(body.error.message, body.error.detail, body.error.type)
  if (typeof body.message === 'string') return body.message
  return undefined
}

/**
 * Read the reasoning levels an endpoint's rejection names, when it names them.
 * Many OpenAI-compatible servers answer an unsupported `reasoning_effort` with
 * a message listing the accepted values.
 *
 * Both ASCII and CJK punctuation delimit a name, because a gateway serving a
 * Chinese-speaking deployment answers in Chinese (`请使用 low、high 或 max`).
 * @param message - the endpoint's error text.
 * @returns the levels it named, in escalation order.
 */
function levelsNamedIn(message) {
  if (typeof message !== 'string' || message.length === 0) return []
  const found = []
  for (const level of THINKING_LEVELS) {
    if (new RegExp(`["'\`\\s(=,（、，：:；;]${level}(?:["'\`\\s,.)）、，。：:；;]|$)`, 'i').test(message)) found.push(level)
  }
  return found
}

/**
 * Turn parsed listing entries into the probe reply the panel renders.
 *
 * Two transforms happen here, both about making a bare listing usable:
 * non-chat entries are dropped (a route advertises its embedders and rerankers
 * beside its chat models), and a capacity the endpoint did not disclose is
 * filled from the plugin's defaults, tagged so the panel can say where each
 * number came from.
 * @param route - the provider route that was interrogated.
 * @param url - the listing URL that answered.
 * @param api - the route's wire protocol, when it names one.
 * @param entries - the normalized listing entries.
 * @param profile - the route's configured profile.
 * @param keyless - whether the request went out without a credential.
 * @param defaults - the effective capacity and filter defaults.
 * @returns the `probe` invocation's success value.
 */
function buildProbeResult(route, url, api, entries, profile, keyless, defaults) {
  const configured = Array.isArray(profile.models) ? profile.models.filter(isRecord) : []
  const configuredIds = configured.map((entry) => firstString(entry.id)).filter((id) => id !== undefined)
  const configuredSet = new Set(configuredIds)
  const notes = []
  if (keyless) notes.push('未找到该 provider 的凭据，本次探测未带认证头；若端点要求认证，请在卡片里填写 API key。')
  let filtered = 0
  const models = []
  for (const entry of entries) {
    // A model the configuration already lists is never filtered away: the user
    // asked for it, and hiding it would make its row unreachable.
    if (!configuredSet.has(entry.id) && isExcludedModel(entry.id, defaults.exclude)) {
      filtered += 1
      continue
    }
    const fromMetadata = entry.reasoning
    const fromId = fromMetadata === undefined ? reasoningFromId(entry.id) : undefined
    const reasoning = fromMetadata !== undefined ? fromMetadata : fromId
    const fallback = defaultsForModel(entry.id, defaults)
    models.push({
      id: entry.id,
      name: entry.name ?? entry.id,
      contextWindow: entry.contextWindow ?? fallback.contextWindow,
      maxTokens: entry.maxTokens ?? fallback.maxTokens,
      contextSource: entry.contextWindow === undefined ? fallback.source : 'endpoint',
      maxTokensSource: entry.maxTokens === undefined ? fallback.source : 'endpoint',
      reasoningEfforts: reasoning,
      reasoningSource: fromMetadata !== undefined ? 'metadata' : fromId !== undefined ? 'heuristic' : 'none',
    })
  }
  const advertised = new Set(models.map((model) => model.id))
  const missing = configuredIds.filter((id) => !advertised.has(id))
  if (missing.length > 0) notes.push(`端点的列表里没有出现：${missing.join('、')}（会保留原有数值）。`)
  const filled = models.filter((model) => model.contextSource !== 'endpoint').length
  if (filled > 0) notes.push(`${filled} 个模型没有披露上下文长度，已填入默认值（表里标为「默认」，确认前可以改）。`)
  if (filtered > 0) notes.push(`已过滤 ${filtered} 个非对话模型（embedding / rerank / 语音等），它们不会被写入配置。`)
  const inferred = models.filter((model) => model.reasoningSource === 'heuristic').length
  if (inferred > 0) {
    notes.push(`${inferred} 个模型的思考级别只是按模型名推断、端点没有确认；默认不会写入，请先用「实测思考级别」验证。`)
  }
  return {
    route,
    endpoint: url,
    protocol: api,
    models,
    configuredIds,
    filtered,
    defaults: { contextWindow: defaults.contextWindow, maxTokens: defaults.maxTokens, levels: defaults.levels },
    notes,
  }
}

/**
 * The `providerToolkit` service: settings-owned network policy plus endpoint
 * interrogation for the Models page.
 *
 * The network policy is enforced by wrapping `globalThis.fetch` once on mount.
 * The wrapper reads the *live* policy for each request, so a settings change
 * takes effect on the next request with no restart, and it restores the
 * original fetch when the plugin is disposed.
 */
class ProviderToolkitService extends TypertRemoteService {
  static Config = Config

  constructor(ctx, config) {
    super(ctx, 'providerToolkit')
    this.ctx = ctx
    this.probeTimeoutMs = config?.probeTimeoutMs ?? PROBE_TIMEOUT_MS
    /** Cache of the parsed policy resolved for each host, rebuilt on a settings change. */
    this.policy = { ready: false, entries: [], signature: '' }
    /** One undici dispatcher per distinct connect configuration. */
    this.dispatchers = new Map()
    /** The undici module namespace, resolved lazily so a failure is reported not thrown. */
    this.undici = undefined
    this.undiciError = undefined

    ctx.inject(['settings'], (settingsCtx) => {
      const settings = settingsCtx.settings
      try {
        if (typeof settings.installSection === 'function') {
          settings.installSection(ctx, SETTINGS_NS, SectionSchema, {}, { setSource: () => {}, onChange: () => {} })
        } else if (typeof settings.register === 'function') {
          settings.register(SETTINGS_NS, SectionSchema, { base: {} })
        }
      } catch (error) {
        console.error(`[dsh-provider-toolkit] settings namespace registration failed: ${String(error?.message ?? error)}`)
      }
    })

    ctx.effect(() => {
      const invalidate = () => {
        this.policy.ready = false
      }
      const off = ctx.on('settings/updated', (ns) => {
        if (ns === SETTINGS_NS) invalidate()
      })
      const offRaw = ctx.on('settings/document-updated', (ns) => {
        if (ns === SETTINGS_NS) invalidate()
      })
      return () => {
        off()
        offRaw()
      }
    }, 'dsh-provider-toolkit: policy invalidation')

    ctx.effect(() => this.installFetchPolicy(), 'dsh-provider-toolkit: outbound fetch policy')

    ctx.effect(() => () => {
      for (const dispatcher of this.dispatchers.values()) {
        try {
          const closed = dispatcher.close?.()
          if (closed !== undefined && typeof closed.catch === 'function') closed.catch(() => {})
        } catch {
          /* a dispatcher that refuses to close is already unusable */
        }
      }
      this.dispatchers.clear()
    }, 'dsh-provider-toolkit: dispatcher teardown')
  }

  /** The settings service, when it is mounted. */
  get settingsService() {
    return this.ctx.get('settings')
  }

  /** The resolved pi-ai section, when the namespace is registered. */
  llmSection() {
    const settings = this.settingsService
    if (settings === undefined || typeof settings.get !== 'function') return undefined
    try {
      const value = settings.get(LLM_NS)
      return isRecord(value) ? value : undefined
    } catch {
      return undefined
    }
  }

  /** The resolved policy section this plugin owns. */
  policySection() {
    const settings = this.settingsService
    if (settings === undefined || typeof settings.get !== 'function') return undefined
    try {
      const value = settings.get(SETTINGS_NS)
      return isRecord(value) ? value : undefined
    } catch {
      return undefined
    }
  }

  /** The effective capacity, filter, and verification-level defaults. */
  defaults() {
    return resolveDefaults(this.policySection())
  }

  /**
   * Report every configured pi-ai provider with the facts the footer panel
   * renders, plus which routes a live adapter currently serves.
   * @returns the provider rows in settings order.
   */
  async overview() {
    const section = this.llmSection()
    const providers = []
    const raw = section !== undefined && isRecord(section.providers) ? section.providers : {}
    for (const [route, value] of Object.entries(raw)) {
      if (!isRecord(value)) continue
      const baseURL = firstString(value.baseURL)
      const models = Array.isArray(value.models) ? value.models.filter(isRecord) : undefined
      providers.push({
        route,
        displayName: firstString(value.displayName, route),
        api: firstString(value.api) ?? '',
        baseURL: baseURL ?? '',
        host: hostOf(baseURL) ?? '',
        apiKeyEnv: firstString(value.apiKeyEnv) ?? '',
        declaredModels: models === undefined ? undefined : models.map((entry) => ({
          id: firstString(entry.id) ?? '',
          name: firstString(entry.name) ?? '',
          contextWindow: firstNumber(entry.contextWindow),
          maxTokens: firstNumber(entry.maxTokens),
          reasoningMode: entry.reasoningEfforts === false
            ? 'none'
            : isRecord(entry.reasoningEfforts) ? 'levels' : 'inherit',
        })),
      })
    }
    let live = []
    const llm = this.ctx.get('llm')
    if (llm !== undefined && typeof llm.listProviders === 'function') {
      try {
        live = llm.listProviders().map((entry) => ({ id: entry.id, name: entry.name }))
      } catch {
        live = []
      }
    }
    return { ok: true, value: { providers, live } }
  }

  /**
   * Interrogate one provider's endpoint for the models it advertises, the
   * capacities it discloses, and the reasoning levels it confirms or implies.
   * @param request - `{ route }`, the provider route to interrogate.
   * @returns candidate metadata; nothing is written to settings.
   */
  async probe(request) {
    const route = isRecord(request) ? firstString(request.route) : undefined
    if (route === undefined) return failure('invalid-route', 'probe 需要一个 provider 路由（route）')
    const section = this.llmSection()
    const profile = section !== undefined && isRecord(section.providers) ? section.providers[route] : undefined
    if (!isRecord(profile)) return failure('unknown-route', `设置里没有 provider「${route}」`)
    const baseURL = firstString(profile.baseURL)
    if (baseURL === undefined || !/^https?:\/\//i.test(baseURL)) {
      return failure(
        'missing-endpoint',
        `provider「${route}」没有可用的 http(s) endpoint；内置目录路由请先在卡片里填写 baseURL`,
      )
    }
    const api = firstString(profile.api) ?? ''
    const headers = isRecord(profile.headers)
      ? Object.fromEntries(Object.entries(profile.headers).filter(([, value]) => typeof value === 'string'))
      : {}
    const apiKey = await this.resolveApiKey(profile)
    const urls = listingUrls(baseURL, api)
    const defaults = this.defaults()
    let lastError
    for (const url of urls) {
      const result = await this.fetchListing(url, api, headers, apiKey)
      if (result.ok) return this.probeResult(route, url, api, result.entries, profile, apiKey === undefined, defaults)
      lastError = result.error
    }
    return lastError ?? failure('probe-failed', '端点没有返回可解析的模型列表')
  }

  /**
   * Test a provider's reasoning levels against the real endpoint instead of
   * inferring them.
   *
   * A declaration the endpoint does not accept is not a harmless extra option:
   * the model picker offers the level, the loop logs the message, and the
   * request is refused mid-turn. So a level is only ever declared from what the
   * endpoint itself disclosed (`probe`) or from this call's verdicts.
   *
   * Each tested level costs one minimal request (`max_tokens` 16), plus one
   * baseline request per model so an endpoint-wide failure can be told apart
   * from a rejected level.
   * @param request - `{ route, models? }`; omission tests every declared model, up to a cap.
   * @returns per-model, per-level verdicts; nothing is written to settings.
   */
  async verifyReasoning(request) {
    const route = isRecord(request) ? firstString(request.route) : undefined
    if (route === undefined) return failure('invalid-route', 'verifyReasoning 需要一个 provider 路由（route）')
    const section = this.llmSection()
    const profile = section !== undefined && isRecord(section.providers) ? section.providers[route] : undefined
    if (!isRecord(profile)) return failure('unknown-route', `设置里没有 provider「${route}」`)
    const baseURL = firstString(profile.baseURL)
    if (baseURL === undefined || !/^https?:\/\//i.test(baseURL)) {
      return failure('missing-endpoint', `provider「${route}」没有可用的 http(s) endpoint，无法实测`)
    }
    const api = firstString(profile.api) ?? ''
    if (!VERIFIABLE_PROTOCOLS.has(api)) {
      return failure(
        'unsupported-protocol',
        `协议「${api || '未声明'}」不在可实测范围内（只支持 openai-completions / openai-responses）；该厂商的思考级别请以端点声明为准，或手工声明`,
      )
    }
    const declared = Array.isArray(profile.models) ? profile.models.filter(isRecord) : []
    const requested = isRecord(request) && Array.isArray(request.models)
      ? request.models.filter((id) => typeof id === 'string' && id.length > 0)
      : declared.map((entry) => firstString(entry.id)).filter((id) => id !== undefined)
    if (requested.length === 0) return failure('no-models', '该 provider 还没有声明任何模型，无法实测')
    if (requested.length > VERIFY_MODEL_LIMIT) {
      return failure('too-many-models', `一次最多实测 ${VERIFY_MODEL_LIMIT} 个模型，本次请求了 ${requested.length} 个`)
    }
    const headers = isRecord(profile.headers)
      ? Object.fromEntries(Object.entries(profile.headers).filter(([, value]) => typeof value === 'string'))
      : {}
    const apiKey = await this.resolveApiKey(profile)
    const routeCompat = isRecord(profile.compat) ? profile.compat : undefined
    const routeBudgets = isRecord(profile.thinkingBudgets) ? profile.thinkingBudgets : undefined
    const levels = this.defaults().levels
    const models = []
    for (const id of requested) {
      const entry = declared.find((candidate) => firstString(candidate.id) === id)
      const modelCompat = entry !== undefined && isRecord(entry.compat) ? entry.compat : undefined
      const compat = modelCompat !== undefined || routeCompat !== undefined ? { ...routeCompat, ...modelCompat } : undefined
      const declaredEfforts = entry !== undefined && isRecord(entry.reasoningEfforts) ? entry.reasoningEfforts : undefined
      const baseline = await this.chatProbe(route, { baseURL, api, headers, apiKey, compat, model: id, fields: {} })
      if (baseline.kind === 'refused') {
        models.push({ id, verdicts: [], accepted: [], tested: [], capabilities: {}, failure: { code: baseline.code, message: baseline.message } })
        continue
      }
      // Capability probes run before any level test so a model that cannot
      // talk at all reports that, not a list of reasoning rejections.
      const developer = await this.chatProbe(route, { baseURL, api, headers, apiKey, compat, model: id, mode: 'developer', fields: {} })
      const image = await this.chatProbe(route, { baseURL, api, headers, apiKey, compat, model: id, mode: 'image', fields: {} })
      const capabilities = {
        developerRole: capabilityVerdict(developer),
        imageInput: capabilityVerdict(image),
      }
      const verdicts = [{ level: 'baseline', status: baseline.kind === 'accepted' ? 'accepted' : 'inconclusive', wire: '', sawReasoning: baseline.sawReasoning, message: baseline.message }]
      const accepted = []
      const tested = []
      for (const level of levels) {
        const wire = declaredEfforts !== undefined && typeof declaredEfforts[level] === 'string' ? declaredEfforts[level] : level
        tested.push(level)
        const reproduced = reasoningFieldsFor(api, compat, level, wire, routeBudgets)
        if (reproduced.unsupported !== undefined) {
          verdicts.push({ level, status: 'unverifiable', wire, sawReasoning: false, message: reproduced.unsupported })
          continue
        }
        const outcome = await this.chatProbe(route, { baseURL, api, headers, apiKey, compat, model: id, level, fields: reproduced.fields })
        if (outcome.kind === 'refused') {
          verdicts.push({ level, status: 'inconclusive', wire, sawReasoning: false, message: outcome.message })
          continue
        }
        if (outcome.kind === 'accepted') accepted.push(level)
        verdicts.push({
          level,
          status: outcome.kind === 'accepted' ? 'accepted' : 'rejected',
          wire,
          sawReasoning: outcome.kind === 'accepted' ? outcome.sawReasoning : false,
          message: outcome.message,
        })
      }
      models.push({ id, verdicts, accepted, tested, capabilities })
    }
    return {
      ok: true,
      value: {
        route,
        protocol: api,
        models,
        levels,
        requests: models.reduce((total, model) => total + 3 + model.tested.length, 0),
      },
    }
  }

  /**
   * Send one minimal chat request and classify the endpoint's answer.
   * @param route - the provider route, for diagnostics.
   * @param spec - endpoint, credential, model, and the fields being tested.
   * @returns `accepted`, `rejected`, or `refused` (the request never reached a verdict).
   */
  async chatProbe(route, spec) {
    const headers = { 'content-type': 'application/json', accept: 'application/json', ...spec.headers }
    if (typeof spec.apiKey === 'string' && spec.apiKey.length > 0) headers.authorization = `Bearer ${spec.apiKey}`
    const responses = spec.api === 'openai-responses' || spec.api === 'azure-openai-responses'
    const cap = responses
      ? (spec.compat !== undefined && spec.compat.supportsMaxOutputTokens === false ? undefined : 'max_output_tokens')
      : maxTokensFieldOf(spec.compat)
    const body = responses
      ? { model: spec.model, input: probeInput(spec.mode), stream: false, ...(cap === undefined ? {} : { [cap]: VERIFY_MAX_TOKENS }), ...spec.fields }
      : { model: spec.model, messages: probeMessages(spec.mode), [cap]: VERIFY_MAX_TOKENS, stream: false, ...spec.fields }
    const url = responses ? responsesUrl(spec.baseURL) : chatUrl(spec.baseURL)
    let response
    try {
      const fetchImpl = typeof globalThis.fetch === 'function' ? globalThis.fetch : undefined
      if (fetchImpl === undefined) return { kind: 'refused', code: 'no-fetch', message: '宿主进程没有可用的 fetch' }
      response = await fetchImpl(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { kind: 'refused', code: 'request-failed', message: `${url} 请求失败：${message}` }
    }
    const text = await response.text().catch(() => '')
    let parsed
    try {
      parsed = text.length > 0 ? JSON.parse(text) : undefined
    } catch {
      parsed = undefined
    }
    if (response.ok) return { kind: 'accepted', sawReasoning: sawReasoningIn(parsed), message: undefined }
    const detail = firstString(errorTextOf(parsed), text.slice(0, 300))
    if (response.status === 401 || response.status === 403) {
      return { kind: 'refused', code: 'auth', message: `provider「${route}」拒绝了凭据（HTTP ${response.status}）：${detail ?? ''}` }
    }
    if (response.status === 404) {
      return { kind: 'refused', code: 'not-found', message: `${url} 返回 404，请确认 baseURL 与协议（HTTP 404）` }
    }
    if (response.status === 429 || response.status >= 500) {
      return { kind: 'refused', code: 'transient', message: `端点暂时不可用（HTTP ${response.status}）：${detail ?? ''}` }
    }
    const named = levelsNamedIn(detail ?? '')
    // A gateway that lists the level it just refused is contradicting itself:
    // its own set is the family's documented set, not this model's. Saying so
    // is more useful than either hiding it or believing it.
    const contradiction = spec.level !== undefined && named.includes(spec.level)
    return {
      kind: 'rejected',
      status: response.status,
      message: named.length > 0
        ? `HTTP ${response.status}；端点自称接受：${named.join('、')}${contradiction ? `（含本次被拒的 ${spec.level}，端点自述与实测不一致）` : ''}`
        : `HTTP ${response.status}${detail === undefined ? '' : `：${detail}`}`,
    }
  }

  /**
   * Resolve one route's credential reference through the harness credential seam.
   *
   * Only `apiKeyEnv` is read: a route using pi-ai's own stored sign-in record
   * authenticates through a flow whose record this plugin cannot interpret, so
   * such a route is probed unauthenticated and the reply says so rather than
   * guessing at a token shape.
   * @param profile - the route's configured profile.
   * @returns the key value, or undefined when the route has no resolvable reference.
   */
  async resolveApiKey(profile) {
    const ref = firstString(profile.apiKeyEnv)
    if (ref === undefined) return undefined
    const credentials = this.ctx.get('credentials')
    if (credentials === undefined || typeof credentials.resolve !== 'function') return undefined
    try {
      const resolved = await credentials.resolve(ref)
      if (isRecord(resolved) && typeof resolved.value === 'string' && resolved.value.length > 0) return resolved.value
    } catch {
      return undefined
    }
    return undefined
  }

  /** Perform one listing request and parse it. */
  async fetchListing(url, api, headers, apiKey) {
    const requestHeaders = { accept: 'application/json', ...headers }
    if (apiKey !== undefined) {
      if (api === 'anthropic-messages') requestHeaders['x-api-key'] = apiKey
      else requestHeaders.authorization = `Bearer ${apiKey}`
    }
    if (api === 'anthropic-messages' && requestHeaders['anthropic-version'] === undefined) {
      requestHeaders['anthropic-version'] = '2023-06-01'
    }
    let response
    try {
      const fetchImpl = typeof globalThis.fetch === 'function' ? globalThis.fetch : undefined
      if (fetchImpl === undefined) return { ok: false, error: failure('no-fetch', '宿主进程没有可用的 fetch') }
      response = await fetchImpl(url, {
        method: 'GET',
        headers: requestHeaders,
        signal: AbortSignal.timeout(this.probeTimeoutMs),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { ok: false, error: failure('request-failed', `${url} 请求失败：${message}`) }
    }
    if (!response.ok) {
      return { ok: false, error: failure('http-error', `${url} 返回 HTTP ${response.status}`) }
    }
    let body
    try {
      body = await response.json()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return { ok: false, error: failure('bad-json', `${url} 的响应不是 JSON：${message}`) }
    }
    const entries = parseListing(body)
    if (entries.length === 0) return { ok: false, error: failure('empty-listing', `${url} 没有返回任何模型`) }
    return { ok: true, entries }
  }

  /** Turn parsed listing entries into the probe reply the panel renders. */
  probeResult(route, url, api, entries, profile, keyless, defaults) {
    return { ok: true, value: buildProbeResult(route, url, api, entries, profile, keyless, defaults) }
  }

  /** Resolve the live policy table, rebuilding it when settings changed. */
  policyTable() {
    const section = this.policySection()
    const raw = section !== undefined && isRecord(section.network) ? section.network : {}
    const signature = JSON.stringify(raw)
    if (this.policy.ready && this.policy.signature === signature) return this.policy.entries
    const entries = []
    for (const [route, value] of Object.entries(raw)) {
      if (!isRecord(value) || !isEffective(value)) continue
      const host = firstString(value.host)
      if (host === undefined) continue
      entries.push({
        route,
        host: host.toLowerCase(),
        skipProxy: value.skipProxy === true,
        connect: connectOptionsOf(value),
        proxied: value.skipProxy !== true,
      })
    }
    this.policy = { ready: true, entries, signature }
    return entries
  }

  /** The policy entry governing one request URL, if any. */
  policyFor(url) {
    let entries
    try {
      entries = this.policyTable()
    } catch {
      return undefined
    }
    const host = url.hostname.toLowerCase()
    for (const entry of entries) if (hostMatches(host, entry.host)) return entry
    return undefined
  }

  /**
   * The undici dispatcher one request must use, or undefined when the process
   * default (the launch-time proxy policy) already sends it correctly.
   * @param url - the request URL.
   * @returns a dispatcher to pass as `RequestInit.dispatcher`, or undefined.
   */
  dispatcherFor(url) {
    const policy = this.policyFor(url)
    if (policy === undefined) return undefined
    let undici
    try {
      if (this.undici === undefined) {
        this.undici = loadUndici(this.ctx)
      }
      undici = this.undici
    } catch (error) {
      if (this.undiciError === undefined) {
        this.undiciError = error instanceof Error ? error.message : String(error)
        console.error(`[dsh-provider-toolkit] undici unavailable, network policy inactive: ${this.undiciError}`)
      }
      return undefined
    }
    const host = url.hostname.toLowerCase()
    const useProxy = policy.proxied && !isLoopback(host)
    const proxyUrl = useProxy ? proxyUrlFor(url.protocol) : undefined
    const key = JSON.stringify({
      connect: policy.connect,
      proxy: proxyUrl ?? null,
    })
    const cached = this.dispatchers.get(key)
    if (cached !== undefined) return cached
    let dispatcher
    try {
      if (proxyUrl !== undefined && typeof undici.ProxyAgent === 'function') {
        dispatcher = new undici.ProxyAgent({ uri: proxyUrl, requestTls: policy.connect })
      } else {
        dispatcher = new undici.Agent({ connect: policy.connect })
      }
    } catch (error) {
      console.error(`[dsh-provider-toolkit] dispatcher construction failed: ${error instanceof Error ? error.message : String(error)}`)
      return undefined
    }
    this.dispatchers.set(key, dispatcher)
    return dispatcher
  }

  /**
   * Install the fetch wrapper that applies this plugin's per-host policy, and
   * return the disposer restoring the previous implementation.
   * @returns the disposer owned by this plugin's fiber.
   */
  installFetchPolicy() {
    const service = this
    const original = globalThis.fetch
    if (typeof original !== 'function') return () => {}
    const wrapped = function wrappedFetch(input, init) {
      let next
      try {
        const url = urlOf(input)
        if (url === undefined) return original(input, init)
        const dispatcher = service.dispatcherFor(url)
        if (dispatcher === undefined) return original(input, init)
        next = init === undefined || init === null
          ? { dispatcher }
          : { ...init, dispatcher }
      } catch {
        return original(input, init)
      }
      return original(input, next)
    }
    globalThis.fetch = wrapped
    return () => {
      if (globalThis.fetch === wrapped) globalThis.fetch = original
    }
  }
}

export { ProviderToolkitService }
export default ProviderToolkitService

/**
 * Pure helpers exposed for this package's own tests. Nothing outside a test
 * should import them: they are implementation details of the service above.
 */
export const __testables = {
  parseListing,
  listingUrls,
  chatUrl,
  responsesUrl,
  normalizeListingEntry,
  reasoningFromMetadata,
  reasoningFromId,
  reasoningFieldsFor,
  sawReasoningIn,
  levelsNamedIn,
  errorTextOf,
  probeMessages,
  probeInput,
  capabilityVerdict,
  PROBE_PIXEL,
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
}