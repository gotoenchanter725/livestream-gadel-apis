const mongoose = require('mongoose');
require("mongoose-double")( mongoose );

const currencySchema = new mongoose.Schema({
    name: {
        type: String
    },
    symbol: {
        type: String
    },
    nickName: {
        type: String
    }
});

module.exports = mongoose.model('Currencies', currencySchema);
