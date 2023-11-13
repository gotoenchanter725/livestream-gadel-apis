const express = require('express');
const router = express.Router();
const fileUpload = require("express-fileupload");
const { socketServer } = require("./../index");
const userController = require("../controllers/userController");
const { Should_Not_Be_Authenticated, Need_Authentification, verifyToken, tokenAnalyze } = require('../middlewares/authentication.js');
const { Validate_Login, Validate_Register, Validate_Change_Email, imageValidation, audioValidation, videoValidation } = require('../middlewares/validation.js');

router.post('/login', Should_Not_Be_Authenticated, Validate_Login, userController.login);

router.post('/register', Should_Not_Be_Authenticated, Validate_Register, userController.signUp);

router.post('/emailVerify', Should_Not_Be_Authenticated, userController.emailVerify);

router.post('/logout', verifyToken, Need_Authentification, tokenAnalyze, (req, res) => {
    req.session.user = null
    req.session.save(function (err) {
        req.session.regenerate(function (err) {
            if (err) {
                res.status(200).json({
                    status: true,
                })
            }
            res.status(200).json({
                status: true,
                data: req.user
            })
        })
    })
});

router.get('/getUserInfo', verifyToken, Need_Authentification, tokenAnalyze, userController.getUserInfo);

router.post('/changeLanguage', verifyToken, Need_Authentification, tokenAnalyze, userController.changeLanguage);

router.post('/changeEmailUsername', verifyToken, Need_Authentification, tokenAnalyze, Validate_Change_Email, userController.changeEmailUsername);

router.post('/changeDeactivate', verifyToken, Need_Authentification, tokenAnalyze, userController.changeDeactivate);

router.post('/changePostsDisplayMode', verifyToken, Need_Authentification, tokenAnalyze, userController.changePostsDisplayMode);

router.post('/changePostType', verifyToken, Need_Authentification, tokenAnalyze, userController.changePostType);

router.post('/changeProfileImage', verifyToken, Need_Authentification, tokenAnalyze, fileUpload({
    createParentPath: true,
}), imageValidation, userController.changeProfileImage);

router.post('/changeCoverImage', verifyToken, Need_Authentification, tokenAnalyze, fileUpload({
    createParentPath: true,
}), imageValidation, userController.changeCoverImage);


// add follower
router.put('/follow', verifyToken, Need_Authentification, tokenAnalyze, (req, res, next) => {req.io = socketServer.io;req.socket = socketServer.socket; next()}, userController.addFollower);
// delete follower
router.delete('/follow', verifyToken, Need_Authentification, tokenAnalyze, (req, res, next) => {req.io = socketServer.io;req.socket = socketServer.socket; next()}, userController.deleteFollower);
// allow follower
router.post('/follow', verifyToken, Need_Authentification, tokenAnalyze, userController.allowFollower);
router.post("/password-reset-request", userController.setResetPasswordCode);
router.post("/password-reset", userController.resetPassword);
router.post("/message", verifyToken, Need_Authentification, tokenAnalyze, (req, res, next) => {req.io = socketServer.io;req.socket = socketServer.socket; next()}, fileUpload({
    createParentPath: true,
}), userController.sendMessage);
router.get("/message", verifyToken, Need_Authentification, tokenAnalyze, userController.getMessage);
router.put("/message/as-read", verifyToken, Need_Authentification, tokenAnalyze, userController.setMassageAsRead);
router.post('/contact', verifyToken, Need_Authentification, tokenAnalyze, userController.addContact);
router.get('/contact', verifyToken, Need_Authentification, tokenAnalyze, userController.getContact);
router.post("/payment/capture/gift", verifyToken, Need_Authentification, tokenAnalyze, userController.captureGiftPayment);
router.post("/payment/capture/official-activate", verifyToken, Need_Authentification, tokenAnalyze, userController.captureOfficialActivatePayment);
router.get("/gift", verifyToken, Need_Authentification, tokenAnalyze, userController.getGifts);
router.put("/gift/send", verifyToken, Need_Authentification, tokenAnalyze, userController.sendGift);
router.get("/user/gift", verifyToken, Need_Authentification, tokenAnalyze, userController.getUserGifts);
router.put("/update-userinfo", verifyToken, Need_Authentification, tokenAnalyze, userController.updateUserInfo);
router.get("/follows", verifyToken, Need_Authentification, tokenAnalyze, userController.getFollows);
router.get("/user/notification/get", verifyToken, Need_Authentification, tokenAnalyze, userController.getNotifications);
module.exports = router;