const express = require('express');
const router = express.Router();
const supportController = require("../controllers/supportController");

const { Validate_Support } = require('../middlewares/validation.js');
const { Need_Authentification, verifyToken, tokenAnalyze } = require('../middlewares/authentication.js');

router.put('/support', verifyToken, Need_Authentification, tokenAnalyze, Validate_Support, supportController.submit);

module.exports = router;