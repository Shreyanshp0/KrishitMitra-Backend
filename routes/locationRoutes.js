const express = require("express");
const { getStates, getDistricts } = require("../controllers/locationController");

const router = express.Router();

// Public routes for dropdowns
router.get("/states", getStates);
router.get("/districts", getDistricts);

module.exports = router;
