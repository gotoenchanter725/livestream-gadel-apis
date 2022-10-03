const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    postId: {
        type: String,
    },
    type: {
        type: String,
        enum: ["postCreate", "postDelete", "follow", "unfollow"],
        default: "PostCreate"
    }, 
    text: {
        type: String,
        required: true,
    },
    date: {
        type: Date, 
        required: true
    }, 
    receivers: [String], 
    rflag: {
        type: Boolean, 
        default: false
    }
});

module.exports = mongoose.model('Notifications', notificationSchema);
