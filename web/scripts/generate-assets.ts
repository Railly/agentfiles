import sharp from "sharp";

const VIOLET = "#8b5cf6";
const ZINC_900 = "#18181b";
const ZINC_950 = "#09090b";
const WHITE = "#fafafa";
const MUTED = "#71717a";

function ogSvg(width: number, height: number): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ZINC_950}"/>
      <stop offset="100%" stop-color="${ZINC_900}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="${VIOLET}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${VIOLET}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#glow)"/>
  <rect x="60" y="${height - 4}" width="${width - 120}" height="4" rx="2" fill="${VIOLET}" opacity="0.6"/>

  <!-- Icon: scan brackets -->
  <g transform="translate(${width / 2 - 24}, ${height * 0.22})" stroke="${VIOLET}" stroke-width="3" fill="none" stroke-linecap="round">
    <path d="M0 8V2a2 2 0 0 1 2-2h6"/>
    <path d="M42 0h6a2 2 0 0 1 2 2v6"/>
    <path d="M50 42v6a2 2 0 0 1-2 2h-6"/>
    <path d="M8 50H2a2 2 0 0 1-2-2v-6"/>
    <line x1="10" y1="25" x2="40" y2="25"/>
  </g>

  <text x="${width / 2}" y="${height * 0.58}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="800" fill="${WHITE}" letter-spacing="-1">Agentfiles</text>
  <text x="${width / 2}" y="${height * 0.72}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="${MUTED}">One plugin for all your agent files.</text>
  <text x="${width / 2}" y="${height * 0.84}" text-anchor="middle" font-family="monospace" font-size="14" fill="${VIOLET}" opacity="0.7">agentfiles.crafter.run</text>
</svg>`;
}

function faviconSvg(): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="10" fill="${ZINC_950}"/>
  <g transform="translate(8, 8)" stroke="${VIOLET}" stroke-width="2.5" fill="none" stroke-linecap="round">
    <path d="M0 6V2a2 2 0 0 1 2-2h4"/>
    <path d="M26 0h4a2 2 0 0 1 2 2v4"/>
    <path d="M32 26v4a2 2 0 0 1-2 2h-4"/>
    <path d="M6 32H2a2 2 0 0 1-2-2v-4"/>
    <line x1="6" y1="16" x2="26" y2="16"/>
  </g>
</svg>`;
}

const og = Buffer.from(ogSvg(1200, 630));
const ogTwitter = Buffer.from(ogSvg(1200, 600));
const favicon = Buffer.from(faviconSvg());

await Promise.all([
	sharp(og).png().toFile("public/og.png"),
	sharp(ogTwitter).png().toFile("public/og-twitter.png"),
	sharp(favicon).resize(48, 48).png().toFile("/tmp/fav-48.png"),
]);

const fav16 = await sharp(favicon).resize(16, 16).png().toBuffer();
const fav32 = await sharp(favicon).resize(32, 32).png().toBuffer();
const fav48 = await sharp(favicon).resize(48, 48).png().toBuffer();

const { default: toIco } = await import("to-ico");
const ico = await toIco([fav16, fav32, fav48]);
await Bun.write("public/favicon.ico", ico);

console.log("Generated: public/og.png, public/og-twitter.png, public/favicon.ico");
