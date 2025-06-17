<script lang="ts">
	import { queryAi } from '$lib/ai-client';
	import { AiQueryResult } from '$lib/types/ai-query-result';
	import { AddItems } from '$lib/add-items';

	let searchText = '';
	let loading = false;

	async function handleKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (searchText.trim() === '') return;

			loading = true;
			let aiQueryResult: AiQueryResult | null = await queryAi(searchText, 0);
			if (aiQueryResult) {
				console.log('Query result:', aiQueryResult);
				console.log('Gender:', aiQueryResult.getGender());
				console.log('Diagnosis:', aiQueryResult.getDiagnosis());
				console.log('Age at Diagnosis:', aiQueryResult.getAgeAtDiagnosis());
				console.log('Date of Diagnosis:', aiQueryResult.getDateOfDiagnosis());
				console.log('Sampling Date:', aiQueryResult.getSamplingDate());
				console.log('Patient Age:', aiQueryResult.getPatientAge());
				console.log('Sample Type:', aiQueryResult.getSampleType());
				console.log('Storage Temperature:', aiQueryResult.getSampleStorageTemperature());

				AddItems.gender(aiQueryResult.getGender());
				AddItems.sampleType(aiQueryResult.getSampleType());
				AddItems.ageAtDiagnosis(aiQueryResult.getAgeAtDiagnosis());
				AddItems.patientAge(aiQueryResult.getPatientAge());
			}
			loading = false;
		}
	}
</script>

<textarea
	class="search-field"
	bind:value="{searchText}"
	placeholder="Type a free-text query and press Enter..."
	rows="4"
	on:keypress="{handleKeyPress}"
></textarea>

{#if loading}
	<p>Processing...</p>
{/if}

<style>
	.search-field {
		width: 100%;
		padding: 8px;
		font-size: 16px;
		border: 1px solid #ccc;
		border-radius: 5px;
		margin-bottom: 10px; /* Adds space underneath */
	}
</style>
