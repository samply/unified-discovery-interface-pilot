<script>
  let searchText = "";
  let loading = false;

  async function handleKeyPress(event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevents newline in `textarea`
      if (searchText.trim() === "") return;

      loading = true;

      try {
        const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "mistral",
            prompt: searchText,
            stream: false // Disables streaming, returns full response at once
        })
        });

        const data = await response.json();
        searchText = data.response; // Directly set the full response
      } catch (error) {
        console.error("Error:", error);
        searchText = "Error contacting Ollama.";
      } finally {
        loading = false;
      }
    }
  }
</script>

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

<textarea
  class="search-field"
  bind:value={searchText}
  placeholder="Type a free-text query and press Enter..."
  rows="4"
  on:keypress={handleKeyPress}
/>

{#if loading}
  <p>Processing...</p>
{/if}
