const fs = require("fs/promises");
const path = require("path");
const SHC = require("../models/SHC");
const { extractText } = require("../services/ocrService");
const { parseAndNormalizeShcText } = require("../services/shcParser");
const { convertPdfToImage } = require("../utils/pdfConverter");
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
  let convertedImagePath = null;
  let processingPath = originalFilePath;

  try {
    console.log("-----------------------------------");
    console.log("OCR Pipeline Started");
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

    // 1. Handle PDF conversion if necessary
    if (req.file.mimetype === "application/pdf") {
      try {
        convertedImagePath = await convertPdfToImage(originalFilePath);
        processingPath = convertedImagePath;
        console.log("Converted Image Path:", convertedImagePath);
      } catch (convError) {
        console.error("PDF Conversion Error:", convError.message);
        throw new Error("Failed to process PDF document. Please upload a clear image instead.");
      }
    }

    // 2. Read file into Buffer and Compress for Gemini Multimodal
    const fsNode = require("fs");
    let imageBuffer = fsNode.readFileSync(processingPath);
    
    // Compress image to save quota/tokens
    imageBuffer = await compressImage(imageBuffer);
    
    const mimeType = req.file.mimetype === "application/pdf" ? "image/jpeg" : req.file.mimetype;

    // 3. Parse using Gemini Vision (with Local Fallback)
    let extracted;
    try {
      extracted = await parseAndNormalizeShcText(null, imageBuffer, mimeType, processingPath);
      console.log("Extraction Result:", JSON.stringify(extracted.processedData, null, 2));
    } catch (parseError) {
      console.error("Parsing Error:", parseError.message);
      return res.status(422).json({
        success: false,
        message: parseError.message || "Failed to parse SHC document.",
      });
    }

    // 4. Validate extraction
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

    // 5. Save to Database
    let doc;
    try {
      doc = await SHC.create({
        userId: req.user._id,
        location: extracted.location,
        rawData: extracted.rawData,
        processedData: extracted.processedData,
      });
    } catch (dbError) {
      console.error("MongoDB SHC.create Error:", dbError);
      return res.status(400).json({
        success: false,
        message: "Failed to save SHC to database: " + dbError.message,
      });
    }

    console.log("OCR Pipeline Successful");
    console.log("-----------------------------------");

    return res.status(201).json({
      success: true,
      data: doc,
    });

  } catch (error) {
    console.error("OCR Pipeline Global Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process SHC document",
    });
  } finally {
    // 6. Cleanup Temporary Files
    await safeUnlink(originalFilePath);
    if (convertedImagePath) {
      await safeUnlink(convertedImagePath);
    }
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
