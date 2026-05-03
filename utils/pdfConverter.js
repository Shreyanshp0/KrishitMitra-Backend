const path = require("path");
const poppler = require("pdf-poppler");

/**
 * Converts the first page of a PDF file to a JPEG image.
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<string>} - Path to the generated image.
 */
const convertPdfToImage = async (filePath) => {
  try {
    const outputDir = path.dirname(filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    
    const options = {
      format: "jpeg",
      out_dir: outputDir,
      out_prefix: fileName,
      page: 1,
    };

    await poppler.convert(filePath, options);

    // pdf-poppler adds "-1.jpg" for the first page
    const imagePath = path.join(outputDir, `${fileName}-1.jpg`);
    return imagePath;
  } catch (error) {
    console.error("PDF Conversion Error:", error.message);
    throw new Error("Failed to convert PDF to image for OCR.");
  }
};

module.exports = {
  convertPdfToImage,
};
