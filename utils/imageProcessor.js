const sharp = require("sharp");

/**
 * Compresses an image buffer to reduce size for API calls.
 * Resizes to 1024px width and converts to JPEG at 80% quality.
 * @param {Buffer} buffer - Original image buffer.
 * @returns {Promise<Buffer>} - Compressed image buffer.
 */
const compressImage = async (buffer) => {
  try {
    console.log("Compressing image...");
    const originalSize = buffer.length;

    const compressedBuffer = await sharp(buffer)
      .resize({ width: 1024, withoutEnlargement: true }) // Limit width to 1024px
      .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
      .toBuffer();

    const compressedSize = compressedBuffer.length;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`Image Compressed: ${originalSize} -> ${compressedSize} bytes (${savings}% reduction)`);
    return compressedBuffer;
  } catch (error) {
    console.error("Image Compression Error:", error.message);
    return buffer; // Return original buffer if compression fails
  }
};

module.exports = {
  compressImage,
};
