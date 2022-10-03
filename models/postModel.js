const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    sender: {
        type: String, 
        required: true
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
        type: String, 
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
        type: Number,
        default: 0
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
});

module.exports = mongoose.model('Posts', postSchema);
