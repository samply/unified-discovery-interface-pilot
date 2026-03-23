import { env } from '$env/dynamic/private';

type ChatMessage = {
	role: 'system' | 'user' | 'assistant';
	content: string;
};

function getConfig() {
	const baseURL = env.AI_BASE_URL ?? 'http://localhost:11434/v1';
	const model = env.AI_MODEL ?? 'mistral';
	const apiKey = env.AI_API_KEY ?? 'ollama';
	const maxTries = Number(env.AI_MAX_TRIES ?? '3');

	return { baseURL, model, apiKey, maxTries };
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string | null> {
	const { baseURL, model, apiKey, maxTries } = getConfig();
    const url = `${baseURL}/chat/completions`;
	console.log('chatCompletion: using AI URL:', url);

	for (let attempt = 1; attempt <= maxTries; attempt++) {
	    console.log('chatCompletion: attempt:', attempt);
		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model,
					messages,
					temperature: 0,
					stream: false
				})
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(`AI HTTP ${response.status}: ${text}`);
			}

			const data = await response.json();
			const content = data?.choices?.[0]?.message?.content;

			if (typeof content === 'string' && content.trim()) {
				return content;
			}
		} catch (err) {
			if (attempt === maxTries) {
				console.error('Problem talking to URL:', url);
				console.error('AI request failed:', err);
				return null;
			}
		}
	}

	return null;
}