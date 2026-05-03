const axios = require("axios");

/**
 * MOCK EXTERNAL DATA SERVICE
 * Replace the return statements with actual axios calls when you have the API endpoints.
 */

const getWeather = async (state, district) => {
  try {
    // const response = await axios.get(`https://api.weather.example.com/v1/current?state=${state}&district=${district}`);
    // return response.data;
    
    // Mock Return
    return {
      temperature: "32°C",
      humidity: "65%",
      forecast: "Sunny with scattered showers",
      rainfall_mm: 12,
    };
  } catch (error) {
    console.error("Weather API Error:", error.message);
    return null; // Don't crash if weather fails
  }
};

const getPrices = async () => {
  try {
    // const response = await axios.get(`https://api.prices.example.com/latest`);
    // return response.data;
    
    // Mock Return
    return {
      "Wheat": "₹2,500/Quintal",
      "Cotton": "₹7,200/Quintal",
      "Sugarcane": "₹315/Quintal",
      "Soybean": "₹4,600/Quintal",
      "Mustard": "₹5,400/Quintal",
    };
  } catch (error) {
    console.error("Prices API Error:", error.message);
    return null;
  }
};

const getMockODOP = (district) => {
  const lowercaseDistrict = (district || "").toLowerCase();
  if (lowercaseDistrict.includes("nagpur")) return ["Orange", "Cotton"];
  if (lowercaseDistrict.includes("nashik")) return ["Grapes", "Onion"];
  if (lowercaseDistrict.includes("lucknow")) return ["Mango", "Wheat"];
  if (lowercaseDistrict.includes("pune")) return ["Tomato", "Sugarcane"];
  return ["Wheat", "Mustard"];
};

const getODOP = async (state, district) => {
  try {
    const odopUrl = process.env.ODOP;
    if (!odopUrl) {
      return getMockODOP(district);
    }
    
    // Append a high limit to get all records if it's a data.gov.in API
    const url = odopUrl.includes('?') ? `${odopUrl}&limit=1000` : `${odopUrl}?limit=1000`;
    const response = await axios.get(url, { timeout: 8000 });
    
    if (response.data && response.data.records) {
      const records = response.data.records;
      
      // Filter for the district
      const districtRecords = records.filter(record => {
        // Handle common variations of 'district' key
        const recordDistrict = record.district || record.district_name || record.District || record.district_title || "";
        return String(recordDistrict).toLowerCase().includes(String(district).toLowerCase());
      });
      
      // Map to the product field
      const odopCrops = districtRecords.map(record => {
        return record.odop_product || record.product || record.crop || record.Product || record.product_name || record.ODOP_Product;
      }).filter(Boolean);
      
      if (odopCrops.length > 0) {
        return [...new Set(odopCrops)]; // Return unique crops
      }
    }
    
    return getMockODOP(district);
  } catch (error) {
    console.error("ODOP API Error:", error.message);
    return getMockODOP(district);
  }
};

module.exports = {
  getWeather,
  getPrices,
  getODOP,
};
