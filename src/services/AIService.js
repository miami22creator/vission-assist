
const SYSTEM_PROMPT = `You are a multimodal assistant designed to help blind and visually impaired users in real time.
CONTEXT & INPUT: The user is using a mobile app. The phone camera is sending you images.
GOALS: Describe clearly and concisely what the camera is seeing. Help the user understand their surroundings. Read visible text. Guide the user. Prioritize safety.
DESCRIPTION STYLE: Short, clear sentences. No "as you can see". Use relative positions.
SAFETY RULES: Warn about danger clearly.
`;

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
  "gemini-1.5-pro",
  "gemini-1.5-pro-001",
  "gemini-pro-vision"
];

const AIService = {
  analyzeImage: async (imageBase64, userQuery, config) => {
    const { provider, apiKey } = config;

    if (!apiKey) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return "Simulation Mode: Please enter your API Key in settings to see the real world.";
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    try {
      if (provider === 'gemini') {
        return await callGeminiWithFallback(cleanBase64, userQuery, apiKey);
      } else {
        return await callOpenAI(imageBase64, userQuery, apiKey);
      }
    } catch (error) {
      console.error("AI Service Error:", error);
      return `Error: ${error.message || "Could not connect to AI."}`;
    }
  },
};

async function callGeminiWithFallback(base64Image, query, apiKey) {
  let lastError = null;

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${model}`);
      return await callGemini(base64Image, query, apiKey, model);
    } catch (error) {
      console.warn(`Model ${model} failed:`, error.message);
      lastError = error;
      // If it's an auth error (403/401), don't bother retrying other models
      if (error.message.includes("403") || error.message.includes("401") || error.message.includes("API key")) {
        throw error;
      }
      // Continue to next model if it was a 404 (Not Found) or other error
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
}

async function callGemini(base64Image, query, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: `${SYSTEM_PROMPT}\nUser Question: ${query}` },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `Gemini API (${model}) failed`);
  }

  const data = await response.json();
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("No response candidates from Gemini");
  }
  return data.candidates[0].content.parts[0].text;
}

async function callOpenAI(base64Image, query, apiKey) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: query },
            { type: "image_url", image_url: { url: base64Image } }
          ]
        }
      ],
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "OpenAI API failed");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export default AIService;
