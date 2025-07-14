import { json, type RequestHandler } from '@sveltejs/kit';
import {
	astToGraphqlFilter,
	buildGraphqlQuery,
	runGraphqlQuery
} from '$lib/utils/ast-to-directory-graphql';

/**
 * Handles a GET request to fetch the biobank organization count from a GraphQL API.
 *
 * This function constructs a GraphQL query to retrieve the aggregated count of biobanks
 * and sends it to the specified GraphQL endpoint. The response is parsed to extract the count.
 * If the request is unsuccessful, or if the count is not available in the response, an error message
 * is returned in JSON format.
 *
 * @returns {Promise<Response>} A JSON response containing either the count of biobanks or an error message.
 */
export const GET: RequestHandler = async ({ url }) => {
	try {
		const astParam = url.searchParams.get('ast');
		let graphqlFilter = '';
		if (astParam) {
			const ast = JSON.parse(astParam);
			graphqlFilter = astToGraphqlFilter(ast);
		}

		console.log('GET: graphqlFilter: ', graphqlFilter);

		const query = buildGraphqlQuery('Biobanks_agg', graphqlFilter, ['count']);

		console.log('GET: the value of query: ', query);

		const data = await runGraphqlQuery(query);

		const count = data?.Biobanks_agg.count ?? 0;
		console.log('GET: count: ', count);
		if (count != null) {
			return json({ count });
		}

		console.error('Failed to fetch count from Directory API, data: ', data);
		return json({ error: 'Unknown error' });
	} catch (error) {
		return json({ error: `Unexpected server error ${error}, status: 500` });
	}
};
