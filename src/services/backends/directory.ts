/**
 * Sends a query to the Directory and updates the store with the results.
 */

import type { ResponseStore } from '@samply/lens';

export class Directory {
	constructor(
		private url: URL,
		private sites: Array<string>,
		private currentTask: string
	) {}

	/**
	 * sends the query to the Directory and updates the store with the results
	 * @param query the query as base64 encoded string
	 * @param updateResponse the function to update the response store
	 * @param controller the abort controller to cancel the request
	 */
	async send(
		query: string,
		updateResponse: (response: ResponseStore) => void,
		controller: AbortController
	): Promise<void> {
		console.log('Directory.send: this function is probably a dummy');

		// Keep eslint happy
		console.debug(query, updateResponse, controller);

		// Convert query to a suitable intermediate format for relaying to Directory

		// Send query to Directory

		// Convert response to a format compatible with the response store.

		// Update response store
	}
}
