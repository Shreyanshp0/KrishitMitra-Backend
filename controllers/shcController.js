const fs = require("fs/promises");
const fsNode = require("fs");
const SHC = require("../models/SHC");
const { parseAndNormalizeShcText } = require("../services/shcParser");
const { compressImage } = require("../utils/imageProcessor");

const safeUnlink = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // ignore
  }
};

const uploadShc = async (req, res, next) => {
  const originalFilePath = req.file?.path;

  try {
    console.log("-----------------------------------");
    console.log("SHC Processing Started");
    console.log("File Type:", req.file?.mimetype);

    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    let imageBuffer = fsNode.readFileSync(originalFilePath);
    const mimeType = req.file.mimetype;

    // Apply compression ONLY for images (Gemini handles PDF directly without needing compression here)
    if (mimeType.startsWith("image/")) {
      imageBuffer = await compressImage(imageBuffer);
    }

    // Parse using Gemini Multimodal
    let extracted;
    try {
      extracted = await parseAndNormalizeShcText(imageBuffer, mimeType);
      console.log("Extraction Result:", JSON.stringify(extracted.processedData, null, 2));
    } catch (parseError) {
      console.error("Parsing Error:", parseError.message);
      return res.status(422).json({
        success: false,
        message: parseError.message || "Failed to parse SHC document.",
      });
    }

    // Validate extraction
    const hasAnyValue =
      Boolean(extracted.processedData.nitrogen) ||
      Boolean(extracted.processedData.phosphorus) ||
      Boolean(extracted.processedData.potassium) ||
      Boolean(extracted.processedData.ph);

    if (!hasAnyValue) {
      return res.status(422).json({
        success: false,
        message: "Unable to extract SHC values (N, P, K, pH) from the uploaded file.",
      });
    }

    // Save to Database
    const doc = await SHC.create({
      userId: req.user._id,
      location: extracted.location,
      rawData: extracted.rawData,
      processedData: extracted.processedData,
    });

    console.log("SHC Pipeline Successful");
    console.log("-----------------------------------");

    return res.status(201).json({
      success: true,
      data: doc,
    });

  } catch (error) {
    console.error("SHC Pipeline Global Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process SHC document",
    });
  } finally {
    // Cleanup Temporary Files
    await safeUnlink(originalFilePath);
  }
};

const getLatestShc = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const latest = await SHC.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: "No SHC data found",
      });
    }

    return res.status(200).json({
      success: true,
      data: latest,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  uploadShc,
  getLatestShc,
};
