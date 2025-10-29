import { json, type RequestHandler } from '@sveltejs/kit';
import {
	astToGraphqlFilter,
	buildGraphqlQuery,
	runGraphqlQuery
} from '$lib/utils/ast-to-directory-graphql';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const astParam = url.searchParams.get('ast');
		let graphqlFilter = '';
		if (astParam) {
			const ast = JSON.parse(astParam);
			graphqlFilter = astToGraphqlFilter(ast);
		}

		console.log('GET list: graphqlFilter: ', graphqlFilter);

		const query = buildGraphqlQuery('Biobanks', graphqlFilter, ['id', 'name', 'url']);

		console.log('GET list: the value of query: ', query);

		const data = await runGraphqlQuery(query);

		console.log('GET list: data: ', data);

		return json(data);
	} catch (error) {
		return json({ error: `Unexpected server error ${error}, status: 500` });
	}
};
