const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Create a compound index to ensure uniqueness of state+district combinations
locationSchema.index({ state: 1, district: 1 }, { unique: true });

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;
