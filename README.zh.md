# dsh-provider-toolkit

[English](README.md) | **简体中文**

**自定义厂商的端点探测 + 出站网络策略。** 一个 DSH Web 插件（host half + client half），把控件直接
注入 设置 → 模型 页的官方界面，解决内置「模型添加」流程对自定义厂商缺少的四件事：

1. **自动获取上下文 / 输出长度（拿不到就填默认值）** —— 反问端点 `GET {baseURL}/v1/models`
   （Anthropic 用原生 `/v1/models`，vLLM / OpenAI 兼容网关同样支持），解析 `context_length`、
   `max_model_len`、`max_input_tokens`、`top_provider.context_length` 等字段。
   **端点不披露时不再留空**：按可编辑的默认值（出厂 1,000,000 / 32,000，在页面底部调整）补齐。
   这样新加一个模型不必再去查文档。
2. **过滤非对话模型** —— 网关的 `/v1/models` 往往把 embedding / reranker / ASR / TTS 一起列出来。
   按可编辑的关键字列表（子串匹配）过滤，命中的既不显示也不会被新增；**已经配置好的模型永不被过滤**，
   不会出现行凭空消失。
3. **自动识别思考级别（两级证据，绝不瞎猜）** —— 先读端点自己声明的推理能力
   （OpenRouter 系 `reasoning.supported_efforts`、`supported_parameters` 里的
   `reasoning_effort` / `include_reasoning` / `thinking`），端点没说时按模型名**只给提示、不写设置**；
   要真正写入就用编辑卡片里的「探测扩展能力」：host 按 pi-ai 自己的 wire 规则**逐档位**发一个极小请求
   （每个模型 1 次基线 + **1 次 developer 角色复刻** + **1 次图像输入** +
   `minimal`/`low`/`medium`/`high`/`xhigh`/`max` 各一次，`max_tokens` 16），
   只有端点**接受**的档位才写入 `reasoningEfforts`。端点拒绝时的原文会被读出来（含中文报错的顿号/句号），
   并且当**端点自述与实测矛盾**——它列出的"可用档位"里包含刚被拒的那个——会以实测为准。
   按模型名的推断永远不写入。
4. **控制调用该厂商时是否走代理** —— 勾选「直连（忽略代理环境变量）」，该厂商的请求会绕过
   `HTTPS_PROXY` / `ALL_PROXY` 等进程级代理策略直连，内网网关必需。
5. **控制调用该厂商时的 TLS 行为** —— 正常校验 / 跳过校验（自签名）/ 使用指定 CA 证书文件，
   另可指定客户端证书与私钥（mTLS）。

写入只在两处发生：打开模型页时的**自动补齐**（可关），与编辑卡片左下角的**「探测扩展能力」**按钮——
写入的都是实测通过的档位与能力；未验证的名称推断永远不会被写入。

以上都写进插件自己的设置命名空间 `dsh-provider-toolkit` 与官方 `llm-pi-ai` 命名空间，
**立即生效、无需重启**；不会覆盖你手工配置过的字段。

## 安装

包是纯 JavaScript、无构建步骤，任何一台装了 DSH 的机器上：

```powershell
# 从 GitHub 仓库直接安装
dsh plugin --profile web add github:southblowed/dsh-provider-toolkit

# 或者从本地克隆的目录安装
dsh plugin --profile web add D:\src\dsh-provider-toolkit

# 开发本包时用软链（改动即时生效）
dsh plugin --profile web add link:D:\src\dsh-provider-toolkit
```

`dsh plugin add` 会把包安装进 `profiles/web` 并自动把声明了 `dsh.bundle` 的包登记进
`dsh.profile.bundles`——装完即出现在 **设置 → 插件** 的插件管理列表里，可在那里查看。
重启 `dsh web` 后 host half 生效；client half 刷新页面即可。

