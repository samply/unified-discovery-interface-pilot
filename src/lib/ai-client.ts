import { env } from '$env/dynamic/public';
import { AiQueryResult } from '$lib/types/ai-query-result';

export async function queryAi(searchText: string, tryCount: number): Promise<AiQueryResult | null>{
	try {
		const response = await fetch('http://localhost:11434/api/generate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'mistral',
				prompt:
					'You are an expert in Biobanks and patient data. You can analyze queries in free text and generate JSON with the following elements: gender (a smple string), diagnosis (convert named diagnoses intoa list of ICD-10 codes), age_at_diagnosis (a map, with explicit lower and upper values), date_of_diagnosis (a map, with explicit lower and upper values), patient_age (a map, with explicit lower and upper values), sample_type (a list containing one or more of the following: blood-serum, tissue-frozen, whole-blood, blood-plasma, derivative-other, tissue-other, peripheral-blood-cells-vital, urine, rna, liquid-other, buffy-coat, dna, csf-liquor, stool-faeces, bone-marrow, tissue-ffpe, saliva, ascites, swab, dried-whole-blood), sampling_date (a map, with explicit lower and upper values), sample_storage_temperature (a list). Please convert the following text into JSON: ' +
					searchText,
				stream: false
			})
		});

		const data = await response.json();
		const jsonString = cleanResponse(data.response);
		let maxAiTries = 3;
		if (env.PUBLIC_AI_MAX_TRIES) {
			maxAiTries = Number(env.PUBLIC_AI_MAX_TRIES);
		}
		if (!jsonString) {
			if (tryCount < maxAiTries) {
				console.error('Error querying Mistral, trying again');
				return await queryAi(searchText, tryCount + 1);
			}
			// End recursion, don't try any more.
			console.error('Too many attempts to query Mistral, giving up');
			return null;
		}
		const parsed: AiQueryResult = AiQueryResult.fromJson(jsonString);
		return parsed;
	} catch (error) {
		console.error('Error querying Mistral:', error);
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

export function cleanJsonResponse(content: string): string {
	// Ensure we have a valid string
	if (!content || typeof content !== 'string') {
		console.error('Invalid input: expected a string.');
		return '{}'; // Return an empty JSON object
	}

	// Get rid of everything before the first `{` (if present)
	let jsonStr = content.includes('{') ? content.substring(content.indexOf('{')) : content;

	// Get rid of everything after the last `}` (if present)
	jsonStr = jsonStr.replace(/}[^}]*$/, '}');

	// Add an initial `{` if missing
	if (!jsonStr.trim().startsWith('{')) {
		jsonStr = '{' + jsonStr.trim();
	}

	// Remove trailing comma if present
	if (jsonStr.trim().endsWith(',')) {
		jsonStr = jsonStr.trim().slice(0, -1);
	}

	// Add a closing `}` if missing
	if (!jsonStr.trim().endsWith('}')) {
		jsonStr = jsonStr.trim() + '}';
	}

	return jsonStr;
}
