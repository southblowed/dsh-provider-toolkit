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
			"pt.title": "厂商探测与网络策略",
			"pt.description": "自动读取自定义厂商的模型上下文/输出与思考级别，并为每个厂商单独指定出站代理与 TLS 行为。策略立即生效，无需重启。",
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
		};
		const en = {
			"pt.title": "Provider probing & network policy",
			"pt.description": "Read a custom provider's model context/output and thinking levels automatically, and give each provider its own outbound proxy and TLS behaviour. Changes apply live.",
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
		//#endregion

		//#region dsh-provider-toolkit/Panel.tsx
		const TLS_MODES = ["verify", "insecure", "ca"];

		/**
		 * One provider's editable review table, capability probes, and network
		 * policy. The table is the contract: every number it shows is what the
		 * confirmation will write, so a value the endpoint never disclosed can be
		 * reviewed — and corrected — instead of being looked up by hand.
		 */
		function ProviderBlock(props) {
			const {
				provider, live, probe, verify, draft, defaults, edits, selected, reasoningChoice, busy, auto, allowUnverified, includeNew,
				onProbe, onVerify, onConfirm, onDraft, onSave, onAllowUnverified, onIncludeNew, onEdit, onToggle, onReasoningChoice, t,
			} = props;
			const [open, setOpen] = useState(false);
			const result = probe !== undefined && probe.result !== undefined ? probe.result : undefined;
			const models = result !== undefined && Array.isArray(result.models) ? result.models : [];
			const verified = verify !== undefined && isRecord(verify.result) && Array.isArray(verify.result.models) ? verify.result.models : undefined;
			const rowEdits = isRecord(edits) ? edits : {};
			const confirmedIds = result !== undefined && Array.isArray(result.configuredIds) ? result.configuredIds : [];
			const configuredSet = new Set(confirmedIds);
			const extraModels = models.filter((model) => !configuredSet.has(model.id));
			const isChecked = (model) => (isRecord(selected) && typeof selected[model.id] === "boolean" ? selected[model.id] : configuredSet.has(model.id));
			const checkedModels = models.filter(isChecked);

			// The levels every checked-and-verified model accepted — the only
			// safe defaults to enable for the whole route.
			const checkedVerified = (verified ?? []).filter((model) => isRecord(model) && checkedModels.some((entry) => entry.id === model.id));
			const levelNames = Array.isArray(defaults.levels) ? defaults.levels : SHIPPED_DEFAULTS.levels;
			const commonAccepted = checkedVerified.length > 0
				? levelNames.filter((level) => checkedVerified.every((model) => Array.isArray(model.accepted) && model.accepted.includes(level)))
				: [];
			const developerUnsupported = checkedVerified.filter((model) => isRecord(model.capabilities) && model.capabilities.developerRole === "unsupported");

			const planned = checkedModels.length > 0 ? checkedModels.length * (3 + levelNames.length) : 0;

			const policyChip = draft.skipProxy === true || draft.tls !== "verify"
				? e("span", { className: styles.tag },
					[draft.skipProxy === true ? t("pt.network.policyChip.direct") : "", draft.tls === "insecure" ? t("pt.network.policyChip.insecure") : "", draft.tls === "ca" ? t("pt.network.policyChip.ca") : ""]
						.filter((part) => part.length > 0).join(" + "))
				: null;

			const header = e("div", { className: styles.row },
				e("span", { className: styles.route }, provider.displayName),
				provider.displayName !== provider.route ? e("span", { className: styles.dim }, provider.route) : null,
				e("span", { className: styles.tag }, live ? t("pt.live") : t("pt.offline")),
				policyChip,
				provider.host.length > 0 ? e("span", { className: styles.dim }, provider.host) : null,
				e("span", { className: styles.spacer }),
				e("button", {
					type: "button", className: styles.btn,
					onClick: () => { setOpen(!open); },
				}, open ? t("pt.collapse") : t("pt.expand")),
			);

			const summary = e("div", { className: styles.row },
				e("span", { className: styles.dim },
					Array.isArray(provider.declaredModels)
						? t("pt.models.count").replace("{n}", String(provider.declaredModels.length))
						: t("pt.models.catalog")),
				provider.api.length > 0 ? e("span", { className: styles.tag }, provider.api) : null,
				provider.baseURL.length > 0 ? e("span", { className: styles.dim }, provider.baseURL) : null,
			);

			// The automatic pass reports itself in the collapsed row too, because it
			// runs with nobody having clicked anything.
			const autoNote = !isRecord(auto) ? null
				: auto.phase === "running" ? e("span", { className: styles.tag }, t("pt.auto.running").replace("{n}", String(auto.total)))
					: auto.phase === "applying" ? e("span", { className: styles.tag }, t("pt.auto.applying"))
						: auto.phase === "done" ? e("span", { className: styles.ok }, t("pt.auto.done").replace("{n}", String(auto.done)))
							: e("span", { className: styles.error }, t("pt.auto.failed").replace("{message}", text(auto.message, "unknown")));

			const tlsSelect = e("select", {
				className: styles.select,
				value: draft.tls,
				onChange: (event) => { onDraft(provider.route, { tls: event.target.value }); },
			}, e("option", { value: "verify" }, t("pt.network.tls.verify")),
				e("option", { value: "insecure" }, t("pt.network.tls.insecure")),
				e("option", { value: "ca" }, t("pt.network.tls.ca")));

			const caFileField = draft.tls !== "ca" ? null : e("label", { className: styles.field },
				t("pt.network.caFile"),
				e("input", {
					className: styles.input + " " + styles.wide, type: "text", value: draft.caFile,
					placeholder: "C:\\\\certs\\\\corp-ca.pem",
					onChange: (event) => { onDraft(provider.route, { caFile: event.target.value }); },
				}),
			);

			// The network policy sits right under the summary, before any probing —
			// it is what makes a proxy-blocked or self-signed endpoint answer at all.
			const network = e("div", { className: styles.card },
				e("div", { className: styles.row },
					e("span", { className: styles.dim }, t("pt.network.title")),
				),
				e("div", { className: styles.row },
					e("label", { className: styles.check },
						e("input", {
							type: "checkbox", checked: draft.skipProxy === true,
							onChange: (event) => { onDraft(provider.route, { skipProxy: event.target.checked }); },
						}),
						t("pt.network.skipProxy"),
					),
					e("span", { className: styles.spacer }),
					e("label", { className: styles.field }, t("pt.network.tls"), tlsSelect),
				),
				e("div", { className: styles.row },
					e("label", { className: styles.field }, t("pt.network.host"),
						e("input", {
							className: styles.input, type: "text", value: draft.host,
							onChange: (event) => { onDraft(provider.route, { host: event.target.value }); },
						}),
					),
					caFileField,
				),
				e("div", { className: styles.row },
					e("label", { className: styles.field }, t("pt.network.certFile"),
						e("input", {
							className: styles.input, type: "text", value: draft.certFile,
							onChange: (event) => { onDraft(provider.route, { certFile: event.target.value }); },
						}),
					),
					e("label", { className: styles.field }, t("pt.network.keyFile"),
						e("input", {
							className: styles.input, type: "text", value: draft.keyFile,
							onChange: (event) => { onDraft(provider.route, { keyFile: event.target.value }); },
						}),
					),
				),
				e("div", { className: styles.row },
					e("span", { className: styles.note }, t("pt.network.hint")),
					e("span", { className: styles.spacer }),
					draft.status === "saved" ? e("span", { className: styles.ok }, t("pt.network.saved")) : null,
					draft.status === "error" ? e("span", { className: styles.error }, draft.message) : null,
					e("button", {
						type: "button", className: styles.btn,
						disabled: draft.saving === true,
						onClick: () => { onSave(provider.route); },
					}, draft.saving === true ? t("pt.network.saving") : t("pt.network.save")),
				),
			);

			if (!open) return e("div", { className: styles.card }, header, summary,
				autoNote === null ? null : e("div", { className: styles.row }, autoNote));

			const probeButton = e("button", {
				type: "button", className: styles.btn,
				disabled: busy.probing === true || provider.baseURL.length === 0,
				onClick: () => { onProbe(provider.route); },
			}, busy.probing === true ? t("pt.probing") : t("pt.probe"));

			// The test button targets the checked rows only; verification costs
			// real requests, so the count is announced before the user commits.
			const verifyButton = e("button", {
				type: "button", className: styles.btn,
				disabled: busy.verifying === true || provider.baseURL.length === 0 || checkedModels.length === 0,
				onClick: () => { onVerify(provider.route, checkedModels.map((model) => model.id)); },
			}, busy.verifying === true ? t("pt.testing") : t("pt.testSelected"));

			const verifyHint = e("span", { className: styles.note },
				t("pt.test.hint").replace("{levels}", levelNames.join(" / ")),
				planned > 0 ? ` ${t("pt.verify.requests").replace("{n}", String(planned))}` : "");

			/** What one capacity cell shows: the user's edit, the endpoint, or the default. */
			const capacityValue = (model, key) => {
				const edited = isRecord(rowEdits[model.id]) ? rowEdits[model.id] : {};
				const raw = edited[key];
				if (typeof raw === "string" && raw.length > 0) return raw;
				const disclosed = number(model[key]);
				if (disclosed !== undefined) return String(disclosed);
				return String(defaultCapacityFor(model.id, defaults)[key]);
			};
			const capacitySourceLabel = (model) => {
				const edited = isRecord(rowEdits[model.id]) ? rowEdits[model.id] : {};
				if (typeof edited.contextWindow === "string" || typeof edited.maxTokens === "string") return t("pt.table.edited");
				const endpoint = model.contextSource === "endpoint" || model.maxTokensSource === "endpoint";
				const fallback = model.contextSource !== "endpoint" || model.maxTokensSource !== "endpoint";
				return [endpoint ? t("pt.table.endpoint") : "", fallback ? t("pt.table.default") : ""].filter((part) => part.length > 0).join(" / ");
			};

			const table = models.length === 0 ? null : e("table", { className: styles.table },
				e("thead", null, e("tr", null,
					e("th", null, ""),
					e("th", null, t("pt.col.id")),
					e("th", null, t("pt.col.context")),
					e("th", null, t("pt.col.output")),
					e("th", null, t("pt.col.reasoning")),
					e("th", null, t("pt.col.source")),
				)),
				e("tbody", null, models.map((model) => {
					const entry = verifiedById(verified, model.id);
					const detection = effectiveDetection(model, entry);
					const reasoning = formatReasoning(detection.reasoningEfforts);
					const source = detection.reasoningSource === "metadata" ? t("pt.source.metadata")
						: detection.reasoningSource === "heuristic" ? t("pt.source.heuristic") + t("pt.unverifiedTag")
							: detection.reasoningSource === "verified" ? t("pt.source.verified") + t("pt.verifiedTag")
								: detection.reasoningSource === "verified-none" ? t("pt.source.rejected")
									: t("pt.source.none");
					const reasoningCell = detection.reasoningEfforts === false ? t("pt.reasoning.none")
						: detection.reasoningSource === "verified-none" ? t("pt.source.rejected")
							: reasoning === undefined ? "—" : reasoning;
					return e("tr", { key: model.id },
						e("td", null, e("input", {
							type: "checkbox", checked: isChecked(model),
							onChange: (event) => { onToggle(provider.route, model.id, event.target.checked); },
						})),
						e("td", null,
							text(model.name, model.id) === model.id ? model.id : `${model.name} (${model.id})`,
							configuredSet.has(model.id) ? null : e("span", { className: styles.tag }, t("pt.table.new")),
						),
						e("td", null, e("input", {
							className: styles.cell, type: "text", value: capacityValue(model, "contextWindow"),
							onChange: (event) => { onEdit(provider.route, model.id, { contextWindow: event.target.value }); },
						})),
						e("td", null, e("input", {
							className: styles.cell, type: "text", value: capacityValue(model, "maxTokens"),
							onChange: (event) => { onEdit(provider.route, model.id, { maxTokens: event.target.value }); },
						})),
						e("td", null, reasoningCell),
						e("td", null, source, e("span", { className: styles.dim }, ` · ${capacitySourceLabel(model)}`)),
					);
				})),
			);

			const verdictRows = [];
			for (const model of verified ?? []) {
				if (model.failure !== undefined) {
					verdictRows.push(e("tr", { key: `${model.id}-failure` },
						e("td", null, model.id),
						e("td", null, "—"),
						e("td", null, verdictLabel("inconclusive", t)),
						e("td", null, model.failure.message),
					));
					continue;
				}
				for (const verdict of Array.isArray(model.verdicts) ? model.verdicts : []) {
					verdictRows.push(e("tr", { key: `${model.id}-${verdict.level}` },
						e("td", null, model.id),
						e("td", null, verdict.level === "baseline" ? t("pt.verify.baseline") : verdict.level),
						e("td", null, verdictLabel(verdict.status, t)),
						e("td", null,
							[verdict.message ?? "", verdict.status === "accepted"
								? (verdict.sawReasoning ? t("pt.verify.sawReasoning") : t("pt.verify.noReasoning"))
								: ""].filter((part) => part.length > 0).join(" · ")
							|| "—"),
					));
				}
			}
			const verifyTable = verified === undefined || verdictRows.length === 0 ? null : e("table", { className: styles.table },
				e("thead", null, e("tr", null,
					e("th", null, t("pt.verify.col.model")),
					e("th", null, t("pt.verify.col.level")),
					e("th", null, t("pt.verify.col.verdict")),
					e("th", null, t("pt.verify.col.detail")),
				)),
				e("tbody", null, verdictRows),
			);

			const capabilitySummary = verified === undefined ? null : e("div", { className: styles.note },
				verified.map((model) => {
					const accepted = Array.isArray(model.accepted) ? model.accepted : [];
					const caps = isRecord(model.capabilities) ? model.capabilities : {};
					const parts = [];
					if (caps.imageInput === "supported") parts.push(t("pt.caps.image.yes"));
					if (caps.imageInput === "unsupported") parts.push(t("pt.caps.image.no"));
					if (caps.imageInput === "unknown") parts.push(t("pt.caps.image.unknown"));
					if (caps.developerRole === "unsupported") parts.push(t("pt.caps.devRole.no"));
					return e("div", { key: model.id },
						`${model.id}：`,
						model.failure !== undefined
							? model.failure.message
							: accepted.length > 0
								? t("pt.verify.acceptedLevels").replace("{levels}", accepted.join(" / "))
								: t("pt.verify.noAcceptedLevels"),
						parts.length > 0 ? ` ${parts.join("；")}` : "",
					);
				}),
			);
			const allRejected = verified !== undefined && verified.length > 0 && verified.every((model) =>
				Array.isArray(model.tested) && model.tested.length > 0
				&& (Array.isArray(model.accepted) ? model.accepted.length === 0 : false));
			const verifyNote = allRejected ? e("div", { className: styles.error }, t("pt.verify.allRejected")) : null;
			const developerNote = developerUnsupported.length > 0
				? e("div", { className: styles.note }, t("pt.caps.devRole.fix").replace("{n}", String(developerUnsupported.length)))
				: null;

			const notes = result !== undefined && Array.isArray(result.notes) && result.notes.length > 0
				? e("div", null, result.notes.map((note, index) => e("div", { className: styles.note, key: String(index) }, note)))
				: null;

			const reasoningSelect = checkedVerified.length === 0 ? null : e("label", { className: styles.field },
				t("pt.reasoningDefault"),
				e("select", {
					className: styles.select,
					value: reasoningChoice,
					onChange: (event) => { onReasoningChoice(provider.route, event.target.value); },
				},
					e("option", { value: "" }, t("pt.reasoningDefault.unset")),
					commonAccepted.length === 0 ? e("option", { value: "", disabled: true }, t("pt.reasoningDefault.none")) : null,
					commonAccepted.map((level) => e("option", { key: level, value: level }, level)),
				),
			);

			// Bottom bar: the test button on the left, the write controls on the right.
			const actionBar = result === undefined ? null : e("div", { className: styles.row },
				probeButton, verifyButton,
				e("span", { className: styles.spacer }),
				e("label", { className: styles.check },
					e("input", {
						type: "checkbox", checked: allowUnverified === true,
						onChange: (event) => { onAllowUnverified(event.target.checked); },
					}),
					t("pt.writeUnverified"),
				),
				e("label", { className: styles.check },
					e("input", {
						type: "checkbox", checked: includeNew === true,
						onChange: (event) => { onIncludeNew(event.target.checked); },
					}),
					t("pt.includeNew").replace("{n}", String(extraModels.length)),
				),
				reasoningSelect,
				busy.confirmed !== undefined ? e("span", { className: styles.ok }, t("pt.confirmed").replace("{n}", String(busy.confirmed))) : null,
				e("button", {
					type: "button", className: styles.btn + " " + styles.primary,
					disabled: busy.confirming === true,
					onClick: () => { onConfirm(provider.route); },
				}, busy.confirming === true ? t("pt.applying") : t("pt.confirm")),
			);

			return e("div", { className: styles.card },
				header, summary,
				autoNote === null ? null : e("div", { className: styles.row }, autoNote),
				network,
				e("div", { className: styles.row },
					probeButton, verifyButton,
					e("span", { className: styles.spacer }),
					probe !== undefined && probe.error !== undefined ? e("span", { className: styles.error }, probe.error) : null,
					verify !== undefined && verify.error !== undefined ? e("span", { className: styles.error }, verify.error) : null,
				),
				e("div", { className: styles.row }, verifyHint),
				table,
				actionBar,
				capabilitySummary, verifyTable, verifyNote, developerNote, notes,
			);
		}

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

		/** The Models footer seat: every provider, its detected capabilities, and its network policy. */
		function Panel(props) {
			const { settings, callOverview, callProbe, callVerify, t } = props;
			const [state, setState] = useState({ phase: "loading", view: undefined, overview: undefined, failure: undefined });
			const [probes, setProbes] = useState({});
			const [verifies, setVerifies] = useState({});
			const [edits, setEdits] = useState({});
			const [selected, setSelected] = useState({});
			const [drafts, setDrafts] = useState({});
			const [defaultsDraft, setDefaultsDraft] = useState({ contextWindow: "", maxTokens: "", exclude: "", autoCapabilities: true, saving: false, status: undefined, message: undefined, dirty: false });
			const [busy, setBusy] = useState({});
			const [allowUnverified, setAllowUnverified] = useState(false);
			const [includeNew, setIncludeNew] = useState(false);
			const [reasoningChoice, setReasoningChoice] = useState({});
			const [autoState, setAutoState] = useState({});
			const alive = useRef(true);
			/** The configuration shape an automatic pass already ran for. */
			const autoRan = useRef("");

			const load = () => {
				setState((current) => ({ ...current, phase: current.overview === undefined ? "loading" : current.phase }));
				Promise.all([settings.describe(), callOverview()]).then(
					([described, overview]) => {
						if (alive.current !== true) return;
						if (!described.ok) {
							setState({ phase: "error", view: undefined, overview: undefined, failure: messageOf(described) });
							return;
						}
						const unwrapped = overviewOf(overview);
						setState({ phase: "ready", view: described.value, overview: unwrapped.value, failure: unwrapped.failure });
					},
					(error) => {
						if (alive.current !== true) return;
						setState({ phase: "error", view: undefined, overview: undefined, failure: error instanceof Error ? error.message : String(error) });
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
				const view = state.view;
				// First mount has no view yet: describe() has not resolved, so
				// there is nothing to sync drafts from. Reading `view.namespaces`
				// here crashes the whole slot entry before the panel ever shows.
				if (view === undefined) return;
				const routes = providersOf(viewOf(view.namespaces, LLM_NS));
				setDrafts((current) => {
					const next = {};
					for (const route of Object.keys(routes)) {
						// A route already being edited keeps its draft: a document update
						// from elsewhere must not discard what the user has typed.
						if (isRecord(current[route]) && current[route].dirty === true) {
							next[route] = current[route];
							continue;
						}
						const policy = policyOf(viewOf(view.namespaces, TOOLKIT_NS), route);
						const provider = routes[route];
						const baseURL = text(isRecord(provider) ? provider.baseURL : undefined, "");
						next[route] = {
							host: text(isRecord(policy) ? policy.host : undefined, baseURL.replace(/^https?:\/\//, "").replace(/[/:].*$/, "")),
							skipProxy: isRecord(policy) && policy.skipProxy === true,
							tls: isRecord(policy) && TLS_MODES.includes(policy.tls) ? policy.tls : "verify",
							caFile: text(isRecord(policy) ? policy.caFile : undefined, ""),
							caPem: text(isRecord(policy) ? policy.caPem : undefined, ""),
							certFile: text(isRecord(policy) ? policy.certFile : undefined, ""),
							keyFile: text(isRecord(policy) ? policy.keyFile : undefined, ""),
							saving: false,
							dirty: false,
						};
					}
					return next;
				});
			}, [state.view]);

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

			const onDraft = (route, patch) => {
				setDrafts((current) => ({ ...current, [route]: { ...(current[route] ?? {}), ...patch, dirty: true, status: undefined, message: undefined } }));
			};

			const onEdit = (route, modelId, patch) => {
				setEdits((current) => ({
					...current,
					[route]: { ...(current[route] ?? {}), [modelId]: { ...((current[route] ?? {})[modelId] ?? {}), ...patch } },
				}));
				setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), confirmed: undefined } }));
			};

			const onToggle = (route, modelId, checked) => {
				setSelected((current) => ({ ...current, [route]: { ...(current[route] ?? {}), [modelId]: checked } }));
				setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), confirmed: undefined } }));
			};

			const onReasoningChoice = (route, level) => {
				setReasoningChoice((current) => ({ ...current, [route]: level }));
			};

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
					compat: compat ?? null,
					models: (Array.isArray(profile.models) ? profile.models : [])
						.filter(isRecord)
						.map((model) => text(model.id, ""))
						.filter((id) => id.length > 0),
				});
			};

			/**
			 * One automatic pass over every configured route: interrogate the
			 * endpoint, test the models this configuration shape has not measured
			 * yet, then write what was measured — reasoning levels, image input,
			 * the developer-role fix, a default thinking level, and any missing
			 * capacity. Everything it writes is additive, so it is safe to run
			 * without a click; the panel's own buttons remain for corrections.
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
						setProbes((current) => ({ ...current, [route]: { result: probeValue } }));
						const verifyResponse = await callVerify(route, batch);
						if (!verifyResponse.ok || !isRecord(verifyResponse.value) || verifyResponse.value.ok !== true) {
							setAutoState((current) => ({ ...current, [route]: { phase: "failed", message: messageOf(verifyResponse) } }));
							continue;
						}
						const verifyValue = verifyResponse.value.value;
						setVerifies((current) => ({ ...current, [route]: { result: verifyValue } }));
						setAutoState((current) => ({ ...current, [route]: { phase: "applying", done: batch.length, total: batch.length } }));
						const verified = Object.fromEntries((verifyValue.models ?? [])
							.filter((model) => isRecord(model) && typeof model.id === "string")
							.map((model) => [model.id, model]));
						const rows = mergeModels(configured, Array.isArray(probeValue.models) ? probeValue.models : [], false, {
							verified,
							allowUnverified: false,
							edits: {},
							defaults: defaultsOf(namespaces, { result: probeValue }),
							conservative: true,
						}).map(sanitize);
						const ops = [];
						if (JSON.stringify(rows) !== JSON.stringify(configured.map(sanitize))) {
							ops.push({ op: "set", path: ["providers", route, "models"], value: rows });
						}
						const measured = (verifyValue.models ?? []).filter(isRecord);
						if (measured.some((model) => isRecord(model.capabilities) && model.capabilities.developerRole === "unsupported")) {
							const currentCompat = isRecord(profile.compat) ? profile.compat : {};
							if (currentCompat.supportsDeveloperRole !== false) {
								ops.push({ op: "set", path: ["providers", route, "compat", "supportsDeveloperRole"], value: false });
							}
						}
						// Enable thinking by default only where every measured model
						// accepted the same level, and only when the route has no
						// explicit default the user already chose.
						if (profile.reasoning === undefined && effective.levels.length > 0 && measured.length > 0) {
							const common = effective.levels.filter((level) => measured.every((model) => Array.isArray(model.accepted) && model.accepted.includes(level)));
							if (common.length > 0) ops.push({ op: "set", path: ["providers", route, "reasoning"], value: common[common.length - 1] });
						}
						if (ops.length > 0) {
							const written = await settings.mutate(LLM_NS, ops, llmView.revision);
							if (!written.ok) {
								setAutoState((current) => ({ ...current, [route]: { phase: "failed", message: messageOf(written) } }));
								continue;
							}
						}
						// Remember what this shape measured, so the next page open is free.
						const entry = { ...cached };
						for (const model of measured) {
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

			/** Persist one provider's outbound network policy. */
			const onSave = (route) => {
				const view = state.view;
				const toolkitView = viewOf(view === undefined ? undefined : view.namespaces, TOOLKIT_NS);
				const draft = drafts[route];
				if (toolkitView === undefined || draft === undefined) return;
				const value = sanitize({
					host: draft.host,
					skipProxy: draft.skipProxy === true ? true : undefined,
					tls: draft.tls === "verify" ? undefined : draft.tls,
					caFile: draft.caFile,
					caPem: draft.caPem,
					certFile: draft.certFile,
					keyFile: draft.keyFile,
				});
				setDrafts((current) => ({ ...current, [route]: { ...(current[route] ?? {}), saving: true, status: undefined, message: undefined } }));
				const op = Object.keys(value).length === 0
					? { op: "unset", path: ["network", route] }
					: { op: "set", path: ["network", route], value };
				settings.mutate(TOOLKIT_NS, [op], toolkitView.revision).then(
					(response) => {
						if (alive.current !== true) return;
						if (response.ok) {
							setDrafts((current) => ({ ...current, [route]: { ...(current[route] ?? {}), saving: false, dirty: false, status: "saved" } }));
							load();
							return;
						}
						const message = response.error !== undefined && response.error.code === "settings/conflict"
							? t("pt.conflict")
							: t("pt.failed").replace("{message}", messageOf(response));
						setDrafts((current) => ({ ...current, [route]: { ...(current[route] ?? {}), saving: false, status: "error", message } }));
						load();
					},
					(error) => {
						if (alive.current !== true) return;
						setDrafts((current) => ({ ...current, [route]: { ...(current[route] ?? {}), saving: false, status: "error", message: error instanceof Error ? error.message : String(error) } }));
					},
				);
			};

			const onProbe = (route) => {
				setProbes((current) => ({ ...current, [route]: { ...(current[route] ?? {}), error: undefined } }));
				setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), probing: true, confirmed: undefined } }));
				callProbe(route).then(
					(response) => {
						if (alive.current !== true) return;
						setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), probing: false } }));
						if (response.ok && response.value !== undefined && response.value.ok === true) {
							setProbes((current) => ({ ...current, [route]: { result: response.value.value } }));
							return;
						}
						const message = response.ok && response.value !== undefined && response.value.error !== undefined
							? response.value.error.message
							: messageOf(response);
						setProbes((current) => ({ ...current, [route]: { error: message } }));
					},
					(error) => {
						if (alive.current !== true) return;
						setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), probing: false } }));
						setProbes((current) => ({ ...current, [route]: { error: error instanceof Error ? error.message : String(error) } }));
					},
				);
			};

			/**
			 * Ask the host to test the route's checked models against the real
			 * endpoint: reasoning levels, the developer role, and image input. The
			 * reply replaces the listing's inference for those models, so only
			 * accepted facts can be written.
			 */
			const onVerify = (route, models) => {
				setVerifies((current) => ({ ...current, [route]: { ...(current[route] ?? {}), error: undefined } }));
				setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), verifying: true, confirmed: undefined } }));
				callVerify(route, models).then(
					(response) => {
						if (alive.current !== true) return;
						setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), verifying: false } }));
						if (response.ok && response.value !== undefined && response.value.ok === true) {
							setVerifies((current) => ({ ...current, [route]: { result: response.value.value } }));
							return;
						}
						const message = response.ok && response.value !== undefined && response.value.error !== undefined
							? response.value.error.message
							: messageOf(response);
						setVerifies((current) => ({ ...current, [route]: { error: t("pt.verify.failed").replace("{message}", message) } }));
					},
					(error) => {
						if (alive.current !== true) return;
						setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), verifying: false } }));
						setVerifies((current) => ({ ...current, [route]: { error: t("pt.verify.failed").replace("{message}", error instanceof Error ? error.message : String(error)) } }));
					},
				);
			};

			/**
			 * The single confirmation: write exactly what the table shows — every
			 * reviewed capacity, every verified level set, each model's measured
			 * capabilities, the chosen reasoning default, and (when asked) the
			 * route's other chat models.
			 */
			const onConfirm = (route) => {
				const view = state.view;
				const llmView = viewOf(view === undefined ? undefined : view.namespaces, LLM_NS);
				const probe = probes[route];
				if (llmView === undefined || probe === undefined || probe.result === undefined) return;
				const profile = providersOf(llmView)[route];
				const configured = isRecord(profile) && Array.isArray(profile.models) ? profile.models.filter(isRecord) : [];
				const verify = verifies[route] !== undefined && verifies[route].result !== undefined ? verifies[route].result.models : undefined;
				const verified = Array.isArray(verify)
					? Object.fromEntries(verify
						.filter((model) => isRecord(model) && typeof model.id === "string")
						.map((model) => [model.id, model]))
					: {};
				const rows = mergeModels(configured, probe.result.models ?? [], includeNew, {
					verified,
					allowUnverified,
					edits: edits[route] ?? {},
					defaults: defaultsOf(view.namespaces, probe),
				}).map(sanitize);
				const ops = [{ op: "set", path: ["providers", route, "models"], value: rows }];
				// Any verified model that refuses the developer role breaks every
				// reasoning request; write the compat fix once for the whole route.
				if (Array.isArray(verify) && verify.some((model) => isRecord(model) && isRecord(model.capabilities) && model.capabilities.developerRole === "unsupported")) {
					ops.push({ op: "set", path: ["providers", route, "compat", "supportsDeveloperRole"], value: false });
				}
				const choice = text(reasoningChoice[route], "");
				if (choice !== "") {
					ops.push({ op: "set", path: ["providers", route, "reasoning"], value: choice });
				}
				setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), confirming: true, confirmed: undefined } }));
				settings.mutate(LLM_NS, ops, llmView.revision).then(
					(response) => {
						if (alive.current !== true) return;
						if (response.ok) {
							setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), confirming: false, confirmed: rows.length } }));
							setEdits((current) => ({ ...current, [route]: {} }));
							load();
							return;
						}
						const message = response.error !== undefined && response.error.code === "settings/conflict"
							? t("pt.conflict")
							: t("pt.failed").replace("{message}", messageOf(response));
						setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), confirming: false, error: message } }));
						load();
					},
					(error) => {
						if (alive.current !== true) return;
						setBusy((current) => ({ ...current, [route]: { ...(current[route] ?? {}), confirming: false, error: error instanceof Error ? error.message : String(error) } }));
					},
				);
			};

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

			const view = state.view;
			const llmView = viewOf(view.namespaces, LLM_NS);
			const fromSettings = providersOf(llmView);
			const live = new Set((state.overview !== undefined && Array.isArray(state.overview.live) ? state.overview.live : []).map((entry) => entry.id));
			const rows = state.overview !== undefined && Array.isArray(state.overview.providers) && state.overview.providers.length > 0
				? state.overview.providers
				: Object.keys(fromSettings).map((route) => ({
					route,
					displayName: text(fromSettings[route].displayName, route),
					api: text(fromSettings[route].api, ""),
					baseURL: text(fromSettings[route].baseURL, ""),
					host: "",
					apiKeyEnv: "",
					declaredModels: Array.isArray(fromSettings[route].models) ? fromSettings[route].models : undefined,
				}));

			const writable = view.writable !== false;
			const body = rows.length === 0
				? e("div", { className: styles.sub }, t("pt.empty"))
				: rows.map((provider) => e(ProviderBlock, {
					key: provider.route,
					provider,
					live: live.has(provider.route),
					probe: probes[provider.route],
					verify: verifies[provider.route],
					draft: drafts[provider.route] ?? { host: "", skipProxy: false, tls: "verify", caFile: "", caPem: "", certFile: "", keyFile: "" },
					defaults: defaultsOf(view.namespaces, probes[provider.route]),
					edits: edits[provider.route] ?? {},
					selected: selected[provider.route] ?? {},
					reasoningChoice: text(reasoningChoice[provider.route], ""),
					busy: busy[provider.route] ?? {},
					auto: autoState[provider.route],
					allowUnverified,
					includeNew,
					onProbe, onVerify, onConfirm, onDraft, onSave, t,
					onAllowUnverified: setAllowUnverified,
					onIncludeNew: setIncludeNew,
					onEdit,
					onToggle,
					onReasoningChoice,
				}));

			return e("div", { className: styles.root }, head, description,
				state.failure === undefined ? null : e("div", { className: styles.error }, state.failure),
				writable ? null : e("div", { className: styles.error }, t("pt.readOnly")),
				body,
				e(DefaultsEditor, {
					draft: defaultsDraft,
					onChange: (patch) => { setDefaultsDraft((current) => ({ ...current, ...patch, dirty: true, status: undefined, message: undefined })); },
					onSave: onSaveDefaults,
					t,
				}),
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
			const callVerify = (route) => rpc("providerToolkit/verifyReasoning", { request: { route } });
			const onDocumentUpdated = (listener) => {
				try {
					return ctx.remote.$on("settings/document-updated", (ns) => {
						if (ns === LLM_NS || ns === TOOLKIT_NS) listener();
					});
				} catch {
					return () => {};
				}
			};

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
			SHIPPED_DEFAULTS,
		};
		return module.exports;
	}
});
