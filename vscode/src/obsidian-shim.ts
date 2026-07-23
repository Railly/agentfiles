import { load } from "js-yaml";

export function parseYaml(text: string): unknown {
	return load(text);
}

type Handler = (...args: unknown[]) => void;

export class Events {
	private handlers = new Map<string, Set<Handler>>();

	on(name: string, callback: Handler): { name: string; callback: Handler } {
		const set = this.handlers.get(name) || new Set();
		set.add(callback);
		this.handlers.set(name, set);
		return { name, callback };
	}

	off(name: string, callback: Handler): void {
		this.handlers.get(name)?.delete(callback);
	}

	offref(ref: { name: string; callback: Handler }): void {
		this.off(ref.name, ref.callback);
	}

	trigger(name: string, ...args: unknown[]): void {
		for (const cb of this.handlers.get(name) || []) cb(...args);
	}
}

export interface RequestUrlParam {
	url: string;
	method?: string;
	headers?: Record<string, string>;
	body?: string;
	throw?: boolean;
}

export interface RequestUrlResponse {
	status: number;
	text: string;
	json: unknown;
	arrayBuffer: ArrayBuffer;
	headers: Record<string, string>;
}

export async function requestUrl(param: RequestUrlParam | string): Promise<RequestUrlResponse> {
	const p: RequestUrlParam = typeof param === "string" ? { url: param } : param;
	const res = await fetch(p.url, {
		method: p.method || "GET",
		headers: p.headers,
		body: p.body,
	});
	const buf = await res.arrayBuffer();
	const text = new TextDecoder().decode(buf);
	if (p.throw !== false && res.status >= 400) {
		throw new Error(`Request failed, status ${res.status}`);
	}
	let json: unknown = null;
	try {
		json = JSON.parse(text);
	} catch {
		json = null;
	}
	const headers: Record<string, string> = {};
	res.headers.forEach((v, k) => {
		headers[k] = v;
	});
	return { status: res.status, text, json, arrayBuffer: buf, headers };
}
