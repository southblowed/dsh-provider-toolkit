window.__ModuleLoader__.load({
	id: "dsh-provider-toolkit",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");
		const e = react.createElement;
		const useState = react.useState;
		const useEffect = react.useEffect;
		const useRef = react.useRef;

		//#region dsh-provider-toolkit/panel.css
		const css = [
			".dspt_root{border-top:1px solid var(--dsw-alias-border-l2);margin-top:16px;padding-top:16px;display:flex;flex-direction:column;gap:12px}",
			".dspt_root :focus{outline:none;box-shadow:none}",
			".dspt_root input[type=checkbox]{width:14px;height:14px;accent-color:var(--dsw-alias-label-primary)}",
			// The Models page's other extension area (the capability editor in
			// @linxin666/dsh-client-ui-model-capabilities) renders native checkboxes
			// and radios, whose checked fill and focus ring are the browser's blue —
			// the "声明档位" radio being the exact frame the user reported. Those
			// parts carry `data-dsh-part`, so this override reaches exactly them and
			// nothing else in the app, and only the accent colour is touched.
			"[data-dsh-part] input[type=checkbox],[data-dsh-part] input[type=radio]{accent-color:var(--dsw-alias-label-primary)}",
			"[data-dsh-part] input[type=checkbox]:focus,[data-dsh-part] input[type=radio]:focus{outline:none;box-shadow:none}",
			// Widgets this plugin injects into the official provider editor cards.
			".dspi_fs{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:10px 12px;margin:8px 0;display:flex;flex-direction:column;gap:8px}",
			".dspi_fs_title{font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary)}",
			".dspi_row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
			".dspi_label{font-size:12px;color:var(--dsw-alias-label-tertiary);min-width:72px}",
			".dspi_input{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:3px 8px;font:inherit;font-size:12px;min-width:120px}",
			".dspi_input.dspi_wide{min-width:220px;flex:1}",
			".dspi_check{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-primary)}",
			".dspi_btn{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:none;border-radius:14px;padding:0 12px;height:28px;font:inherit;font-size:12px;cursor:pointer}",
			".dspi_btn:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dspi_btn:disabled{cursor:default;opacity:.45}",
			".dspi_chip{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:1px 8px;font-size:11px;cursor:pointer;background:transparent;color:var(--dsw-alias-label-tertiary)}",
			".dspi_chip_on{border-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-label-primary);font-weight:600}",
			".dspi_status{font-size:12px;color:var(--dsw-alias-label-tertiary)}",
			".dspi_error{font-size:12px;color:var(--dsw-alias-fill-danger,var(--dsw-alias-label-tertiary))}",
			".dspi_ok{font-size:12px;color:var(--dsw-alias-fill-safe,var(--dsw-alias-label-tertiary))}",
			".dspi_rowcheck{margin-right:6px;width:14px;height:14px;accent-color:var(--dsw-alias-label-primary)}",
			".dspt_head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
			".dspt_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:600;line-height:22px}",
			".dspt_sub{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}",
			".dspt_spacer{flex:1}",
			".dspt_btn{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:none;border-radius:14px;padding:0 12px;height:28px;font:inherit;font-size:12px;cursor:pointer}",
			".dspt_btn:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dspt_btn:disabled{cursor:default;opacity:.45}",
			".dspt_card{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}",
			".dspt_row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}",
			".dspt_route{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}",
			".dspt_dim{color:var(--dsw-alias-label-tertiary);font-size:12px}",
			".dspt_tag{border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:1px 6px;font-size:11px;color:var(--dsw-alias-label-tertiary)}",
			".dspt_table{width:100%;border-collapse:collapse;font-size:12px}",
			".dspt_table th{text-align:left;color:var(--dsw-alias-label-tertiary);font-weight:500;padding:4px 6px;border-bottom:1px solid var(--dsw-alias-border-l2)}",
			".dspt_table td{padding:4px 6px;color:var(--dsw-alias-label-primary);border-bottom:1px solid var(--dsw-alias-border-l2)}",
			".dspt_note{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}",
			".dspt_error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px}",
			".dspt_ok{color:var(--dsw-alias-state-success-primary);font-size:12px;line-height:18px}",
			".dspt_field{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-tertiary)}",
			".dspt_input,.dspt_select{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:3px 8px;font:inherit;font-size:12px;min-width:120px}",
			".dspt_input.dspt_wide{min-width:280px;flex:1}",
			".dspt_cell{background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);border-radius:6px;padding:2px 6px;font:inherit;font-size:12px;width:96px}",
			".dspt_primary{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-module-platform);height:30px;border-radius:15px;padding:0 16px}",
			".dspt_primary:hover{opacity:.88}",
			".dspt_check{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-primary)}",
		].join("");
		const tagId = "dsh-provider-toolkit/panel.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-provider-toolkit";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		const styles = {
			root: "dspt_root", head: "dspt_head", title: "dspt_title", sub: "dspt_sub",
			spacer: "dspt_spacer", btn: "dspt_btn", card: "dspt_card", row: "dspt_row",
			route: "dspt_route", dim: "dspt_dim", tag: "dspt_tag", table: "dspt_table",
			note: "dspt_note", error: "dspt_error", ok: "dspt_ok", field: "dspt_field",
			input: "dspt_input", select: "dspt_select", wide: "dspt_wide", check: "dspt_check",
			cell: "dspt_cell", primary: "dspt_primary",
		};
		//#endregion

		//#region dsh-provider-toolkit/locales.ts
		const NS = "provider-toolkit";
		const zh = {
			"pt.title": "扩展能力默认值与自动化",
			"pt.description": "探测用的默认值与非对话模型过滤（所有厂商共用）；打开本页时自动为未实测的模型写入扩展能力。出站代理 / TLS 策略在每个厂商的添加与编辑卡片里配置，逐模型能力在模型行的展开区里。",
			"pt.loading": "正在读取…",
			"pt.reload": "重新读取",
			"pt.empty": "还没有配置任何 pi-ai 厂商。先在 Models 页添加一个自定义厂商，再回到这里。",
			"pt.readOnly": "当前设置文档只读，无法保存。",
			"pt.models.count": "{n} 个已声明的模型",
			"pt.models.catalog": "使用内置目录（未声明 models）",
			"pt.live": "已挂载",
			"pt.offline": "未挂载",
			"pt.probe": "探测端点能力",
			"pt.probing": "探测中…",
			"pt.testSelected": "测试选中模型的扩展能力",
			"pt.testing": "测试中…",
			"pt.test.hint": "每勾选一个模型会发 1 次基线、1 次 developer 角色、1 次图像输入、{levels} 逐档位各一次，都是极小请求；只有端点接受的才会被写入声明。",
			"pt.verify": "实测思考级别",
			"pt.verifying": "实测中…",
			"pt.verify.hint": "实测会真的发请求：每个模型 1 次基线 + 逐个档位（{levels}）各一次，均 max_tokens 16。只有端点接受的档位才会被写入声明。",
			"pt.verify.requests": "本次会发送 {n} 个极小请求",
			"pt.verify.col.model": "模型",
			"pt.verify.col.level": "档位",
			"pt.verify.col.verdict": "结论",
			"pt.verify.col.detail": "说明",
			"pt.verify.baseline": "基线（不带思考参数）",
			"pt.verify.accepted": "接受",
			"pt.verify.rejected": "拒绝",
			"pt.verify.inconclusive": "无法判定",
			"pt.verify.unverifiable": "无法实测",
			"pt.verify.sawReasoning": "有推理输出",
			"pt.verify.noReasoning": "无推理输出",
			"pt.verify.failed": "实测失败：{message}",
			"pt.verify.allRejected": "端点拒绝了全部测试档位：可能确实不支持这些档位，也可能它用的是别的参数格式——请先在卡片的模型里设置 compat.thinkingFormat 再重测。",
			"pt.verify.acceptedLevels": "实测可用档位：{levels}",
			"pt.verify.noAcceptedLevels": "实测没有可用档位（不会声明任何思考档位）",
			"pt.caps.image.yes": "支持图像输入",
			"pt.caps.image.no": "不支持图像输入",
			"pt.caps.image.unknown": "图像输入（未知）",
			"pt.caps.devRole.no": "不认 developer 角色（确认时自动写 compat 修正）",
			"pt.caps.devRole.fix": "有 {n} 个已实测模型不接受 developer 角色：确认时会在路由级别写入 compat.supportsDeveloperRole=false，否则开启推理后系统提示会被网关拒绝（400 unknown variant 'developer'）。",
			"pt.reasoningDefault": "默认思考档位",
			"pt.reasoningDefault.unset": "不改动",
			"pt.reasoningDefault.none": "没有全模型公共可用档位",
			"pt.writeUnverified": "同时写入未验证的推断（端点可能拒绝，导致该轮请求失败）",
			"pt.includeNew": "同时新增端点上其余 {n} 个对话模型",
			"pt.confirm": "确定添加 / 更新配置",
			"pt.confirmed": "已写入 {n} 个模型行",
			"pt.table.edited": "已改",
			"pt.table.endpoint": "端点",
			"pt.table.default": "默认",
			"pt.table.new": "新增",
			"pt.defaults.title": "上下文 / 输出默认值与非对话模型过滤（所有厂商共用）",
			"pt.defaults.auto": "打开本页时自动检测并开启扩展能力（推理档位 / 图像输入 / developer 角色修正 / 上下文默认值）",
			"pt.auto.running": "正在自动检测扩展能力：{n} 个模型…",
			"pt.auto.applying": "正在写入检测结果…",
			"pt.auto.done": "已自动配置 {n} 个模型的扩展能力",
			"pt.auto.failed": "自动检测失败：{message}",
			"pt.defaults.context": "默认上下文长度",
			"pt.defaults.maxTokens": "默认最大输出",
			"pt.defaults.exclude": "过滤关键字（逗号分隔）",
			"pt.defaults.hint": "端点没有披露上下文长度时用这里的默认值填进表格（表里标为「默认」，确认前可逐格修改）。过滤关键字按子串匹配，命中的模型不会出现在列表里、也不会被新增——已经配置好的模型不受过滤影响。",
			"pt.defaults.save": "保存默认值",
			"pt.source.verified": "端点实测",
			"pt.source.rejected": "实测全部被拒",
			"pt.unverifiedTag": "（未验证）",
			"pt.verifiedTag": "（实测）",
			"pt.expand": "展开",
			"pt.collapse": "收起",
			"pt.applyExisting": "写入已有模型行",
			"pt.applyAll": "写入全部（含新模型）",
			"pt.applying": "写入中…",
			"pt.col.id": "模型",
			"pt.col.context": "上下文",
			"pt.col.output": "最大输出",
			"pt.col.reasoning": "思考级别",
			"pt.col.source": "来源",
			"pt.source.metadata": "端点声明",
			"pt.source.heuristic": "按模型名推断",
			"pt.source.none": "未能识别",
			"pt.reasoning.none": "不支持推理",
			"pt.reasoning.inherit": "未声明（跟随继承）",
			"pt.network.title": "出站网络策略",
			"pt.network.policyChip.direct": "直连",
			"pt.network.policyChip.insecure": "跳过TLS校验",
			"pt.network.policyChip.ca": "自定义CA",
			"pt.network.skipProxy": "直连（忽略代理环境变量）",
			"pt.network.tls": "TLS 校验",
			"pt.network.tls.verify": "正常校验",
			"pt.network.tls.insecure": "跳过校验（自签名）",
			"pt.network.tls.ca": "使用指定 CA",
			"pt.network.host": "匹配主机",
			"pt.network.caFile": "CA 文件路径",
			"pt.network.certFile": "客户端证书（可选）",
			"pt.network.keyFile": "客户端私钥（可选）",
			"pt.network.save": "保存网络策略",
			"pt.network.saved": "已保存",
			"pt.network.saving": "保存中…",
			"pt.network.hint": "直连会跳过 HTTPS_PROXY 等代理设置，适合内网网关；TLS 覆盖只作用于该厂商的请求。",
			"pt.conflict": "配置在别处被改动，已重新读取，请重试。",
			"pt.failed": "操作失败：{message}",
			"pt.integ.network.applies": "写入后对该厂商的请求立即生效",
			"pt.integ.network.pendingCreate": "随「创建提供方」一并写入",
			"pt.integ.network.writeFailed": "网络策略写入失败：{message}",
			"pt.integ.detect": "探测扩展能力",
			"pt.integ.detect.hint": "对目录里勾选的模型实测推理档位 / 图像输入 / developer 角色，通过的自动写入（每个模型 9 次极小请求）",
			"pt.integ.detect.running": "正在探测扩展能力…",
			"pt.integ.detect.done": "已探测并写入 {n} 个模型的扩展能力",
			"pt.integ.detect.none": "先在目录里勾选要探测的模型",
			"pt.integ.detect.needSave": "创建并提供方保存后可用",
			"pt.integ.detect.failed": "探测失败：{message}",
			"pt.integ.caps.image": "图像输入",
			"pt.integ.caps.levels": "推理档位",
			"pt.integ.caps.wire": "发送值",
			"pt.integ.caps.unsaved": "保存提供方后可配置该模型",
			"pt.integ.caps.saved": "已写入",
			"pt.integ.caps.failed": "写入失败：{message}",
		};
		const en = {
			"pt.title": "Capability defaults & automation",
			"pt.description": "Probe defaults and the non-chat-model filter, shared by every provider; opening this page writes measured capabilities for models not yet tested. Outbound proxy / TLS policy lives in each provider's add/edit card, per-model capabilities in a model row's expand area.",
			"pt.loading": "Loading…",
			"pt.reload": "Reload",
			"pt.empty": "No pi-ai provider is configured yet. Add a custom provider on the Models page first.",
			"pt.readOnly": "The settings document is read-only; saving is disabled.",
			"pt.models.count": "{n} declared model(s)",
			"pt.models.catalog": "Built-in catalog (no models declared)",
			"pt.live": "mounted",
			"pt.offline": "not mounted",
			"pt.probe": "Probe endpoint",
			"pt.probing": "Probing…",
			"pt.testSelected": "Test selected models' capabilities",
			"pt.testing": "Testing…",
			"pt.test.hint": "Each checked model costs one baseline, one developer-role, one image-input request plus one per level ({levels}); all minimal. Only accepted facts are written.",
			"pt.verify": "Verify thinking levels",
			"pt.verifying": "Verifying…",
			"pt.verify.hint": "Verification really calls the endpoint: one baseline plus one request per level ({levels}) for each model, 16 output tokens each. Only levels the endpoint accepts are ever declared.",
			"pt.verify.requests": "This sends {n} tiny requests",
			"pt.verify.col.model": "Model",
			"pt.verify.col.level": "Level",
			"pt.verify.col.verdict": "Verdict",
			"pt.verify.col.detail": "Detail",
			"pt.verify.baseline": "baseline (no reasoning field)",
			"pt.verify.accepted": "accepted",
			"pt.verify.rejected": "rejected",
			"pt.verify.inconclusive": "inconclusive",
			"pt.verify.unverifiable": "not verifiable",
			"pt.verify.sawReasoning": "reasoned",
			"pt.verify.noReasoning": "no reasoning output",
			"pt.verify.failed": "Verification failed: {message}",
			"pt.verify.allRejected": "Every tested level was rejected. The endpoint may genuinely not support them, or it may use a different parameter shape — set compat.thinkingFormat on the model and verify again.",
			"pt.verify.acceptedLevels": "Levels the endpoint accepted: {levels}",
			"pt.verify.noAcceptedLevels": "No level was accepted (nothing will be declared)",
			"pt.caps.image.yes": "accepts image input",
			"pt.caps.image.no": "no image input",
			"pt.caps.image.unknown": "image input (unknown)",
			"pt.caps.devRole.no": "rejects the developer role (confirm writes the compat fix)",
			"pt.caps.devRole.fix": "{n} verified model(s) reject the developer role: confirm writes compat.supportsDeveloperRole=false at route level, or every reasoning request will fail with 400 unknown variant 'developer'.",
			"pt.reasoningDefault": "Default thinking level",
			"pt.reasoningDefault.unset": "Leave unchanged",
			"pt.reasoningDefault.none": "No level accepted by every model",
			"pt.writeUnverified": "Also write unverified inference (the endpoint may reject it and fail the turn)",
			"pt.includeNew": "Also add the {n} other chat models this endpoint serves",
			"pt.confirm": "Confirm add / update",
			"pt.confirmed": "Wrote {n} model rows",
			"pt.table.edited": "edited",
			"pt.table.endpoint": "endpoint",
			"pt.table.default": "default",
			"pt.table.new": "new",
			"pt.defaults.title": "Capacity defaults and non-chat model filter (shared by every provider)",
			"pt.defaults.auto": "Auto-detect and enable capabilities when this page opens (thinking levels / image input / developer-role fix / capacity defaults)",
			"pt.auto.running": "Auto-detecting capabilities: {n} model(s)…",
			"pt.auto.applying": "Writing the measurements…",
			"pt.auto.done": "Auto-configured {n} model(s)",
			"pt.auto.failed": "Automatic pass failed: {message}",
			"pt.defaults.context": "Default context window",
			"pt.defaults.maxTokens": "Default max output",
			"pt.defaults.exclude": "Filter keywords (comma separated)",
			"pt.defaults.hint": "When an endpoint discloses no context length, these defaults fill the table (marked \"default\", editable cell by cell before confirming). Filter keywords match as substrings: a matching model is neither listed nor added, and models already configured are never filtered out.",
			"pt.defaults.save": "Save defaults",
			"pt.source.verified": "verified live",
			"pt.source.rejected": "probe rejected all",
			"pt.unverifiedTag": "(unverified)",
			"pt.verifiedTag": "(verified)",
			"pt.expand": "Expand",
			"pt.collapse": "Collapse",
			"pt.applyExisting": "Write to existing rows",
			"pt.applyAll": "Write all (incl. new)",
			"pt.applying": "Writing…",
			"pt.col.id": "Model",
			"pt.col.context": "Context",
			"pt.col.output": "Max output",
			"pt.col.reasoning": "Thinking levels",
			"pt.col.source": "Source",
			"pt.source.metadata": "endpoint",
			"pt.source.heuristic": "id heuristic",
			"pt.source.none": "not detected",
			"pt.reasoning.none": "no reasoning",
			"pt.reasoning.inherit": "undeclared (inherit)",
			"pt.network.title": "Outbound network policy",
			"pt.network.policyChip.direct": "direct",
			"pt.network.policyChip.insecure": "TLS verification skipped",
			"pt.network.policyChip.ca": "custom CA",
			"pt.network.skipProxy": "Direct connection (ignore proxy env)",
			"pt.network.tls": "TLS verification",
			"pt.network.tls.verify": "Verify normally",
			"pt.network.tls.insecure": "Skip verification (self-signed)",
			"pt.network.tls.ca": "Use a specific CA",
			"pt.network.host": "Match host",
			"pt.network.caFile": "CA file path",
			"pt.network.certFile": "Client certificate (optional)",
			"pt.network.keyFile": "Client key (optional)",
			"pt.network.save": "Save network policy",
			"pt.network.saved": "Saved",
			"pt.network.saving": "Saving…",
			"pt.network.hint": "Direct skips HTTPS_PROXY and friends, which is what an intranet gateway needs; TLS overrides apply only to this provider's requests.",
			"pt.conflict": "The configuration changed elsewhere; reloaded, please retry.",
			"pt.failed": "Failed: {message}",
			"pt.integ.network.applies": "Applies to this provider's requests as soon as it is written",
			"pt.integ.network.pendingCreate": "Written together with “create provider”",
			"pt.integ.network.writeFailed": "Failed to write the network policy: {message}",
			"pt.integ.detect": "Test extended capabilities",
			"pt.integ.detect.hint": "Live-tests reasoning levels / image input / developer role for the models checked in the catalog and writes what passes (9 minimal requests per model)",
			"pt.integ.detect.running": "Testing extended capabilities…",
			"pt.integ.detect.done": "Tested and wrote capabilities for {n} model(s)",
			"pt.integ.detect.none": "Check the models to test in the catalog first",
			"pt.integ.detect.needSave": "Available once the provider is created and saved",
			"pt.integ.detect.failed": "Test failed: {message}",
			"pt.integ.caps.image": "Image input",
			"pt.integ.caps.levels": "Reasoning levels",
			"pt.integ.caps.wire": "wire",
			"pt.integ.caps.unsaved": "Save the provider to configure this model",
			"pt.integ.caps.saved": "Written",
			"pt.integ.caps.failed": "Write failed: {message}",
		};
		//#endregion

		//#region dsh-provider-toolkit/core.ts
		const LLM_NS = "llm-pi-ai";
		const TOOLKIT_NS = "dsh-provider-toolkit";

		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}

		function viewOf(namespaces, ns) {
			if (!Array.isArray(namespaces)) return undefined;
			return namespaces.find((candidate) => isRecord(candidate) && candidate.ns === ns);
		}

		function providersOf(view) {
			if (!isRecord(view) || !isRecord(view.value) || !isRecord(view.value.providers)) return {};
			return view.value.providers;
		}

		function policyOf(view, route) {
			if (!isRecord(view) || !isRecord(view.value) || !isRecord(view.value.network)) return undefined;
			const entry = view.value.network[route];
			return isRecord(entry) ? entry : undefined;
		}

		function sanitize(value) {
			const out = {};
			for (const [key, item] of Object.entries(value)) {
				if (item === undefined || item === null || item === "") continue;
				out[key] = item;
			}
			return out;
		}

		function text(value, fallback) {
			return typeof value === "string" && value.length > 0 ? value : fallback;
		}

		function number(value) {
			return typeof value === "number" && Number.isFinite(value) ? value : undefined;
		}

		/** A positive integer from what a text input holds, or undefined. */
		function toPositive(value) {
			if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.trunc(value) : undefined;
			if (typeof value !== "string") return undefined;
			const trimmed = value.trim();
			if (trimmed.length === 0) return undefined;
			const parsed = Number(trimmed);
			return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : undefined;
		}

		function formatReasoning(efforts) {
			if (efforts === false) return "none";
			if (!isRecord(efforts)) return undefined;
			const levels = Object.keys(efforts);
			return levels.length > 0 ? levels.join(" / ") : undefined;
		}

		/**
		 * Fold one model's live-verification result into its detection.
		 *
		 * A verified set wins over anything the listing implied: only levels the
		 * endpoint accepted become a declaration. When every tested level was
		 * rejected nothing is declared — that outcome may mean the endpoint uses
		 * another parameter shape rather than that it cannot reason, so claiming
		 * `false` would be a second guess in disguise.
		 * @param model - the probe reply's model entry.
		 * @param entry - the verification result for this model, `{ verdicts, capabilities }`, when it was tested.
		 * @returns the declaration to write and its provenance.
		 */
		function effectiveDetection(model, entry) {
			const list = isRecord(entry) && Array.isArray(entry.verdicts) ? entry.verdicts.filter(isRecord) : [];
			const tested = list.filter((verdict) => verdict.level !== "baseline");
			const accepted = tested.filter((verdict) => verdict.status === "accepted");
			if (tested.length > 0) {
				if (accepted.length === 0) return { reasoningEfforts: undefined, reasoningSource: "verified-none" };
				const efforts = { off: null };
				for (const verdict of accepted) efforts[verdict.level] = verdict.wire && verdict.wire.length > 0 ? verdict.wire : verdict.level;
				return { reasoningEfforts: efforts, reasoningSource: "verified" };
			}
			const source = text(model.reasoningSource, "none");
			return { reasoningEfforts: model.reasoningEfforts, reasoningSource: source };
		}

		/** Whether one detection may be written without the user opting into guesses. */
		function isWritableSource(source) {
			return source === "metadata" || source === "verified";
		}

		/** One model's verification entry from a result, when it carries that model. */
		function verifiedById(verified, id) {
			if (!Array.isArray(verified)) return undefined;
			const found = verified.find((model) => isRecord(model) && model.id === id);
			return isRecord(found) ? found : undefined;
		}

		/**
		 * The shipped capacity defaults, mirroring the host half's
		 * `SHIPPED_DEFAULTS`. Duplicated on purpose: the browser half must be able
		 * to show what a row will become before any host call answers, and the
		 * host's copy is authoritative once a probe reply carries it.
		 */
		const SHIPPED_DEFAULTS = {
			contextWindow: 1000000,
			maxTokens: 32000,
			patterns: [],
			exclude: ["embed", "rerank", "bge", "bce", "gte-", "jina", "nomic", "paraphrase", "minilm", "asr", "tts", "whisper", "ocr"],
			levels: ["minimal", "low", "medium", "high", "xhigh", "max"],
		};

		/** Normalize the defaults the panel edits and applies. */
		function normalizeDefaults(raw) {
			const source = isRecord(raw) ? raw : {};
			const positive = (value, fallback) => (typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback);
			const patterns = Array.isArray(source.patterns)
				? source.patterns.filter(isRecord)
					.map((entry) => ({
						match: text(entry.match, "").toLowerCase(),
						contextWindow: positive(entry.contextWindow, SHIPPED_DEFAULTS.contextWindow),
						maxTokens: positive(entry.maxTokens, SHIPPED_DEFAULTS.maxTokens),
					}))
					.filter((entry) => entry.match.length > 0)
				: SHIPPED_DEFAULTS.patterns;
			const exclude = Array.isArray(source.exclude)
				? source.exclude.filter((item) => typeof item === "string" && item.length > 0).map((item) => item.toLowerCase())
				: SHIPPED_DEFAULTS.exclude;
			return {
				// On unless explicitly turned off: the user asked for capabilities to
				// be detected and enabled without having to click anything.
				autoCapabilities: source.autoCapabilities !== false,
				contextWindow: positive(source.contextWindow, SHIPPED_DEFAULTS.contextWindow),
				maxTokens: positive(source.maxTokens, SHIPPED_DEFAULTS.maxTokens),
				patterns: patterns.length > 0 ? patterns : SHIPPED_DEFAULTS.patterns,
				exclude,
				levels: Array.isArray(source.levels) && source.levels.length > 0 ? source.levels : SHIPPED_DEFAULTS.levels,
			};
		}

		/** The defaults in force for one panel, preferring what a probe reply reported. */
		function defaultsOf(view, probe) {
			if (probe !== undefined && isRecord(probe.result) && isRecord(probe.result.defaults)) {
				return normalizeDefaults(probe.result.defaults);
			}
			// Accept either a namespaces array or the whole `describe()` value, so a
			// caller cannot silently fall through to the shipped defaults by shape.
			const namespaces = Array.isArray(view) ? view : isRecord(view) && Array.isArray(view.namespaces) ? view.namespaces : undefined;
			const toolkit = viewOf(namespaces, TOOLKIT_NS);
			return normalizeDefaults(isRecord(toolkit) && isRecord(toolkit.value) ? toolkit.value.defaults : undefined);
		}

		/** The capacity a model row will carry, from its family pattern or the global default. */
		function defaultCapacityFor(id, defaults) {
			const lower = text(id, "").toLowerCase();
			for (const pattern of defaults.patterns) {
				if (lower.includes(pattern.match)) return { contextWindow: pattern.contextWindow, maxTokens: pattern.maxTokens };
			}
			return { contextWindow: defaults.contextWindow, maxTokens: defaults.maxTokens };
		}

		/** Whether a listing entry is a non-chat model the panel hides. */
		function isExcludedModel(id, exclude) {
			const lower = text(id, "").toLowerCase();
			return exclude.some((needle) => lower.includes(needle));
		}

		/** One line summarising a model's verdicts, for the panel's table. */
		function verdictLabel(status, t) {
			if (status === "accepted") return t("pt.verify.accepted");
			if (status === "rejected") return t("pt.verify.rejected");
			if (status === "unverifiable") return t("pt.verify.unverifiable");
			return t("pt.verify.inconclusive");
		}

		/**
		 * Build the model rows one confirmation writes.
		 *
		 * Values resolve in this order: what the user typed in the table, then
		 * what the endpoint disclosed, then the shipped/family default — so a
		 * gateway that discloses nothing still produces a complete, reviewable row
		 * instead of a blank the user has to look up.
		 *
		 * `reasoningEfforts` is written only from what the endpoint disclosed or
		 * accepted. An id heuristic is a guess about a gateway, and a declared
		 * level the gateway refuses fails the turn after the message is durable,
		 * so a guess needs `options.allowUnverified` — an explicit opt-in.
		 *
		 * @param configured - the route's declared model rows.
		 * @param probed - the probe reply's models.
		 * @param includeNew - whether advertised chat models absent from the configuration are appended.
		 * @param options - `{ verified, allowUnverified, edits, defaults, conservative }`.
		 * @returns the complete row list to write.
		 */
		function mergeModels(configured, probed, includeNew, options) {
			const settings = options ?? {};
			const verified = isRecord(settings.verified) ? settings.verified : {};
			const edits = isRecord(settings.edits) ? settings.edits : {};
			const defaults = normalizeDefaults(settings.defaults);
			const allowUnverified = settings.allowUnverified === true;
			// An automatic pass never takes a capability away: it only adds what it
			// measured, so a flaky probe cannot strip a hand-written declaration.
			// A user-confirmed pass may correct or remove one.
			const conservative = settings.conservative === true;
			const detected = new Map();
			for (const model of probed) if (isRecord(model) && typeof model.id === "string") detected.set(model.id, model);

			/**
			 * The capacity one model row must carry: the user's edit, then what the
			 * endpoint disclosed, then the value the row already had, then the
			 * default. A configured number is never overwritten by a default.
			 */
			const capacityOf = (id, found, entry) => {
				const edited = isRecord(edits[id]) ? edits[id] : {};
				const existing = isRecord(entry) ? entry : {};
				const fallback = defaultCapacityFor(id, defaults);
				return {
					contextWindow: toPositive(edited.contextWindow) ?? number(found?.contextWindow) ?? number(existing.contextWindow) ?? fallback.contextWindow,
					maxTokens: toPositive(edited.maxTokens) ?? number(found?.maxTokens) ?? number(existing.maxTokens) ?? fallback.maxTokens,
				};
			};

			const used = new Set();
			/** Apply the measured capabilities of one model to its row, once each. */
			const applyCapabilities = (row, id, conservative) => {
				const caps = isRecord(verified[id]) && isRecord(verified[id].capabilities) ? verified[id].capabilities : undefined;
				if (caps === undefined) return;
				// 'supported' turns image input on; 'unsupported' downgrades nothing —
				// a blind pixel is a weaker claim than an existing declaration.
				if (caps.imageInput === "supported") row.input = ["text", "image"];
				// A gateway that refuses the `developer` role must keep the system
				// role, or every reasoning request on this route fails with 400.
				// This one is a fix rather than a claim, so even the conservative
				// pass writes it.
				if (caps.developerRole === "unsupported") {
					row.compat = { ...(isRecord(row.compat) ? row.compat : {}), supportsDeveloperRole: false };
				}
			};
			const rows = configured.map((entry) => {
				const id = isRecord(entry) ? entry.id : undefined;
				const found = typeof id === "string" ? detected.get(id) : undefined;
				// A configured model the endpoint never listed keeps its numbers
				// unless the user edited it in the table.
				if (found === undefined && !isRecord(edits[id])) return { ...entry };
				if (found !== undefined) used.add(found.id);
				const next = { ...entry };
				const capacity = capacityOf(id, found, entry);
				if (capacity.contextWindow !== undefined) next.contextWindow = capacity.contextWindow;
				if (capacity.maxTokens !== undefined) next.maxTokens = capacity.maxTokens;
				const detection = effectiveDetection(found ?? { id, reasoningSource: "none" }, verified[id]);
				if (detection.reasoningEfforts !== undefined && (isWritableSource(detection.reasoningSource) || allowUnverified)) {
					next.reasoningEfforts = detection.reasoningEfforts;
				} else if (!conservative && (detection.reasoningSource === "verified-none" || detection.reasoningSource === "verified")) {
					delete next.reasoningEfforts;
				}
				applyCapabilities(next, id, conservative);
				return next;
			});
			if (includeNew === true) {
				for (const model of probed) {
					if (!isRecord(model) || typeof model.id !== "string" || used.has(model.id)) continue;
					const row = { id: model.id };
					if (typeof model.name === "string" && model.name !== model.id) row.name = model.name;
					const capacity = capacityOf(model.id, model);
					if (capacity.contextWindow !== undefined) row.contextWindow = capacity.contextWindow;
					if (capacity.maxTokens !== undefined) row.maxTokens = capacity.maxTokens;
					const detection = effectiveDetection(model, verified[model.id]);
					if (detection.reasoningEfforts !== undefined && (isWritableSource(detection.reasoningSource) || allowUnverified)) {
						row.reasoningEfforts = detection.reasoningEfforts;
					}
					applyCapabilities(row, model.id, conservative);
					rows.push(row);
				}
			}
			return rows;
		}

		/** Turn a failed `RemoteResult` into the message the panel shows. */
		function messageOf(result) {
			if (isRecord(result) && isRecord(result.error)) return text(result.error.message, text(result.error.code, "unknown"));
			return "unknown";
		}

		/**
		 * Unwrap one host overview reply. The RPC layer and the host method each
		 * carry their own `{ok, value}` envelope — reading `.live` or `.providers`
		 * one layer too early silently yields `undefined`, which used to mark
		 * every mounted route as unmounted.
		 * @returns the inner `{providers, live}` value, or its failure message.
		 */
		function overviewOf(response) {
			if (!isRecord(response) || response.ok !== true) return { value: undefined, failure: messageOf(response) };
			const inner = response.value;
			if (isRecord(inner) && inner.ok === true) return { value: isRecord(inner.value) ? inner.value : undefined, failure: undefined };
			return { value: undefined, failure: messageOf(inner) };
		}
		/** Reasoning levels in wire order; "off" is declared separately (send nothing). */
		const WIRE_LEVELS = ["minimal", "low", "medium", "high", "xhigh", "max"];

		/** The network-policy settings op for one route: unset when the draft is empty. */
		function networkPolicyOp(route, draft) {
			const value = sanitize({
				host: draft.host,
				skipProxy: draft.skipProxy === true ? true : undefined,
				tls: draft.tls === "verify" || draft.tls === undefined ? undefined : draft.tls,
				caFile: draft.tls === "ca" ? draft.caFile : undefined,
				caPem: draft.tls === "ca" ? draft.caPem : undefined,
				certFile: draft.certFile,
				keyFile: draft.keyFile,
			});
			return Object.keys(value).length === 0
				? { op: "unset", path: ["network", route] }
				: { op: "set", path: ["network", route], value };
		}

		/**
		 * Compute the ops that apply verified capabilities to one route: merged
		 * model rows (additive — hand-written declarations survive), the
		 * developer-role compat fix, and a route default thinking level only when
		 * the route has none and every measured model accepts it. Shared by the
		 * automatic pass and the in-card "test extended capabilities" button.
		 */
		function capabilityWriteOps(route, profile, probedModels, verifyValue, defaults) {
			const configured = isRecord(profile) && Array.isArray(profile.models) ? profile.models.filter(isRecord) : [];
			const verified = {};
			const measured = (verifyValue !== undefined && isRecord(verifyValue) && Array.isArray(verifyValue.models) ? verifyValue.models : []).filter(isRecord);
			for (const model of measured) if (typeof model.id === "string") verified[model.id] = model;
			const rows = mergeModels(configured, Array.isArray(probedModels) ? probedModels : [], false, {
				verified, allowUnverified: false, edits: {}, defaults, conservative: true,
			}).map(sanitize);
			const ops = [];
			if (JSON.stringify(rows) !== JSON.stringify(configured.map(sanitize))) {
				ops.push({ op: "set", path: ["providers", route, "models"], value: rows });
			}
			if (measured.some((model) => isRecord(model.capabilities) && model.capabilities.developerRole === "unsupported")) {
				const compat = isRecord(profile) && isRecord(profile.compat) ? profile.compat : {};
				if (compat.supportsDeveloperRole !== false) {
					ops.push({ op: "set", path: ["providers", route, "compat", "supportsDeveloperRole"], value: false });
				}
			}
			if (isRecord(profile) && profile.reasoning === undefined && measured.length > 0) {
				const levels = defaults !== undefined && Array.isArray(defaults.levels) && defaults.levels.length > 0 ? defaults.levels : WIRE_LEVELS;
				const common = levels.filter((level) => measured.every((model) => Array.isArray(model.accepted) && model.accepted.includes(level)));
				if (common.length > 0) ops.push({ op: "set", path: ["providers", route, "reasoning"], value: common[common.length - 1] });
			}
			return ops;
		}

		/**
		 * The per-model capability edit from a row's expand area: rebuild that one
		 * entry's `input` and `reasoningEfforts` and set it in place. Returns the
		 * full-path op, or undefined when the model id is not in the array (an
		 * unsaved draft row — nothing to write to yet).
		 */
		function modelCapabilityOp(route, models, modelId, capability) {
			const index = models.findIndex((model) => isRecord(model) && model.id === modelId);
			if (index < 0) return undefined;
			const entry = { ...models[index] };
			if (capability.image === true) entry.input = ["text", "image"];
			else if (capability.image === false) entry.input = ["text"];
			if (capability.levels !== undefined) {
				const enabled = WIRE_LEVELS.filter((level) => isRecord(capability.levels) && capability.levels[level] !== undefined && capability.levels[level] !== false);
				if (enabled.length === 0) delete entry.reasoningEfforts;
				else {
					const efforts = { off: null };
					for (const level of enabled) {
						const wire = capability.levels[level];
						efforts[level] = typeof wire === "string" && wire.length > 0 ? wire : level;
					}
					entry.reasoningEfforts = efforts;
				}
			}
			return { op: "set", path: ["providers", route, "models", index], value: sanitize(entry) };
		}
		//#endregion

		//#region dsh-provider-toolkit/integrator.ts
		// DOM integration with the official Models settings cards. The official
		// page declares no slot inside its provider editor cards, so these
		// widgets are injected at structural anchors and re-applied by a
		// MutationObserver whenever React re-renders the card. Everything writes
		// through the settings faces directly — the official editor's minimal
		// path-op saves never touch these fields.

		/** A pi-ai custom-provider card is the one whose protocol select offers openai-completions. */
		function isCustomPiAiCard(card) {
			for (const select of card.querySelectorAll("select")) {
				for (const option of Array.from(select.options || [])) {
					if (option.value === "openai-completions" || option.textContent === "openai-completions") return true;
				}
			}
			return false;
		}

		/**
		 * The route a card edits: edit cards carry it as the title and a
		 * 自定义设置 <details>; the add card types it into the Provider ID field
		 * (its label reads "Provider ID" in every shipped locale).
		 */
		function cardContext(card) {
			const customized = card.querySelector('details[class*="_customized"]');
			const title = card.querySelector('[class*="_editorTitle"]');
			if (customized) return { kind: "edit", route: title ? (title.textContent || "").trim() : "" };
			const idLabel = Array.from(card.querySelectorAll('[class*="_fieldLabel"]')).find((label) => (label.textContent || "").trim() === "Provider ID");
			const idInput = idLabel && idLabel.parentElement ? idLabel.parentElement.querySelector('input[type="text"]') : null;
			return { kind: "add", route: idInput ? idInput.value.trim() : "", idInput };
		}

		function cardActions(card) {
			return card.querySelector('[class*="_editorActions"]');
		}

		/** The card's commit button (创建提供方 / 保存): the last primary action. */
		function cardPrimaryButton(card) {
			const actions = cardActions(card);
			if (!actions) return undefined;
			return actions.querySelector('button[class*="_primaryButton"]') || Array.from(actions.querySelectorAll("button")).pop();
		}

		/** The baseURL a card's form currently shows (for the policy's default host). */
		function cardBaseURL(card) {
			for (const input of card.querySelectorAll('input[type="text"]')) {
				if (/^https?:\/\//.test(input.value)) return input.value;
			}
			return "";
		}

		function el(tag, className, text) {
			const node = document.createElement(tag);
			if (className) node.className = className;
			if (text !== undefined) node.textContent = text;
			return node;
		}

		function field(labelText, input) {
			const row = el("div", "dspi_row");
			row.appendChild(el("span", "dspi_label", labelText));
			row.appendChild(input);
			return row;
		}

		function textInput(className, value, onChange) {
			const input = el("input", className || "dspi_input");
			input.type = "text";
			input.value = value;
			input.addEventListener("change", () => onChange(input.value));
			return input;
		}

		/** Write one route's network policy through the toolkit namespace. */
		async function writeNetworkPolicy(faces, route, draft, setStatus) {
			const t = faces.t;
			try {
				const described = await faces.describe();
				if (!described.ok) throw new Error(messageOf(described));
				const toolkitView = viewOf(described.value.namespaces, TOOLKIT_NS);
				if (toolkitView === undefined) throw new Error("namespace dsh-provider-toolkit missing");
				const op = networkPolicyOp(route, draft);
				const existing = policyOf(toolkitView, route);
				if (op.op === "unset" && existing === undefined) { setStatus("ok", t("pt.network.saved")); return; }
				if (op.op === "set" && existing !== undefined && JSON.stringify(op.value) === JSON.stringify(sanitize(existing))) {
					setStatus("ok", t("pt.network.saved"));
					return;
				}
				const response = await faces.mutate(TOOLKIT_NS, [op], toolkitView.revision);
				if (!response.ok) throw new Error(messageOf(response));
				setStatus("ok", t("pt.integ.network.applies"));
			} catch (error) {
				setStatus("error", t("pt.integ.network.writeFailed").replace("{message}", error instanceof Error ? error.message : String(error)));
			}
		}

		/** The per-card network-policy fieldset, appended ahead of the action row. */
		function buildNetworkFieldset(card, faces, info) {
			if (card.querySelector("[data-dspi-network]")) return;
			const actions = cardActions(card);
			if (!actions) return;
			const t = faces.t;
			const fs = el("div", "dspi_fs");
			fs.setAttribute("data-dspi-network", "1");
			fs.appendChild(el("div", "dspi_fs_title", t("pt.network.title")));
			const note = el("div", "dspi_status", info.kind === "add" ? t("pt.integ.network.pendingCreate") : t("pt.integ.network.applies"));
			fs.appendChild(note);

			const state = { host: "", skipProxy: false, tls: "verify", caFile: "", caPem: "", certFile: "", keyFile: "" };
			const hostInput = textInput("dspi_input dspi_wide", "", (value) => { state.host = value; });
			const skipBox = el("input");
			skipBox.type = "checkbox";
			skipBox.addEventListener("change", () => { state.skipProxy = skipBox.checked; });
			const tlsSelect = el("select", "dspi_input");
			for (const [value, label] of [["verify", t("pt.network.tls.verify")], ["insecure", t("pt.network.tls.insecure")], ["ca", t("pt.network.tls.ca")]]) {
				const option = el("option", "");
				option.value = value;
				option.textContent = label;
				tlsSelect.appendChild(option);
			}
			const caRow = field(t("pt.network.caFile"), textInput("dspi_input dspi_wide", "", (value) => { state.caFile = value; }));
			const certRow = field(t("pt.network.certFile"), textInput("dspi_input dspi_wide", "", (value) => { state.certFile = value; }));
			const keyRow = field(t("pt.network.keyFile"), textInput("dspi_input dspi_wide", "", (value) => { state.keyFile = value; }));
			caRow.style.display = "none";
			tlsSelect.addEventListener("change", () => { state.tls = tlsSelect.value; caRow.style.display = tlsSelect.value === "ca" ? "" : "none"; });
			const skipLabel = el("label", "dspi_check");
			skipLabel.appendChild(skipBox);
			skipLabel.appendChild(document.createTextNode(t("pt.network.skipProxy")));
			const skipRow = el("div", "dspi_row");
			skipRow.appendChild(skipLabel);
			fs.appendChild(field(t("pt.network.host"), hostInput));
			fs.appendChild(skipRow);
			fs.appendChild(field(t("pt.network.tls"), tlsSelect));
			fs.appendChild(caRow);
			fs.appendChild(certRow);
			fs.appendChild(keyRow);
			const status = el("span", "dspi_status");
			const statusRow = el("div", "dspi_row");
			statusRow.appendChild(status);
			fs.appendChild(statusRow);
			card.insertBefore(fs, actions);

			const setStatus = (kind, message) => { status.className = kind === "error" ? "dspi_error" : "dspi_ok"; status.textContent = message; };
			// Load the existing policy (edit cards) once the route is known.
			if (info.kind === "edit" && info.route) {
				faces.describe().then((described) => {
					if (!described.ok || !document.contains(fs)) return;
					const policy = policyOf(viewOf(described.value.namespaces, TOOLKIT_NS), info.route);
					const draft = isRecord(policy) ? policy : {};
					state.host = text(draft.host, "");
					if (!state.host) {
						const baseURL = cardBaseURL(card);
						state.host = baseURL.replace(/^https?:\/\//, "").replace(/[/:].*$/, "");
					}
					state.skipProxy = draft.skipProxy === true;
					state.tls = TLS_MODES.includes(draft.tls) ? draft.tls : "verify";
					state.caFile = text(draft.caFile, "");
					state.caPem = text(draft.caPem, "");
					state.certFile = text(draft.certFile, "");
					state.keyFile = text(draft.keyFile, "");
					hostInput.value = state.host;
					skipBox.checked = state.skipProxy;
					tlsSelect.value = state.tls;
					caRow.style.display = state.tls === "ca" ? "" : "none";
					caRow.querySelector("input").value = state.caFile;
					certRow.querySelector("input").value = state.certFile;
					keyRow.querySelector("input").value = state.keyFile;
				}).catch(() => {});
			} else if (info.kind === "add") {
				const baseURL = cardBaseURL(card);
				hostInput.value = baseURL.replace(/^https?:\/\//, "").replace(/[/:].*$/, "");
				state.host = hostInput.value;
			}

			// The official commit carries the policy: on edit cards write at once
			// (the route exists); on the add card, write once the created route
			// shows up in the settings document.
			const bind = cardPrimaryButton(card);
			if (bind && bind.dataset.dspiNetBound !== "1") {
				bind.dataset.dspiNetBound = "1";
				bind.addEventListener("click", () => {
					const route = info.kind === "edit" ? info.route : (info.idInput ? info.idInput.value.trim() : "");
					if (!route) return;
					const draft = { ...state };
					if (info.kind === "edit") { writeNetworkPolicy(faces, route, draft, setStatus); return; }
					const off = faces.onDocumentUpdated(() => {
						faces.describe().then((described) => {
							if (!described.ok) return;
							if (providersOf(viewOf(described.value.namespaces, LLM_NS))[route] === undefined) return;
							off();
							writeNetworkPolicy(faces, route, draft, setStatus);
						}).catch(() => {});
					});
				});
			}
		}

		/** The left-most action in the official action row: live-test the checked models and write what passes. */
		function buildDetectButton(card, faces, info) {
			const actions = cardActions(card);
			if (!actions || actions.querySelector("[data-dspi-detect]")) return;
			const t = faces.t;
			const btn = el("button", "dspi_btn", t("pt.integ.detect"));
			btn.type = "button";
			btn.title = t("pt.integ.detect.hint");
			btn.setAttribute("data-dspi-detect", "1");
			const status = el("span", "dspi_status");
			actions.insertBefore(status, actions.firstChild);
			actions.insertBefore(btn, status);
			if (info.kind !== "edit") {
				btn.disabled = true;
				btn.title = t("pt.integ.detect.needSave");
				return;
			}
			btn.addEventListener("click", () => { runDetect(card, faces, info.route, btn, status); });
		}

		async function runDetect(card, faces, route, btn, status) {
			const t = faces.t;
			const ids = [];
			for (const row of card.querySelectorAll('[class*="_modelRow"]')) {
				const box = row.querySelector("input[data-dspi-check]");
				const idInput = row.querySelector('input[type="text"]');
				if (box && box.checked && idInput && idInput.value.trim().length > 0) ids.push(idInput.value.trim());
			}
			if (ids.length === 0) { status.className = "dspi_status"; status.textContent = t("pt.integ.detect.none"); return; }
			btn.disabled = true;
			status.className = "dspi_status";
			status.textContent = t("pt.integ.detect.running");
			try {
				const probeResponse = await faces.callProbe(route);
				if (!probeResponse.ok || !isRecord(probeResponse.value) || probeResponse.value.ok !== true) throw new Error(messageOf(probeResponse));
				const probeValue = probeResponse.value.value;
				const verifyResponse = await faces.callVerify(route, ids);
				if (!verifyResponse.ok || !isRecord(verifyResponse.value) || verifyResponse.value.ok !== true) throw new Error(messageOf(verifyResponse));
				const verifyValue = verifyResponse.value.value;
				const described = await faces.describe();
				if (!described.ok) throw new Error(messageOf(described));
				const llmView = viewOf(described.value.namespaces, LLM_NS);
				const profile = providersOf(llmView)[route];
				if (!isRecord(profile)) throw new Error("route missing from settings");
				const ops = capabilityWriteOps(route, profile, isRecord(probeValue) ? probeValue.models : [], verifyValue, defaultsOf(described.value.namespaces, { result: probeValue }));
				if (ops.length > 0) {
					const written = await faces.mutate(LLM_NS, ops, llmView.revision);
					if (!written.ok) throw new Error(messageOf(written));
				}
				status.className = "dspi_ok";
				status.textContent = t("pt.integ.detect.done").replace("{n}", String(ids.length));
			} catch (error) {
				status.className = "dspi_error";
				status.textContent = t("pt.integ.detect.failed").replace("{message}", error instanceof Error ? error.message : String(error));
			} finally {
				btn.disabled = false;
			}
		}

		/** A checkbox before every model row of this card's catalog (default on). */
		function addRowCheckboxes(card) {
			for (const row of card.querySelectorAll('[class*="_modelRow"]')) {
				if (row.querySelector(':scope > input[data-dspi-check]')) continue;
				const box = el("input", "dspi_rowcheck");
				box.type = "checkbox";
				box.checked = true;
				box.setAttribute("data-dspi-check", "1");
				row.insertBefore(box, row.firstChild);
			}
		}

		/** The per-model capability editor inside a row's expanded capacity area. */
		function enhanceAdvancedAreas(card, faces, info) {
			if (info.kind !== "edit") return;
			for (const advanced of card.querySelectorAll('[class*="_modelAdvanced"]')) {
				if (advanced.dataset.dspiCaps === "1") continue;
				advanced.dataset.dspiCaps = "1";
				const entry = advanced.closest('[class*="_modelEntry"]');
				const idInput = entry ? entry.querySelector('input[type="text"]') : null;
				buildCapabilityFields(advanced, faces, info.route, () => (idInput ? idInput.value.trim() : ""));
			}
		}

		function buildCapabilityFields(advanced, faces, route, getModelId) {
			const t = faces.t;
			const wrap = el("div", "dspi_fs");
			advanced.appendChild(wrap);
			const status = el("span", "dspi_status");

			const imageLabel = el("label", "dspi_check");
			const imageBox = el("input");
			imageBox.type = "checkbox";
			imageLabel.appendChild(imageBox);
			imageLabel.appendChild(document.createTextNode(t("pt.integ.caps.image")));

			const chipsRow = el("div", "dspi_row");
			const wireRow = el("div", "dspi_row");
			const chipInputs = {};

			const gather = () => {
				const levels = {};
				for (const level of WIRE_LEVELS) {
					const record = chipInputs[level];
					if (record && record.box.checked) levels[level] = record.input ? record.input.value.trim() : level;
				}
				return { image: imageBox.checked, levels };
			};

			const write = async () => {
				status.className = "dspi_status";
				status.textContent = "";
				try {
					const described = await faces.describe();
					if (!described.ok) throw new Error(messageOf(described));
					const llmView = viewOf(described.value.namespaces, LLM_NS);
					const profile = providersOf(llmView)[route];
					const models = isRecord(profile) && Array.isArray(profile.models) ? profile.models : [];
					const op = modelCapabilityOp(route, models, getModelId(), gather());
					if (op === undefined) { status.textContent = t("pt.integ.caps.unsaved"); return; }
					const response = await faces.mutate(LLM_NS, [{ op: op.op, path: op.path, value: op.value }], llmView.revision);
					if (!response.ok) throw new Error(messageOf(response));
					status.className = "dspi_ok";
					status.textContent = t("pt.integ.caps.saved");
				} catch (error) {
					status.className = "dspi_error";
					status.textContent = t("pt.integ.caps.failed").replace("{message}", error instanceof Error ? error.message : String(error));
				}
			};

			const levelsTitle = el("div", "dspi_fs_title", t("pt.integ.caps.levels"));
			wrap.appendChild(levelsTitle);
			wrap.appendChild(chipsRow);
			wrap.appendChild(wireRow);
			const imageRow = el("div", "dspi_row");
			imageRow.appendChild(imageLabel);
			imageRow.appendChild(status);
			wrap.appendChild(imageRow);

			for (const level of WIRE_LEVELS) {
				const chip = el("button", "dspi_chip", level);
				chip.type = "button";
				const record = { box: { get checked() { return chip.classList.contains("dspi_chip_on"); } }, input: undefined };
				chipInputs[level] = record;
				chip.addEventListener("click", () => {
					chip.classList.toggle("dspi_chip_on");
					if (chip.classList.contains("dspi_chip_on")) {
						const input = textInput("dspi_input", level, () => { write(); });
						input.style.minWidth = "72px";
						input.setAttribute("data-dspi-wire", level);
						const label = el("span", "dspi_label", level + " " + t("pt.integ.caps.wire"));
						const holder = el("span", "dspi_row");
						holder.setAttribute("data-dspi-wire-row", level);
						holder.appendChild(label);
						holder.appendChild(input);
						wireRow.appendChild(holder);
						record.input = input;
					} else {
						const holder = wireRow.querySelector(`[data-dspi-wire-row="${level}"]`);
						if (holder) holder.remove();
						record.input = undefined;
					}
					write();
				});
				chipsRow.appendChild(chip);
			}
			imageBox.addEventListener("change", () => { write(); });

			// Fill from the current settings document.
			faces.describe().then((described) => {
				if (!described.ok || !document.contains(wrap)) return;
				const llmView = viewOf(described.value.namespaces, LLM_NS);
				const profile = providersOf(llmView)[route];
				const models = isRecord(profile) && Array.isArray(profile.models) ? profile.models.filter(isRecord) : [];
				const entry = models.find((model) => model.id === getModelId());
				if (entry === undefined) { status.textContent = t("pt.integ.caps.unsaved"); return; }
				imageBox.checked = Array.isArray(entry.input) && entry.input.includes("image");
				const efforts = isRecord(entry.reasoningEfforts) ? entry.reasoningEfforts : {};
				for (const level of WIRE_LEVELS) {
					if (efforts[level] === undefined) continue;
					const chip = Array.from(chipsRow.querySelectorAll(".dspi_chip")).find((c) => c.textContent === level);
					if (chip && !chip.classList.contains("dspi_chip_on")) chip.click();
					const input = wireRow.querySelector(`[data-dspi-wire="${level}"]`);
					if (input) input.value = typeof efforts[level] === "string" && efforts[level].length > 0 ? efforts[level] : level;
				}
				// chips clicked above each fired a write with partial state; rewrite once with the full picture
				write();
			}).catch(() => {});
		}

		/** Watch the page for official provider editor cards and enhance each once per render. */
		function startIntegrator(faces) {
			// Outside a browser (tests, SSR) there is nothing to integrate with.
			if (typeof document === "undefined" || typeof MutationObserver === "undefined" || !document.body) return () => {};
			let disposed = false;
			let queued = false;
			const scan = () => {
				queued = false;
				if (disposed || typeof document === "undefined") return;
				for (const card of document.querySelectorAll('div[class*="_editor"]')) {
					if (!isCustomPiAiCard(card)) continue;
					const info = cardContext(card);
					buildNetworkFieldset(card, faces, info);
					buildDetectButton(card, faces, info);
					if (info.kind === "edit") {
						addRowCheckboxes(card);
						enhanceAdvancedAreas(card, faces, info);
					}
				}
			};
			const schedule = () => {
				if (queued || disposed) return;
				queued = true;
				Promise.resolve().then(scan);
			};
			const observer = new MutationObserver(schedule);
			observer.observe(document.body, { childList: true, subtree: true });
			scan();
			return () => { disposed = true; observer.disconnect(); };
		}
		//#endregion

		//#region dsh-provider-toolkit/Panel.tsx
		const TLS_MODES = ["verify", "insecure", "ca"];

		/** The panel-level capacity defaults, listing filter, and automatic pass toggle. */
		function DefaultsEditor(props) {
			const { draft, onChange, onSave, t } = props;
			return e("div", { className: styles.card },
				e("div", { className: styles.row }, e("span", { className: styles.dim }, t("pt.defaults.title"))),
				e("div", { className: styles.row },
					e("label", { className: styles.check },
						e("input", {
							type: "checkbox", checked: draft.autoCapabilities !== false,
							onChange: (event) => { onChange({ autoCapabilities: event.target.checked }); },
						}),
						t("pt.defaults.auto"),
					),
				),
				e("div", { className: styles.row },
					e("label", { className: styles.field }, t("pt.defaults.context"),
						e("input", {
							className: styles.cell, type: "text", value: draft.contextWindow,
							onChange: (event) => { onChange({ contextWindow: event.target.value }); },
						}),
					),
					e("label", { className: styles.field }, t("pt.defaults.maxTokens"),
						e("input", {
							className: styles.cell, type: "text", value: draft.maxTokens,
							onChange: (event) => { onChange({ maxTokens: event.target.value }); },
						}),
					),
				),
				e("div", { className: styles.row },
					e("label", { className: styles.field }, t("pt.defaults.exclude"),
						e("input", {
							className: styles.input + " " + styles.wide, type: "text", value: draft.exclude,
							onChange: (event) => { onChange({ exclude: event.target.value }); },
						}),
					),
				),
				e("div", { className: styles.row },
					e("span", { className: styles.note }, t("pt.defaults.hint")),
					e("span", { className: styles.spacer }),
					draft.status === "saved" ? e("span", { className: styles.ok }, t("pt.network.saved")) : null,
					draft.status === "error" ? e("span", { className: styles.error }, draft.message) : null,
					e("button", {
						type: "button", className: styles.btn,
						disabled: draft.saving === true,
						onClick: onSave,
					}, draft.saving === true ? t("pt.network.saving") : t("pt.defaults.save")),
				),
			);
		}

				/**
		 * The Models footer seat: the shared detection defaults and the automatic
		 * capability pass. Provider-scoped controls (network policy, per-model
		 * capabilities, the test button) live inside the official editor cards
		 * through the integrator above, not here.
		 */
		function Panel(props) {
			const { settings, callProbe, callVerify, t } = props;
			const [state, setState] = useState({ phase: "loading", view: undefined, failure: undefined });
			const [defaultsDraft, setDefaultsDraft] = useState({ contextWindow: "", maxTokens: "", exclude: "", autoCapabilities: true, saving: false, status: undefined, message: undefined, dirty: false });
			const [autoState, setAutoState] = useState({});
			const alive = useRef(true);
			/** The configuration shape an automatic pass already ran for. */
			const autoRan = useRef("");

			const load = () => {
				settings.describe().then(
					(described) => {
						if (alive.current !== true) return;
						if (!described.ok) {
							setState({ phase: "error", view: undefined, failure: messageOf(described) });
							return;
						}
						setState({ phase: "ready", view: described.value, failure: undefined });
					},
					(error) => {
						if (alive.current !== true) return;
						setState({ phase: "error", view: undefined, failure: error instanceof Error ? error.message : String(error) });
					},
				);
			};

			useEffect(() => {
				alive.current = true;
				load();
				return () => { alive.current = false; };
			}, []);

			useEffect(() => {
				const off = props.onDocumentUpdated(() => { load(); });
				return off;
			}, []);

			useEffect(() => {
				if (defaultsDraft.dirty === true) return;
				const toolkit = viewOf(state.view === undefined ? undefined : state.view.namespaces, TOOLKIT_NS);
				const effective = normalizeDefaults(isRecord(toolkit) && isRecord(toolkit.value) ? toolkit.value.defaults : undefined);
				setDefaultsDraft((current) => ({
					...current,
					contextWindow: String(effective.contextWindow),
					maxTokens: String(effective.maxTokens),
					exclude: effective.exclude.join(", "),
					autoCapabilities: effective.autoCapabilities,
				}));
			}, [state.view]);

			/**
			 * The configuration shape an automatic capability pass keys on: the
			 * model ids, the route protocol, and the compat switches that shape the
			 * request.
			 *
			 * Two exclusions keep the pass idempotent: `reasoningEfforts` and
			 * `supportsDeveloperRole` are things the pass itself writes, so counting
			 * them would change the signature on every write and make the next page
			 * open measure everything again.
			 */
			const autoSignature = (profile) => {
				const compat = isRecord(profile.compat) ? { ...profile.compat } : undefined;
				if (compat !== undefined) delete compat.supportsDeveloperRole;
				return JSON.stringify({
					api: text(profile.api, ""),
					compat,
					models: (Array.isArray(profile.models) ? profile.models : [])
						.filter(isRecord)
						.map((model) => text(model.id, ""))
						.filter((id) => id.length > 0)
						.sort(),
				});
			};

			/**
			 * One automatic pass over every configured route: interrogate the
			 * endpoint, test the models this configuration shape has not measured
			 * yet, then write what was measured — reasoning levels, image input,
			 * the developer-role fix, a default thinking level, and any missing
			 * capacity. Everything it writes is additive, so it is safe to run
			 * without a click; the in-card button remains for corrections.
			 */
			const runAutoPass = async (view) => {
				const namespaces = view.namespaces;
				const llmView = viewOf(namespaces, LLM_NS);
				const toolkitView = viewOf(namespaces, TOOLKIT_NS);
				if (llmView === undefined || toolkitView === undefined) return;
				const section = isRecord(toolkitView.value) ? toolkitView.value : {};
				const effective = normalizeDefaults(section.defaults);
				if (effective.autoCapabilities !== true) return;
				const cache = isRecord(section.verify) ? section.verify : {};
				const providers = providersOf(llmView);
				for (const [route, profile] of Object.entries(providers)) {
					if (!isRecord(profile)) continue;
					const configured = Array.isArray(profile.models) ? profile.models.filter(isRecord) : [];
					const ids = configured.map((model) => text(model.id, "")).filter((id) => id.length > 0);
					if (ids.length === 0) continue;
					const signature = autoSignature(profile);
					const cached = isRecord(cache[route]) ? cache[route] : {};
					const pending = ids.filter((id) => !isRecord(cached[id]) || cached[id].signature !== signature);
					if (pending.length === 0) continue;
					const batch = pending.slice(0, 20);
					const key = `${route}|${signature}|${batch.join(",")}`;
					if (autoRan.current === key) continue;
					autoRan.current = key;
					setAutoState((current) => ({ ...current, [route]: { phase: "running", done: 0, total: batch.length } }));
					try {
						const probeResponse = await callProbe(route);
						if (!probeResponse.ok || !isRecord(probeResponse.value) || probeResponse.value.ok !== true) {
							setAutoState((current) => ({ ...current, [route]: { phase: "failed", message: messageOf(probeResponse) } }));
							continue;
						}
						const probeValue = probeResponse.value.value;
						const verifyResponse = await callVerify(route, batch);
						if (!verifyResponse.ok || !isRecord(verifyResponse.value) || verifyResponse.value.ok !== true) {
							setAutoState((current) => ({ ...current, [route]: { phase: "failed", message: messageOf(verifyResponse) } }));
							continue;
						}
						const verifyValue = verifyResponse.value.value;
						setAutoState((current) => ({ ...current, [route]: { phase: "applying", done: batch.length, total: batch.length } }));
						const ops = capabilityWriteOps(route, profile, isRecord(probeValue) ? probeValue.models : [], verifyValue, defaultsOf(namespaces, { result: probeValue }));
						if (ops.length > 0) {
							const written = await settings.mutate(LLM_NS, ops, llmView.revision);
							if (!written.ok) {
								setAutoState((current) => ({ ...current, [route]: { phase: "failed", message: messageOf(written) } }));
								continue;
							}
						}
						// Remember what this shape measured, so the next page open is free.
						const entry = { ...cached };
						for (const model of (Array.isArray(verifyValue.models) ? verifyValue.models : []).filter(isRecord)) {
							if (typeof model.id !== "string") continue;
							entry[model.id] = {
								signature,
								accepted: Array.isArray(model.accepted) ? model.accepted : [],
								capabilities: isRecord(model.capabilities) ? model.capabilities : {},
								at: new Date().toISOString(),
							};
						}
						const cachedWrite = await settings.mutate(TOOLKIT_NS, [{ op: "set", path: ["verify"], value: { ...cache, [route]: entry } }], toolkitView.revision);
						if (!cachedWrite.ok) {
							setAutoState((current) => ({ ...current, [route]: { phase: "failed", message: messageOf(cachedWrite) } }));
							continue;
						}
						setAutoState((current) => ({ ...current, [route]: { phase: "done", done: batch.length, total: batch.length } }));
						load();
					} catch (error) {
						setAutoState((current) => ({ ...current, [route]: { phase: "failed", message: error instanceof Error ? error.message : String(error) } }));
					}
				}
			};

			useEffect(() => {
				if (state.phase !== "ready" || state.view === undefined) return;
				runAutoPass(state.view);
			}, [state.view]);

			const onSaveDefaults = () => {
				const view = state.view;
				const toolkitView = viewOf(view === undefined ? undefined : view.namespaces, TOOLKIT_NS);
				if (toolkitView === undefined) return;
				const existing = isRecord(toolkitView.value) && isRecord(toolkitView.value.defaults) ? toolkitView.value.defaults : {};
				const value = {
					...existing,
					autoCapabilities: defaultsDraft.autoCapabilities !== false,
					contextWindow: toPositive(defaultsDraft.contextWindow) ?? SHIPPED_DEFAULTS.contextWindow,
					maxTokens: toPositive(defaultsDraft.maxTokens) ?? SHIPPED_DEFAULTS.maxTokens,
					exclude: String(defaultsDraft.exclude).split(",").map((item) => item.trim()).filter((item) => item.length > 0),
				};
				setDefaultsDraft((current) => ({ ...current, saving: true, status: undefined, message: undefined }));
				settings.mutate(TOOLKIT_NS, [{ op: "set", path: ["defaults"], value }], toolkitView.revision).then(
					(response) => {
						if (alive.current !== true) return;
						if (response.ok) {
							setDefaultsDraft((current) => ({ ...current, saving: false, dirty: false, status: "saved" }));
							load();
							return;
						}
						const message = response.error !== undefined && response.error.code === "settings/conflict"
							? t("pt.conflict")
							: t("pt.failed").replace("{message}", messageOf(response));
						setDefaultsDraft((current) => ({ ...current, saving: false, status: "error", message }));
						load();
					},
					(error) => {
						if (alive.current !== true) return;
						setDefaultsDraft((current) => ({ ...current, saving: false, status: "error", message: error instanceof Error ? error.message : String(error) }));
					},
				);
			};

			const head = e("div", { className: styles.head },
				e("span", { className: styles.title }, t("pt.title")),
				e("span", { className: styles.spacer }),
				e("button", { type: "button", className: styles.btn, onClick: load }, t("pt.reload")),
			);
			const description = e("div", { className: styles.sub }, t("pt.description"));

			if (state.phase === "loading") {
				return e("div", { className: styles.root }, head, description, e("div", { className: styles.sub }, t("pt.loading")));
			}
			if (state.phase === "error" || state.view === undefined) {
				return e("div", { className: styles.root }, head, description,
					e("div", { className: styles.error }, t("pt.failed").replace("{message}", text(state.failure, "unknown"))));
			}

			const autoEntries = Object.entries(autoState);
			return e("div", { className: styles.root }, head, description,
				e(DefaultsEditor, {
					draft: defaultsDraft,
					onChange: (patch) => { setDefaultsDraft((current) => ({ ...current, ...patch, dirty: true, status: undefined, message: undefined })); },
					onSave: onSaveDefaults,
					t,
				}),
				autoEntries.length === 0 ? null : e("div", { className: styles.card },
					autoEntries.map(([route, auto]) => e("div", { key: route, className: styles.row },
						e("span", { className: styles.route }, route),
						auto.phase === "running" ? e("span", { className: styles.tag }, t("pt.auto.running").replace("{n}", String(auto.total)))
							: auto.phase === "applying" ? e("span", { className: styles.tag }, t("pt.auto.applying"))
								: auto.phase === "done" ? e("span", { className: styles.ok }, t("pt.auto.done").replace("{n}", String(auto.done)))
									: e("span", { className: styles.error }, t("pt.auto.failed").replace("{message}", text(auto.message, "unknown"))),
					)),
				),
			);
		}
		//#endregion
		//#region dsh-provider-toolkit/index.ts
		/** Required services: slots, dictionaries, the remote wire, and the settings namespace face. */
		const inject = ["slots", "locale", "remote", "remote.settings", "connection"];

		/**
		 * Browser face: the Models page footer panel. Host work is reached over
		 * the connection RPC carrier on the strict endpoints this package's
		 * `./typert` manifest declares; settings are read and written through the
		 * generated `remote.settings` face, exactly like the shipped card.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-provider-toolkit: dictionaries");

			const settings = ctx.get("remote").settings;
			const rpc = (endpoint, args) => ctx.connection.rpc.call("/api", endpoint, { args }, undefined);
			const callOverview = () => rpc("providerToolkit/overview", {});
			const callProbe = (route) => rpc("providerToolkit/probe", { request: { route } });
			const callVerify = (route, models) => rpc("providerToolkit/verifyReasoning", { request: models === undefined ? { route } : { route, models } });
			const onDocumentUpdated = (listener) => {
				try {
					return ctx.remote.$on("settings/document-updated", (ns) => {
						if (ns === LLM_NS || ns === TOOLKIT_NS) listener();
					});
				} catch {
					return () => {};
				}
			};

			// The official editor cards carry the provider-scoped controls; the
			// locale service is slot-bound, so the integrator picks a dictionary
			// from the document language itself.
			const integratorFaces = {
				describe: () => settings.describe(),
				mutate: (ns, ops, revision) => settings.mutate(ns, ops, revision),
				callProbe,
				callVerify,
				onDocumentUpdated,
				t: (key) => {
					const lang = typeof document !== "undefined" && /^zh/i.test(document.documentElement.lang || "") ? zh : en;
					return lang[key] ?? en[key] ?? key;
				},
			};
			ctx.effect(() => startIntegrator(integratorFaces), "dsh-provider-toolkit: models-card integration");

			ctx.slots.inject("settings.models.footer", () => ctx.slots.register({
				name: "settings.models.footer",
				id: "dsh-provider-toolkit",
				order: 20,
				locale: NS,
				inject: () => ({ settings, callOverview, callProbe, callVerify, onDocumentUpdated }),
			}, Panel));
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		/**
		 * Pure helpers exposed for this package's own tests: the write policy
		 * that decides which detected reasoning levels may reach settings.
		 */
		exports.__testables = {
			mergeModels,
			effectiveDetection,
			isWritableSource,
			verifiedById,
			sanitize,
			defaultsOf,
			normalizeDefaults,
			defaultCapacityFor,
			isExcludedModel,
			toPositive,
			overviewOf,
			networkPolicyOp,
			capabilityWriteOps,
			modelCapabilityOp,
			WIRE_LEVELS,
			SHIPPED_DEFAULTS,
		};
		return module.exports;
	}
});
