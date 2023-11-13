const express = require('express');
const router = express.Router();
const fileUpload = require("express-fileupload");

const userController = require("../controllers/userController");
const { Should_Not_Be_Authenticated, Need_Authentification, verifyToken, tokenAnalyze } = require('../middlewares/authentication.js');
const { Validate_Login, Validate_Register, Validate_Change_Email, imageValidation, audioValidation, videoValidation } = require('../middlewares/validation.js');
router.get("/avatar/:userid", userController.getUserAvatar);
router.get("/cover/:userid", userController.getUserCoverImage);
router.get("/message/:messageid", userController.getMessageFile);
router.get("/gift/:filename", userController.getGiftIcon);

module.exports = router;