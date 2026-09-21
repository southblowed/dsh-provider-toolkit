# dsh-provider-toolkit

**English** | [简体中文](README.zh.md)

**Endpoint probing + outbound network policy for custom pi-ai providers.** A DSH Web plugin
(host half + client half) that integrates into the official Settings → Models cards, covering the
four things the built-in "add model" flow lacks for custom providers:

1. **Auto-fills context window / max output (with defaults when the endpoint stays silent)** —
   interrogates `GET {baseURL}/v1/models` (native `/v1/models` for Anthropic; vLLM and
   OpenAI-compatible gateways work too), reading `context_length`, `max_model_len`,
   `max_input_tokens`, `top_provider.context_length`, etc. When the endpoint discloses nothing,
   the panel fills the editable defaults (ship with 1,000,000 / 32,000) and marks the source
   column as "default" — every cell stays editable before you confirm. No more manual lookups
   for every model you add.
2. **Filters non-chat models** — gateway `/v1/models` listings usually mix in embedding /
   reranker / ASR / TTS models. An editable substring keyword list hides them from the table and
   from any "add the rest" flow; **already-configured models are never filtered out**.
3. **Detects real thinking levels (two-tier evidence, never a blind guess)** — reads what the
   endpoint itself declares (OpenRouter-style `reasoning.supported_efforts`,
   `supported_parameters` entries like `reasoning_effort` / `include_reasoning` / `thinking`);
   when the endpoint says nothing, name-based heuristics are **hints only, never written**.
   Clicking "test selected models' extended capabilities" makes the host send one minimal
   request per level (`minimal`…`max`, `max_tokens` 16) plus a baseline, a `developer`-role
   replay, and a 1×1 image per model — only levels the endpoint **accepted** are written to
   `reasoningEfforts`. Endpoint refusals are quoted verbatim (Chinese punctuation included), and
   when the endpoint's self-report contradicts the live result, the contradiction is flagged.
4. **Per-provider proxy control** — "direct (ignore proxy env vars)" makes one provider's
   requests bypass the process-wide proxy dispatcher; required for intranet gateways.
5. **Per-provider TLS control** — verify / skip verification (self-signed) / use a specific CA
   file, plus optional client certificate + key (mTLS).

Writes are **one confirmation**: the table is the contract — what you see is what gets written.
Everything lands in the plugin's own `dsh-provider-toolkit` settings namespace and the official
`llm-pi-ai` one, **taking effect immediately without a restart**, and never overwriting values
you configured by hand.

## Install

The package is plain JavaScript with no build step. On any machine with DSH:

```powershell
# Install straight from GitHub
dsh plugin --profile web add github:southblowed/dsh-provider-toolkit

# Or from a local clone
dsh plugin --profile web add D:\src\dsh-provider-toolkit

# While developing the package itself, link it (changes apply on reload)
dsh plugin --profile web add link:D:\src\dsh-provider-toolkit
```

`dsh plugin add` installs the package into `profiles/web` and automatically registers any
dependency that declares `dsh.bundle` into `dsh.profile.bundles` — the plugin then shows up in
**Settings → Plugins** like any other. Restart `dsh web` for the host half; the client half
only needs a page refresh.

> Fully offline environments (no npm registry access) can use the bundled fallback script:
> `pwsh -File .\install.ps1` (copies into the profile's `node_modules` and registers the
> bundle; `-Uninstall` removes it). Copying instead of `pnpm link` is deliberate: node resolves
> a symlinked package to its real path, where this package's dependencies
> (`@deepseek-ai/schemastery` / `undici` / `zod`) cannot be resolved.

## Installing into DSH Desktop

The desktop app and `dsh web` share the profile **name** (`web`) but not the data directory —
the desktop's DSH_HOME lives inside the app's own user-data folder, so "install for the desktop"
means pointing the same command at it:

| Platform | Desktop DSH_HOME |
|---|---|
| Windows | `%APPDATA%\dsh-desktop\harness` |
| macOS | `~/Library/Application Support/dsh-desktop/harness` |
| Linux | `~/.config/dsh-desktop/harness` |

**Option 1 (recommended, online)**: install the standalone CLI once
(`npm i -g @deepseek-ai/dsh` — only used for plugin management), then:

