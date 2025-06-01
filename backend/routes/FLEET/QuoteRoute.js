const express = require("express");
const router = express.Router();
const QuoteController = require("../../controllers/FLEET/QuatationController");

router.post("/create-quote", QuoteController.createQuote);

module.exports = router;