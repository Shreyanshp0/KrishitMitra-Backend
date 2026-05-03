const Location = require("../models/Location");

const getStates = async (req, res, next) => {
  try {
    const states = await Location.distinct("state");
    
    // For development/testing: if DB is empty, return some defaults
    if (states.length === 0) {
      return res.status(200).json({
        success: true,
        data: ["Maharashtra", "Karnataka", "Punjab", "Uttar Pradesh", "Gujarat"],
      });
    }

    return res.status(200).json({
      success: true,
      data: states.sort(),
    });
  } catch (error) {
    return next(error);
  }
};

const getDistricts = async (req, res, next) => {
  try {
    const { state } = req.query;

    if (!state) {
      return res.status(400).json({
        success: false,
        message: "State parameter is required",
      });
    }

    const locations = await Location.find({ state: { $regex: new RegExp(`^${state}$`, "i") } }).select("district");
    const districts = locations.map(loc => loc.district);

    // For development/testing: if DB is empty, return some defaults based on state
    if (districts.length === 0) {
      const defaultDistricts = {
        "maharashtra": ["Pune", "Nagpur", "Nashik", "Aurangabad"],
        "karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore"],
        "punjab": ["Amritsar", "Ludhiana", "Jalandhar", "Patiala"],
        "uttar pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra"],
        "gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"]
      };
      
      const found = defaultDistricts[state.toLowerCase()] || ["District 1", "District 2"];
      return res.status(200).json({
        success: true,
        data: found,
      });
    }

    return res.status(200).json({
      success: true,
      data: districts.sort(),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStates,
  getDistricts,
};