```powershell
# Windows PowerShell
$env:DSH_HOME = "$env:APPDATA\dsh-desktop\harness"
dsh plugin --profile web add github:southblowed/dsh-provider-toolkit
```

```bash
# macOS
export DSH_HOME="$HOME/Library/Application Support/dsh-desktop/harness"
# Linux
export DSH_HOME="$HOME/.config/dsh-desktop/harness"
dsh plugin --profile web add github:southblowed/dsh-provider-toolkit
```

**Option 2 (offline)**: clone this repository, then run the installer with `-DshHome` aimed at
the desktop data directory:

```powershell
pwsh -File .\install.ps1 -DshHome "$env:APPDATA\dsh-desktop\harness"
```

The installer copies the package, registers the bundle, and backfills the **dependency closure**
(direct + transitive + peer dependencies) from any other local DSH installation (the CLI's npm
install, the CLI web profile, or the desktop's own bundled modules). One hard rule: **the undici
major must match the host Node's built-in `fetch` generation** (DSH runs Node 24 → undici 7; a
cross-generation dispatcher handed to the built-in fetch hangs every request it governs —
measured). The installer automatically skips version-incompatible sources; if no undici 7
exists on the machine, follow the script's hint and install it once online.

**Option 3 (market)**: the desktop ships the dshmarket plugin market; once this package is
registered in a community index (awesome-dsh-plugin / dsh-web-ui community.json), it becomes a
one-click install there.

