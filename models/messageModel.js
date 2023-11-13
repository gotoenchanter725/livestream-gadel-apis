const { default: mongoose } = require("mongoose")

const messageSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: "User"
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: "User"
    },
    content: {
        type: String
    },
    readed: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date
    },
    file: {
        type: String
    },
    oldName: {
        type: String
    },
    fileType: {
        type: String,
        enum: ["image", "other"]
    }
});

module.exports = mongoose.model("Message", messageSchema);