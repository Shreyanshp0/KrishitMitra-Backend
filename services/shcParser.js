const axios = require("axios");
const { parseSHCTextLocal } = require("./fallbackParser");
const { extractText } = require("./ocrService"); // Added to allow parser to trigger OCR as fallback

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

const normalizeNutrientCategory = (value) => {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return null;

  if (v.includes("low")) return "low";
  if (v.includes("medium") || v.includes("moderate") || v.includes("normal")) return "medium";
  if (v.includes("high")) return "high";
  return null;
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
 * Supports Multimodal (Image) or Text-based parsing.
 */
const getGeminiShcParsing = async (rawText, imageBuffer = null, mimeType = null) => {
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

Extract ALL soil parameter data from the provided document (text or image) and return a COMPLETE, VALID JSON object.

The document may vary in format, layout, or quality.

-----------------------------------
📌 DOCUMENT CONTEXT
-----------------------------------

- The input is a Soil Health Card (SHC) issued under Government of India schemes.
- The document typically contains:
  - Farmer/location details
  - A table of soil parameters
  - Result values + units
  - Status (Low/Medium/High/Normal)

-----------------------------------
🧠 EXTRACTION RULES (STRICT)
-----------------------------------

1. COMPLETE TABLE EXTRACTION (CRITICAL)
- Extract EVERY row from the soil parameter table
- Do NOT skip any parameter even if unclear

-----------------------------------
2. VALUE NORMALIZATION
-----------------------------------

- Convert numeric values to float or integer
- Remove units (kg/ha, %, dS/m, etc.)
- Extract only numeric values

-----------------------------------
3. MANDATORY VALIDATION
-----------------------------------

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
${rawText ? `\nRAW TEXT TO PARSE:\n${rawText}` : ""}
`;

    // Construct Multimodal Payload
    const parts = [{ text: prompt }];
    
    if (imageBuffer) {
      parts.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBuffer.toString("base64")
        }
      });
    }

    const payload = {
      contents: [{ parts }],
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
    throw error;
  }
};

/**
 * Main parser entry point.
 * Tries Gemini Vision first, falls back to Tesseract OCR + Local Parser.
 */
const parseAndNormalizeShcText = async (rawText, imageBuffer = null, mimeType = null, imagePath = null) => {
  let geminiData;
  try {
    console.log("Attempting Gemini Multimodal Parsing...");
    geminiData = await getGeminiShcParsing(rawText, imageBuffer, mimeType);
    console.log("Gemini Parsing Successful");
  } catch (error) {
    console.warn("Gemini Multimodal Parsing Failed, falling back to local OCR:", error.message);
    
    // 1. Get OCR Text locally if not already provided
    let textToUse = rawText;
    if (!textToUse && imagePath) {
      try {
        const { extractText } = require("./ocrService");
        textToUse = await extractText(imagePath);
      } catch (ocrError) {
        console.error("Local OCR Fallback Failed:", ocrError.message);
        throw new Error("Unable to parse document. Both Gemini and local OCR failed.");
      }
    }

    // 2. Use Local Regex Parser
    geminiData = parseSHCTextLocal(textToUse || "");
  }
  
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
