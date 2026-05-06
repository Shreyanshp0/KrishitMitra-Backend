const axios = require("axios");

const buildPrompt = ({ pipeline, soilData, location, weather, prices, odopCrops, selectedLanguage }) => {
  let soilBlock = "";
  let role = "";

  if (pipeline === "shc") {
    role = "expert soil chemist and precision agriculture AI";
    soilBlock = `
SOIL HEALTH CARD (SHC) DATA:
- Nitrogen: ${soilData.nitrogen || "Unknown"}
- Phosphorus: ${soilData.phosphorus || "Unknown"}
- Potassium: ${soilData.potassium || "Unknown"}
- pH: ${soilData.ph || "Unknown"}
    `;
  } else {
    role = "expert agronomist and crop recommendation AI";
    soilBlock = `
MANUAL GENERAL INPUTS:
- Season: ${soilData.season || "Unknown"}
- Soil Type: ${soilData.soilType || "Unknown"}
- Soil Fertility: ${soilData.soilFertility || "Unknown"}
- Water Availability: ${soilData.waterAvailability || "Unknown"}
- Irrigation Source: ${soilData.irrigationSource || "Unknown"}
- Priority: ${soilData.priority || "Yield"}
    `;
  }

  const odopText = odopCrops && odopCrops.length > 0 
    ? odopCrops.join(", ") 
    : "None found";

  return `
You are an ${role}.
Based on the provided location, soil data, and external factors, provide highly suitable crop recommendations.

IMPORTANT LANGUAGE RULE:
Generate the ENTIRE response only in ${selectedLanguage}.

- Crop names
- Reasons
- Explanations
- Confidence descriptions

All text must be in ${selectedLanguage}.

Use simple farmer-friendly language.
Avoid technical jargon.

-----------------------------------
📍 LOCATION:
- State: ${location.state || "Unknown"}
- District: ${location.district || "Unknown"}

-----------------------------------
🌱 SOIL DATA:
${soilBlock.trim()}

-----------------------------------
🌤️ WEATHER DATA:
${JSON.stringify(weather || "Unknown", null, 2)}

-----------------------------------
💰 CURRENT CROP PRICES (For Economic Priority):
${JSON.stringify(prices || "Unknown", null, 2)}

-----------------------------------
🚨 MANDATORY RULE (ODOP INTEGRATION):
The "One District One Product" (ODOP) crops for this district are: [${odopText}]
RULE: If ANY of the ODOP crops are scientifically suitable for the given soil and weather, you MUST include them in your top recommendations.

-----------------------------------
📦 OUTPUT FORMAT:
Return exactly this JSON schema and nothing else:
{
  "recommendations": [
    {
      "crop": "Crop Name",
      "reason": "Detailed reason including why it matches the soil, weather, or ODOP priority in ${selectedLanguage}.",
      "confidence": "High/Medium/Low",
      "costOfCultivation": "Estimated cost per acre (e.g., ₹15,000) in ${selectedLanguage}",
      "estimatedROI": "Estimated profit margin or return on investment per acre in ${selectedLanguage}",
      "fertilizers": "Recommended fertilizers to help grow the crop better in ${selectedLanguage}"
    }
  ]
}
Return up to 3 recommendations. Do not include markdown formatting.
`;
};

const getRecommendations = async ({ pipeline, soilData, location, weather, prices, odopCrops, selectedLanguage }) => {
  try {
    const apiKey = process.env.GeminiAPI;
    if (!apiKey) {
      throw new Error("GeminiAPI key is missing in .env");
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const prompt = buildPrompt({ pipeline, soilData, location, weather, prices, odopCrops, selectedLanguage });

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
      }
    };

    console.log("==========================================");
    console.log("Gemini Prompt:\n", prompt);
    console.log("==========================================");

    const response = await axios.post(url, payload);
    let textRes = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textRes) {
      throw new Error("Invalid response format from Gemini (no text field found)");
    }

    textRes = textRes.trim();
    if (textRes.startsWith("```json")) textRes = textRes.substring(7);
    else if (textRes.startsWith("```")) textRes = textRes.substring(3);
    if (textRes.endsWith("```")) textRes = textRes.substring(0, textRes.length - 3);
    textRes = textRes.trim();

    try {
      return JSON.parse(textRes);
    } catch (parseErr) {
      console.error("JSON Parse Error on text:\n", textRes);
      throw new Error("Gemini response is not valid JSON");
    }
  } catch (error) {
    console.error("Gemini Error:", error.response?.data || error.message);
    
    console.log("Returning Fallback Response due to Gemini failure.");
    
    // Fallback: Try to use an ODOP crop if available, otherwise Wheat.
    const fallbackCrop = (odopCrops && odopCrops.length > 0) ? odopCrops[0] : "Wheat";
    
    return {
      recommendations: [
        {
          crop: fallbackCrop,
          reason: "Fallback recommendation triggered due to AI service unavailability. This is a locally relevant crop.",
          confidence: "Low",
          costOfCultivation: "Unknown",
          estimatedROI: "Unknown",
          fertilizers: "General NPK"
        }
      ]
    };
  }
};

module.exports = {
  getRecommendations,
};
