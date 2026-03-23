import { AiQueryResult } from '$lib/types/ai-query-result';

export async function queryAi(searchText: string): Promise<AiQueryResult | null> {
	try {
		const response = await fetch('/api/ai-query', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ searchText })
		});

		if (!response.ok) {
			console.error('AI route failed:', response.status);
			return null;
		}

		const data = await response.json();
		const jsonString = cleanResponse(data.raw);

		if (!jsonString) {
			return null;
		}

		return AiQueryResult.fromJson(jsonString);
	} catch (error) {
		console.error('Error querying AI route:', error);
		return null;
	}
}

/**
 * Cleans and formats a response string to ensure it is a valid JSON-like string.
 *
 * - Validates the response, ensuring it is a non-empty string.
 * - Trims whitespace and removes comments starting with "//" or "#".
 * - Replaces lists containing a single null with empty lists.
 * - Strips content before the first `{` and after the last `}`.
 * - Ensures the string starts and ends with curly braces.
 * - Removes any trailing commas.
 * - Fixes unquoted JSON values.
 * - Remove standalone string values from JSON objects.
 *
 * @param response - The response to be cleaned.
 * @returns A cleaned string formatted as JSON or an empty string on error
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanResponse(response: any): string {
	if (!response) {
		console.error('No response received');
		return '';
	}

	// Check if response is not a string
	if (typeof response !== 'string') {
		console.error('Invalid response format:', response);
		return '';
	}

	// Clean up whitespace
	let text = response.trim();

	console.log('cleanResponse: initial text: ', text);

	// Remove comments starting with "//" or "#" that span multiple lines
	text = text.replace(/(\/\/|#)[^\n]*/g, '').trim();

	// Remove /* ... */ block comments
	text = text.replace(/\/\*[\s\S]*?\*\//g, '');

	// Get rid of lists containing a single null
	text = text.replace(/":\s*\[null\]/g, '": []');

	// Get rid of nulls where empty strings ought to be
	text = text.replace(/":\s*null/g, '": ""');
	text = text.replace(/":\s*undefined/g, '": ""');

	// Get rid of everything before the first `{` (if present)
	text = text.includes('{') ? text.substring(text.indexOf('{')) : text;

	// Get rid of everything after the last `}` (if present)
	text = text.replace(/}[^}]*$/, '}');

	// Add an initial `{` if missing
	if (!text.trim().startsWith('{')) {
		text = '{' + text.trim();
	}

	// Remove trailing comma if present
	if (text.trim().endsWith(',')) {
		text = text.trim().slice(0, -1);
	}

	// Add a closing `}` if missing
	if (!text.trim().endsWith('}')) {
		text = text.trim() + '}';
	}

	// Fix unquoted JSON values
	text = fixUnquotedJsonValues(text);

	// Remove standalone string values from JSON objects.
	text = removeStandaloneStringFromBraces(text);

	// Fix missing commas between adjacent closing brackets/braces/quotes
	text = fixMissingCommas(text);

	// Remove trailing commas in lists or maps
	text = removeTrailingCommas(text);

	console.log('cleanResponse: final text: ', text);

	// Test text to see if it is valid JSON
	try {
		JSON.parse(text);
	} catch (error) {
		console.error('Invalid JSON response:', text);
		return '';
	}

	return text;
}

/**
 * Fix unquoted JSON values in a string.
 *
 * This function takes a string representing a JSON object, and
 * returns a new string with any unquoted values wrapped in quotes.
 *
 * Unquoted values are matched by the following pattern:
 *
 *   "key": unquoted_value (not wrapped in quotes), followed by comma or closing brace
 *
 * The replacement string is:
 *
 *   "${keyName}": "${trimmed}"
 *
 * unless the value is a number, boolean, or null, in which case the
 * replacement string is:
 *
 *   "${keyName}": ${trimmed}
 *
 * @param {string} input - The input string
 * @returns {string} - The fixed string
 */
function fixUnquotedJsonValues(input: string): string {
	// Match: "key": unquoted_value (not wrapped in quotes), followed by comma or closing brace
	//const pattern = /("([^"]+)")\s*:\s*([^"\{\[\}\],\n\r]+)(?=\s*[,}])/g;
	const pattern = /("([^"]+)")\s*:\s*([^"{[}\],\n\r]+)(?=\s*[,}])/g;

	return input.replace(pattern, (_, fullKey, keyName, value) => {
		const trimmed = value.trim();
		// Avoid wrapping if it looks like a number, boolean, or null
		if (/^(true|false|null|\d+(\.\d+)?|\d+)$/.test(trimmed)) {
			return `"${keyName}": ${trimmed}`;
		}
		return `"${keyName}": "${trimmed}"`;
	});
}

/**
 * Remove standalone string values from JSON objects.
 *
 * This function takes a string representing a JSON object, and
 * returns a new string with any standalone string values (i.e.
 * where the value is a string, and there is no inner key) removed
 * from the object.
 *
 * The replacement string is an empty object.
 *
 * Example input:
 *
 *   {
 *     "key1": "value1",
 *     "key2": { "value2" }
 *   }
 *
 * Example output:
 *
 *   {
 *     "key1": "value1",
 *     "key2": {}
 *   }
 *
 * @param {string} input - The input string
 * @returns {string} - The fixed string
 */
function removeStandaloneStringFromBraces(input: string): string {
	// Match: "some_key": { "value" }, where "value" is a string, and there’s no inner key
	const pattern = /"(\w+)"\s*:\s*\{\s*"([^"]+)"\s*\}/g;

	return input.replace(pattern, (_match, key, value) => {
		console.warn(`Removing stray string "${value}" from object for key "${key}"`);
		return `"${key}": {}`;
	});
}

/**
 * Fix missing commas between adjacent closing brackets/braces or quoted strings.
 *
 * This function takes a string representing a JSON object, and returns a new
 * string with any missing commas between adjacent closing brackets/braces or
 * quoted strings added.
 *
 * The search pattern is two adjacent closing brackets/braces or quoted strings
 * that should be separated by a comma. The replacement string is the first
 * matched group, followed by a comma, followed by the second matched group.
 *
 * @param {string} input - The input string
 * @returns {string} - The fixed string
 */

function fixMissingCommas(input: string): string {
	// Look for adjacent closing brackets/braces or quoted strings that should be separated by a comma
	const pattern = /("\s*]|\}\s*")(\s*")/g;

	return input.replace(pattern, '$1,$2');
}

/**
 * Removes trailing commas from a JSON-like string.
 *
 * This function takes a string as input and removes any commas that
 * appear immediately before a closing bracket (either ']' or '}').
 *
 * @param input - The input string from which to remove trailing commas.
 * @returns A new string with trailing commas removed.
 */

function removeTrailingCommas(input: string): string {
	// Remove any comma that comes just before a closing ] or }
	return input.replace(/,\s*([\]}])/g, '$1');
}
