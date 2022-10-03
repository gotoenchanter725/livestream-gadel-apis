const express = require('express');
const router = express.Router();
const fileUpload = require("express-fileupload");

const userController = require("../controllers/userController");
const { Should_Not_Be_Authenticated, Need_Authentification, verifyToken, tokenAnalyze } = require('../middlewares/authentication.js');
const { Validate_Login, Validate_Register, Validate_Change_Email, imageValidation, audioValidation, videoValidation } = require('../middlewares/validation.js');

router.post('/login', Should_Not_Be_Authenticated, Validate_Login, userController.login);

router.post('/register', Should_Not_Be_Authenticated, Validate_Register, userController.signUp);

router.post('/emailVerify', verifyToken, Need_Authentification, tokenAnalyze, userController.emailVerify);

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


// add follower
router.put('/follow', verifyToken, Need_Authentification, tokenAnalyze, userController.addFollower);
// delete follower
router.delete('/follow', verifyToken, Need_Authentification, tokenAnalyze, userController.deleteFollower);
// allow follower
router.post('/follow', verifyToken, Need_Authentification, tokenAnalyze, userController.allowFollower);

module.exports = router;