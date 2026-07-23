export { TOOL_SVGS } from "./tool-svgs";
import { TOOL_SVGS } from "./tool-svgs";

export function renderToolIcon(
	container: HTMLElement,
	toolId: string,
	size = 16
): void {
	const svgData = TOOL_SVGS[toolId];
	if (!svgData) return;

	const svg = createSvg("svg");
	svg.setAttribute("viewBox", svgData.viewBox);
	svg.setAttribute("width", String(size));
	svg.setAttribute("height", String(size));
	svg.setAttribute("fill", "none");
	svg.classList.add("as-tool-svg");
	const parser = new DOMParser();
	const svgDoc = parser.parseFromString(
		`<svg xmlns="http://www.w3.org/2000/svg">${svgData.paths}</svg>`,
		"image/svg+xml",
	);
	for (const child of Array.from(svgDoc.documentElement.childNodes)) {
		svg.appendChild(svg.ownerDocument.importNode(child, true));
	}
	container.appendChild(svg);
}
