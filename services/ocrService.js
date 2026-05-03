const Tesseract = require("tesseract.js");

/**
 * Extracts text from an image using local Tesseract.js OCR.
 * @param {string} filePath - Path to the image file.
 * @returns {Promise<string>} - Extracted text.
 */
const extractTextFromImage = async (filePath) => {
  try {
    console.log("-----------------------------------");
    console.log("Local OCR Started (Tesseract.js)");
    console.log("Processing File:", filePath);

    const { data: { text } } = await Tesseract.recognize(filePath, "eng", {
      // logger: m => console.log(m) // Optional: add detailed progress logging
    });

    console.log("OCR Text Extracted Successfully");
    console.log("OCR Text Preview:", text.substring(0, 100) + "...");

    if (!text || text.trim() === "") {
      throw new Error("Tesseract OCR returned empty text.");
    }

    return text.trim();
  } catch (error) {
    console.error("Tesseract OCR Error:", error.message);
    throw new Error("Failed to extract text from image using Tesseract OCR");
  }
};

/**
 * Main OCR service function.
 * Note: PDF conversion is handled in the controller to manage file paths and cleanup.
 */
const extractText = async (imagePath) => {
  return await extractTextFromImage(imagePath);
};

module.exports = {
  extractText,
};
