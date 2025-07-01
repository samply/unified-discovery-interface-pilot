<script lang="ts">
	import './app.css';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import Linker from './Linker.svelte';
	import AiSearchField from './AiSearchField.svelte';
	//import { queryStore } from "@samply/lens";

	// If a results table cell contains "-1", it means that the cell is empty,
	// so we replace it with "-". This is done inside the shadow DOM of the
	// lens-result-table component.
	onMount(() => {
		let observer: MutationObserver | null = null;

		const waitForShadowRoot = () => {
			const lensTable = document.querySelector('lens-result-table');
			if (!lensTable) {
				// lens-result-table not found yet, retrying.
				setTimeout(waitForShadowRoot, 100);
				return;
			}

			const shadow = lensTable?.shadowRoot;
			if (!shadow) {
				// lens-result-table found but shadowRoot not ready yet, retrying.
				setTimeout(waitForShadowRoot, 100);
				return;
			}

			// Shadow root detected, attaching observer.
			observer = new MutationObserver(() => {
				const cells = shadow.querySelectorAll('td[part="table-body-cell"]');
				cells.forEach((cell) => {
					if (cell.textContent.trim() === '-1') {
						// Replacing -1 with - in cell
						cell.textContent = '-';
					}
				});
			});

			observer.observe(shadow, { childList: true, subtree: true });
		};

		waitForShadowRoot();

		// Disconnect when the component is destroyed
		return () => {
			if (observer) observer.disconnect();
		};
	});

	// conditional import for SSR
	if (browser) import('@samply/lens');

	import { measures } from './config/environment';
	import type { LensDataPasser, ResponseStore, SiteData } from '@samply/lens';
	import { catalogueText, fetchData } from './services/catalogue.service';
	import { requestBackend } from './services/backends/backend.service';
	import MyResultSummaryComponent from './MyResultSummaryComponent.wc.svelte';

	// Always show catalog hierarchy
	let catalogueopen = true;
	let catalogueCollapsable = false;

	const catalogueUrl = 'catalogues/catalogue-bbmri.json';
	const optionsFilePath = 'config/options.json';

	const jsonPromises: Promise<{
		catalogueJSON: string;
		optionsJSON: string;
	}> = fetchData(catalogueUrl, optionsFilePath);

	let dataPasser: LensDataPasser;

	const getAggregatedPopulation = (store: ResponseStore, code: string): number => {
		let population = 0;
		for (const site of store.values()) {
			if (site.status === 'succeeded') {
				population += getSitePopulationForCode(site.data, code);
			}
		}
		return population;
	};
	
	/**
	 * @param site - data of the responding site
	 * @param code - the code to search for
	 * @returns the population count for a given code at a given site
	 */
	export const getSitePopulationForCode = (site: SiteData, code: string): number => {
		let population = 0;
		for (const group of site.group) {
			if (group.code.text === code) {
				population += group.population[0].count;
			}
		}
		return population;
	};

	/**
	 * This event listener is triggered when the user clicks the search button
	 */
	if (browser) {
		window.addEventListener('emit-lens-query', (e) => {
			if (!dataPasser) return;

			const event = e as CustomEvent;
			const { ast, updateResponse, abortController } = event.detail;
			const criteria: string[] = dataPasser.getCriteriaAPI('diagnosis');

			requestBackend(ast, updateResponse, abortController, measures, criteria);

			// Get site count
			console.log('Initial site count: ', getAggregatedPopulation(dataPasser.getResponseAPI(), 'collection').toString());
			(async () => {
				console.log("Waiting ...");
				await new Promise(resolve => setTimeout(resolve, 10000));
				console.log("Done waiting!");
				console.log('Final site count: ', getAggregatedPopulation(dataPasser.getResponseAPI(), 'collection').toString());
				const responseStore = dataPasser.getResponseAPI();
				console.log('responseStore: ', responseStore);
			})();
		});
	}
</script>

<header>
	<div class="header-panel">
		<img
			class="header-panel-image"
			src="../assets/images/BBMRI-Logo-Slim.png"
			alt="UDI"
		/>
		<p class="header-panel-text">Unified Discovery Interface</p>
	</div>
</header>

<main>
	<div class="search">
		<div class="search-wrapper">
			<div>
				<AiSearchField />
				<lens-search-bar
					noMatchesFoundMessage={'No information found'}
					placeholderText={'Culumulative query'}
				></lens-search-bar>
			</div>
			<div class="button-container">
				<lens-info-button
					noQueryMessage="Query with no criteria selected: Searches for all collections."
					showQuery={true}
				></lens-info-button>
				<lens-search-button title="Search"></lens-search-button>
			</div>
		</div>
	</div>
	<div class="grid">
		<div class="catalogue-wrapper">
			<div class="catalogue">
				<!-- infoIconUrl should be in static/config/options.json under iconOptions according to the migration guide
				     for v0.5.0-alpha, but doing that causes a runtime error. -->
				<lens-catalogue
					infoIconUrl="info-circle-svgrepo-com.svg"
					texts={catalogueText}
					toggle={{ collapsable: catalogueCollapsable, open: catalogueopen }}
				></lens-catalogue>
			</div>
		</div>
		<div class="charts">
			<!-- Each chart requires an entry in static/config/options.json -->
			<!-- in the catalogueKeyToResponseKeyMap, providing mappings from the code for -->
			<!-- the stratifier to the catalogueGroupCode for the chart. You need to do this -->
			<!-- even if code and catalogueGroupCode are the same. -->

			<div class="chart-wrapper result-summary">
				<MyResultSummaryComponent></MyResultSummaryComponent>
			</div>
			<div class="chart-wrapper result-summary">
				<lens-result-summary></lens-result-summary>
			</div>
			<div class="chart-wrapper chart-double-width">
				<Linker
					title="Directory"
					sampleCount={250000}
					browseLink="https://directory.bbmri-eric.eu"
				>
					<!-- <img src="/DirectoryMock.png" alt="Directory" style="width: 200px; height: auto;" /> -->
					<img src="/DirectoryMock.png" alt="Directory" />
				</Linker>
			</div>
			<div class="chart-wrapper chart-double-width">
				<Linker
					title="Locator"
					sampleCount={3500}
					browseLink="https://locator.bbmri-eric.eu/"
				>
					<lens-chart
						title="Gender Distribution"
						catalogueGroupCode="gender"
						chartType="pie"
						displayLegends={true}
						xAxisTitle="Gender signifier"
						yAxisTitle="Number of patients"
					></lens-chart>
					<lens-chart
						title="Age Distribution"
						catalogueGroupCode="age_at_diagnosis"
						chartType="bar"
						displayLegends={true}
						groupRange={10}
						filterRegex="^(1*[12]*[0-9])"
					></lens-chart>
				</Linker>
			</div>
		</div>
	</div>

	<div class="credits">
		<p>
			This federated search was made with the open source <a
				href="https://github.com/samply/">Samply tools</a
			>
			(<a href="https://github.com/samply/lens/">Lens</a>,
			<a href="https://github.com/samply/beam/">Beam</a>), created by the
			<a href="https://www.dkfz.de/en/verbis/">German Cancer Research Center (DKFZ)</a>.
		</p>
	</div>
</main>

<!-- here it waits on all promises to resolve and fills in the parameters -->
{#await jsonPromises}
	Loading data...
{:then { optionsJSON, catalogueJSON }}
	<lens-options {catalogueJSON} {optionsJSON} {measures}></lens-options>
{:catch someError}
	System error: {someError.message}
{/await}

<lens-data-passer bind:this={dataPasser}></lens-data-passer>
