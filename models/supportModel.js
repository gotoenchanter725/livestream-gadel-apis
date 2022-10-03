const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
    },
    query: {
        type: String,
        required: true,
    },
    date: {
        type: Date, 
        required: true
    }, 
    isRecieve: {
        type: Boolean, 
        default: false
    }
});

module.exports = mongoose.model('Support', supportSchema);
