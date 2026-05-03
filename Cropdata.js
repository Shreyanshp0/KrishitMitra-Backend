const cropsData = [
  // ===== CEREALS =====
  {
    name: "Rice",
    water: "high",
    soil: ["clayey", "alluvial"],
    pH: { min: 5.5, max: 7 },
    temperature: { min: 20, max: 35 },
    rainfall: { min: 100, max: 200 },
    nutrients: { nitrogen: "high", phosphorus: "medium", potassium: "medium" },
    season: ["kharif"]
  },
  {
    name: "Wheat",
    water: "medium",
    soil: ["loamy"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 10, max: 25 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "medium" },
    season: ["rabi"]
  },
  {
    name: "Maize",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 5.5, max: 7.5 },
    temperature: { min: 18, max: 27 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "high", phosphorus: "medium", potassium: "medium" },
    season: ["kharif", "rabi"]
  },
  {
    name: "Barley",
    water: "low-medium",
    soil: ["loamy", "sandy"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 12, max: 25 },
    rainfall: { min: 30, max: 70 },
    nutrients: { nitrogen: "low-medium", phosphorus: "medium", potassium: "low" },
    season: ["rabi"]
  },

  // ===== MILLETS =====
  {
    name: "Bajra",
    water: "low",
    soil: ["sandy", "dry"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 25, max: 35 },
    rainfall: { min: 40, max: 60 },
    nutrients: { nitrogen: "low", phosphorus: "low", potassium: "low" },
    season: ["kharif"]
  },
  {
    name: "Jowar",
    water: "low-medium",
    soil: ["sandy", "alluvial"],
    pH: { min: 6, max: 8 },
    temperature: { min: 25, max: 32 },
    rainfall: { min: 40, max: 100 },
    nutrients: { nitrogen: "low-medium", phosphorus: "low", potassium: "medium" },
    season: ["kharif", "rabi"]
  },
  {
    name: "Ragi",
    water: "low",
    soil: ["red", "sandy"],
    pH: { min: 5.5, max: 7.5 },
    temperature: { min: 20, max: 30 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "low", phosphorus: "low", potassium: "low" },
    season: ["kharif"]
  },

  // ===== CASH CROPS =====
  {
    name: "Cotton",
    water: "medium",
    soil: ["black"],
    pH: { min: 6, max: 8 },
    temperature: { min: 21, max: 30 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "high", phosphorus: "medium", potassium: "medium" },
    season: ["kharif"]
  },
  {
    name: "Sugarcane",
    water: "high",
    soil: ["loamy", "alluvial"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 20, max: 35 },
    rainfall: { min: 75, max: 150 },
    nutrients: { nitrogen: "high", phosphorus: "high", potassium: "high" },
    season: ["annual"]
  },

  // ===== PULSES =====
  {
    name: "Pulses",
    water: "low-medium",
    soil: ["loamy"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 20, max: 30 },
    rainfall: { min: 40, max: 80 },
    nutrients: { nitrogen: "low", phosphorus: "medium", potassium: "low" },
    season: ["kharif", "rabi"]
  },
  {
    name: "Peas",
    water: "low-medium",
    soil: ["loamy"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 10, max: 25 },
    rainfall: { min: 40, max: 80 },
    nutrients: { nitrogen: "low", phosphorus: "medium", potassium: "medium" },
    season: ["rabi"]
  },

  // ===== OILSEEDS =====
  {
    name: "Mustard",
    water: "low-medium",
    soil: ["well-drained"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 10, max: 25 },
    rainfall: { min: 25, max: 75 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "medium" },
    season: ["rabi"]
  },
  {
    name: "Groundnut",
    water: "low-medium",
    soil: ["sandy", "well-drained"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 20, max: 30 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "low", phosphorus: "medium", potassium: "medium" },
    season: ["kharif"]
  },
  {
    name: "Soybean",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 20, max: 30 },
    rainfall: { min: 60, max: 100 },
    nutrients: { nitrogen: "low", phosphorus: "medium", potassium: "medium" },
    season: ["kharif"]
  },
  {
    name: "Sunflower",
    water: "low-medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 20, max: 25 },
    rainfall: { min: 50, max: 75 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "high" },
    season: ["kharif", "rabi"]
  },

  // ===== VEGETABLES =====
  {
    name: "Potato",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 5, max: 6.5 },
    temperature: { min: 15, max: 25 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "high", phosphorus: "high", potassium: "high" },
    season: ["rabi"]
  },
  {
    name: "Tomato",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7 },
    temperature: { min: 18, max: 30 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "medium", phosphorus: "high", potassium: "high" },
    season: ["kharif", "rabi"]
  },
  {
    name: "Onion",
    water: "low-medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 13, max: 25 },
    rainfall: { min: 30, max: 75 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "high" },
    season: ["kharif", "rabi"]
  },
  {
    name: "Garlic",
    water: "low-medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 12, max: 25 },
    rainfall: { min: 30, max: 60 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "high" },
    season: ["rabi"]
  },
  {
    name: "Cabbage",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 15, max: 25 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "high", phosphorus: "medium", potassium: "high" },
    season: ["rabi"]
  },
  {
    name: "Cauliflower",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7 },
    temperature: { min: 15, max: 25 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "high", phosphorus: "high", potassium: "high" },
    season: ["rabi"]
  },
  {
    name: "Brinjal",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 5.5, max: 7.5 },
    temperature: { min: 20, max: 30 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "high" },
    season: ["kharif", "rabi"]
  },
  {
    name: "Okra",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 20, max: 35 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "medium" },
    season: ["kharif"]
  },
  {
    name: "Chili",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7 },
    temperature: { min: 20, max: 30 },
    rainfall: { min: 50, max: 100 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "high" },
    season: ["kharif"]
  },

  // ===== SPICES =====
  {
    name: "Turmeric",
    water: "high",
    soil: ["loamy", "well-drained"],
    pH: { min: 5.5, max: 7.5 },
    temperature: { min: 20, max: 30 },
    rainfall: { min: 100, max: 200 },
    nutrients: { nitrogen: "high", phosphorus: "medium", potassium: "high" },
    season: ["kharif"]
  },
  {
    name: "Ginger",
    water: "high",
    soil: ["loamy", "well-drained"],
    pH: { min: 5.5, max: 6.5 },
    temperature: { min: 20, max: 30 },
    rainfall: { min: 100, max: 200 },
    nutrients: { nitrogen: "high", phosphorus: "medium", potassium: "high" },
    season: ["kharif"]
  },

  // ===== PLANTATION =====
  {
    name: "Tea",
    water: "high",
    soil: ["acidic"],
    pH: { min: 4.5, max: 5.5 },
    temperature: { min: 18, max: 30 },
    rainfall: { min: 150, max: 300 },
    nutrients: { nitrogen: "high", phosphorus: "medium", potassium: "medium" },
    season: ["perennial"]
  },
  {
    name: "Coffee",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 5, max: 6.5 },
    temperature: { min: 15, max: 28 },
    rainfall: { min: 100, max: 200 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "medium" },
    season: ["perennial"]
  },

  // ===== FRUITS =====
  {
    name: "Banana",
    water: "high",
    soil: ["loamy", "alluvial"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 20, max: 35 },
    rainfall: { min: 100, max: 200 },
    nutrients: { nitrogen: "high", phosphorus: "high", potassium: "high" },
    season: ["annual"]
  },
  {
    name: "Mango",
    water: "low-medium",
    soil: ["loamy", "alluvial"],
    pH: { min: 5.5, max: 7.5 },
    temperature: { min: 24, max: 35 },
    rainfall: { min: 75, max: 150 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "high" },
    season: ["perennial"]
  },
  {
    name: "Apple",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 5.5, max: 6.5 },
    temperature: { min: 5, max: 25 },
    rainfall: { min: 100, max: 150 },
    nutrients: { nitrogen: "medium", phosphorus: "medium", potassium: "high" },
    season: ["perennial"]
  },
  {
    name: "Papaya",
    water: "medium",
    soil: ["loamy", "well-drained"],
    pH: { min: 6, max: 7.5 },
    temperature: { min: 21, max: 33 },
    rainfall: { min: 100, max: 150 },
    nutrients: { nitrogen: "high", phosphorus: "high", potassium: "high" },
    season: ["annual"]
  }
];

module.exports = cropsData;

// export default cropsData;