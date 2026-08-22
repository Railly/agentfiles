import { isAbsolute, relative, resolve } from "path";

const SAFE_SKILL_NAME = /^[\p{L}\p{N}][\p{L}\p{N} ._@+-]{0,199}$/u;
const SAFE_SOURCE_PART = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
const UNSAFE_COMMAND_CHARACTERS = /[\0\r\n&|<>^%!`"'()]/;

export function isSafeSkillName(name: string): boolean {
	return name !== "." && name !== ".." && SAFE_SKILL_NAME.test(name);
}

export function isSafeMarketplaceSource(source: string): boolean {
	const parts = source.split("/");
	return parts.length === 2 && parts.every((part) =>
		part !== "." && part !== ".." && SAFE_SOURCE_PART.test(part)
	);
}

export function areSafeCommandArguments(args: string[]): boolean {
	return args.every((arg) => arg.length <= 512 && !UNSAFE_COMMAND_CHARACTERS.test(arg));
}

export function resolveContainedSkillPath(root: string, skillName: string): string | null {
	if (!isSafeSkillName(skillName)) return null;
	const target = resolve(root, skillName);
	const rel = relative(resolve(root), target);
	if (!rel || rel.startsWith("..") || isAbsolute(rel)) return null;
	return target;
}
