export function getStyles(): string {
  return `
body {
  font-family: var(--vscode-font-family);
  font-size: var(--vscode-font-size);
}

.as-hidden {
  display: none !important;
}

.as-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.as-panel {
  overflow-y: auto;
  height: 100%;
}

.as-panel-sidebar {
  border-bottom: 1px solid var(--vscode-panel-border);
  padding: 8px 0;
  flex-shrink: 0;
}

.as-panel-list {
  flex: 1;
  overflow-y: auto;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-panel-detail {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--vscode-editor-background);
}

/* Resize handles (not applicable in single-column, kept for compatibility) */
.as-resize-handle {
  display: none;
  width: 6px;
  background: transparent;
  cursor: col-resize;
  transition: background 0.15s;
  z-index: 1;
}

.as-resize-handle:hover,
.as-resize-handle.is-dragging {
  background: var(--vscode-focusBorder);
}

/* Sidebar / filter chips */
.as-sidebar-section {
  margin-bottom: 8px;
}

.as-sidebar-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vscode-descriptionForeground);
  padding: 4px 16px;
  margin-bottom: 2px;
}

.as-sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 16px;
  cursor: pointer;
  font-size: var(--vscode-font-size);
  color: var(--vscode-foreground);
  border-radius: 4px;
  margin: 0 4px;
}

.as-sidebar-item:hover {
  background: var(--vscode-list-hoverBackground);
}

.as-sidebar-item.is-active {
  background: var(--vscode-focusBorder);
  color: var(--vscode-button-foreground);
}

.as-sidebar-item.is-active .as-sidebar-icon {
  color: var(--vscode-button-foreground);
}

.as-sidebar-item.is-active .as-sidebar-count {
  color: var(--vscode-button-foreground);
  opacity: 0.8;
}

.as-sidebar-icon {
  display: flex;
  align-items: center;
  color: var(--vscode-descriptionForeground);
  width: 16px;
  height: 16px;
}

.as-sidebar-icon svg {
  width: 14px;
  height: 14px;
}

.as-sidebar-label {
  flex: 1;
}

.as-sidebar-count {
  font-size: 10px;
  color: var(--vscode-disabledForeground);
  min-width: 20px;
  text-align: right;
}

.as-sidebar-empty {
  font-size: 10px;
  color: var(--vscode-disabledForeground);
  padding: 4px 16px;
  font-style: italic;
}

/* Search */
.as-search {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-search-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  font-size: var(--vscode-font-size);
  outline: none;
}

.as-search-input:focus {
  border-color: var(--vscode-focusBorder);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--vscode-focusBorder) 25%, transparent);
}

/* List */
.as-list-items {
  padding: 4px;
}

.as-list-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--vscode-disabledForeground);
  font-size: var(--vscode-font-size);
}

.as-skill-card {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 2px;
}

.as-skill-card:hover {
  background: var(--vscode-list-hoverBackground);
}

.as-skill-card.is-selected {
  background: var(--vscode-list-activeSelectionBackground);
}

.as-skill-header {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.as-skill-name {
  font-size: var(--vscode-font-size);
  font-weight: 500;
  color: var(--vscode-foreground);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-skill-star {
  color: #e3b341;
  display: flex;
  align-items: center;
}

.as-skill-star svg {
  width: 12px;
  height: 12px;
}

.as-skill-desc {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  margin-top: 2px;
  line-height: 1.4;
}

.as-skill-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.as-type-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  background: var(--vscode-list-hoverBackground);
  color: var(--vscode-descriptionForeground);
  border: 1px solid var(--vscode-panel-border);
}

.as-tool-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.as-tool-badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--tool-color);
}

.as-tool-badge {
  color: var(--tool-color);
}

.as-tool-svg {
  display: block;
}

.as-tool-name-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--vscode-font-size);
  padding: 2px 8px;
  border: 1px solid var(--tool-color);
  border-radius: 10px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--tool-color);
  flex-shrink: 0;
}

/* Detail — toolbar */
.as-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.as-detail-toolbar {
  padding: 10px 16px 8px;
  border-bottom: 1px solid var(--vscode-panel-border);
  flex-shrink: 0;
  -webkit-user-select: text;
  user-select: text;
}

.as-toolbar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.as-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.as-detail-title {
  font-size: var(--vscode-font-size);
  font-weight: 600;
  color: var(--vscode-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-toolbar-right {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.as-toolbar-btn {
  background: none;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  color: var(--vscode-descriptionForeground);
  display: flex;
  align-items: center;
}

.as-toolbar-btn:hover {
  background: var(--vscode-list-hoverBackground);
  color: var(--vscode-foreground);
}

.as-toolbar-btn svg {
  width: 14px;
  height: 14px;
}

.as-detail-meta-bar {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.as-meta-item {
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
  background: var(--vscode-sideBar-background);
  padding: 2px 8px;
  border-radius: 4px;
}

.as-meta-type {
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 500;
}

/* Detail — empty */
.as-detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--vscode-disabledForeground);
  gap: 8px;
  font-size: var(--vscode-font-size);
}

.as-detail-empty-icon svg {
  width: 48px;
  height: 48px;
  opacity: 0.3;
}

/* Detail — frontmatter */
.as-frontmatter {
  border-bottom: 1px solid var(--vscode-panel-border);
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--vscode-sideBar-background);
}

.as-fm-prop {
  display: flex;
  align-items: baseline;
  gap: 8px;
  line-height: 1.5;
}

.as-fm-key {
  color: var(--vscode-disabledForeground);
  font-weight: 500;
  white-space: nowrap;
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-font-size);
  min-width: 80px;
}

.as-fm-key::after {
  content: ":";
}

.as-fm-value {
  color: var(--vscode-foreground);
  font-size: var(--vscode-font-size);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-fm-value-long {
  color: var(--vscode-foreground);
  font-size: var(--vscode-font-size);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Detail — body / preview */
.as-detail-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  -webkit-user-select: text;
  user-select: text;
  cursor: text;
}

.as-detail-preview {
  padding: 12px 20px;
}

.as-detail-preview pre {
  background: var(--vscode-textCodeBlock-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 12px 16px;
  overflow-x: auto;
  position: relative;
}

.as-detail-preview pre code {
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-font-size);
  color: var(--vscode-foreground);
  background: none;
  padding: 0;
  border-radius: 0;
}

.as-detail-preview code {
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-font-size);
  color: var(--vscode-foreground);
  background: var(--vscode-textCodeBlock-background);
  padding: 2px 4px;
  border-radius: 4px;
}

.as-detail-preview .copy-code-button {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 4px 8px;
  font-size: 10px;
  background: var(--vscode-list-hoverBackground);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  color: var(--vscode-descriptionForeground);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.as-detail-preview pre:hover .copy-code-button {
  opacity: 1;
}

/* Detail — editor */
.as-detail-body-editor {
  display: flex;
  flex-direction: column;
}

.as-editor-cm {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.as-editor-cm .cm-editor {
  height: 100%;
}

.as-editor-cm .cm-editor.cm-focused {
  outline: none;
}

.as-save-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-top: 1px solid var(--vscode-panel-border);
  background: var(--vscode-sideBar-background);
  flex-shrink: 0;
}

.as-save-btn {
  padding: 4px 16px;
  border-radius: 4px;
  background: var(--vscode-focusBorder);
  color: var(--vscode-button-foreground);
  border: none;
  cursor: pointer;
  font-size: var(--vscode-font-size);
  font-weight: 500;
}

.as-save-btn:hover {
  opacity: 0.9;
}

.as-save-hint {
  font-size: 10px;
  color: var(--vscode-disabledForeground);
}

/* Skillkit usage badges */
.as-usage-badge {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--vscode-focusBorder);
  color: var(--vscode-button-foreground);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.as-badge-stale {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-button-foreground);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.as-badge-heavy {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #e3b341;
  color: var(--vscode-editor-background);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Detail usage bar */
.as-detail-usage-bar {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  align-items: center;
}

.as-usage-stat {
  font-size: var(--vscode-font-size);
  color: var(--vscode-focusBorder);
  font-weight: 500;
}

/* Skillkit CTA */
.as-skillkit-cta {
  margin: 8px 8px 0;
  padding: 10px 12px;
  border-radius: 4px;
  border: 1px dashed var(--vscode-panel-border);
  background: var(--vscode-sideBar-background);
}

.as-skillkit-icon {
  color: var(--vscode-disabledForeground);
  margin-bottom: 4px;
}

.as-skillkit-icon svg {
  width: 16px;
  height: 16px;
}

.as-skillkit-title {
  font-size: var(--vscode-font-size);
  font-weight: 600;
  color: var(--vscode-foreground);
  margin-bottom: 2px;
}

.as-skillkit-desc {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  line-height: 1.4;
  margin-bottom: 6px;
}

.as-skillkit-cmd {
  margin-bottom: 4px;
}

.as-skillkit-cmd code {
  font-size: 10px;
  font-family: var(--vscode-editor-font-family);
  background: var(--vscode-textCodeBlock-background);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--vscode-foreground);
}

.as-skillkit-link {
  font-size: 10px;
  color: var(--vscode-textLink-foreground);
  cursor: pointer;
  text-decoration: none;
}

.as-skillkit-link:hover {
  text-decoration: underline;
}

/* Dashboard panel — full width in single-column layout */
.as-panel-dashboard {
  overflow-y: auto;
  padding: 12px 16px 20px;
  container-type: inline-size;
}

.as-dash-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 12px;
}

.as-dash-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--vscode-panel-border);
  border-top-color: var(--vscode-focusBorder);
  border-radius: 50%;
  animation: as-spin 0.6s linear infinite;
}

@keyframes as-spin {
  to { transform: rotate(360deg); }
}

.as-dash-loading-text {
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
}

.as-dash-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
}

.as-dash-empty-icon svg {
  width: 48px;
  height: 48px;
  opacity: 0.3;
  margin-bottom: 12px;
}

.as-dash-empty h3 {
  margin: 0 0 4px;
  color: var(--vscode-foreground);
}

.as-dash-empty p {
  margin: 0 0 12px;
  font-size: var(--vscode-font-size);
}

.as-dash-install-cmd {
  margin-bottom: 8px;
}

.as-dash-install-cmd code {
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-font-size);
  background: var(--vscode-textCodeBlock-background);
  padding: 4px 10px;
  border-radius: 4px;
}

/* Dashboard layout — 2-column grid, collapses at narrow widths */
.as-dash-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@container (max-width: 400px) {
  .as-dash-row {
    grid-template-columns: 1fr;
  }
  .as-dash-stats {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

/* Dashboard sections */
.as-dash-section {
  margin-bottom: 24px;
}

.as-dash-title {
  font-size: var(--vscode-font-size);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 10px;
}

/* Stat cards — 2-column grid in VSCode sidebar */
.as-dash-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.as-dash-stats-sm {
  grid-template-columns: repeat(2, 1fr);
}

.as-stat-card {
  background: var(--vscode-sideBar-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.as-stat-icon {
  color: var(--vscode-disabledForeground);
  margin-bottom: 4px;
}

.as-stat-icon svg {
  width: 16px;
  height: 16px;
}

.as-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--vscode-foreground);
  font-variant-numeric: tabular-nums;
}

.as-stat-label {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  margin-top: 2px;
}

/* Bar chart */
.as-dash-bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.as-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.as-bar-name {
  font-size: var(--vscode-font-size);
  color: var(--vscode-foreground);
  width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--vscode-editor-font-family);
}

.as-bar-wrap {
  flex: 1;
  height: 16px;
  background: var(--vscode-sideBar-background);
  border-radius: 4px;
  overflow: hidden;
}

.as-bar-fill {
  height: 100%;
  width: var(--bar-w, 0%);
  background: var(--vscode-focusBorder);
  border-radius: 4px;
  min-width: 2px;
  transition: width 0.3s;
}

.as-bar-count {
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
  width: 32px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Health donut */
.as-dash-health-row {
  display: flex;
  gap: 20px;
  align-items: center;
}

.as-donut {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(
    var(--vscode-focusBorder) calc(var(--pct) * 1%),
    var(--vscode-panel-border) calc(var(--pct) * 1%)
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}

.as-donut::before {
  content: "";
  position: absolute;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--vscode-editor-background);
}

.as-donut-label {
  font-size: 16px;
  font-weight: 700;
  color: var(--vscode-foreground);
  position: relative;
  z-index: 1;
}

.as-donut-sub {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  position: relative;
  z-index: 1;
}

.as-health-details {
  flex: 1;
}

.as-health-line {
  font-size: var(--vscode-font-size);
  color: var(--vscode-foreground);
  margin-bottom: 4px;
}

.as-health-warn {
  color: var(--vscode-errorForeground);
}

.as-budget-bar {
  height: 6px;
  background: var(--vscode-panel-border);
  border-radius: 3px;
  overflow: hidden;
  margin: 6px 0;
}

.as-budget-fill {
  height: 100%;
  width: var(--bar-w, 0%);
  background: var(--vscode-focusBorder);
  border-radius: 3px;
  transition: width 0.3s;
}

.as-budget-over {
  background: var(--vscode-errorForeground);
}

/* Burn chart */
.as-burn-chart {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 100px;
  margin-top: 12px;
}

.as-burn-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.as-burn-bar {
  width: 100%;
  height: var(--bar-h, 2%);
  background: var(--vscode-focusBorder);
  border-radius: 2px 2px 0 0;
  min-height: 2px;
  transition: height 0.3s;
  cursor: default;
}

.as-burn-date {
  font-size: 9px;
  color: var(--vscode-disabledForeground);
  margin-top: 4px;
}

/* Model breakdown */
.as-model-breakdown {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.as-model-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--vscode-font-size);
}

.as-model-name {
  color: var(--vscode-foreground);
  font-family: var(--vscode-editor-font-family);
  flex: 1;
}

.as-model-calls {
  color: var(--vscode-descriptionForeground);
}

.as-model-cost {
  color: var(--vscode-textLink-foreground);
  font-weight: 500;
}

/* Context tax */
.as-ctx-bar {
  display: flex;
  height: 20px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.as-ctx-part {
  height: 100%;
  width: var(--bar-w, 0%);
  cursor: default;
}

.as-ctx-claude { background: var(--vscode-focusBorder); }
.as-ctx-skills { background: #e3b341; }
.as-ctx-memory { background: #4caf50; }

.as-ctx-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.as-ctx-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
}

.as-ctx-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}

.as-ctx-costs {
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
}

.as-ctx-costs div {
  margin-bottom: 2px;
}

.as-ctx-savings {
  color: #4caf50;
  font-weight: 500;
}

/* Stale list */
.as-stale-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.as-stale-item {
  font-size: var(--vscode-font-size);
  padding: 2px 8px;
  background: var(--vscode-sideBar-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  color: var(--vscode-descriptionForeground);
}

.as-stale-more {
  font-size: var(--vscode-font-size);
  color: var(--vscode-disabledForeground);
  padding: 2px 8px;
}

.as-stale-hint {
  margin-top: 8px;
  font-size: var(--vscode-font-size);
  color: var(--vscode-disabledForeground);
}

.as-stale-hint code {
  font-family: var(--vscode-editor-font-family);
  background: var(--vscode-textCodeBlock-background);
  padding: 1px 4px;
  border-radius: 4px;
}

/* Warning and conflict badges */
.as-badge-warn {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #d08700;
  color: var(--vscode-editor-background);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.as-badge-conflict {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-button-foreground);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Detail: warnings section */
.as-warnings {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-warnings-icon {
  color: #d08700;
  flex-shrink: 0;
}

.as-warnings-icon svg {
  width: 12px;
  height: 12px;
}

.as-warnings-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.as-warnings-item {
  font-size: 10px;
  color: #d08700;
}

/* Detail: usage section */
.as-usage-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-usage-left {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.as-usage-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--vscode-foreground);
}

.as-usage-label {
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
}

.as-usage-last {
  font-size: var(--vscode-font-size);
  color: var(--vscode-disabledForeground);
}

.as-usage-spark {
  color: var(--vscode-focusBorder);
}

.as-sparkline {
  display: block;
}

/* Detail: section titles */
.as-section-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 6px;
}

/* Detail: conflicts section */
.as-conflicts-section {
  padding: 10px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-conflict-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.as-conflict-name {
  font-size: var(--vscode-font-size);
  color: var(--vscode-foreground);
  font-family: var(--vscode-editor-font-family);
  width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-conflict-bar-wrap {
  flex: 1;
  height: 6px;
  background: var(--vscode-panel-border);
  border-radius: 3px;
  overflow: hidden;
}

.as-conflict-bar {
  height: 100%;
  width: var(--bar-w, 0%);
  background: var(--vscode-inputValidation-errorBackground);
  border-radius: 3px;
}

.as-conflict-score {
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
  width: 32px;
  text-align: right;
}

/* Detail: traces section */
.as-traces-section {
  padding: 10px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-traces-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.as-trace-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--vscode-font-size);
}

.as-trace-date {
  color: var(--vscode-descriptionForeground);
  width: 50px;
}

.as-trace-model {
  color: var(--vscode-foreground);
  font-family: var(--vscode-editor-font-family);
  width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.as-trace-tokens {
  color: var(--vscode-descriptionForeground);
  width: 40px;
  text-align: right;
}

.as-trace-cost {
  color: var(--vscode-textLink-foreground);
  width: 50px;
  text-align: right;
}

.as-trace-duration {
  color: var(--vscode-disabledForeground);
  width: 40px;
  text-align: right;
}

.as-traces-hint {
  font-size: 10px;
  color: var(--vscode-disabledForeground);
  font-family: var(--vscode-editor-font-family);
  margin-top: 6px;
}

/* Detail: prune action */
.as-prune-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: color-mix(in srgb, var(--vscode-inputValidation-errorBackground) 10%, transparent);
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-prune-btn {
  padding: 4px 12px;
  border-radius: 4px;
  background: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-button-foreground);
  border: none;
  cursor: pointer;
  font-size: var(--vscode-font-size);
  font-weight: 500;
}

.as-prune-btn:hover {
  opacity: 0.9;
}

.as-prune-hint {
  font-size: 10px;
  color: var(--vscode-disabledForeground);
}

/* Dashboard: action buttons */
.as-dash-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.as-dash-title-row .as-dash-title {
  margin-bottom: 0;
}

.as-action-btn {
  padding: 4px 12px;
  border-radius: 4px;
  background: var(--vscode-focusBorder);
  color: var(--vscode-button-foreground);
  border: none;
  cursor: pointer;
  font-size: var(--vscode-font-size);
  font-weight: 500;
}

.as-action-btn:hover {
  opacity: 0.9;
}

.as-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.as-toolbar-btn-danger:hover {
  color: var(--vscode-errorForeground);
  border-color: var(--vscode-errorForeground);
}

.as-action-btn.as-action-btn-danger {
  background: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-button-foreground);
}

/* Marketplace — full width in VSCode */
.as-panel-marketplace {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.as-mp-search {
  padding: 12px 16px;
  border-bottom: 1px solid var(--vscode-panel-border);
  flex-shrink: 0;
}

.as-mp-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  font-size: var(--vscode-font-size);
  outline: none;
  box-sizing: border-box;
}

.as-mp-search-input:focus {
  border-color: var(--vscode-focusBorder);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--vscode-focusBorder) 25%, transparent);
}

.as-mp-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.as-mp-list {
  overflow-y: auto;
  border-bottom: 1px solid var(--vscode-panel-border);
  padding: 4px;
  max-height: 50%;
}

.as-mp-preview {
  overflow-y: auto;
  padding: 16px;
  flex: 1;
}

.as-mp-hint {
  padding: 24px 16px;
  text-align: center;
  color: var(--vscode-disabledForeground);
  font-size: var(--vscode-font-size);
}

.as-mp-loading {
  padding: 16px;
  text-align: center;
  color: var(--vscode-descriptionForeground);
  font-size: var(--vscode-font-size);
}

/* Marketplace cards */
.as-mp-card {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 2px;
}

.as-mp-card:hover {
  background: var(--vscode-list-hoverBackground);
}

.as-mp-card.is-selected {
  background: var(--vscode-list-activeSelectionBackground);
}

.as-mp-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.as-mp-card-name {
  font-size: var(--vscode-font-size);
  font-weight: 500;
  color: var(--vscode-foreground);
  flex: 1;
}

.as-mp-installed-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #4caf50;
  color: var(--vscode-editor-background);
  font-weight: 500;
}

.as-mp-card-source {
  font-size: 10px;
  color: var(--vscode-disabledForeground);
  font-family: var(--vscode-editor-font-family);
  margin-top: 2px;
}

.as-mp-card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.as-mp-dl-icon {
  color: var(--vscode-disabledForeground);
  display: flex;
  align-items: center;
}

.as-mp-dl-icon svg {
  width: 12px;
  height: 12px;
}

.as-mp-card-installs {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
}

/* Marketplace preview */
.as-mp-preview-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-mp-preview-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.as-mp-preview-left {
  min-width: 0;
  flex: 1;
}

.as-mp-preview-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.as-mp-preview-name {
  font-size: var(--vscode-font-size);
  font-weight: 600;
  color: var(--vscode-foreground);
}

.as-mp-preview-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.as-mp-preview-source {
  font-size: var(--vscode-font-size);
  color: var(--vscode-disabledForeground);
  font-family: var(--vscode-editor-font-family);
}

.as-mp-preview-installs {
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
}

.as-mp-installed-label {
  font-size: var(--vscode-font-size);
  color: #4caf50;
  font-weight: 500;
}

.as-mp-install-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.as-mp-install-btn {
  padding: 6px 20px;
  border-radius: 4px;
  background: var(--vscode-focusBorder);
  color: var(--vscode-button-foreground);
  border: none;
  cursor: pointer;
  font-size: var(--vscode-font-size);
  font-weight: 500;
}

.as-mp-install-btn:hover {
  opacity: 0.9;
}

.as-mp-install-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.as-mp-rendered {
  font-size: var(--vscode-font-size);
}

.as-mp-preview-content pre {
  background: var(--vscode-textCodeBlock-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 12px 16px;
  overflow-x: auto;
}

.as-mp-preview-content code {
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-font-size);
}

.as-mp-section-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vscode-descriptionForeground);
  padding: 8px 12px 4px;
}

/* Install modal (VSCode webview modal) */
.as-install-modal h3 {
  margin: 0 0 4px;
}

.as-install-source {
  font-size: var(--vscode-font-size);
  color: var(--vscode-disabledForeground);
  font-family: var(--vscode-editor-font-family);
  margin: 0 0 12px;
}

.as-install-agent-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
  vertical-align: middle;
}

.as-mp-install-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.as-mp-uninstall-btn {
  padding: 4px 12px;
  border-radius: 4px;
  background: none;
  border: 1px solid var(--vscode-panel-border);
  color: var(--vscode-descriptionForeground);
  cursor: pointer;
  font-size: var(--vscode-font-size);
}

.as-mp-uninstall-btn:hover {
  color: var(--vscode-errorForeground);
  border-color: var(--vscode-errorForeground);
}

.as-mp-uninstall-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.as-dash-updated {
  font-size: 10px;
  color: var(--vscode-disabledForeground);
}

/* Confirm modal */
.as-confirm-modal {
  padding: 0;
}

.as-confirm-title {
  font-size: var(--vscode-font-size);
  font-weight: 600;
  color: var(--vscode-foreground);
  margin: 0 0 8px;
}

.as-confirm-message {
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
  margin: 0 0 16px;
}

.as-confirm-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.as-confirm-cancel {
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid var(--vscode-panel-border);
  background: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  font-size: var(--vscode-font-size);
}

.as-confirm-cancel:hover {
  background: var(--vscode-list-hoverBackground);
}

.as-confirm-action {
  padding: 6px 16px;
  border-radius: 4px;
  border: none;
  background: var(--vscode-inputValidation-errorBackground);
  color: var(--vscode-button-foreground);
  cursor: pointer;
  font-size: var(--vscode-font-size);
  font-weight: 500;
}

.as-confirm-action:hover {
  opacity: 0.9;
}

/* Dashboard action bar */
.as-dash-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-dash-action-buttons {
  display: flex;
  gap: 6px;
}

/* Dashboard streak and velocity */
.as-dash-streak-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: var(--vscode-font-size);
}

.as-streak-value {
  font-weight: 600;
  color: var(--vscode-foreground);
}

.as-streak-fire {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: #d08700;
  color: var(--vscode-editor-background);
  font-weight: 500;
  text-transform: uppercase;
}

.as-streak-longest {
  font-size: var(--vscode-font-size);
  color: var(--vscode-disabledForeground);
}

.as-dash-velocity-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
}

.as-velocity-vs {
  color: var(--vscode-disabledForeground);
}

.as-velocity-up {
  color: #f44336;
  font-weight: 500;
}

.as-velocity-down {
  color: #4caf50;
  font-weight: 500;
}

.as-install-detected {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--vscode-list-hoverBackground);
  color: var(--vscode-disabledForeground);
  margin-left: 6px;
  font-weight: 400;
}

.as-install-agent-placeholder {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: repeating-linear-gradient(
    -45deg,
    var(--vscode-focusBorder),
    var(--vscode-focusBorder) 2px,
    transparent 2px,
    transparent 4px
  );
}

.as-install-scroll {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.as-install-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--vscode-panel-border);
}

/* Filter dropdown */

/* Active filter indicator */
.as-active-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  margin: 4px 4px 0;
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  background: var(--vscode-sideBar-background);
  border-radius: 4px;
}

.as-filter-clear {
  color: var(--vscode-textLink-foreground);
  cursor: pointer;
  font-weight: 500;
}

.as-filter-clear:hover {
  text-decoration: underline;
}

/* Create skill */
.as-sidebar-create {
  border-top: 1px solid var(--vscode-panel-border);
  margin-top: 4px;
  padding-top: 8px !important;
}

.as-create-modal {
  width: 100%;
  max-width: 90vw;
}

.as-create-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.as-create-back {
  cursor: pointer;
  opacity: 0.5;
  display: flex;
  align-items: center;
  border-radius: 4px;
  padding: 4px;
}

.as-create-back:hover {
  opacity: 1;
  background: var(--vscode-list-hoverBackground);
}

.as-create-title {
  font-size: var(--vscode-font-size);
  font-weight: 600;
}

.as-create-subtitle {
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
  margin-bottom: 12px;
}

.as-create-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.as-create-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 6px;
  border: 1px solid var(--vscode-panel-border);
  cursor: pointer;
  transition: all 0.15s;
}

.as-create-card:hover {
  border-color: var(--tool-color);
  background: var(--vscode-list-hoverBackground);
}

.as-create-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: var(--vscode-sideBar-background);
}

.as-create-card-name {
  font-size: var(--vscode-font-size);
  font-weight: 500;
  text-align: center;
}

.as-create-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}

.as-create-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: 6px;
  border: 1px solid var(--vscode-panel-border);
  cursor: pointer;
  transition: all 0.15s;
}

.as-create-type-card:hover {
  border-color: var(--tool-color);
  background: var(--vscode-list-hoverBackground);
}

.as-create-type-icon {
  color: var(--vscode-descriptionForeground);
}

.as-create-type-card:hover .as-create-type-icon {
  color: var(--tool-color);
}

.as-create-type-label {
  font-size: var(--vscode-font-size);
  font-weight: 500;
  text-transform: capitalize;
}

.as-create-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  background: var(--vscode-sideBar-background);
  font-size: var(--vscode-font-size);
  color: var(--vscode-descriptionForeground);
  margin-bottom: 16px;
}

.as-create-badge-icon {
  display: flex;
  align-items: center;
}

.as-create-input-wrap {
  margin-bottom: 16px;
}

.as-create-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  font-size: var(--vscode-font-size);
  font-family: var(--vscode-editor-font-family);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.as-create-input:focus {
  border-color: var(--tool-color, var(--vscode-focusBorder));
}

.as-create-actions {
  display: flex;
  justify-content: flex-end;
}

.as-create-submit {
  padding: 8px 20px;
  border-radius: 6px;
  border: none;
  background: var(--tool-color, var(--vscode-focusBorder));
  color: white;
  font-weight: 500;
  cursor: pointer;
  font-size: var(--vscode-font-size);
  transition: opacity 0.15s;
}

.as-create-submit:hover {
  opacity: 0.9;
}

/* Wrapper for swapping content inside grid cells */
.as-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ===== Conversation Explorer ===== */

/* Search row actions (date + tag dropdowns + sort) */
.as-conv-search-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

/* Icon buttons (date, tag, sort) */
.as-conv-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--vscode-descriptionForeground);
  cursor: pointer;
  transition: all 0.12s ease;
}

.as-conv-icon-btn:hover {
  color: var(--vscode-foreground);
  background: var(--vscode-sideBar-background);
}

.as-conv-icon-btn.has-active {
  color: var(--vscode-button-foreground);
  background: var(--vscode-focusBorder);
}

.as-conv-icon-btn.has-active:hover {
  opacity: 0.85;
  background: var(--vscode-focusBorder);
}

.as-conv-icon-btn.is-disabled {
  opacity: 0.35;
  cursor: default;
}

.as-conv-icon-btn.is-disabled:hover {
  color: var(--vscode-descriptionForeground);
  background: transparent;
}

.as-conv-icon-btn-icon {
  display: flex;
}

.as-conv-icon-btn-icon svg {
  width: 14px;
  height: 14px;
}

/* Shared dropdown */
.as-conv-dropdown-wrap {
  position: relative;
}

.as-conv-dropdown {
  display: none;
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 100;
  width: 200px;
  max-height: 280px;
  overflow-y: auto;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 4px;
}

.as-conv-dropdown.is-open {
  display: block;
}

.as-conv-dropdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 11.5px;
  color: var(--vscode-descriptionForeground);
  cursor: pointer;
  transition: background 0.1s ease;
}

.as-conv-dropdown-item:hover {
  background: var(--vscode-sideBar-background);
  color: var(--vscode-foreground);
}

.as-conv-dropdown-item.is-active {
  color: var(--vscode-foreground);
  font-weight: 500;
}

.as-conv-dropdown-check {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--vscode-focusBorder);
}

.as-conv-dropdown-check svg {
  width: 12px;
  height: 12px;
}

.as-conv-dropdown-item-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-conv-dropdown-item-count {
  font-size: 10px;
  color: var(--vscode-disabledForeground);
  flex-shrink: 0;
}

.as-conv-dropdown-wide {
  width: 180px;
}

.as-conv-dropdown-header {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vscode-disabledForeground);
  padding: 6px 8px 2px;
}

.as-conv-dropdown-clear {
  color: var(--vscode-disabledForeground);
  border-bottom: 1px solid var(--vscode-panel-border);
  margin-bottom: 2px;
  padding-bottom: 6px;
}

.as-conv-dropdown-clear:hover {
  color: var(--vscode-errorForeground);
}

.as-conv-dropdown-item-icon {
  display: flex;
  align-items: center;
}

.as-conv-dropdown-item-icon svg {
  width: 12px;
  height: 12px;
}

/* Row 2: active filters strip (only shows when filters applied) */
.as-conv-toolbar {
  border-bottom: 1px solid var(--vscode-panel-border);
}

.as-conv-toolbar:empty {
  display: none;
}

.as-conv-tag-strip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  overflow-x: auto;
  scrollbar-width: none;
}

.as-conv-tag-strip::-webkit-scrollbar {
  display: none;
}

.as-conv-result-count {
  font-size: 11px;
  color: var(--vscode-disabledForeground);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.as-conv-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 8px;
  border-radius: 99px;
  font-size: 10.5px;
  color: var(--vscode-descriptionForeground);
  background: transparent;
  border: 1px solid var(--vscode-panel-border);
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.as-conv-tag-pill.is-active {
  color: var(--vscode-focusBorder);
  background: color-mix(in srgb, var(--vscode-focusBorder) 10%, transparent);
  border-color: color-mix(in srgb, var(--vscode-focusBorder) 30%, transparent);
}

.as-conv-tag-pill-x {
  display: flex;
  align-items: center;
}

.as-conv-tag-pill-x svg {
  width: 10px;
  height: 10px;
}

.as-conv-tag-clear {
  color: var(--vscode-disabledForeground);
  border-color: transparent;
}

.as-conv-tag-clear:hover {
  color: var(--vscode-errorForeground);
}

/* Date group headers */
.as-conv-date-header {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vscode-disabledForeground);
  padding: 10px 12px 4px;
}

/* Conversation card overrides */
.as-conv-list .as-skill-card {
  padding: 10px 12px;
  margin-bottom: 0;
  border-bottom: 1px solid var(--vscode-panel-border);
  border-radius: 0;
}

.as-conv-list .as-skill-card:last-child {
  border-bottom: none;
}

/* Tags */
.as-conv-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 6px;
}

.as-conv-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  background: var(--vscode-sideBar-background);
  color: var(--vscode-descriptionForeground);
  border: 1px solid var(--vscode-panel-border);
}

.as-conv-tag-custom {
  background: color-mix(in srgb, var(--vscode-focusBorder) 15%, transparent);
  color: var(--vscode-focusBorder);
  border-color: color-mix(in srgb, var(--vscode-focusBorder) 30%, transparent);
}

.as-conv-tag-more {
  color: var(--vscode-disabledForeground);
  font-style: italic;
}

.as-conv-tag-add {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 1px 4px;
}

.as-conv-tag-add:hover {
  background: var(--vscode-list-hoverBackground);
}

.as-conv-tag-add svg {
  width: 10px;
  height: 10px;
}

.as-conv-tag-remove {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
  opacity: 0.6;
}

.as-conv-tag-remove:hover {
  opacity: 1;
}

.as-conv-tag-remove svg {
  width: 8px;
  height: 8px;
}

.as-conv-tag-input {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  border: 1px solid var(--vscode-focusBorder);
  background: var(--vscode-editor-background);
  color: var(--vscode-foreground);
  outline: none;
  width: 80px;
}

/* Detail tags bar */
.as-conv-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 16px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

/* Selection bar */
.as-conv-selection-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: color-mix(in srgb, var(--vscode-focusBorder) 10%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--vscode-focusBorder) 30%, transparent);
  border-radius: 4px;
  margin: 8px 16px;
  font-size: var(--vscode-font-size);
  color: var(--vscode-focusBorder);
  font-weight: 500;
}

.as-conv-save-selected-btn {
  padding: 4px 12px;
  border-radius: 4px;
  background: var(--vscode-focusBorder);
  color: var(--vscode-button-foreground);
  border: none;
  cursor: pointer;
  font-size: var(--vscode-font-size);
  font-weight: 500;
}

.as-conv-save-selected-btn:hover {
  opacity: 0.9;
}

/* Messages */
.as-conv-msg {
  padding: 10px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
  transition: background 0.15s;
}

.as-conv-msg:hover {
  background: var(--vscode-list-hoverBackground);
}

.as-conv-msg-selected {
  background: color-mix(in srgb, var(--vscode-focusBorder) 8%, transparent) !important;
  border-left: 3px solid var(--vscode-focusBorder);
  padding-left: 17px;
}

.as-conv-msg-human {
  /* subtle differentiation */
}

.as-conv-msg-assistant {
  background: var(--vscode-sideBar-background);
}

.as-conv-msg-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.as-conv-msg-role-icon {
  display: flex;
  align-items: center;
  color: var(--vscode-descriptionForeground);
}

.as-conv-msg-role-icon svg {
  width: 14px;
  height: 14px;
}

.as-conv-msg-role {
  font-size: var(--vscode-font-size);
  font-weight: 600;
  color: var(--vscode-foreground);
}

.as-conv-msg-time {
  font-size: 10px;
  color: var(--vscode-disabledForeground);
  margin-left: auto;
}

.as-conv-msg-select {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--vscode-disabledForeground);
  margin-left: 4px;
}

.as-conv-msg-select:hover {
  color: var(--vscode-focusBorder);
}

.as-conv-msg-select svg {
  width: 14px;
  height: 14px;
}

.as-conv-msg-content {
  font-size: var(--vscode-font-size);
  color: var(--vscode-foreground);
  line-height: 1.5;
  overflow-x: auto;
}

.as-conv-msg-content p {
  margin: 0 0 4px;
}

.as-conv-msg-content pre {
  background: var(--vscode-textCodeBlock-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  padding: 8px 12px;
  overflow-x: auto;
  font-size: var(--vscode-font-size);
}

/* Tool call badges */
.as-conv-msg-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 6px;
}

.as-conv-tool-badge {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--vscode-panel-border);
  color: var(--vscode-disabledForeground);
  font-family: var(--vscode-editor-font-family);
}

/* Show more */
.as-conv-show-more {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 12px 20px;
}

.as-conv-show-more-btn,
.as-conv-show-all-btn {
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid var(--vscode-panel-border);
  background: none;
  color: var(--vscode-descriptionForeground);
  cursor: pointer;
  font-size: var(--vscode-font-size);
}

.as-conv-show-more-btn:hover,
.as-conv-show-all-btn:hover {
  background: var(--vscode-list-hoverBackground);
  color: var(--vscode-foreground);
}

.as-conv-show-more-btn {
  flex: 1;
}

.as-conv-show-all-btn {
  color: var(--vscode-disabledForeground);
  font-size: 10px;
}

/* Resume section */
.as-conv-resume-section {
  padding: 12px 20px;
  border-top: 1px solid var(--vscode-panel-border);
  margin-top: 8px;
}

.as-conv-resume-cmd {
  display: block;
  margin-top: 6px;
  padding: 8px 12px;
  background: var(--vscode-textCodeBlock-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-font-size);
  color: var(--vscode-foreground);
  cursor: pointer;
}

.as-conv-resume-cmd:hover {
  background: var(--vscode-list-hoverBackground);
}

/* Primary toolbar button */
.as-toolbar-btn-primary {
  color: var(--vscode-focusBorder) !important;
}

.as-toolbar-btn-primary:hover {
  background: color-mix(in srgb, var(--vscode-focusBorder) 15%, transparent);
}

/* Tab bar */
.as-tabs {
  display: flex;
  border-bottom: 1px solid var(--vscode-panel-border);
  position: sticky;
  top: 0;
  background: var(--vscode-editor-background);
  z-index: 100;
  flex-shrink: 0;
}
.as-tab {
  flex: 1;
  padding: 8px 4px;
  cursor: pointer;
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--vscode-descriptionForeground);
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  white-space: nowrap;
}
.as-tab:hover { color: var(--vscode-foreground); }
.as-tab.active {
  color: var(--vscode-foreground);
  border-bottom-color: var(--vscode-focusBorder);
}

/* Tab panels */
.as-tab-panel { display: none; flex: 1; overflow-y: auto; flex-direction: column; }
.as-tab-panel.active { display: flex; }

/* Detail overlay */
.as-panel-detail {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--vscode-editor-background);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.as-panel-detail.as-hidden { display: none; }
.as-detail-toolbar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--vscode-panel-border);
  padding: 8px;
}
.as-detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.as-detail-title {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.as-toolbar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.as-toolbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}
.as-toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.as-toolbar-btn {
  background: none;
  border: none;
  color: var(--vscode-foreground);
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 14px;
}
.as-toolbar-btn:hover { background: var(--vscode-list-hoverBackground); }
.as-toolbar-btn-danger { color: var(--vscode-errorForeground); }
.as-toolbar-btn.has-active { background: color-mix(in srgb, var(--vscode-focusBorder) 20%, transparent); }

.as-detail-meta-bar {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.as-meta-item { white-space: nowrap; }

/* Detail tags */
.as-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
  align-items: center;
}
.as-conv-tag-add {
  cursor: pointer;
  padding: 2px 6px;
  border: 1px dashed var(--vscode-panel-border);
  border-radius: 4px;
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
}
.as-conv-tag-add:hover { border-color: var(--vscode-foreground); color: var(--vscode-foreground); }
.as-conv-tag-input {
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid var(--vscode-focusBorder);
  border-radius: 4px;
  background: var(--vscode-input-background);
  color: var(--vscode-foreground);
  width: 80px;
}
.as-conv-tag-remove { cursor: pointer; margin-left: 2px; opacity: 0.6; }
.as-conv-tag-remove:hover { opacity: 1; }

/* Tool name badge (in detail) */
.as-tool-name-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  font-size: 10px;
}

/* Frontmatter */
.as-fm-prop {
  display: flex;
  gap: 8px;
  padding: 3px 0;
  font-size: 11px;
  border-bottom: 1px solid var(--vscode-panel-border);
}
.as-fm-key {
  font-family: var(--vscode-editor-font-family);
  font-weight: 600;
  flex-shrink: 0;
  min-width: 80px;
}
.as-fm-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.as-fm-value-long {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* Detail preview */
.as-detail-preview {
  white-space: pre-wrap;
  font-family: var(--vscode-editor-font-family);
  font-size: 11px;
  line-height: 1.6;
  background: var(--vscode-textCodeBlock-background);
  padding: 10px;
  border-radius: 6px;
  max-height: 60vh;
  overflow-y: auto;
}

/* Editor */
.as-detail-body-editor { display: flex; flex-direction: column; flex: 1; }
.as-editor-cm {
  flex: 1;
  width: 100%;
  min-height: 300px;
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-editor-font-size, 12px);
  background: var(--vscode-input-background);
  color: var(--vscode-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  padding: 8px;
  resize: vertical;
}
.as-save-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}
.as-save-btn {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.as-save-btn:hover { opacity: 0.9; }
.as-save-hint { font-size: 11px; color: var(--vscode-descriptionForeground); }

/* Warnings */
.as-warnings-list { font-size: 11px; }
.as-warnings-item {
  padding: 4px 8px;
  background: color-mix(in srgb, #d08700 10%, transparent);
  border-radius: 4px;
  margin-bottom: 4px;
  color: #d08700;
}

/* Conversation messages */
.as-conv-msg {
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 11px;
  line-height: 1.5;
}
.as-conv-msg-human { background: var(--vscode-input-background); }
.as-conv-msg-assistant { border: 1px solid var(--vscode-panel-border); }
.as-conv-msg-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.as-conv-msg-role {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.as-conv-msg-human .as-conv-msg-role { color: var(--vscode-focusBorder); }
.as-conv-msg-assistant .as-conv-msg-role { color: #4caf50; }
.as-conv-msg-time { font-size: 9px; color: var(--vscode-descriptionForeground); }
.as-conv-msg-content {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}
.as-conv-msg-tools { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 4px; }
.as-conv-tool-badge {
  font-size: 9px;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  padding: 1px 4px;
  border-radius: 2px;
}
.as-conv-show-more {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 8px;
}
.as-conv-show-more-btn, .as-conv-show-all-btn {
  background: none;
  border: 1px solid var(--vscode-panel-border);
  color: var(--vscode-foreground);
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}
.as-conv-show-more-btn:hover, .as-conv-show-all-btn:hover { background: var(--vscode-list-hoverBackground); }

/* Date header in conversation list */
.as-conv-date-header {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground);
  padding: 8px 8px 4px;
  border-top: 1px solid var(--vscode-panel-border);
}
.as-conv-date-header:first-child { border-top: none; }
`;
}
