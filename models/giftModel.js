const mongoose = require('mongoose');
require("mongoose-double")( mongoose );

const giftSchema = new mongoose.Schema({
    id: {
        type: mongoose.Schema.ObjectId
    },
    title: {
        type: String,
    },
    price: {
        type: mongoose.Schema.Types.Double,
    },
    icon: {
        type: String
    },
    post: {
        type: mongoose.Schema.Types.ObjectId
    },
    date: {
        type: Date,
    }
});

module.exports = giftSchema;
