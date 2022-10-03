const mongoose = require('mongoose');
const { ActionForEmailCampaignsEnum } = require('sib-api-v3-sdk/src/model/RequestContactExportCustomContactFilter');

var validateEmail = function (email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email)
};

const settingSchema = new mongoose.Schema({
    language: {
        type: String,
        default: "EN"
    },
    postType: {
        type: String,
        enum: ["HELPME", "AUDIO", "PHOTO", "VIDEO"],
        default: "VIDEO"
    },
    deactivate: {
        type: Boolean,
        default: false,
    },
    postsDisplayMode: {
        type: String,
        enum: ["NATIONAL", "INTERNATIONAL"],
        default: "INTERNATIONAL"
    }
})

const followSchem = new mongoose.Schema({
    userId: {
        type: String, 
        required: true
    }, 
    postId: {
        type: String, 
    }, 
    date: {
        type: Date
    }, 
    isActive: {
        type: Boolean, 
        default: false
    }
})

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
    },
    lastname: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        maxlength: 50,
        minlength: 3,
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: true,
        validate: [validateEmail, 'Please fill a valid email address'],
        match: [/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please fill a valid email address']
    },
    email_active: {
        type: Boolean, 
        default: false
    }, 
    email_verification_code: {
        type: String,
    },
    country: {
        type: String,
    },
    profile_image_path: {
        type: String,
    },
    expire_at: {
        type: String,
    },
    setting: {
        type: settingSchema,
        default: {
            languages: "EN",
            postType: "VIDEO",
            deactivate: false,
            postsDisplayMode: "INTERNATIONAL"
        }
    }, 
    follows: {
        type: [followSchem]
    }
});

userSchema.methods.updateInactiveDate = function () {
    this.expire_at = Date.now() + 86400000;
};

module.exports = mongoose.model('User', userSchema);
