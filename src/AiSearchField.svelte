<script>
	let searchText = '';
	let loading = false;

	async function handleKeyPress(event) {
		if (event.key === 'Enter') {
			event.preventDefault(); // Prevents newline in `textarea`
			if (searchText.trim() === '') return;

			loading = true;

			try {
				const response = await fetch('http://localhost:11434/api/generate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						model: 'mistral',
						prompt: "You are an expert in Biobanks and patient data. You can analyze queries in free text and generate JSON with the following elements: gender (a smple string), diagnosis (a list of ICD-10 codes), age_at_diagnosis (a map, with explicit lower and upper values), date_of_diagnosis, patient_age (a map, with explicit lower and upper values), sample_type (a list), sampling_date, sample_storage_temperature (a list). Please convert the following text into JSON: " + searchText,
						stream: false // Disables streaming, returns full response at once
					})
				});

				const data = await response.json();
				searchText = data.response; // Directly set the full response
			} catch (error) {
				console.error('Error:', error);
				searchText = 'Error contacting Ollama.';
			} finally {
				loading = false;
			}
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
