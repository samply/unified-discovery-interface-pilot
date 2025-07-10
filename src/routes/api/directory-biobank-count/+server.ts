import { json } from '@sveltejs/kit';

const DIRECTORY_GRAPHQL_ENDPOINT = 'https://directory.bbmri-eric.eu/ERIC/api/graphql';

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
export async function GET() {
    const query = `query { Biobanks_agg { count } }`;

    try {
        const jsonStringifiedQuery = JSON.stringify({ query });

        const response = await fetch(DIRECTORY_GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: jsonStringifiedQuery
        });

        if (!response.ok) {
            return json({ error: 'Failed to fetch from Directory API,  status: ' + response.status + ', URL' +  DIRECTORY_GRAPHQL_ENDPOINT + ', jsonStringifiedQuery: ' + jsonStringifiedQuery });
        }

        const result = await response.json();
        const count = result?.data?.Biobanks_agg.count ?? 0;
        if (count != null) {
            return json({ count });
        }

        return json({ error: 'Unknown error' });
    } catch (error) {
        return json({ error: 'Unexpected server error' }, { status: 500 });
    }
}