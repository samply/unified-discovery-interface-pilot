import { type AstElement } from '@samply/lens';

export function buildDirectoryUrlFromAst(ast: AstElement, baseUrl: string): string {
	const params = extractParamsFromAst(ast);
	const queryString = buildQueryString(params);
	return `${baseUrl.replace(/\/+$/, '')}/#/catalogue?${queryString}`;
}

// Mapping from AST keys to query parameter names
const keyMap: Record<string, string> = {
	country: 'Countries',
	'collection-type': 'Collectiontype',
	category: 'Categories',
	'service-type': 'Servicestype'
	// Add more mappings here as needed
};

// Converts the AST to a flat record of query parameters
function extractParamsFromAst(ast: AstElement): Record<string, string[]> {
	const params: Record<string, string[]> = {};

	function recurse(node: AstElement) {
		if ('children' in node && Array.isArray(node.children)) {
			for (const child of node.children) {
				recurse(child);
			}
		} else if ('key' in node && 'value' in node) {
			const mappedKey = keyMap[node.key];
			if (!mappedKey) return;

			const value = node.value;
			if (typeof value === 'string') {
				const normalized = node.key === 'collection-type' ? value.toUpperCase() : value;
				if (!params[mappedKey]) params[mappedKey] = [];
				params[mappedKey].push(normalized);
			} else if (Array.isArray(value)) {
				if (!params[mappedKey]) params[mappedKey] = [];
				params[mappedKey].push(...value);
			}
			// If the value is a range object (min/max), skip it for this URL
		}
	}

	recurse(ast);
	return params;
}

// Converts params object to URL query string
function buildQueryString(params: Record<string, string[]>): string {
	const searchParams = new URLSearchParams();
	for (const key of Object.keys(params)) {
		for (const value of params[key]) {
			searchParams.append(key, value);
		}
	}
	return searchParams.toString();
}