> 完全离线的环境（拿不到 npm 依赖）可以用随包脚本：
> `pwsh -File .\install.ps1`（复制到 profile 的 `node_modules` 并登记 bundle，`-Uninstall` 卸载）。
> 复制而不是 `pnpm link`：node 会把软链包解析成真实路径，从工作区解析不到本包依赖的
> `@deepseek-ai/schemastery` / `undici` / `zod`，插件会在启动时加载失败。

## 在桌面版（DSH Desktop）安装

桌面版与 `dsh web` 的 profile **同名（都叫 `web`）但数据目录独立**——桌面版的 DSH_HOME 是应用自己的
数据目录，所以"给桌面版装" = 把同一条命令指向它：

| 平台 | 桌面版 DSH_HOME |
|---|---|
| Windows | `%APPDATA%\dsh-desktop\harness` |
| macOS | `~/Library/Application Support/dsh-desktop/harness` |
| Linux | `~/.config/dsh-desktop/harness` |

**方式一（推荐，可联网）**：先装一次独立 CLI（`npm i -g @deepseek-ai/dsh`，只用于插件管理，不影响桌面版本身），然后：

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

**方式二（离线）**：克隆本仓库后运行安装脚本，用 `-DshHome` 指向桌面版数据目录：

```powershell
pwsh -File .\install.ps1 -DshHome "$env:APPDATA\dsh-desktop\harness"
```

脚本会复制包本体、登记 bundle，并自动从本机其他 DSH 安装位置（CLI 的 npm 安装、CLI 的 web profile、
桌面版自带依赖）**按依赖闭包**补齐缺失的依赖。有一个硬约束：**undici 大版本必须与宿主 Node 自带
`fetch` 的 undici 同代**（DSH 用 Node 24 → undici 7；跨代 dispatcher 传给内置 fetch 会让请求永久挂起，
已实测）。脚本会自动跳过版本不符的来源；如果本机找不到 undici 7，按脚本提示联网装一次即可。

**方式三（插件市场）**：桌面版内置 dshmarket 插件市场；把本包登记进社区索引（awesome-dsh-plugin /
dsh-web-ui community.json）后，可在市场里一键安装。

装完后**完全退出并重启桌面版**（桌面版设置里的「一键重启」也可以），打开 设置 → 模型，页面底部即是
本插件的面板。

> 注意：桌面版与 `dsh web` 是**两套独立配置**（各自的 `settings.yaml` 与 profile）。在桌面版里需要
> 重新配置厂商的 API Key；本插件写入的档位/网络策略也只存在于所装的这一侧。

## 用法

一切入口都在 设置 → 模型 页里**官方自己的界面**上（本插件只做注入，没有独立面板要记）：

1. **添加厂商时配网络策略**：「添加自定义提供方」卡片里多出「出站网络策略」区——匹配主机、
   直连（忽略代理环境变量）、TLS 校验（正常 / 跳过 / 指定 CA）、客户端证书与私钥——随
   「创建提供方」一并写入。
2. **编辑厂商时改网络策略**：厂商卡片 → 编辑 → 同一区域，改动随「保存」立即生效。
3. **逐模型勾选探测**：编辑卡片展开「自定义设置」→「自定义模型目录」每行最前有勾选框（默认全勾）；
   卡片左下角「探测扩展能力」对勾选的模型实测（每个 9 次极小请求：基线 + developer 角色 + 图像输入 +
   `minimal`/`low`/`medium`/`high`/`xhigh`/`max` 各一次）并把通过的写入：推理档位、图像输入、
   developer 角色修正、上下文/输出默认值。
4. **单模型微调**：模型行「容量」展开区里直接改——推理档位逐个点选（可改写请求里实际发送的取值）、
   图像输入勾选——改动立即写入，不用再找别的地方。
5. **新建厂商零操作**：创建后打开模型页，自动流程为还没实测过的模型自动补齐扩展能力（结果按配置
   形状缓存——模型 id 列表 + 协议 + 影响请求的 compat，同一形状只测一次；只做加法，不删手写声明、
   不覆盖已填数值）。页面底部的「扩展能力默认值与自动化」可关掉自动化、调整探测默认值与过滤关键字。

## 为什么必须落盘成插件包

