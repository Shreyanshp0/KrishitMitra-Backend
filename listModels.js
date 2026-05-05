require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GeminiAPI);
    // There is no genAI.listModels() exposed directly in standard SDK that returns everything easily in a single array sometimes, 
    // but there is usually a REST endpoint or we can try to fetch via standard REST call.
    
    // Instead of using the SDK, let's just make a raw fetch call to the Google API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY || process.env.GeminiAPI}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

listModels();
