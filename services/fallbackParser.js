/**
 * Refined Local Fallback Parser for Soil Health Card OCR Text
 * Extracts values ONLY when strict keywords match and validates ranges.
 */

const parseSHCTextLocal = (text) => {
  console.log("-----------------------------------");
  console.log("Using refined local fallback parser");

  // 1. Clean OCR Text
  // Remove known noise like survey numbers to prevent false positives
  const cleanText = text
    .replace(/Survey No:?\s*\d+/gi, "")
    .replace(/Date:?\s*\d{2}[/-]\d{2}[/-]\d{4}/gi, "")
    .replace(/[\(\)\[\]\|]/g, " "); // Replace brackets/pipes with space

  const result = {
    location: {
      state: null,
      district: null,
    },
    rawData: {
      nitrogen: null,
      phosphorus: null,
      potassium: null,
      ph: null,
      ec: null,
      organicCarbon: null,
    },
    processedData: {
      nitrogen: null,
      phosphorus: null,
      potassium: null,
      ph: null,
    },
  };

  // Helper for range validation
  const validateRange = (val, min, max) => {
    if (val === null || isNaN(val)) return null;
    return (val >= min && val <= max) ? val : null;
  };

  // 2. Extract Location Details
  const stateMatch = cleanText.match(/(?:State|Stat)[:\s]+([a-zA-Z\s]+)/i);
  if (stateMatch) result.location.state = stateMatch[1].trim();

  const districtMatch = cleanText.match(/(?:District|Dist)[:\s]+([a-zA-Z\s]+)/i);
  if (districtMatch) result.location.district = districtMatch[1].trim();

  // 3. Extract Nutrients with specific regex requirements
  // Nitrogen (Realistic range: 0 - 1000 kg/ha)
  const nMatch = cleanText.match(/nitrogen.*?(\d+(?:\.\d+)?)/i);
  if (nMatch) {
    const val = parseFloat(nMatch[1]);
    result.rawData.nitrogen = validateRange(val, 0, 1000);
  }

  // Phosphorus (Realistic range: 0 - 500 kg/ha)
  const pMatch = cleanText.match(/phosphorus.*?(\d+(?:\.\d+)?)/i);
  if (pMatch) {
    const val = parseFloat(pMatch[1]);
    result.rawData.phosphorus = validateRange(val, 0, 500);
  }

  // Potassium (Realistic range: 0 - 1000 kg/ha)
  const kMatch = cleanText.match(/potassium.*?(\d+(?:\.\d+)?)/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1]);
    result.rawData.potassium = validateRange(val, 0, 1000);
  }

  // 4. Extract pH (Realistic range: 0 - 14)
  const phMatch = cleanText.match(/pH.*?(\d+(?:\.\d+)?)/i);
  if (phMatch) {
    const val = parseFloat(phMatch[1]);
    result.rawData.ph = validateRange(val, 0, 14);
  }

  // 5. Extract EC (Realistic range: 0 - 20 dS/m)
  const ecMatch = cleanText.match(/EC.*?(\d+(?:\.\d+)?)/i);
  if (ecMatch) {
    const val = parseFloat(ecMatch[1]);
    result.rawData.ec = validateRange(val, 0, 20);
  }

  // 6. Extract Organic Carbon (Realistic range: 0 - 10 %)
  const ocMatch = cleanText.match(/(?:Organic Carbon|OC).*?(\d+(?:\.\d+)?)/i);
  if (ocMatch) {
    const val = parseFloat(ocMatch[1]);
    result.rawData.organicCarbon = validateRange(val, 0, 10);
  }

  return result;
};

module.exports = {
  parseSHCTextLocal,
};
