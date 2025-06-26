/**
 * TODO: document this class
 */

import type { ResponseStore, SiteData, BeamResult } from '@samply/lens';
import { showErrorToast, translate } from '@samply/lens';

export class Spot {
	constructor(
		private url: URL,
		private sites: Array<string>,
		private currentTask: string
	) {}

	/**
	 * sends the query to beam and updates the store with the results
	 * @param query the query as base64 encoded string
	 * @param updateResponse the function to update the response store
	 * @param controller the abort controller to cancel the request
	 */
	async send(
		query: string,
		updateResponse: (response: ResponseStore) => void,
		controller: AbortController
	): Promise<void> {
		console.log(`send: entered, query: ${query}`);
		console.log(`send: entered, atob(query): ${atob(query)}`);
		let query1 = JSON.parse(atob(query));
		console.log(`send: entered, query1: ${query1}`);
		let ast = query1.payload;
		console.log(`send: ast: ${ast}`);
		let decodedAst = atob(ast);
		console.log(`send: decodedAst: ${decodedAst}`);
		try {
			console.log(`send: fetch, this.url: ${this.url}`);
			const beamTaskResponse = await fetch(
				`${this.url}beam?sites=${this.sites.toString()}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify({
						id: this.currentTask,
						sites: this.sites,
						query: query
					}),
					signal: controller.signal
				}
			);
			console.log(`send: check beamTaskResponse`);
			if (!beamTaskResponse.ok) {
				const error = await beamTaskResponse.text();
				console.debug(`Received ${beamTaskResponse.status} with message ${error}`);
				throw new Error(`Unable to create new beam task.`);
			}

			console.info(`Created new Beam Task with id ${this.currentTask}`);
			console.log(`send: Created new Beam Task with id ${this.currentTask}`);

			const eventSource = new EventSource(
				`${this.url.toString()}beam/${this.currentTask}?wait_count=${this.sites.length}`,
				{
					withCredentials: true
				}
			);

			console.log(`send: listen for result`);

			/**
			 * Listenes to the new_result event from beam and updates the response store
			 */
			eventSource.addEventListener('new_result', (message) => {
				const response: BeamResult = JSON.parse(message.data);
				console.log(`addEventListener: response.task: ${response.task}`);
				if (response.task !== this.currentTask) return;
				const site: string = response.from.split('.')[1];
				const status = response.status;
				console.log(`addEventListener: site: ${site}, status: ${status}`);
				const body: SiteData =
					status === 'succeeded' ? JSON.parse(atob(response.body)) : null;
				console.log(`addEventListener: body: ${body}`);
				console.log(`addEventListener: response.body: ${response.body}`);

				const parsedResponse: ResponseStore = new Map().set(site, {
					status: status,
					data: body
				});
				console.log(`addEventListener: run updateResponse`);
				updateResponse(parsedResponse);
				console.log(`addEventListener: done`);
			});

			console.log(`send: read error events from beam`);

			// read error events from beam
			eventSource.addEventListener('error', (message) => {
				console.error(`Beam returned error`, message);
				eventSource.close();
			});

			console.log(`send: throw error if needed`);

			// event source in javascript throws an error then the event source is closed by backend
			eventSource.onerror = () => {
				console.info(
					`Querying results from sites for task ${this.currentTask} finished.`
				);
				eventSource.close();
			};

			console.log(`send: looking good`);
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') {
				console.log(`Aborting request ${this.currentTask}`);
			} else {
				console.error(err);
				showErrorToast(translate('network_error'));
			}
		}

		console.log(`send: done`);
	}
}
