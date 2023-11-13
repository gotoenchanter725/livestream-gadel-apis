const Post = require("../models/postModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { generateRandomName, getChunkProps, getFileSizeAndResolvedPath } = require("../middlewares/function");
const { unlink, rename } = require('fs')

// const VIDEO_POST = "VIDEO"
// const AUDIO_POST = "AUDIO"
// const PHOTO_POST = "PHOTO"
// const HELPME_POST  = "HELPME"

const AUDIO_DEFAULT_IMAEG = ""
const VIDEO_DEFAULT_IMAEG = ""
const TEXT_DEFAULT_IMAGE  = ""

exports.createPost = async (req, res) => {
    try {
        let post;
        let fileType = Post.HELPME_POST
        if (req.files) {
            const file = req.files.file;
            const file_path = 'posts/' + generateRandomName(file.name, 17);
            const path = 'uploads/' + file_path;

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
                file_path: file_path
            });
        } else {
            post = new Post({
                userId: req.user._id,
                title: req.body.title,
                description: req.body.description,
                text: req.body.title,
                location: req.body.location,
                type: fileType,
                date: Date.now()
            });
        }

        const user = await User.findOne({ _id: req.user._id });
        if (user && user.follows) {
            const notification = new Notification();
            notification.userId = req.user._id;
            notification.postId = post._id;
            notification.type = "postCreate";
            notification.text = `"${user.username}" have just posted "${post.title}".`;
            notification.date = Date.now();
            notification.receivers = user.follows.map(item => item.userId);
            notification.save()
            const n = notification.receivers.length;
            for( let i = 0; i < n; i ++ ) {
                const socketId = global.socketIds[notification.receivers[i]];
                if( socketId ) {
                    req.io.to(socketId).emit("new-notificaiton", notification);
                }
            }
        }

        await post.save();
        res.status(200).json({
            state: true,
            data: "Success!",
            post: post
        })
    } catch (e) {
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
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.addLike = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postId });
        if( post.like.indexOf(req.user._id) < 0 ) {
            post.like.push(req.user._id);
            await post.save();
        }
        
        res.status(200).json({
            state: true,
            data: "Success!",
            likes: post.like
        })
    } catch (e) {
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.deleteLike = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postId });
        let id = post.like.indexOf( req.user._id )
        if( id < 0 ) ;
        else {
            post.like.splice(id, 1)
            await post.save();
        }
        
        res.status(200).json({
            state: true,
            data: "Success!",
            likes: post.like
        })
    } catch (e) {
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
            sender: req.user.username,
            senderId: req.user._id,
            content: req.body.content,
            date: Date.now()
        })
        await post.save();
        res.status(200).json({
            state: true,
            comments: post.comments
        })
    } catch (e) {
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.removeComment = async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.body.postId });
        const index = post.comments.findIndex((item) => (item._id == req.body.commentId && item.senderId == req.user._id))
        if(index < 0);
        else post.comments.splice(index, 1);
        await post.save();
        res.status(200).json({
            state: true,
            comments: post.comments
        })
    } catch (e) {
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.user._id }).sort({date: 'desc'});
        res.status(200).json({
            state: true,
            data: posts
        })
    } catch (e) {
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.getAllPosts = async (req, res) => {
    try {
        let condition = {}
        if( req.body.userid ) condition.userId = {_id: req.body.userid}
        if( req.body.type != 'ALL' ) condition.type = req.body.type
        let posts = await Post.find(condition).sort({date: 'desc'}).populate('userId', ['country', 'username', 'profile_image_path']);
        posts = posts.filter(post => !!(post.userId && post.userId._id))
        res.status(200).json({
            state: true,
            data: posts
        })
    } catch (e) {
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
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

exports.getPostPrevImage = (postid) => {
    const post = Post.findOne({_id: postid})
    if( post.type == VIDEO_POST ) {

    }
}

exports.getPostCount = async (req, res) => {
    const helpme = await Post.count({userId:req.query.userid, type:Post.HELPME_POST})
    const photo = await Post.count({userId:req.query.userid, type:Post.PHOTO_POST})
    const video = await Post.count({userId:req.query.userid, type:Post.VIDEO_POST})
    const audio = await Post.count({userId:req.query.userid, type:Post.AUDIO_POST})
    const live = await Post.count({userId:req.query.userid, type:Post.LIVE_POST})
    res.json({
        helpme, photo, video, audio, live, all: helpme + photo + video + audio + live
    })
}

exports.getGifts = async ( req, res ) => {
    try {
        const post = await Post.findOne( {_id: req.query.postID} );
        const userid = post.userId;
        const user = await User.findOne({_id: userid});
        const gifts = user.gifts.filter(item => item.post == req.query.postID);
        res.status(200).json({
            status: true,
            data: {
                gifts: gifts
            }
        })
    } catch (error) {
        res.status(400).json({
            status: false,
            message: error
        })
    }
}