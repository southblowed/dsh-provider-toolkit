/**
 * dsh-provider-toolkit — Typert host manifest.
 *
 * The typert-loader finds this file through the package's `./typert` export and
 * registers both strict invocations into the host registry; the api-gateway
 * then routes `providerToolkit/overview` and `providerToolkit/probe` to the
 * `providerToolkit` Cordis service in `index.js`. Every codec must be a zod v4
 * schema: the loader rejects anything else.
 *
 * @module dsh-provider-toolkit/typert
 */

import { z } from 'zod'

/** The failure branch every invocation shares. */
const failureSchema = z.object({
  code: z.string(),
  message: z.string(),
})

/** One provider row the footer panel renders. */
const providerSchema = z.object({
  route: z.string(),
  displayName: z.string(),
  api: z.string(),
  baseURL: z.string(),
  host: z.string(),
  apiKeyEnv: z.string(),
  declaredModels: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        contextWindow: z.number().optional(),
        maxTokens: z.number().optional(),
        reasoningMode: z.string(),
      }),
    )
    .optional(),
})

/** `providerToolkit/overview`: every configured provider plus the live route ids. */
const overviewResultSchema = z.union([
  z.object({
    ok: z.literal(true),
    value: z.object({
      providers: z.array(providerSchema),
      live: z.array(z.object({ id: z.string(), name: z.string() })),
    }),
  }),
  z.object({ ok: z.literal(false), error: failureSchema }),
])

/** `providerToolkit/probe` request: the provider route to interrogate. */
const probeRequestSchema = z.object({ route: z.string() })

/** One advertised model with what the endpoint disclosed and what the id implies. */
const probedModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  contextWindow: z.number().optional(),
  maxTokens: z.number().optional(),
  contextSource: z.string(),
  maxTokensSource: z.string(),
  reasoningEfforts: z
    .union([z.literal(false), z.record(z.string(), z.union([z.string(), z.null()]))])
    .optional(),
  reasoningSource: z.string(),
})

/** `providerToolkit/probe`: candidate metadata for one endpoint. */
const probeResultSchema = z.union([
  z.object({
    ok: z.literal(true),
    value: z.object({
      route: z.string(),
      endpoint: z.string(),
      protocol: z.string(),
      models: z.array(probedModelSchema),
      configuredIds: z.array(z.string()),
      filtered: z.number(),
      defaults: z.object({
        contextWindow: z.number(),
        maxTokens: z.number(),
        levels: z.array(z.string()),
      }),
      notes: z.array(z.string()),
    }),
  }),
  z.object({ ok: z.literal(false), error: failureSchema }),
])

/** `providerToolkit/verifyReasoning` request: which route, and optionally which models. */
const verifyRequestSchema = z.object({
  route: z.string(),
  models: z.array(z.string()).optional(),
})

/** One tested level's verdict. */
const verdictSchema = z.object({
  level: z.string(),
  status: z.string(),
  wire: z.string(),
  sawReasoning: z.boolean(),
  message: z.string().optional(),
})

/** One model's verdict list, its accepted set, and its capability probes, or the route-level failure that stopped it. */
const verifiedModelSchema = z.object({
  id: z.string(),
  verdicts: z.array(verdictSchema),
  accepted: z.array(z.string()),
  tested: z.array(z.string()),
  capabilities: z.object({
    developerRole: z.string().optional(),
    imageInput: z.string().optional(),
  }),
  failure: z.object({ code: z.string(), message: z.string() }).optional(),
})

/** `providerToolkit/verifyReasoning`: what the real endpoint accepts. */
const verifyResultSchema = z.union([
  z.object({
    ok: z.literal(true),
    value: z.object({
      route: z.string(),
      protocol: z.string(),
      models: z.array(verifiedModelSchema),
      levels: z.array(z.string()),
      requests: z.number(),
    }),
  }),
  z.object({ ok: z.literal(false), error: failureSchema }),
])