After installing, **fully quit and restart the desktop app** (the in-app "一键重启 / restart
Harness" works too), then open Settings → Models — the panel sits at the page bottom.

> Note: the desktop and `dsh web` keep **two independent configurations** (separate
> `settings.yaml` and profiles). Provider API keys and anything this plugin writes must be
> configured again on the desktop side.

## Usage

Every entry point lives **inside the official UI** on Settings → Models (the plugin only injects;
there is no separate panel to learn):

1. **Network policy while adding a provider**: the "add custom provider" card gains an "outbound
   network policy" area — host match, direct connection (ignore proxy env vars), TLS mode
   (verify / skip / custom CA), client certificate and key — written together with "create provider".
2. **Network policy while editing a provider**: provider card → Edit → the same area; changes
   apply the moment you hit save.
3. **Per-model checked testing**: edit card → expand 自定义设置 → every row of the model catalog
   starts with a checkbox (all on by default); the bottom-left "test extended capabilities"
   button live-tests the checked models (9 minimal requests each: baseline + developer role +
   image input + one per level) and writes what passes: reasoning levels, image input, the
   developer-role fix, capacity defaults.
4. **Single-model tweaks**: a model row's capacity expand area edits it directly — reasoning-level
   chips (toggle each, optionally edit the wire spelling) and an image-input checkbox — written
   immediately, nowhere else to look.
5. **Zero-touch for new providers**: after creation, opening the Models page auto-fills measured
   capabilities for models never tested (cached by configuration shape — model id set + protocol +
   request-shaping compat — so each shape measures once; strictly additive: it never deletes
   hand-written declarations nor overwrites values you filled in). The page-bottom "capability
   defaults & automation" card turns the automation off and edits the probe defaults and the
   non-chat filter.

## Why this must be a real plugin package

The network policy is not "two more input fields": pi-ai sends model requests through
`globalThis.fetch`, and the process-wide proxy policy is installed into undici's global
dispatcher by `@deepseek-ai/dsh-http-proxy` at launch — no provider profile field can change it.
This plugin's host half wraps `globalThis.fetch` on mount: only configured hosts are routed to
its own undici dispatcher (a direct Agent, or a ProxyAgent carrying `requestTls`), everything
else passes through untouched, and the original implementation is restored on unload. That
requires a node-side half, hence a real bundle package rather than a browser-only script.

## Relationship with dsh-model-capabilities

Each provider card on the Models page has exactly one extension seat
(`settings.models.provider-card`, keyed by settingsNs), already occupied by
`@linxin666/dsh-client-ui-model-capabilities` (manual reasoning-level / image-input editing).
This plugin does not fight for the seat: provider- and model-level controls are DOM-injected
**inside the official editor cards** (network policy in the card form, per-model capabilities in
a model row's expand area), and the footer seat only hosts the probe defaults and the automation
toggle. Both plugins read and write the same `llm-pi-ai` settings document: what this plugin
auto-detects shows up in the other's manual editor directly.

## Behavior & boundaries

- **Defaults only backfill what the endpoint never disclosed** — priority: your edited cell →
  endpoint-disclosed value → the row's existing value → the default.
- **The 1,000,000 default is deliberately generous**; lower it in the defaults editor or per
  cell if you prefer.
- **Probing never writes settings by itself** — writes come from the in-card "test extended
  capabilities" button and the (toggleable) automatic pass, and both write only what the
  endpoint provably accepted.
- **Filtering only affects models the endpoint lists that you have not configured yet.**
- **Unverified inference never lands on disk by default** — `reasoningEfforts` is written only
  for endpoint-declared or live-verified levels; when a live test rejects every level, nothing
  is written at all (that is a parameter-shape problem, not "no reasoning").
- **Do not trust an endpoint's self-report**: observed in the wild — a gateway's error text
  claims "use low, high or max" while the same model 400s on `max`. The plugin flags the
  contradiction but **the live result wins**.
- **The `developer` role is the most common 400 once reasoning is on**: pi-ai sends the system
  prompt as `developer` for reasoning models, and gateways pi-ai does not recognize default to
  OpenAI behavior — many intranet MaaS gateways only accept `system`. The live test replays one
  developer-role request; on rejection, confirm writes `compat.supportsDeveloperRole: false`.
- **Image input is measured live** with a real 1×1 image per checked model. Supported →
  `input: ["text", "image"]`; unsupported → nothing is written and your manual declaration is
  kept (a blind pixel is weak evidence — removing someone's declaration takes more).
- **Live testing spends real requests**: 9 minimal requests per checked model, at most 20 models
  per pass, and requires working credentials.
- **Probing covers OpenAI-compatible and Anthropic listings only; live verification covers
  `openai-completions` / `openai-responses` only** — other protocols return an explicit
  "unsupported" answer because their reasoning parameters are chosen by pi-ai from catalog
  compat and cannot be faithfully replicated for a hand-declared route.
- **Probing carries credentials**: the host half resolves the route's `apiKeyEnv` through
  `ctx.credentials`; routes using pi-ai's own OAuth records are probed without auth and the
  result says so.
- **TLS override + proxied**: with a TLS override but without direct connection, the plugin
  builds a `requestTls`-carrying undici ProxyAgent from the process proxy environment; loopback
  hosts always go direct.
- **Unknown fields are preserved** when the `models` array is written.
- **Write conflicts are surfaced**: every write carries the read `revision`; an interleaved edit
  conflicts instead of being silently overwritten.

## Development

```powershell
node --check index.js; node --check client.js; node --check typert.host.js

$env:PTK_ENTRY = "$env:DSH_HOME\profiles\web\node_modules\dsh-provider-toolkit\index.js"
node test/smoke.test.mjs      # listing parse, defaults/filter, TLS options, host matching, 11 thinkingFormat wire replications, zod contracts
node test/network.test.mjs    # undici dispatcher, self-signed TLS reject/allow/custom CA
node test/service.test.mjs    # host half on a real cordis Context: overview/probe/verifyReasoning
node test/client.test.mjs     # browser half: module shape, locale parity, panel render, wire format, write policy
```

Run each suite directly with `node <file>` (`node --test` spawns child processes with piped
stdio, which the local file sandbox refuses). The self-signed certificates under
`test/fixtures` are regenerated with `openssl req -x509 -newkey rsa:2048 -nodes -days 3650
-keyout key.pem -out cert.pem -config openssl.cnf`.

## Files

| File | Role |
|---|---|
| `index.js` | host half: settings namespace, `globalThis.fetch` policy wrapper, the `providerToolkit` service (overview / probe / verifyReasoning) |
| `typert.host.js` | manifest of the three strict Remote invocations |
| `client.js` | browser half: DOM integration inside the official provider editor cards + the footer defaults panel (hand-written bundle wrapper) |
| `cordis.patch.yml` | bundle patch inserting the `provider-toolkit` row into the web profile |
| `install.ps1` | offline fallback: copies into the profile's `node_modules` and registers the bundle |
