const express = require('express');
const router = express.Router();
const fileUpload = require("express-fileupload");
const postController = require("../controllers/postController");

const { fileValidation } = require('../middlewares/validation.js');
const { Need_Authentification, verifyToken, tokenAnalyze, locationAnalyze } = require('../middlewares/authentication.js');

router.post('/createPost', verifyToken, Need_Authentification, tokenAnalyze, fileUpload({
    createParentPath: true,
}), locationAnalyze, fileValidation, postController.createPost);
router.delete('/post', verifyToken, Need_Authentification, tokenAnalyze, postController.deletePost);

router.post('/add-like', verifyToken, Need_Authentification, tokenAnalyze, postController.addLike);
router.post('/delete-like', verifyToken, Need_Authentification, tokenAnalyze, postController.deleteLike);
router.post('/add-views', verifyToken, Need_Authentification, tokenAnalyze, postController.addViews);
router.post('/send-comment', verifyToken, Need_Authentification, tokenAnalyze, postController.sendComment);
router.post('/remove-comment', verifyToken, Need_Authentification, tokenAnalyze, postController.removeComment);

router.get('/getMyPosts', verifyToken, Need_Authentification, tokenAnalyze, postController.getMyPosts);
router.post('/getAllPosts', verifyToken, Need_Authentification, tokenAnalyze, postController.getAllPosts);
router.get('/getPostCount', verifyToken, Need_Authentification, tokenAnalyze, postController.getPostCount);
router.get('/post', verifyToken, Need_Authentification, tokenAnalyze, postController.getPost);
router.get('/post/gifts', verifyToken, Need_Authentification, tokenAnalyze, postController.getGifts);

router.post('/livestreamPost', verifyToken, Need_Authentification, tokenAnalyze, postController.livestreamPost);

module.exports = router;