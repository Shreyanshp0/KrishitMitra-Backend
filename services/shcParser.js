const axios = require("axios");

const coerceNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value)
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "")
    .trim();

  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const threshold = (envName, fallback) => {
  const v = Number(process.env[envName]);
  return Number.isFinite(v) ? v : fallback;
};

const normalizeNpkFromNumeric = (value, { lowMax, mediumMax }) => {
  if (!Number.isFinite(value)) return null;
  if (value <= lowMax) return "low";
  if (value <= mediumMax) return "medium";
  return "high";
};

const normalizePhFromNumeric = (value) => {
  if (!Number.isFinite(value)) return null;
  if (value < threshold("SHC_PH_NEUTRAL_MIN", 6.5)) return "acidic";
  if (value <= threshold("SHC_PH_NEUTRAL_MAX", 7.5)) return "neutral";
  return "alkaline";
};

/**
 * Calls Gemini API to parse SHC data.
 * Supports Multimodal (Image/PDF) parsing.
 */
const getGeminiShcParsing = async (imageBuffer, mimeType) => {
  try {
    const apiKey = process.env.GeminiAPI;
    if (!apiKey) throw new Error("GeminiAPI key is missing in .env");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `
SYSTEM ROLE:
You are a specialized OCR engine and Agricultural Data Scientist trained on Indian Soil Health Card (SHC) formats.

-----------------------------------
🎯 OBJECTIVE
-----------------------------------

Extract ALL soil parameter data from the provided document and return a COMPLETE, VALID JSON object.

-----------------------------------
🧠 EXTRACTION RULES (STRICT)
-----------------------------------

1. COMPLETE TABLE EXTRACTION
- Extract EVERY row from the soil parameter table.

2. VALUE NORMALIZATION
- Convert numeric values to float or integer.
- Remove units (kg/ha, %, dS/m, etc.).

3. MANDATORY VALIDATION
Ensure these are NOT missed:
- Nitrogen (N)
- Phosphorus (P)
- Potassium (K)
- pH

-----------------------------------
📦 OUTPUT FORMAT (STRICT JSON ONLY)
-----------------------------------

Return ONLY a valid JSON object.
Do NOT include explanations or markdown.

{
  "location": {
    "state": "",
    "district": ""
  },
  "rawData": {
    "texture": "",
    "ph": 0,
    "ec": 0,
    "organicCarbon": 0,
    "nitrogen": 0,
    "phosphorus": 0,
    "potassium": 0,
    "zinc": 0
  },
  "processedData": {
    "nitrogen": "",
    "phosphorus": "",
    "potassium": "",
    "ph": ""
  }
}
`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: imageBuffer.toString("base64")
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    const response = await axios.post(url, payload);
    let textRes = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textRes) throw new Error("Invalid response format from Gemini");

    textRes = textRes.trim();
    if (textRes.startsWith("\`\`\`json")) textRes = textRes.substring(7);
    else if (textRes.startsWith("\`\`\`")) textRes = textRes.substring(3);
    if (textRes.endsWith("\`\`\`")) textRes = textRes.substring(0, textRes.length - 3);
    textRes = textRes.trim();

    return JSON.parse(textRes);
  } catch (error) {
    console.error("Gemini Parsing Error:", error.response?.data || error.message);
    throw new Error("Unable to parse Soil Health Card document. Ensure the image/PDF is clear.");
  }
};

/**
 * Main parser entry point.
 */
const parseAndNormalizeShcText = async (imageBuffer, mimeType) => {
  const geminiData = await getGeminiShcParsing(imageBuffer, mimeType);
  
  const rawData = geminiData.rawData || {};
  const processedData = geminiData.processedData || {};
  const location = geminiData.location || {};

  const cleanNumeric = (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const num = Number(val);
      return Number.isNaN(num) || num === 0 ? null : num;
  };

  const cleanCategory = (val) => {
      const v = String(val || "").trim().toLowerCase();
      if (!v) return null;
      if (v.includes("low") || v.includes("acidic")) return v.includes("low") ? "low" : "acidic";
      if (v.includes("medium") || v.includes("neutral") || v.includes("normal") || v.includes("moderate")) return v.includes("neutral") ? "neutral" : "medium";
      if (v.includes("high") || v.includes("alkaline")) return v.includes("high") ? "high" : "alkaline";
      return null;
  };

  return {
    location: {
      state: location.state || null,
      district: location.district || null,
    },
    rawData: {
      nitrogen: cleanNumeric(rawData.nitrogen),
      phosphorus: cleanNumeric(rawData.phosphorus),
      potassium: cleanNumeric(rawData.potassium),
      ph: cleanNumeric(rawData.ph),
      ec: cleanNumeric(rawData.ec),
      organicCarbon: cleanNumeric(rawData.organicCarbon),
    },
    processedData: {
      nitrogen: cleanCategory(processedData.nitrogen) || normalizeNpkFromNumeric(cleanNumeric(rawData.nitrogen), { lowMax: threshold("SHC_N_LOW_MAX", 280), mediumMax: threshold("SHC_N_MED_MAX", 560) }),
      phosphorus: cleanCategory(processedData.phosphorus) || normalizeNpkFromNumeric(cleanNumeric(rawData.phosphorus), { lowMax: threshold("SHC_P_LOW_MAX", 12.5), mediumMax: threshold("SHC_P_MED_MAX", 25) }),
      potassium: cleanCategory(processedData.potassium) || normalizeNpkFromNumeric(cleanNumeric(rawData.potassium), { lowMax: threshold("SHC_K_LOW_MAX", 135), mediumMax: threshold("SHC_K_MED_MAX", 335) }),
      ph: cleanCategory(processedData.ph) || normalizePhFromNumeric(cleanNumeric(rawData.ph)),
    },
    rawGeminiData: geminiData
  };
};

module.exports = {
  parseAndNormalizeShcText,
  normalizePhFromNumeric,
  normalizeNpkFromNumeric,
};
