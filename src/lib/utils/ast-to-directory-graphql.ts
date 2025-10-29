import type { AstElement, AstTopLayer, AstBottomLayerValue } from '@samply/lens';

/**
 * Converts an AST element into a GraphQL filter string.
 *
 * This function takes an AST element, e.g. the result of the `parse` function
 * from `@samply/lens/ast`, and converts it into a valid GraphQL filter string,
 * which can be used with the Directory GraphQL API.
 *
 * The returned string is a valid GraphQL filter, and can be used directly in a
 * GraphQL query.
 *
 * If no filters are specified in the AST, an empty string is returned.
 *
 * @param ast - The AST element to be converted.
 * @returns A GraphQL filter string.
 */
export function astToGraphqlFilter(ast: AstElement): string {
	if (!ast) return '';
	const result = processAstNode(ast);
	if (result) {
		return `( filter: { ${result} } )`;
	}
	return '';
}

/**
 * Builds a GraphQL query string.
 *
 * Given a database name, a filter string and an optional list of attribute
 * names, this function returns a valid GraphQL query string.
 *
 * If no attribute names are specified, an empty string is returned.
 *
 * E.g. if database = "Biobanks" and filter = "( filter: { country: { name: {equals: \"UK\" } } } )"
 * and attributeNames = ["count"], the function will return the following string:
 *
 * query { Biobanks_agg( filter: { country: { name: {equals: \"UK\" } } } ){ count } }
 *
 * @param database - The name of the database to query.
 * @param filter - A valid GraphQL filter string.
 * @param attributeNames - An optional array of attribute names to include in the query.
 * @returns A valid GraphQL query string.
 */
export function buildGraphqlQuery(
	database: string,
	filter: string,
	attributeNames: string[]
): string {
	let attributeNamesString: string = '';
	if (attributeNames && attributeNames.length > 0) {
		attributeNamesString = '{ ' + attributeNames.join(', ') + ' }';
	}
	return `query { ${database}${filter} ${attributeNamesString} }`;
}

import { json } from '@sveltejs/kit';
const DIRECTORY_GRAPHQL_ENDPOINT = 'https://directory.bbmri-eric.eu/ERIC/api/graphql';

/**
 * Sends a GraphQL query to the Directory API and returns the result.
 *
 * Given a valid GraphQL query string, this function sends a POST request to the
 * Directory API and returns the result as a JSON object.
 *
 * If the request is unsuccessful, or if the response is not a valid JSON object,
 * an error message is returned in JSON format.
 *
 * @param query - A valid GraphQL query string.
 * @returns A JSON object containing the result of the query, or an error message if the request fails.
 */
export async function runGraphqlQuery(query: string) {
	try {
		const jsonStringifiedQuery = JSON.stringify({ query });

		console.log('runGraphqlQuery: jsonStringifiedQuery: ', jsonStringifiedQuery);

		const response = await fetch(DIRECTORY_GRAPHQL_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: jsonStringifiedQuery
		});

		console.log('runGraphqlQuery: response: ', response);

		if (!response.ok) {
			console.error(
				'runGraphqlQuery: Failed to fetch from Directory API, status: ',
				response.status,
				', URL: ',
				DIRECTORY_GRAPHQL_ENDPOINT,
				', jsonStringifiedQuery: ',
				jsonStringifiedQuery
			);
			return json({
				error:
					'Failed to fetch from Directory API,  status: ' +
					response.status +
					', URL' +
					DIRECTORY_GRAPHQL_ENDPOINT +
					', jsonStringifiedQuery: ' +
					jsonStringifiedQuery
			});
		}

		const result = await response.json();
		console.log('runGraphqlQuery: result: ', result);

		return result?.data;
	} catch (error) {
		console.error('runGraphqlQuery: Unexpected server error: ', error);
		return null;
	}
}

/**
 * Recursively converts an AST node into a GraphQL filter fragment.
 *
 * - For non-leaf nodes (nodes with `children`), it processes each child and:
 *   - returns an empty string if no child produced a filter,
 *   - returns the single child's filter if exactly one child produced a filter,
 *   - otherwise wraps multiple child filters in the corresponding GraphQL logical
 *     operand (e.g., `and: [ ... ]`, `or: [ ... ]`).
 * - For leaf nodes, delegates to {@link leafToFilter}.
 *
 * @param node - Any AST element (either a top-level node with `children` or a leaf).
 * @returns A GraphQL filter fragment string, or an empty string if nothing applies.
 */
function processAstNode(node: AstElement): string {
	if ('children' in node) {
		const childFilters = node.children.map(processAstNode).filter(Boolean);

		if (childFilters.length === 0) return '';

		// Nest in GraphQL-style operand if > 1
		if (childFilters.length === 1) {
			return childFilters[0];
		}

		const operandKey = operandToGraphQLKey(node.operand);
		return `${operandKey}: [${childFilters.join(', ')}]`;
	} else {
		return leafToFilter(node);
	}
}

/**
 * Converts a leaf AST value into a GraphQL filter fragment.
 *
 * Currently supports only the `EQUALS` operation by mapping it to something like:
 * `{ <key>: { name: { equals: <value> } } }`
 *
 * Notes:
 * - String values are automatically quoted; non-strings are stringified via `JSON.stringify`.
 * - Non-supported operations yield an empty string.
 *
 * @param leaf - A bottom-layer AST value with `key`, `type`, and `value`.
 * @returns A GraphQL filter fragment string for supported operations, otherwise an empty string.
 *
 * @example
 * // Produces: country: { name: { equals: "UK" } }
 * leafToFilter({ key: 'country', type: 'EQUALS', value: 'UK' });
 */
function leafToFilter(leaf: AstBottomLayerValue): string {
	const { key, type, value } = leaf;

	// Handle just the AST EQUALS for now
	if (type === 'EQUALS') {
		const formattedValue =
			typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
		let filter = `${key}: { name: {equals: ${formattedValue} } }`; // default generic filter. E.g. key = "country".
		// Build specialized filters, depending on AST key.
		if (key === `collection-type`)
			filter = `collections: { type: { name: {equals: ${formattedValue} } } }`;
		else if (key === `category`)
			filter = `collections: { categories: { name: {equals: ${formattedValue} } } }`;
		else if (key === `service-type`)
			filter = `services: { serviceTypes: { name: {equals: ${formattedValue} } } }`;
		return filter;
	}

	// Any other AST types will be silently ignored
	return '';
}

/**
 * Maps a high-level AST logical operand to its GraphQL key.
 *
 * The function provides a safe fallback to `and` for unknown operands.
 *
 * @param op - One of the supported top-layer operands (`AND`, `OR`, `XOR`, `NOT`).
 * @returns The corresponding GraphQL key (`and`, `or`, `xor`, `not`), or `and` by default.
 */
function operandToGraphQLKey(op: AstTopLayer['operand']): string {
	switch (op) {
		case 'AND':
			return 'and';
		case 'OR':
			return 'or';
		case 'XOR':
			return 'xor';
		case 'NOT':
			return 'not';
		default:
			return 'and'; // Fallback
	}
}
