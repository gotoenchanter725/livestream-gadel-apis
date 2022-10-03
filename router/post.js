const express = require('express');
const router = express.Router();
const fileUpload = require("express-fileupload");
const postController = require("../controllers/postController");

const { fileValidation } = require('../middlewares/validation.js');
const { Need_Authentification, verifyToken, tokenAnalyze } = require('../middlewares/authentication.js');

router.put('/post', verifyToken, Need_Authentification, tokenAnalyze, fileUpload({
    createParentPath: true,
}), fileValidation, postController.createPost);
router.delete('/post', verifyToken, Need_Authentification, tokenAnalyze, postController.deletePost);

router.post('/add-like', verifyToken, Need_Authentification, tokenAnalyze, postController.addLike);
router.post('/add-views', verifyToken, Need_Authentification, tokenAnalyze, postController.addViews);
router.post('/send-comment', verifyToken, Need_Authentification, tokenAnalyze, postController.sendComment);

router.get('/getAllPosts', verifyToken, Need_Authentification, tokenAnalyze, postController.getAllPosts);
router.get('/post', verifyToken, Need_Authentification, tokenAnalyze, postController.getPost);

router.post('/livestreamPost', verifyToken, Need_Authentification, tokenAnalyze, postController.livestreamPost);

module.exports = router;