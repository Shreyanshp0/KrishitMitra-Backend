const axios = require("axios");
const { parseSHCTextLocal } = require("./fallbackParser");

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

const getGeminiShcParsing = async (rawText) => {
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

Extract ALL soil parameter data from a Soil Health Card document (image or PDF) and return a COMPLETE, VALID JSON object.

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
- Common parameters include:
  - Texture
  - pH
  - EC (Electrical Conductivity)
  - Organic Carbon (OC)
  - Nitrogen (N)
  - Phosphorus (P)
  - Potassium (K)
  - Zinc (Zn)
  - Other micronutrients (if present)

-----------------------------------
2. OCR RECOVERY (INTELLIGENT)
-----------------------------------

- If text is blurry or partially visible:
  - Infer correct agricultural terms
  - Examples:
    "PH" → pH
    "OC" → Organic Carbon
    "NPK" → Nitrogen, Phosphorus, Potassium

-----------------------------------
3. VALUE NORMALIZATION
-----------------------------------

- Convert numeric values to float or integer
- Remove units (kg/ha, %, dS/m, etc.)
- Extract only numeric values

Example:
"280 kg/ha" → 280

-----------------------------------
4. STATUS EXTRACTION
-----------------------------------

- Capture status as string:
  - "Low"
  - "Medium"
  - "High"
  - "Normal"

-----------------------------------
5. MANDATORY VALIDATION (VERY IMPORTANT)
-----------------------------------

Ensure these are NOT missed:

- Nitrogen (N)
- Phosphorus (P)
- Potassium (K)

Even if table is complex or misaligned.

-----------------------------------
6. LOCATION EXTRACTION
-----------------------------------

Extract:
- State
- District

If not clearly present, return empty string ""

-----------------------------------
7. PROCESSED DATA LOGIC
-----------------------------------

Convert numeric values into categories:

- Nitrogen:
  low / medium / high
- Phosphorus:
  low / medium / high
- Potassium:
  low / medium / high
- pH:
  acidic (<6.5)
  neutral (6.5–7.5)
  alkaline (>7.5)

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

-----------------------------------
⚠️ CONSTRAINTS
-----------------------------------

- Output MUST be valid JSON
- No missing keys
- If value not found → use:
  - "" for text
  - 0 for numeric
- Do NOT skip any parameter

-----------------------------------
🛠️ PERFORMANCE OPTIMIZATION (IMPORTANT)
-----------------------------------

- Temperature: 0.0 or 0.1
- response_mime_type: "application/json"
- Avoid creative interpretation—focus on accuracy

-----------------------------------
🚨 ERROR HANDLING STRATEGY
-----------------------------------

If OCR fails partially:
- Return partial data with available values
- Do NOT crash or return invalid JSON

-----------------------------------
RAW TEXT TO PARSE:
${rawText}
`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
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

    let parsed;
    try {
      parsed = JSON.parse(textRes);
    } catch (err) {
      throw new Error("Unable to parse SHC data. Try clearer image.");
    }

    return parsed;
  } catch (error) {
    console.error("Gemini Parsing Error:", error.response?.data || error.message);
    // Rethrow to be caught by the fallback mechanism in parseAndNormalizeShcText
    throw error;
  }
};

const parseAndNormalizeShcText = async (rawText) => {
  let geminiData;
  try {
    geminiData = await getGeminiShcParsing(rawText);
  } catch (error) {
    console.warn("Gemini Parsing Failed, using fallback:", error.message);
    geminiData = parseSHCTextLocal(rawText);
  }
  
  // The new prompt enforces outputting 0 for numeric values that are not found.
  // We should convert 0 back to null for database consistency, unless 0 is a valid reading (rare for N,P,K).
  // But for safety, we'll keep what Gemini returns, just formatting it cleanly.
  
  const rawData = geminiData.rawData || {};
  const processedData = geminiData.processedData || {};
  const location = geminiData.location || {};

  const cleanNumeric = (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const num = Number(val);
      return Number.isNaN(num) || num === 0 ? null : num; // Converting 0 to null as 0 usually means "not found" based on the prompt instructions
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
