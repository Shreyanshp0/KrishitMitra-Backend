const SHC = require("../models/SHC");
const User = require("../models/User");
const { getRecommendations } = require("../services/recommendationService");
const { getWeather, getPrices, getODOP } = require("../services/externalDataService");

const recommend = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { mode, language = "en", ...manualInput } = req.body;

    const supportedLanguages = ["en", "hi", "pa", "te"];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported language",
      });
    }

    const languageMap = {
      en: "English",
      hi: "Hindi",
      pa: "Punjabi",
      te: "Telugu"
    };
    const selectedLanguage = languageMap[language] || "English";

    console.log("==========================================");
    console.log("Incoming Request to /api/recommend:", req.body);
    console.log("Selected Language:", selectedLanguage);
    console.log("==========================================");

    if (!mode || (mode !== "auto" && mode !== "manual" && mode !== "shc")) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing mode. Mode must be 'auto', 'manual', or 'shc'.",
      });
    }

    // 1. Fetch User Data to get base location
    const user = await User.findById(req.user._id).select("state district");
    
    // Determine the location to use. Prioritize request body (if manual override), then user profile.
    const location = {
      state: manualInput.state || user?.state || null,
      district: manualInput.district || user?.district || null,
    };

    if (!location.state || !location.district) {
      return res.status(400).json({
        success: false,
        message: "State and District are required to generate recommendations. Please update your profile or provide them in the request.",
      });
    }

    // 2. Fetch External Data in Parallel
    const [weather, prices, odopCrops, latestShc] = await Promise.all([
      getWeather(location.state, location.district),
      getPrices(),
      getODOP(location.state, location.district),
      SHC.findOne({ userId: req.user._id }).sort({ createdAt: -1 })
    ]);

    // 3. Determine Pipeline and Soil Data
    let pipeline = "manual";
    let soilData = {};

    if (mode === "auto") {
      if (latestShc && latestShc.processedData) {
        pipeline = "shc";
        soilData = latestShc.processedData;
      } else {
        pipeline = "manual";
        soilData = manualInput;
      }
    } else if (mode === "shc") {
      if (!latestShc || !latestShc.processedData) {
        return res.status(400).json({
          success: false,
          message: "No Soil Health Card found. Please upload an SHC first.",
        });
      }
      pipeline = "shc";
      soilData = latestShc.processedData;
    } else if (mode === "manual") {
      pipeline = "manual";
      soilData = manualInput;
    }

    // 4. Generate Recommendations via Gemini
    const recommendationsResult = await getRecommendations({
      pipeline,
      soilData,
      location,
      weather,
      prices,
      odopCrops,
      selectedLanguage,
    });

    return res.status(200).json({
      success: true,
      data: {
        source: pipeline,
        used: soilData,
        location,
        odopInjected: odopCrops.length > 0,
        recommendations: recommendationsResult.recommendations,
      },
    });

  } catch (error) {
    return next(error);
  }
};

module.exports = {
  recommend,
};
