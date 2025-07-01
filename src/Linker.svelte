<script>
	export let title = 'Default Title';
	export let sampleCount = 0;
	export let browseLink = '#';
</script>

<div class="info-panel">
	<!-- Top Section (Title, Sample Count, Browse Button) -->
	<div class="top-section">
		<h2>{title}</h2>
		<span>Total Samples: {sampleCount}</span>
		<a href={browseLink} target="_blank">
			<button class="browse-button">Browse</button>
		</a>
	</div>

	<!-- The subcomponent will be inserted here -->
	<div class="slot-container">
		<slot />
	</div>
</div>

<style>
	.info-panel {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 8px;
		width: fit-content;

		/* min-width: 2000px; */
		min-width: 500px;
	}

	.top-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	.browse-button {
		padding: 5px 10px;
		background-color: blue;
		color: white;
		border: none;
		cursor: pointer;
		border-radius: 5px;
	}

	.slot-container {
		display: flex;
		gap: 1rem; /* Creates space between items */
		flex-wrap: nowrap; /* Prevents wrapping */
		justify-content: flex-start; /* Aligns them side by side */

		/*width: 80%;*/ /* Adjust percentage based on preference */
		max-width: 2000px; /* Prevents it from becoming too large */
	}
</style>
