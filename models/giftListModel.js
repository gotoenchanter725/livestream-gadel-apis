const mongoose = require('mongoose');
require("mongoose-double")( mongoose );

const giftListSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    price: {
        type: mongoose.Schema.Types.Double,
    },
    icon: {
        type: String
    },
    type: {
        type: String,
        enum: ["Official", "Regular"],
        default: "Official"
    }
});

module.exports = mongoose.model('GiftList', giftListSchema);