网络策略不是「多两个输入框」：pi-ai 的模型请求走 `globalThis.fetch`，而进程级的代理策略由
`@deepseek-ai/dsh-http-proxy` 在启动时装进 undici 的全局 dispatcher，厂商 profile 里没有任何
字段能改它。本插件的 host half 在挂载时包一层 `globalThis.fetch`：只对被配置过的主机，改用自己
的 undici dispatcher（直连 Agent，或带 `requestTls` 的 ProxyAgent），其余请求原样透传；卸载时
恢复原实现。所以它必须是一个有 node 半边的正式插件包，而不是浏览器端脚本。

## 与 dsh-model-capabilities 的关系

Models 页每条厂商卡片只有一个扩展位（`settings.models.provider-card`，key 必须是 settingsNs
即 `llm-pi-ai`），已被 `@linxin666/dsh-client-ui-model-capabilities` 占用（手工编辑思考级别 /
图片输入）。本插件不与之争位：厂商级与模型级的控件以 DOM 注入的方式挂在**官方编辑卡片内部**
（网络策略在卡片表单里、逐模型能力在模型行展开区里），页面底部扩展位只保留探测默认值与自动化
开关。两边读写的是同一份 `llm-pi-ai` 设置：这里自动探测写入的字段，那边的手工编辑器会直接显示出来。

### 为什么思考级别要「实测」而不是「推断」

写进 `reasoningEfforts` 的档位就是模型选择器会提供给用户的档位——它不是一句备注，而是一个**声明**。
声明了端点不接受的档位，后果不是「这个选项没用」，而是：用户选中它 → 请求带上端点不认识的参数 →
端点返回 4xx → 这一轮请求在消息已经落盘之后失败，会话可能反复失败。所以：

- 端点自己声明的能力（`probe`）→ 直接可用，标「端点声明」；
- 实测通过的档位（`verifyReasoning`）→ 直接可用，标「端点实测」；
- 按模型名推断（deepseek-r1、qwen3、glm-4.5/4.6、gpt-5、o1/o3/o4、claude 4、gemini 2.5/3 等）
  → 只做提示，标「（未验证）」，默认不写入。

实测会用与该厂商**完全相同**的请求参数：host 复刻了 pi-ai 在 `openai-completions` 下的全部
`thinkingFormat` 分派（`openai`/`openrouter`/`deepseek`/`together`/`baseten`/`zai`/`qwen`/
`chat-template`/`qwen-chat-template`/`string-thinking`/`ant-ling`）与 `openai-responses` 的
`reasoning.effort`，并按声明里已有的 wire 拼写、`compat`、`thinkingBudgets` 生成。这就是为什么
「协议不支持实测」是一个明确答复而不是猜：`anthropic-messages` 的 adaptive thinking /
预算 / mid-convo effort 由 pi-ai 从目录 compat 里选，手写路由复刻不出来，硬测只会给出一个
关于「另一个请求」的结论。`chat-template` 系若没配 `chat_template_kwargs`，同样直接回「无法实测」。

## 设置的存储位置

`settings.yaml` 的 `dsh-provider-toolkit` 段：

```yaml
dsh-provider-toolkit:
  # 上下文 / 输出的兜底默认值，以及非对话模型的过滤关键字（面板底部可编辑）
  defaults:
    contextWindow: 1000000
    maxTokens: 32000
    exclude: [embed, rerank, bge, bce, gte-, jina, nomic, paraphrase, minilm, asr, tts, whisper, ocr]
    # levels: [...]          # 可选：实测要测哪些档位，默认全部 6 个
    # patterns:              # 可选：按模型名子串给不同的默认值（第一命中生效）
    #   - match: deepseek
    #     contextWindow: 1000000
    #     maxTokens: 32000
  network:
    acme-gateway:
      host: api.acme.internal
      skipProxy: true          # 直连，忽略代理环境变量
      tls: ca                  # verify | insecure | ca
      caFile: C:\certs\corp-ca.pem
      certFile: C:\certs\client.pem   # 可选，mTLS
      keyFile: C:\certs\client.key
```

