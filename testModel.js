require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GeminiAPI);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  try {
    const result = await model.generateContent("Hello");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Error with gemini-2.0-flash:", err.message);
  }
}

testModel();
