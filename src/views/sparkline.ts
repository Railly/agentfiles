export function renderSparkline(
	container: HTMLElement,
	data: number[],
	width = 48,
	height = 16
): void {
	if (data.length === 0) return;

	const max = Math.max(...data, 1);
	const points = data.map((v, i) => {
		const x = (i / (data.length - 1 || 1)) * width;
		const y = height - (v / max) * height;
		return `${x.toFixed(1)},${y.toFixed(1)}`;
	});

	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
	svg.setAttribute("width", String(width));
	svg.setAttribute("height", String(height));
	svg.classList.add("as-sparkline");

	const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
	polyline.setAttribute("points", points.join(" "));
	polyline.setAttribute("fill", "none");
	polyline.setAttribute("stroke", "currentColor");
	polyline.setAttribute("stroke-width", "1.5");
	polyline.setAttribute("stroke-linecap", "round");
	polyline.setAttribute("stroke-linejoin", "round");
	svg.appendChild(polyline);

	container.appendChild(svg);
}
