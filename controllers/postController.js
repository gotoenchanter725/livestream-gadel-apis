const Post = require("../models/postModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { generateRandomName, getChunkProps, getFileSizeAndResolvedPath } = require("../middlewares/function");
const { unlink, rename } = require('fs')

exports.createPost = async (req, res) => {
    try {
        let post;
        if (req.files) {
            const file = req.files.file;
            const path = 'uploads/posts/' + generateRandomName(file.name, 17);

            file.mv(path, (err) => {
                if (err) {
                    res.status(400).json({
                        state: false,
                        errMessage: err
                    });
                }
            });

            post = new Post({
                userId: req.user._id,
                title: req.body.title,
                description: req.body.description,
                text: req.body.title,
                location: req.body.location,
                type: req.body.type,
                date: Date.now(),
                file_path: path
            });
        } else {
            post = new Post({
                userId: req.user._id,
                title: req.body.title,
                description: req.body.description,
                text: req.body.title,
                location: req.body.location,
                type: req.body.type,
                date: Date.now()
            });
        }

        const user = await User.findOne({ _id: req.user._id });
        console.log(user);
        if (user && user.follows) {
            const notification = new Notification();
            notification.userId = req.user._id;
            notification.postId = post._id;
            notification.type = "postCreate";
            notification.text = `"${user.username}" have just posted "${post.title}".`;
            notification.date = Date.now();
            notification.receivers = user.follows.map(item => item.userId);
            notification.save()
        }

        await post.save();
        res.status(200).json({
            state: true,
            data: "Success!"
        })
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postId });
        if (!post) throw "don't exist"
        unlink(post.file_path, (err) => {
            if (err) console.log(`No file to delete at this location: ${path}`)
        });
        await Post.deleteOne({ _id: req.body.postId });
        res.status(200).json({
            state: true,
            data: "Success!"
        })
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.addLike = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postId });
        post.like++;
        await post.save();
        res.status(200).json({
            state: true,
            data: "Success!"
        })
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.addViews = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postId });
        post.views++;
        await post.save();
        res.status(200).json({
            state: true,
            data: "Success!"
        })
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.sendComment = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postId });
        post.comments.push({
            sender: req.user._id,
            content: req.body.content,
            date: Date.now()
        })
        await post.save();
        res.status(200).json({
            state: true,
            data: "Success!"
        })
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.user._id });
        res.status(200).json({
            state: true,
            data: posts
        })
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.getPost = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postId});
        res.status(200).json({
            state: true,
            data: post
        })
    } catch (e) {
        // console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.livestreamPost = async (req, res) => {
    try {
        const { fileSize, resolvedPath } = getFileSizeAndResolvedPath(req.body.url);

        const requestRangeHeader = req.headers.range;

        if (!requestRangeHeader) {
            req.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            });
            // .pipe -> in a simple words it's like re.send() but for readStream
            fs.createReadStream(resolvedPath).pipe(req);
        } else {
            const { start, end, chunkSize } = getChunkProps(requestRangeHeader, fileSize);

            // Read only part of the file from "start" to "end"
            const readStream = fs.createReadStream(resolvedPath, { start, end });

            req.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4',
            });
            readStream.pipe(req);
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}