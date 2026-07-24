import { Analytics } from "@vercel/analytics/next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { TOOL_COUNT, TOOL_LEAD } from "./tools-meta.generated";
import "./globals.css";

export const metadata: Metadata = {
	title: "Agentfiles — One plugin for all your agent files",
	description: `Browse, create, and edit skills, commands, and agents across ${TOOL_LEAD}, and ${TOOL_COUNT} AI coding tools — from a single Obsidian panel.`,
	metadataBase: new URL("https://agentfiles.crafter.run"),
	openGraph: {
		title: "Agentfiles — One plugin for all your agent files",
		description: `Browse, create, and edit skills, commands, and agents across ${TOOL_LEAD}, and ${TOOL_COUNT} AI coding tools — from a single Obsidian panel.`,
		url: "https://agentfiles.crafter.run",
		siteName: "Agentfiles",
		type: "website",
		images: [{ url: "/og.png", width: 1200, height: 630 }],
	},
	twitter: {
		card: "summary_large_image",
		title: "Agentfiles — One plugin for all your agent files",
		description: `Browse, create, and edit skills, commands, and agents across ${TOOL_LEAD}, and ${TOOL_COUNT} AI coding tools — from a single Obsidian panel.`,
		images: ["/og-twitter.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
				{children}
				<Analytics />
			</body>
		</html>
	);
}
