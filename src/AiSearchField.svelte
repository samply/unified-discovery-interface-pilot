<script>
    import { queryAi } from '$lib/ai-client';

    let searchText = '';
    let loading = false;

    async function handleKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (searchText.trim() === '') return;

            loading = true;
            searchText = await queryAi(searchText, 0);
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
