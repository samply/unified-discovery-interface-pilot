<script lang="ts">
	export let directoryBiobankList: { id: string; name: string; url?: string }[] = [];
</script>

<div class="biobank-list">
	{#each directoryBiobankList as biobank}
		<div class="biobank-entry">
			<a
				href={'https://directory.bbmri-eric.eu/ERIC/directory/#/biobank/' + biobank.id}
				target="_blank"
				rel="noopener noreferrer"
				class="biobank-link"
			>
				{biobank.name}
			</a>
		</div>
	{/each}
</div>

<style>
	.biobank-list {
		max-height: 300px; /* Adjust as needed */
		overflow-y: auto;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 8px;
	}

	.biobank-entry {
		margin: 0.25rem 0;
	}

	.biobank-link {
		color: blue;
		text-decoration: underline;
	}
</style>
