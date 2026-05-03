const express = require("express");

const { authenticate } = require("../middleware/authMiddleware");
const { recommend } = require("../controllers/recommendController");

const router = express.Router();

router.post("/recommend", authenticate, recommend);

module.exports = router;
