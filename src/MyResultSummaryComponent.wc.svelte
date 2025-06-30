<script lang="ts">
	import { lensOptions, setOptions } from './my-options';
	import {
		responseStore,
		getAggregatedPopulation,
		getAggregatedPopulationForStratumCode
	} from './my-response';
	import type { ResponseStore } from '@samply/lens';
	import type { HeaderData } from '@samply/lens';

	setOptions(JSON.parse('[]'));

	// This is derived from lensOptions and from responseStore
	const populations: { title: string; population: string }[] = $derived.by(() => {
		console.log('populations: entered');

		// Show empty header when lens options are not loaded yet
		if ($lensOptions === undefined) {
			console.log('populations: lensOptions is undefined');
			return [];
		}

		console.log('populations: do something amusing, heh!');
		let phew: HeaderData = {
			title: 'Standorte',
			dataKey: 'collections'
		};
		let grobbles = getPopulation(phew, $responseStore);
		console.log('populations: grobbles: ', grobbles);

		console.log('populations: loop over options');

		const populations = [];
		if ($lensOptions?.resultSummaryOptions?.dataTypes !== undefined) {
			for (const type of $lensOptions.resultSummaryOptions.dataTypes) {
				console.log('populations: type: ', type);
				populations.push({
					title: type.title,
					population: getPopulation(type, $responseStore)
				});
			}
		}

		console.log('populations: number of populations: ', populations.length);

		return populations;
	});

	const sitePopulation: { title: string; population: string } = $derived.by(() => {
		console.log('populations: entered');

		// Show empty header when lens options are not loaded yet
		if ($lensOptions === undefined) {
			console.log('populations: lensOptions is undefined');
			return [];
		}

		console.log('populations: do something amusing, heh!');
		let siteHeaderData: HeaderData = {
			title: 'Sites',
			dataKey: 'collections'
		};
		let sitePopulation = getPopulation(siteHeaderData, $responseStore);
		console.log('populations: sitePopulation: ', sitePopulation);

		return {
			title: siteHeaderData.title,
			population: sitePopulation
		};
	});

	/**
	 * Get the count to display in the result summary header.
	 * @param type An element of the "dataTypes" array from the lens options
	 * @param store The current value of the response store
	 * @returns This is the text that is displayed after the colon, e.g. "Standorte: 13 / 15"
	 */
	function getPopulation(type: HeaderData, store: ResponseStore): string {
		console.log('getPopulation: type.dataKey: ', type.dataKey);
		// If the type is collections, the population is the length of the store
		if (type.dataKey === 'collections') {
			let sitesClaimed = 0;
			let sitesWithData = 0;
			for (const site of $responseStore.values()) {
				if (site.status === 'claimed' || site.status === 'succeeded') {
					sitesClaimed++;
				}
				if (site.status === 'succeeded') {
					sitesWithData++;
				}
			}
			return `${sitesWithData} / ${sitesClaimed}`;
		}

		// if the type has only one dataKey, the population is the aggregated population of that dataKey
		if (type.dataKey) {
			return getAggregatedPopulation(store, type.dataKey).toString();
		}

		// if the type has multiple dataKeys to aggregate, the population is the aggregated population of all dataKeys
		let aggregatedPopulation: number = 0;
		type.aggregatedDataKeys?.forEach((dataKey) => {
			if (dataKey.groupCode) {
				aggregatedPopulation += getAggregatedPopulation(store, dataKey.groupCode);
			} else if (dataKey.stratifierCode && dataKey.stratumCode) {
				aggregatedPopulation += getAggregatedPopulationForStratumCode(
					store,
					dataKey.stratumCode,
					dataKey.stratifierCode
				);
			}
			/**
			 * TODO: add support for stratifiers if needed?
			 * needs to be implemented in response.ts
			 */
		});
		return aggregatedPopulation.toString();
	}
</script>

<div part="result-summary-content">
	Some text
	<!-- eslint-disable-next-line svelte/require-each-key -->
	{#each populations as population}
		<div part="result-summary-content-type">
			{population.title}: {population.population}
		</div>
	{/each}
	<div part="result-summary-content-type">
		{sitePopulation.title}: {sitePopulation.population}
	</div>
</div>
