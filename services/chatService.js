const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GeminiAPI);

const generateChatResponse = async ({ message, location, context }) => {
  const prompt = `
You are an expert agricultural assistant for Indian farmers.

RULES:
- Use VERY SIMPLE language
- Answer like speaking to a farmer
- Keep response under 120 words
- Be practical and actionable
- Avoid technical jargon
- If scheme exists → mention clearly

LOCATION:
State: ${location?.state || "Unknown"}
District: ${location?.district || "Unknown"}

FARM CONTEXT:
Soil: ${context?.soilType || "Unknown"}
Season: ${context?.season || "Unknown"}
Water: ${context?.waterAvailability || "Unknown"}

USER QUESTION:
${message}

RESPONSE:
`;

  const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest"];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Trying Gemini model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`Successfully generated response using ${modelName}`);
      return text;
    } catch (error) {
      console.warn(`Failed with model ${modelName}:`, error.message);
      lastError = error;
    }
  }

  console.error("All Gemini models failed. Last error:", lastError);
  throw lastError;
};

module.exports = {
  generateChatResponse,
};