export const TYPERT = {
  package: 'dsh-provider-toolkit',
  face: 'host',
  schemas: [],
  invocations: [
    {
      id: 'dsh-provider-toolkit#providerToolkit/overview',
      service: 'providerToolkit',
      namespace: 'providerToolkit',
      method: 'overview',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-provider-toolkit/types#OverviewResult',
        schema: overviewResultSchema,
      },
    },
    {
      id: 'dsh-provider-toolkit#providerToolkit/probe',
      service: 'providerToolkit',
      namespace: 'providerToolkit',
      method: 'probe',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'request',
          wire: 'request',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: 'dsh-provider-toolkit/types#ProbeRequest',
            schema: probeRequestSchema,
          },
        },
      ],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-provider-toolkit/types#ProbeResult',
        schema: probeResultSchema,
      },
    },
    {
      id: 'dsh-provider-toolkit#providerToolkit/verifyReasoning',
      service: 'providerToolkit',
      namespace: 'providerToolkit',
      method: 'verifyReasoning',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'request',
          wire: 'request',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: 'dsh-provider-toolkit/types#VerifyRequest',
            schema: verifyRequestSchema,
          },
        },
      ],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-provider-toolkit/types#VerifyResult',
        schema: verifyResultSchema,
      },
    },
  ],
  model: {
    services: [
      {
        key: 'providerToolkit',
        exportName: 'ProviderToolkitService',
        description:
          'Interrogate a custom pi-ai provider endpoint for its models, token capacities, and reasoning levels, and report the provider routes the Models settings page can edit.',
        summary: 'Provider endpoint interrogation for the Models settings page.',
        tags: [],
        jsDoc:
          '/**\n * The providerToolkit service: settings-owned network policy plus endpoint\n * interrogation for the Models page.\n */',
        members: [
          {
            kind: 'method',
            name: 'overview',
            signature: 'async overview(): Promise<OverviewResult>',
            summary: 'Report every configured pi-ai provider and the live route ids.',
            jsDoc:
              '/**\n * Report every configured pi-ai provider with the facts the footer panel\n * renders, plus which routes a live adapter currently serves.\n * @returns the provider rows in settings order.\n */',
          },
          {
            kind: 'method',
            name: 'probe',
            signature: 'async probe(request: ProbeRequest): Promise<ProbeResult>',
            summary: 'Interrogate one provider endpoint for the models it advertises.',
            jsDoc:
              '/**\n * Interrogate one provider endpoint for the models it advertises, the\n * capacities it discloses, and the reasoning levels it confirms or implies.\n * @param request - the provider route to interrogate.\n * @returns candidate metadata; nothing is written to settings.\n */',
          },
          {
            kind: 'method',
            name: 'verifyReasoning',
            signature: 'async verifyReasoning(request: VerifyRequest): Promise<VerifyResult>',
            summary: 'Test a provider\'s reasoning levels against the real endpoint.',
            jsDoc:
              '/**\n * Test a provider\'s reasoning levels against the real endpoint instead of\n * inferring them, so an unsupported level is never offered by the picker.\n * @param request - the route, and optionally which of its models to test.\n * @returns per-model, per-level verdicts; nothing is written to settings.\n */',
          },
        ],
        types: [
          {
            name: 'Failure',
            declaration:
              'export interface Failure { readonly code: string; readonly message: string }',
          },
          {
            name: 'DeclaredModel',
            declaration:
              'export interface DeclaredModel { readonly id: string; readonly name: string; readonly contextWindow?: number; readonly maxTokens?: number; readonly reasoningMode: string }',
          },
          {
            name: 'ProviderRow',
            declaration:
              'export interface ProviderRow { readonly route: string; readonly displayName: string; readonly api: string; readonly baseURL: string; readonly host: string; readonly apiKeyEnv: string; readonly declaredModels?: readonly DeclaredModel[] }',
          },
          {
            name: 'OverviewResult',
            declaration:
              'export type OverviewResult = { readonly ok: true; readonly value: { readonly providers: readonly ProviderRow[]; readonly live: ReadonlyArray<{ readonly id: string; readonly name: string }> } } | { readonly ok: false; readonly error: Failure }',
          },
          {
            name: 'ProbeRequest',
            declaration: 'export interface ProbeRequest { readonly route: string }',
          },
          {
            name: 'ProbedModel',
            declaration:
              'export interface ProbedModel { readonly id: string; readonly name: string; readonly contextWindow?: number; readonly maxTokens?: number; readonly reasoningEfforts?: false | Readonly<Record<string, string | null>>; readonly reasoningSource: string }',
          },
          {
            name: 'ProbeResult',
            declaration:
              'export type ProbeResult = { readonly ok: true; readonly value: { readonly route: string; readonly endpoint: string; readonly protocol: string; readonly models: readonly ProbedModel[]; readonly configuredIds: readonly string[]; readonly notes: readonly string[] } } | { readonly ok: false; readonly error: Failure }',
          },
          {
            name: 'VerifyRequest',
            declaration:
              'export interface VerifyRequest { readonly route: string; readonly models?: readonly string[] }',
          },
          {
            name: 'ReasoningVerdict',
            declaration:
              'export interface ReasoningVerdict { readonly level: string; readonly status: string; readonly wire: string; readonly sawReasoning: boolean; readonly message?: string }',
          },
          {
            name: 'VerifiedModel',
            declaration:
              'export interface VerifiedModel { readonly id: string; readonly verdicts: readonly ReasoningVerdict[]; readonly failure?: Failure }',
          },
          {
            name: 'VerifyResult',
            declaration:
              'export type VerifyResult = { readonly ok: true; readonly value: { readonly route: string; readonly protocol: string; readonly models: readonly VerifiedModel[]; readonly requests: number } } | { readonly ok: false; readonly error: Failure }',
          },
        ],
      },
    ],
    events: [],
    objects: [],
  },
}

export default TYPERT