import type { AstElement, AstTopLayer, AstBottomLayerValue } from '@samply/lens';

/**
 * Converts an AST element into a GraphQL filter string.
 *
 * This function takes an AST element, e.g. the result of the `parse` function
 * from `@samply/lens/ast`, and converts it into a valid GraphQL filter string,
 * which can be used with the Samply.MDS GraphQL API.
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
 * Sends a GraphQL query to the Samply.MDS Directory API and returns the result.
 *
 * Given a valid GraphQL query string, this function sends a POST request to the
 * Samply.MDS Directory API and returns the result as a JSON object.
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

function leafToFilter(leaf: AstBottomLayerValue): string {
	const { key, type, value } = leaf;

	// Handle EQUALS only for now
	if (type === 'EQUALS') {
		const formattedValue =
			typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
		return `${key}: { name: {equals: ${formattedValue} } }`;
	}

	// You can add more operations (e.g., RANGE, CONTAINS) here
	return '';
}

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
