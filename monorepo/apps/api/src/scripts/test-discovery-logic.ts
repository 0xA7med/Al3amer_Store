import { ModelDiscoveryService } from "../services/model-discovery.service.js";

async function test() {
    // Mocking fetch globally for this test
    const originalFetch = global.fetch;
    
    // Test Case 1: OpenRouter-style response (if redirected)
    global.fetch = (async (url: string) => {
        return {
            ok: true,
            status: 200,
            json: async () => ({
                models: [
                    { name: "models/gemini-pro", supportedGenerationMethods: ["generateContent"] },
                    { name: "google/gemini-2.0-flash:free", supportedGenerationMethods: ["generateContent"] },
                    { name: "nvidia/nemotron-3-super-120b-a12b:free", supportedGenerationMethods: ["generateContent"] },
                    { name: "models/gemini-1.5-flash-tts", supportedGenerationMethods: ["generateContent"] }
                ]
            })
        };
    }) as any;

    console.log("--- Testing Discovery with Mixed Models ---");
    const models = await ModelDiscoveryService.discoverModels("fake-key");
    console.log("Discovered Models:", models);

    global.fetch = originalFetch;
}

test();
