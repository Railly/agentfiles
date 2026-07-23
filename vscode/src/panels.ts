import type { SkillItem, ConversationItem } from "../../src/types";

interface ToolInfo { id: string; name: string; color: string }

interface SkillkitData {
	available: boolean;
	stats: {
		total_invocations: number;
		unique_skills: number;
		most_active_day: string;
		streak?: { current: number; longest: number };
		velocity?: { this_week: number; last_week: number; change_pct: number };
		top_skills: { name: string; total: number; daily: { date: string; count: number }[] }[];
		period: { days: number };
	} | null;
	health: {
		installed: number;
		usage: { used_30d: number; unused_30d: number; never_used: string[] };
		metadata: { total_chars: number; budget: number; pct: number };
	} | null;
	burn: {
		agent: string;
		cost: { total: number };
		period: { days: number; sessions: number; api_calls: number };
		by_day: { date: string; costUsd: number }[];
		by_model: { model: string; apiCalls: number; costUsd: number }[];
	} | null;
	context: {
		always_loaded: { total_tokens: number; claude_md_tokens: number; skill_metadata_tokens: number; memory_tokens: number };
		session_estimate: { with_cache: number; without_cache: number; savings_pct: number };
	} | null;
}

const SVG: Record<string, { vb: string; p: string }> = {
	"claude-code": { vb: "0 0 24 24", p: '<path d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z" fill="currentColor"/>' },
	cursor: { vb: "0 0 466.73 532.09", p: '<path d="M457.43 125.94 244.42 2.96a22.127 22.127 0 0 0-22.12 0L9.3 125.94C3.55 129.26 0 135.4 0 142.05v247.99c0 6.65 3.55 12.79 9.3 16.11l213.01 122.98a22.127 22.127 0 0 0 22.12 0l213.01-122.98c5.75-3.32 9.3-9.46 9.3-16.11V142.05c0-6.65-3.55-12.79-9.3-16.11h-.01Zm-13.38 26.05L238.42 508.15c-1.39 2.4-5.06 1.42-5.06-1.36V273.58c0-4.66-2.49-8.97-6.53-11.31L24.87 145.67c-2.4-1.39-1.42-5.06 1.36-5.06h411.26c5.84 0 9.49 6.33 6.57 11.39h-.01Z" fill="currentColor"/>' },
	windsurf: { vb: "0 0 24 24", p: '<path d="M23.55 5.067c-1.2038-.002-2.1806.973-2.1806 2.1765v4.8676c0 .972-.8035 1.7594-1.7597 1.7594-.568 0-1.1352-.286-1.4718-.7659l-4.9713-7.1003c-.4125-.5896-1.0837-.941-1.8103-.941-1.1334 0-2.1533.9635-2.1533 2.153v4.8957c0 .972-.7969 1.7594-1.7596 1.7594-.57 0-1.1363-.286-1.4728-.7658L.4076 5.1598C.2822 4.9798 0 5.0688 0 5.2882v4.2452c0 .2147.0656.4228.1884.599l5.4748 7.8183c.3234.462.8006.8052 1.3509.9298 1.3771.313 2.6446-.747 2.6446-2.0977v-4.893c0-.972.7875-1.7593 1.7596-1.7593h.003a1.798 1.798 0 0 1 1.4718.7658l4.9723 7.0994c.4135.5905 1.05.941 1.8093.941 1.1587 0 2.1515-.9645 2.1515-2.153v-4.8948c0-.972.7875-1.7594 1.7596-1.7594h.194a.22.22 0 0 0 .2204-.2202v-4.622a.22.22 0 0 0-.2203-.2203Z" fill="currentColor"/>' },
	codex: { vb: "0 0 24 24", p: '<path d="M8.086.457a6.105 6.105 0 013.046-.415c1.333.153 2.521.72 3.564 1.7a.117.117 0 00.107.029c1.408-.346 2.762-.224 4.061.366l.063.03.154.076c1.357.703 2.33 1.77 2.918 3.198.278.679.418 1.388.421 2.126a5.655 5.655 0 01-.18 1.631.167.167 0 00.04.155 5.982 5.982 0 011.578 2.891c.385 1.901-.01 3.615-1.183 5.14l-.182.22a6.063 6.063 0 01-2.934 1.851.162.162 0 00-.108.102c-.255.736-.511 1.364-.987 1.992-1.199 1.582-2.962 2.462-4.948 2.451-1.583-.008-2.986-.587-4.21-1.736a.145.145 0 00-.14-.032c-.518.167-1.04.191-1.604.185a5.924 5.924 0 01-2.595-.622 6.058 6.058 0 01-2.146-1.781c-.203-.269-.404-.522-.551-.821a7.74 7.74 0 01-.495-1.283 6.11 6.11 0 01-.017-3.064.166.166 0 00.008-.074.115.115 0 00-.037-.064 5.958 5.958 0 01-1.38-2.202 5.196 5.196 0 01-.333-1.589 6.915 6.915 0 01.188-2.132c.45-1.484 1.309-2.648 2.577-3.493.282-.188.55-.334.802-.438.286-.12.573-.22.861-.304a.129.129 0 00.087-.087A6.016 6.016 0 015.635 2.31C6.315 1.464 7.132.846 8.086.457z" fill="currentColor"/>' },
	copilot: { vb: "0 0 24 24", p: '<path d="M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Z" fill="currentColor"/>' },
	amp: { vb: "0 0 21 21", p: '<path d="M3.769 18.302l4.73-4.797 1.72 6.535 2.5-.684-2.49-9.489-9.338-2.529-.665 2.555 6.425 1.746-4.71 4.789 1.828 1.874z" fill="currentColor"/><path d="M17.407 12.741l2.5-.683-2.49-9.489-9.339-2.529-.664 2.555 7.885 2.142 2.108 8.004z" fill="currentColor"/><path d="M13.818 16.388l2.5-.684-2.49-9.488-9.339-2.53-.664 2.556 7.885 2.142 2.108 8.004z" fill="currentColor"/>' },
	opencode: { vb: "0 0 24 36", p: '<path d="M18 30H6V18H18V30Z" fill="currentColor" opacity="0.4"/><path d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z" fill="currentColor" opacity="0.6"/>' },
	"claude-desktop": { vb: "0 0 256 257", p: '<path d="m50.228 170.321 50.357-28.257.843-2.463-.843-1.361h-2.462l-8.426-.518-28.775-.778-24.952-1.037-24.175-1.296-6.092-1.297L0 125.796l.583-3.759 5.12-3.434 7.324.648 16.202 1.101 24.304 1.685 17.629 1.037 26.118 2.722h4.148l.583-1.685-1.426-1.037-1.101-1.037-25.147-17.045-27.22-18.017-14.258-10.37-7.713-5.25-3.888-4.925-1.685-10.758 7-7.713 9.397.649 2.398.648 9.527 7.323 20.35 15.75L94.817 91.9l3.889 3.24 1.555-1.102.195-.777-1.75-2.917-14.453-26.118-15.425-26.572-6.87-11.018-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0 82.05 1.426l4.472 3.888 6.61 15.101 10.694 23.786 16.591 32.34 4.861 9.592 2.592 8.879.973 2.722h1.685v-1.556l1.36-18.211 2.528-22.36 2.463-28.776.843-8.1 4.018-9.722 7.971-5.25 6.222 2.981 5.12 7.324-.713 4.73-3.046 19.768-5.962 30.98-3.889 20.739h2.268l2.593-2.593 10.499-13.934 17.628-22.036 7.778-8.749 9.073-9.657 5.833-4.601h11.018l8.1 12.055-3.628 12.443-11.342 14.388-9.398 12.184-13.48 18.147-8.426 14.518.778 1.166 2.01-.194 30.46-6.481 16.462-2.982 19.637-3.37 8.88 4.148.971 4.213-3.5 8.62-20.998 5.184-24.628 4.926-36.682 8.685-.454.324.519.648 16.526 1.555 7.065.389h17.304l32.21 2.398 8.426 5.574 5.055 6.805-.843 5.184-12.962 6.611-17.498-4.148-40.83-9.721-14-3.5h-1.944v1.167l11.666 11.406 21.387 19.314 26.767 24.887 1.36 6.157-3.434 4.86-3.63-.518-23.526-17.693-9.073-7.972-20.545-17.304h-1.36v1.814l4.73 6.935 25.017 37.59 1.296 11.536-1.814 3.76-6.481 2.268-7.13-1.297-14.647-20.544-15.1-23.138-12.185-20.739-1.49.843-7.194 77.448-3.37 3.953-7.778 2.981-6.48-4.925-3.436-7.972 3.435-15.749 4.148-20.544 3.37-16.333 3.046-20.285 1.815-6.74-.13-.454-1.49.194-15.295 20.999-23.267 31.433-18.406 19.702-4.407 1.75-7.648-3.954.713-7.064 4.277-6.286 25.47-32.405 15.36-20.092 9.917-11.6-.065-1.686h-.583L44.07 198.125l-12.055 1.555-5.185-4.86.648-7.972 2.463-2.593 20.35-13.999Z" fill="currentColor"/>' },
	"global-agents": { vb: "0 0 24 24", p: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>' },
	antigravity: { vb: "0 0 112 96", p: '<path d="M89.7 93.7c4.667 3.5 11.667 1.167 5.25-5.25C75.7 69.778 79.783 18.445 55.866 18.445S36.033 69.778 16.783 88.445c-7 7-.417 8.75 4.25 5.25 18.083-12.25 16.916-33.834 33.833-33.834s16.834 21.584 34.834 33.834z" fill="currentColor"/>' },
	"gemini-cli": { vb: "0 0 24 24", p: '<path d="M11.538.392C11.722-.1 12.434-.093 12.608.407l.486 1.412A14.956 14.956 0 0022.135 10.9l1.569.569c.5.181.501.887.002 1.069l-1.573.576A14.953 14.953 0 0013.24 22.01l-.616 1.677c-.182.496-.884.497-1.068.002l-.643-1.731A14.953 14.953 0 002.05 13.127l-1.601-.588c-.496-.182-.497-.883-.002-1.067l1.633-.607A14.955 14.955 0 0010.895 2.14l.643-1.739v-.01z" fill="currentColor"/>' },
	aider: { vb: "0 0 24 24", p: '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' },
	pi: { vb: "0 0 24 24", p: '<path d="M7 7h10M9 7v10M15 7v6a4 4 0 01-4 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>' },
};

function e(s: string): string { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function fd(ts: string): string { if (!ts) return ""; try { const d = Date.now() - new Date(ts).getTime(); const m = Math.floor(d / 60000); if (m < 60) return m + "m"; const h = Math.floor(m / 60); if (h < 24) return h + "h"; return Math.floor(h / 24) + "d"; } catch { return ""; } }
function fn(n: number): string { return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n); }
function tsvg(id: string, sz = 14): string { const d = SVG[id]; return d ? `<svg viewBox="${d.vb}" width="${sz}" height="${sz}" style="display:inline-block;vertical-align:middle">${d.p}</svg>` : ""; }

const BASE_CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:var(--vscode-font-family); font-size:12px; color:var(--vscode-foreground); background:var(--vscode-editor-background); }
.si { width:100%; background:var(--vscode-input-background); border:1px solid var(--vscode-input-border,var(--vscode-panel-border)); color:var(--vscode-foreground); padding:5px 8px; border-radius:4px; font-size:12px; margin-bottom:6px; }
.si:focus { outline:1px solid var(--vscode-focusBorder); }
.fb { display:inline-flex; align-items:center; gap:4px; background:none; border:1px solid var(--vscode-panel-border); color:var(--vscode-descriptionForeground); padding:3px 8px; border-radius:12px; font-size:10px; cursor:pointer; margin:0 3px 4px 0; }
.fb:hover { color:var(--vscode-foreground); border-color:var(--vscode-foreground); }
.fb.on { background:var(--vscode-focusBorder); color:var(--vscode-button-foreground); border-color:var(--vscode-focusBorder); }
.card { padding:6px 8px; border-radius:4px; cursor:pointer; border-bottom:1px solid var(--vscode-panel-border); }
.card:hover { background:var(--vscode-list-hoverBackground); }
.card:last-child { border-bottom:none; }
.card-name { font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.card-desc { color:var(--vscode-descriptionForeground); font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:1px; }
.card-meta { display:flex; gap:4px; align-items:center; margin-top:2px; flex-wrap:wrap; }
.badge { font-size:9px; font-weight:600; text-transform:uppercase; padding:1px 5px; border-radius:3px; background:var(--vscode-badge-background); color:var(--vscode-badge-foreground); }
.dot { display:inline-block; width:8px; height:8px; border-radius:50%; }
.muted { color:var(--vscode-descriptionForeground); }
.st { padding:10px; border:1px solid var(--vscode-panel-border); border-radius:6px; }
.sv { font-size:20px; font-weight:700; }
.sl { font-size:10px; color:var(--vscode-descriptionForeground); margin-top:2px; }
.ds { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--vscode-descriptionForeground); margin-bottom:6px; margin-top:12px; }
.ds:first-child { margin-top:0; }
.ov { position:fixed; inset:0; background:var(--vscode-editor-background); z-index:200; display:none; flex-direction:column; }
.ov.on { display:flex; }
.ov-bar { flex-shrink:0; padding:8px; border-bottom:1px solid var(--vscode-panel-border); }
.ov-body { flex:1; overflow-y:auto; padding:8px; }
.tb { background:none; border:none; color:var(--vscode-foreground); cursor:pointer; padding:3px 6px; border-radius:4px; font-size:13px; display:inline-flex; align-items:center; }
.tb:hover { background:var(--vscode-list-hoverBackground); }
.empty { text-align:center; padding:24px; color:var(--vscode-descriptionForeground); font-size:11px; }
.msg { padding:8px; border-radius:6px; margin-bottom:4px; font-size:11px; line-height:1.5; }
.msg-h { background:var(--vscode-input-background); }
.msg-a { border:1px solid var(--vscode-panel-border); }
.msg-r { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; margin-bottom:3px; }
.msg-h .msg-r { color:var(--vscode-focusBorder); }
.msg-a .msg-r { color:#4caf50; }
.msg-t { white-space:pre-wrap; word-break:break-word; max-height:200px; overflow-y:auto; }
.msg-tc { display:flex; flex-wrap:wrap; gap:3px; margin-top:4px; }
.msg-tc span { font-size:9px; background:var(--vscode-badge-background); color:var(--vscode-badge-foreground); padding:1px 4px; border-radius:2px; }
.bar-row { display:flex; align-items:center; gap:6px; padding:2px 0; font-size:11px; }
.bar-name { width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex-shrink:0; }
.bar-wrap { flex:1; height:12px; background:var(--vscode-input-background); border-radius:3px; overflow:hidden; }
.bar-fill { height:100%; background:var(--vscode-focusBorder); border-radius:3px; }
.bar-count { width:28px; text-align:right; color:var(--vscode-descriptionForeground); font-size:10px; }
.installed { font-size:9px; padding:1px 5px; border-radius:3px; background:#4caf5020; color:#4caf50; }
`;

const SHARED_JS = `const V=acquireVsCodeApi();const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);const E=s=>{const d=document.createElement('div');d.textContent=s;return d.innerHTML};const D=ts=>{if(!ts)return'';try{const d=Date.now()-new Date(ts).getTime(),m=Math.floor(d/60000);if(m<60)return m+'m';const h=Math.floor(m/60);if(h<24)return h+'h';return Math.floor(h/24)+'d'}catch{return''}};const IC={back:'<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M7 3l-5 5 5 5v-3h6V6H7V3z"/><\\/svg>',star:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.3l2 4.1 4.5.7-3.3 3.2.8 4.5L8 11.6l-4 2.2.8-4.5L1.5 6.1 6 5.4z"/><\\/svg>',starO:'<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M8 1.3l2 4.1 4.5.7-3.3 3.2.8 4.5L8 11.6l-4 2.2.8-4.5L1.5 6.1 6 5.4z"/><\\/svg>',folder:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 3h5l1.5 1.5H15v9H1V3zm1 1v8h12V5.5H7.1L5.6 4H2z"/><\\/svg>',terminal:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v12H1V2zm1 1v10h12V3H2zm2.5 3L6 4.5 7.5 6 6 7.5 4.5 6zM8 8h4v1H8V8z"/><\\/svg>',save:'<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M13 1H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm-1 2v4H4V3h8zm1 10H3V8h10v5z"/><\\/svg>'};`;

function escScript(s: string): string {
	// Escape all </ sequences inside JS strings to prevent HTML parser from closing script tag
	return s.replace(/<\//g, "<\\/");
}

function wrap(nonce: string, body: string, script: string, extraCss = ""): string {
	const safeScript = escScript(script);
	return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"><style>${BASE_CSS}${extraCss}</style></head><body>${body}<script nonce="${nonce}">${SHARED_JS}${safeScript}<\/script></body></html>`;
}

// ── Library Panel ──
export function libraryHtml(skills: SkillItem[], tools: ToolInfo[], nonce: string): string {
	const tc = new Map<string, number>();
	for (const s of skills) for (const t of s.tools) tc.set(t, (tc.get(t) || 0) + 1);
	const yc = new Map<string, number>();
	for (const s of skills) yc.set(s.type, (yc.get(s.type) || 0) + 1);
	const colors = Object.fromEntries(tools.map((t) => [t.id, t.color]));

	const TYPE_ICON: Record<string, string> = {
		skill: '<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2 3h3l-2.5 2.5L11.5 10 8 8l-3.5 2 1-3.5L3 4h3l2-3z"/></svg>',
		command: '<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="3" width="14" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 6l2 2-2 2M8.5 10h3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>',
		agent: '<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3.5 14c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
		rule: '<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h8l-1 12H5L4 2z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
		memory: '<svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" fill="none" stroke-width="1.2"/><path d="M6 1v2m4-2v2M6 13v2m4-2v2M1 6h2m10 0h2M1 10h2m10 0h2" stroke="currentColor" stroke-width="1"/></svg>',
	};

	const chips = tools.filter((t) => (tc.get(t.id) || 0) > 0)
		.map((t) => `<button class="fb" data-k="tool" data-v="${t.id}">${tsvg(t.id, 12)} ${t.name} <span class="muted" style="font-size:10px">${tc.get(t.id)}</span></button>`).join("")
		+ Array.from(yc.entries()).map(([type, count]) => {
			const icon = TYPE_ICON[type] || "";
			return `<button class="fb" data-k="type" data-v="${type}">${icon} <span style="font-size:9px;font-weight:600;text-transform:uppercase">${type}</span> <span class="muted" style="font-size:10px">${count}</span></button>`;
		}).join("");

	const sorted = [...skills].sort((a, b) => a.name.localeCompare(b.name));
	const cards = sorted.map((s) => {
		const dots = s.tools.map((t) => `<span class="dot" style="background:${colors[t] || "#888"}"></span>`).join("");
		const typeIcon = TYPE_ICON[s.type] || "";
		const typeBadge = `<span style="display:inline-flex;align-items:center;gap:2px;font-size:9px;font-weight:500;text-transform:uppercase;padding:1px 5px;border-radius:3px;color:var(--vscode-descriptionForeground);opacity:0.7">${typeIcon} ${s.type}</span>`;
		const usage = (s as SkillItem & { usage?: { uses: number; isStale: boolean; isHeavy: boolean } }).usage;
		const usageBadge = usage && usage.uses > 0 ? `<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:var(--vscode-focusBorder);color:var(--vscode-button-foreground)">${usage.uses}</span>` : "";
		const staleBadge = usage?.isStale ? '<span style="font-size:9px;padding:1px 4px;border-radius:3px;background:#e3b34120;color:#e3b341">STALE</span>' : "";
		const heavyBadge = usage?.isHeavy ? '<span style="font-size:9px;padding:1px 4px;border-radius:3px;background:#ef444420;color:#ef4444">HEAVY</span>' : "";
		return `<div class="card" data-id="${s.id}" data-tools="${s.tools.join(",")}" data-type="${s.type}" data-n="${e(s.name.toLowerCase())}" data-d="${e((s.description || "").toLowerCase())}"><div style="display:flex;align-items:center;gap:4px"><span class="card-name">${e(s.name)}</span>${s.isFavorite ? '<span style="color:#e3b341;font-size:12px">★</span>' : ""}</div>${s.description ? `<div class="card-desc">${e(s.description.slice(0, 100))}</div>` : ""}<div class="card-meta">${typeBadge}${dots}${usageBadge}${staleBadge}${heavyBadge}</div></div>`;
	}).join("");

	const body = `<div style="padding:6px">${chips}</div><input class="si" id="ss" placeholder="Search..." style="margin:0 6px;width:calc(100% - 12px)" /><div id="sl">${cards || '<div class="empty">No skills found</div>'}</div><div class="ov" id="ov"><div class="ov-bar" id="ob"></div><div class="ov-body" id="oc"></div></div>`;

	const script = `
const TC=${JSON.stringify(colors)};
let af=null;
$$('.fb').forEach(b=>b.onclick=()=>{if(b.classList.contains('on')){b.classList.remove('on');af=null}else{$$('.fb').forEach(x=>x.classList.remove('on'));b.classList.add('on');af={k:b.dataset.k,v:b.dataset.v}}filterS()});
$('#ss').oninput=()=>filterS();
function filterS(){const q=$('#ss').value.toLowerCase();$$('#sl .card').forEach(c=>{let s=c.dataset.n.includes(q)||c.dataset.d.includes(q);if(s&&af){if(af.k==='tool')s=c.dataset.tools.split(',').includes(af.v);if(af.k==='type')s=c.dataset.type===af.v}c.style.display=s?'':'none'})}
$('#sl').onclick=ev=>{const c=ev.target.closest('.card');if(c)V.postMessage({type:'selectSkill',id:c.dataset.id})};
function closeOv(){$('#ov').classList.remove('on')}
window.addEventListener('message',ev=>{const m=ev.data;if(m.type==='showSkillDetail'){$('#ov').classList.add('on');const dots=(m.tools||[]).map(t=>'<span class="dot" style="background:'+(TC[t]||'#888')+'"></span>'+t).join(' ');$('#ob').innerHTML='<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><button class="tb" id="bk">'+IC.back+'<\\/button><span style="font-size:14px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+E(m.name)+'<\\/span><button class="tb" id="fv" data-id="'+m.id+'">'+(m.isFavorite?IC.star:IC.starO)+'<\\/button><button class="tb" id="op" data-p="'+E(m.filePath)+'">'+IC.folder+'<\\/button><\\/div><div style="font-size:11px;color:var(--vscode-descriptionForeground)">'+((m.fileSize/1024).toFixed(1))+' KB · '+(m.content||'').length+' chars · <span class="badge">'+(m.skillType||'skill')+'<\\/span><\\/div>';let b='';if(m.frontmatter&&Object.keys(m.frontmatter).length>0){b+='<div style="margin-bottom:12px">';for(const[k,v]of Object.entries(m.frontmatter)){b+='<div style="display:flex;gap:8px;padding:3px 0;font-size:11px;border-bottom:1px solid var(--vscode-panel-border)"><span style="font-family:var(--vscode-editor-font-family);font-weight:600;min-width:70px;flex-shrink:0">'+E(k)+'<\\/span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+E(String(v).slice(0,200))+'<\\/span><\\/div>'}b+='<\\/div>'}b+='<pre style="white-space:pre-wrap;font-family:var(--vscode-editor-font-family);font-size:11px;line-height:1.6;background:var(--vscode-textCodeBlock-background);padding:10px;border-radius:6px;overflow-y:auto">'+E(m.content||'')+'<\\/pre>';$('#oc').innerHTML=b;$('#bk').onclick=closeOv;const fv=$('#fv');if(fv)fv.onclick=()=>V.postMessage({type:'toggleFavorite',id:fv.dataset.id});const op=$('#op');if(op)op.onclick=()=>V.postMessage({type:'openFile',path:op.dataset.p})}});`;

	return wrap(nonce, body, script);
}

// ── Sessions Panel ──
export function sessionsHtml(conversations: ConversationItem[], nonce: string): string {
	const sorted = [...conversations].sort((a, b) => (b.lastTimestamp || "").localeCompare(a.lastTimestamp || "")).slice(0, 100);
	const cards = sorted.map((c) =>
		`<div class="card" data-uuid="${c.uuid}" data-t="${e((c.title + " " + c.project).toLowerCase())}"><div style="display:flex;gap:4px;align-items:center"><span class="badge">${e(c.project)}</span><span class="muted" style="font-size:10px;margin-left:auto">${c.messageCount} msgs · ${fd(c.lastTimestamp)}</span></div><div style="font-size:11px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e(c.title.slice(0, 100))}</div></div>`,
	).join("");

	const body = `<input class="si" id="cs" placeholder="Search sessions..." style="margin:6px;width:calc(100% - 12px)" /><div id="cl">${cards || '<div class="empty">No sessions found</div>'}</div><div class="ov" id="ov"><div class="ov-bar" id="ob"></div><div class="ov-body" id="oc"></div></div>`;

	const script = `
$('#cs').oninput=()=>{const q=$('#cs').value.toLowerCase();$$('#cl .card').forEach(c=>{c.style.display=c.dataset.t.includes(q)?'':'none'})};
$('#cl').onclick=ev=>{const c=ev.target.closest('.card');if(c)V.postMessage({type:'selectConversation',id:c.dataset.uuid})};
function closeOv(){$('#ov').classList.remove('on')}
window.addEventListener('message',ev=>{const m=ev.data;if(m.type==='showConvDetail'){$('#ov').classList.add('on');$('#ob').innerHTML='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><button class="tb" id="bk">'+IC.back+'<\\/button><span style="font-size:13px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+E((m.title||'').slice(0,80))+'<\\/span><button class="tb" id="cr" data-u="'+m.uuid+'">'+IC.terminal+'<\\/button><button class="tb" id="sv" data-u="'+m.uuid+'">'+IC.save+'<\\/button><\\/div><div style="font-size:11px;color:var(--vscode-descriptionForeground)">'+E(m.project)+' · '+m.messageCount+' msgs<\\/div>';$('#bk').onclick=closeOv;$('#cr').onclick=()=>V.postMessage({type:'copyResumeCmd',uuid:m.uuid});$('#sv').onclick=()=>V.postMessage({type:'saveToVault',uuid:m.uuid});const msgs=m.messages||[];const P=20;let sh=P;function ren(){let h='';for(const x of msgs.slice(0,sh)){const cl=x.role==='human'?'msg-h':'msg-a';const lb=x.role==='human'?'You':'Assistant';const tx=(x.text||'').slice(0,2000);const tr=(x.text||'').length>2000?'...(truncated)':'';const tc=(x.toolCalls||[]).slice(0,5).map(t=>'<span>'+E(t)+'<\\/span>').join('');h+='<div class="msg '+cl+'"><div class="msg-r">'+lb+'<\\/div><div class="msg-t">'+E(tx)+tr+'<\\/div>'+(tc?'<div class="msg-tc">'+tc+'<\\/div>':'')+'<\\/div>'}if(sh<msgs.length)h+='<div style="text-align:center;padding:8px"><button class="tb" style="border:1px solid var(--vscode-panel-border);padding:4px 12px" id="sm">More ('+Math.min(P,msgs.length-sh)+')<\\/button><\\/div>';h+='<div style="margin-top:12px;padding:8px;background:var(--vscode-textCodeBlock-background);border-radius:4px;font-family:var(--vscode-editor-font-family);font-size:11px;cursor:pointer" onclick="V.postMessage({type:\\'copyResumeCmd\\',uuid:\\''+m.uuid+'\\'})">claude --resume '+m.uuid+'<\\/div>';$('#oc').innerHTML=h;const sm=$('#sm');if(sm)sm.onclick=()=>{sh+=P;ren()}}ren()}});`;

	return wrap(nonce, body, script);
}

// ── Dashboard Panel ──
export function dashboardHtml(skills: SkillItem[], conversations: ConversationItem[], tools: ToolInfo[], sk: SkillkitData, nonce: string): string {
	const tc = new Map<string, number>();
	for (const s of skills) for (const t of s.tools) tc.set(t, (tc.get(t) || 0) + 1);
	const yc = new Map<string, number>();
	for (const s of skills) yc.set(s.type, (yc.get(s.type) || 0) + 1);
	const totalMsgs = conversations.reduce((s2, c) => s2 + c.messageCount, 0);

	let h = `<div style="padding:8px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px">
<div class="st"><div class="sv">${skills.length}</div><div class="sl">Skills</div></div>
<div class="st"><div class="sv">${tools.length}</div><div class="sl">Tools</div></div>
<div class="st"><div class="sv">${conversations.length}</div><div class="sl">Sessions</div></div>
<div class="st"><div class="sv">${fn(totalMsgs)}</div><div class="sl">Messages</div></div></div>`;

	if (sk.available && sk.stats) {
		const s = sk.stats;
		h += `<div class="ds">Usage (${s.period.days}d)</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px"><div class="st"><div class="sv">${s.total_invocations}</div><div class="sl">invocations</div></div><div class="st"><div class="sv">${s.unique_skills}</div><div class="sl">active</div></div></div>`;
		if (s.top_skills.length > 0) {
			const mx = s.top_skills[0].total || 1;
			h += `<div class="ds">Top Skills</div>`;
			for (const sk2 of s.top_skills.slice(0, 10)) {
				h += `<div class="bar-row"><span class="bar-name">${e(sk2.name)}</span><div class="bar-wrap"><div class="bar-fill" style="width:${(sk2.total / mx) * 100}%"></div></div><span class="bar-count">${sk2.total}</span></div>`;
			}
		}
	}

	if (sk.available && sk.health) {
		const hp = sk.health;
		h += `<div class="ds">Health</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px"><div class="st"><div class="sv">${hp.usage.used_30d}</div><div class="sl">Active</div></div><div class="st"><div class="sv">${hp.usage.unused_30d}</div><div class="sl">Stale</div></div></div><div style="font-size:10px;margin-bottom:3px" class="muted">Budget: ${hp.metadata.pct}%</div><div style="height:6px;background:var(--vscode-input-background);border-radius:3px;overflow:hidden;margin-bottom:8px"><div style="height:100%;width:${hp.metadata.pct}%;background:${hp.metadata.pct > 80 ? "#f44336" : hp.metadata.pct > 50 ? "#e3b341" : "#4caf50"};border-radius:3px"></div></div>`;
	}

	if (sk.available && sk.burn) {
		const b = sk.burn;
		h += `<div class="ds">Burn Rate (${b.period.days}d)</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px"><div class="st"><div class="sv">$${Math.round(b.cost.total)}</div><div class="sl">total</div></div><div class="st"><div class="sv">$${Math.round(b.cost.total / (b.period.days || 1))}</div><div class="sl">daily avg</div></div></div>`;
		if (b.by_model.length > 0) {
			for (const m of b.by_model.slice(0, 4)) {
				h += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0"><span>${e(m.model)}</span><span class="muted">${m.apiCalls} calls${m.costUsd > 0 ? ` · $${Math.round(m.costUsd)}` : ""}</span></div>`;
			}
		}
	}

	if (sk.available && sk.context) {
		const cx = sk.context;
		const tot = cx.always_loaded.total_tokens || 1;
		h += `<div class="ds">Context Tax</div><div style="display:flex;height:10px;border-radius:3px;overflow:hidden;margin-bottom:6px"><div style="width:${(cx.always_loaded.claude_md_tokens / tot) * 100}%;background:#f97316"></div><div style="width:${(cx.always_loaded.skill_metadata_tokens / tot) * 100}%;background:#3b82f6"></div><div style="width:${(cx.always_loaded.memory_tokens / tot) * 100}%;background:#a855f7"></div></div><div style="font-size:10px;display:flex;flex-direction:column;gap:2px;margin-bottom:8px"><div><span class="dot" style="background:#f97316;width:6px;height:6px;margin-right:4px"></span>CLAUDE.md: ${(cx.always_loaded.claude_md_tokens / 1000).toFixed(1)}k</div><div><span class="dot" style="background:#3b82f6;width:6px;height:6px;margin-right:4px"></span>Skills: ${(cx.always_loaded.skill_metadata_tokens / 1000).toFixed(1)}k</div><div><span class="dot" style="background:#a855f7;width:6px;height:6px;margin-right:4px"></span>Memory: ${(cx.always_loaded.memory_tokens / 1000).toFixed(1)}k</div></div><div style="font-size:11px">Cached: $${cx.session_estimate.with_cache.toFixed(2)} · <span style="color:#4caf50">Saves ${cx.session_estimate.savings_pct.toFixed(0)}%</span></div>`;
	}

	// Tools
	h += `<div class="ds">Tools</div>`;
	for (const t of tools) {
		h += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px">${tsvg(t.id, 16)}<span>${t.name}</span><span style="margin-left:auto" class="muted" style="font-size:11px">${tc.get(t.id) || 0} skills</span></div>`;
	}

	// Skill types
	if (yc.size > 0) {
		const maxTC = Math.max(...Array.from(yc.values()));
		h += `<div class="ds">Skill Types</div>`;
		for (const [type, count] of Array.from(yc.entries()).sort((a, b) => b[1] - a[1])) {
			h += `<div class="bar-row"><span class="bar-name"><span class="badge">${type}</span></span><div class="bar-wrap"><div class="bar-fill" style="width:${(count / maxTC) * 100}%"></div></div><span class="bar-count">${count}</span></div>`;
		}
	}

	if (!sk.available) {
		h += `<div style="margin-top:16px;padding:12px;border:1px dashed var(--vscode-panel-border);border-radius:6px;text-align:center"><div style="font-weight:600;margin-bottom:4px">Unlock analytics</div><div style="font-size:11px;margin-bottom:8px" class="muted">Install skillkit for usage stats, burn rate, and more</div><code style="font-size:11px;background:var(--vscode-textCodeBlock-background);padding:4px 8px;border-radius:4px">npm i -g @crafter/skillkit</code></div>`;
	}

	h += "</div>";
	return wrap(nonce, h, "");
}

// ── Marketplace Panel ──
export function marketplaceHtml(nonce: string): string {
	const body = `<div style="padding:8px"><input class="si" id="ms" placeholder="Search skills on skills.sh..." /><div id="ml"><div class="empty">Loading popular skills...</div></div><div class="ov" id="ov"><div class="ov-bar" id="ob"></div><div class="ov-body" id="oc"></div></div></div>`;

	const script = `
let mt;
$('#ms').oninput=ev=>{clearTimeout(mt);mt=setTimeout(()=>{if(ev.target.value.length>=2)V.postMessage({type:'marketplaceSearch',query:ev.target.value})},300)};
function closeOv(){$('#ov').classList.remove('on')}
V.postMessage({type:'marketplaceInit'});
window.addEventListener('message',ev=>{const m=ev.data;
if(m.type==='marketplaceResults'){const el=$('#ml');if(!m.skills||m.skills.length===0){el.innerHTML='<div class="empty">No skills found<\\/div>';return}let h=m.title?'<div class="ds">'+E(m.title)+'<\\/div>':'';for(const s of m.skills){h+='<div class="card" data-src="'+E(s.source)+'" data-nm="'+E(s.name)+'" data-sid="'+(s.id||'')+'"><div style="display:flex;align-items:center;gap:4px"><span class="card-name">'+E(s.name)+'<\\/span>'+(s.installed?'<span class="installed">Installed<\\/span>':'')+'<\\/div><div class="card-desc" style="font-family:var(--vscode-editor-font-family)">'+E(s.source)+'<\\/div><div class="muted" style="font-size:10px;margin-top:2px">\\u2B07 '+s.installs+'<\\/div><\\/div>'}el.innerHTML=h;el.querySelectorAll('.card').forEach(c=>c.onclick=()=>V.postMessage({type:'marketplaceSelectSkill',source:c.dataset.src,name:c.dataset.nm,id:c.dataset.sid}))}
if(m.type==='marketplacePreview'){$('#ov').classList.add('on');$('#ob').innerHTML='<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><button class="tb" id="bk">'+IC.back+'<\\/button><span style="font-size:14px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+E(m.name)+'<\\/span>'+(m.installed?'<span class="installed">Installed<\\/span><button class="tb" style="color:var(--vscode-errorForeground)" id="un">Uninstall<\\/button>':'<button class="tb" style="background:var(--vscode-button-background);color:var(--vscode-button-foreground);border-radius:4px;padding:4px 12px" id="inst">Install<\\/button>')+'<\\/div><div class="muted" style="font-size:11px">'+E(m.source)+' · \\u2B07 '+m.installs+'<\\/div>';$('#bk').onclick=closeOv;const inst=$('#inst');if(inst)inst.onclick=()=>V.postMessage({type:'marketplaceInstall',source:m.source,name:m.name});const un=$('#un');if(un)un.onclick=()=>{if(confirm('Uninstall '+m.name+'?'))V.postMessage({type:'marketplaceUninstall',skillName:m.name})};$('#oc').innerHTML=m.content?'<pre style="white-space:pre-wrap;font-family:var(--vscode-editor-font-family);font-size:11px;line-height:1.6;background:var(--vscode-textCodeBlock-background);padding:10px;border-radius:6px;overflow-y:auto">'+E(m.content)+'<\\/pre>':'<div class="empty">Loading content...<\\/div>'}
if(m.type==='marketplaceInstallResult'&&m.success){V.postMessage({type:'marketplaceInit'})}
});`;

	return wrap(nonce, body, script);
}
