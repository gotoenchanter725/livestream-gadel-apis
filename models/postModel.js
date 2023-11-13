const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    sender: {
        type: String, 
        required: true
    }, 
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    content: {
        type: String, 
        required: true
    }, 
    date: {
        type: Date
    }, 
    rflag: {
        type: Boolean, 
        default: false
    }
})

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    }, 
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    text: {
        type: String, 
        required: true
    }, 
    location: {
        type: String, 
        required: true
    }, 
    type: {
        type: String,
        enum: ["HELPME", "AUDIO", "PHOTO", "VIDEO"],
        default: "VIDEO"
    },
    like: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    },
    comments: {
        type: [commentSchema],
    },
    views: {
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        required: true,
    },
    file_path: {
        type: String,
    },
    gifts: {
        type: [mongoose.Schema.Types.ObjectId],
        default: []
    }
});

module.exports = mongoose.model('Posts', postSchema);

module.exports.VIDEO_POST = "VIDEO"
module.exports.AUDIO_POST = "AUDIO"
module.exports.PHOTO_POST = "PHOTO"
module.exports.HELPME_POST  = "HELPME"
module.exports.LIVE_POST = "VIDEO"