也可以直接手写这一段，效果与界面一致。

## 行为与边界

- **默认值是给「端点不说」兜底的，不会覆盖你已有的数值**：优先级是
  表格里手改的值 → 端点披露的值 → 该行原本配置的值 → 默认值。
- **默认 1,000,000 是有意偏大的**：不放心就把默认值改小，或在表里逐格改掉。
- **探测不写设置**：探测只返回候选元数据，写入是你点的按钮触发的。
- **过滤只影响「端点列出的、且你还没配置的」模型**：已配置的行永远显示、永远可编辑。
- **未验证的推断默认不落盘**：`reasoningEfforts` 只在「端点声明」或「实测接受」时写入。
- **不要相信端点的自述**：实测见过网关在报错里写「请使用 low、high 或 max」，而同一个模型对 `max`
  实际返回 400。插件会把这种自相矛盾标出来，但**以实测为准**。
- **`developer` 角色是开启推理后最常见的 400**：实测会用一个 developer 角色的请求复现它，一旦复现就
  在确认时自动写入 `compat.supportsDeveloperRole: false`（保持 `system`）。
- **图像输入用实测**：对每个勾选模型真的发一张 1×1 的图。支持 → 确认时写 `input: ["text", "image"]`；
  不支持 → 不写、也不清掉你已有的人工声明。
- **实测会花掉真实请求**：每个勾选模型 9 次极小请求，一次最多 20 个模型，且必须有可用凭据。
- **只探测 OpenAI 兼容与 Anthropic 协议**；**实测只在 openai-completions / openai-responses 上可用**。
- **带凭据探测**：host half 通过 `ctx.credentials` 解析该路由的 `apiKeyEnv`。
- **TLS 覆盖 + 走代理**：勾选了 TLS 覆盖但没有勾直连时，插件会按进程环境里的 `https_proxy`
  等变量自行构造带 `requestTls` 的 undici `ProxyAgent`；loopback 主机永远直连。
- **保留未知字段**：写入 `models` 数组时，`id`、`name`、`input`、`compat` 等本插件不编辑的字段原样保留。
- **并发写保护**：每次写入都带读取时的 `revision`，别处改过就会冲突并提示重试，不会静默覆盖。

## 开发

```powershell
node --check index.js; node --check client.js; node --check typert.host.js

$env:PTK_ENTRY = "$env:DSH_HOME\profiles\web\node_modules\dsh-provider-toolkit\index.js"
node test/smoke.test.mjs      # 列表解析、默认值/过滤、TLS 选项、主机匹配、11 种 thinkingFormat 的 wire 复刻、zod 契约
node test/network.test.mjs    # undici dispatcher 生效、自签名 TLS 拒绝/放行/自定义 CA
node test/service.test.mjs    # host half 在真实 cordis Context 上跑通 overview/probe/verifyReasoning
node test/client.test.mjs     # 浏览器半边：模块形状、词表对齐、面板渲染、调用线格式、写入策略
```

四个套件都直接 `node <file>` 跑（`node --test` 会 spawn 子进程并把 stdio 接成管道，被本机文件沙箱
拒绝）。`test/fixtures` 里的自签名证书用 `openssl req -x509 -newkey rsa:2048 -nodes -days 3650
-keyout key.pem -out cert.pem -config openssl.cnf` 生成，是网络套件的固定装置。

## 文件

| 文件 | 作用 |
|---|---|
| `index.js` | host half：设置命名空间、`globalThis.fetch` 策略包装、`providerToolkit` 服务（overview / probe / verifyReasoning） |
| `typert.host.js` | 三个 strict Remote 调用的清单（`overview`、`probe`、`verifyReasoning`） |
| `client.js` | 浏览器半边：官方厂商卡片内的 DOM 注入集成 + 底部默认值面板（手写 bundle 包装） |
| `cordis.patch.yml` | bundle patch：把 `provider-toolkit` 这一行插入 web profile |
| `install.ps1` | 离线安装后备：复制到 profile 的 `node_modules` 并登记 bundle |
