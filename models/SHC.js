const mongoose = require("mongoose");

const nutrientLevels = ["low", "medium", "high"];
const phLevels = ["acidic", "neutral", "alkaline"];

const shcSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    location: {
      state: { type: String, default: null },
      district: { type: String, default: null },
    },
    rawData: {
      nitrogen: { type: Number, default: null },
      phosphorus: { type: Number, default: null },
      potassium: { type: Number, default: null },
      ph: { type: Number, default: null },
      ec: { type: Number, default: null },
      organicCarbon: { type: Number, default: null },
    },
    processedData: {
      nitrogen: {
        type: String,
        enum: [...nutrientLevels, null],
        default: null,
      },
      phosphorus: {
        type: String,
        enum: [...nutrientLevels, null],
        default: null,
      },
      potassium: {
        type: String,
        enum: [...nutrientLevels, null],
        default: null,
      },
      ph: {
        type: String,
        enum: [...phLevels, null],
        default: null,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

shcSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("SHC", shcSchema);
