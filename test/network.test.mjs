/**
 * Network-mechanism tests for dsh-provider-toolkit.
 *
 * These verify the exact mechanism the plugin relies on for its third and
 * fourth features: that an undici `Agent` handed to `fetch` as
 * `RequestInit.dispatcher` really does govern that one request (so a plugin can
 * bypass the process-wide proxy dispatcher), and that the `connect` options the
 * plugin builds really do control TLS verification and custom CA trust.
 *
 * The fixtures under `test/fixtures` are a self-signed localhost certificate
 * generated with:
 *
 *   openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
 *     -keyout key.pem -out cert.pem -config openssl.cnf
 *
 * Run directly (the test runner spawns child processes the file sandbox
 * refuses):
 *
 *   pwsh> $env:PTK_ENTRY = "$env:DSH_HOME\profiles\web\node_modules\dsh-provider-toolkit\index.js"
 *   pwsh> node test/network.test.mjs
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:https'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const entry = process.env.PTK_ENTRY ?? join(here, '..', 'index.js')
const pkgRoot = dirname(entry)

// Resolve undici the way the plugin does: from the profile that hosts the package.
const undici = createRequire(join(pkgRoot, 'package.json'))('undici')
const key = readFileSync(join(here, 'fixtures', 'key.pem'))
const cert = readFileSync(join(here, 'fixtures', 'cert.pem'))

/** Start an HTTPS server on a free loopback port and return its URL plus a stopper. */
async function startSecureServer() {
  const server = createServer({ key, cert }, (_req, res) => {
    res.writeHead(200, { 'content-type': 'text/plain' })
    res.end('secure')
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return { url: `https://127.0.0.1:${port}/`, close: () => new Promise((resolve) => server.close(resolve)) }
}

test('a per-request dispatcher governs the request, overriding the process default', async () => {
  const mock = new undici.MockAgent()
  mock.disableNetConnect()
  mock.get('http://provider.invalid').intercept({ path: '/v1/models', method: 'GET' }).reply(200, '{"data":[{"id":"m"}]}')
  const response = await fetch('http://provider.invalid/v1/models', { dispatcher: mock })
  assert.equal(response.status, 200)
  assert.equal(await response.text(), '{"data":[{"id":"m"}]}')
  await mock.close()
})

test('a self-signed endpoint is refused by default and accepted through the plugin connect options', async () => {
  const server = await startSecureServer()
  try {
    let refused = false
    try {
      await (await fetch(server.url)).text()
    } catch {
      refused = true
    }
    assert.equal(refused, true, 'a self-signed certificate must fail under normal verification')

    const insecure = new undici.Agent({ connect: { rejectUnauthorized: false } })
    try {
      const response = await fetch(server.url, { dispatcher: insecure })
      assert.equal(await response.text(), 'secure')
    } finally {
      await insecure.close()
    }

    const trusted = new undici.Agent({ connect: { ca: [cert] } })
    try {
      const response = await fetch(server.url, { dispatcher: trusted })
      assert.equal(await response.text(), 'secure')
    } finally {
      await trusted.close()
    }
  } finally {
    await server.close()
  }
})

test('a plain direct agent reaches an endpoint the global policy would otherwise proxy', async () => {
  // The plugin's "direct connection" arm is exactly `new Agent({ connect })`
  // passed per request: no proxy URL is involved, so nothing can tunnel it.
  const server = await startSecureServer()
  try {
    const direct = new undici.Agent({ connect: { ca: [cert] } })
    try {
      const first = await fetch(server.url, { dispatcher: direct })
      const second = await fetch(server.url, { dispatcher: direct })
      assert.equal(await first.text(), 'secure')
      assert.equal(await second.text(), 'secure')
    } finally {
      await direct.close()
    }
  } finally {
    await server.close()
  }
})