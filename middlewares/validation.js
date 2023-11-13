const { imageTypes, audioTypes, videoTypes, limitedImageSize, limitedAudioSize, limitedVideoSize, postTypes } = require('./const');
const { compareArray, validateEmail, getPostType } = require('./function');

function ValidateText(value, inputName, { minlength = 3, maxlength = 50, isRequired = true } = {}) {
    if (!isRequired && !value) return undefined;

    if (typeof value !== 'string') throw (`Invalid ${inputName} Data Type`);

    value = value.trim();

    if (isRequired && !value) throw (`The ${inputName} fields is Required`);
    if (value.length > maxlength || value.length < minlength) throw (`The ${inputName} need to be within ${minlength} to ${maxlength} characters longs`);

    return value;
}

function ValidatePhone(value, inputName, { minlength = 3, maxlength = 50, isRequired = true } = {}) {
    if (!isRequired && !value) return undefined;

    if (typeof value !== 'string') throw (`Invalid ${inputName} Data Type`);

    value = value.trim();

    if (isRequired && !value) throw (`The ${inputName} fields is Required`);
    if (value.length > maxlength || value.length < minlength) throw (`The ${inputName} need to be within ${minlength} to ${maxlength} characters longs`);

    return value;
}

// Input Validation
function Validate_Login(req, res, next) {
    try {
        if (!validateEmail(req.body.email)) throw "invalid Email";

        req.body.password = ValidateText(req.body.password, 'Password', {
            minlength: 6,
            maxlength: 200
        });

        next();
    } catch (e) {
        res.status(400).json({
            state: false,
            data: e
        })
    }
};

function Validate_Register(req, res, next) {
    try {
        req.body.firstname = ValidateText(req.body.firstname, 'Firstname', { minlength: 1, maxlength: 25 });
        req.body.lastname = ValidateText(req.body.lastname, 'Lastname', { minlength: 1, maxlength: 25 });
        // if (compareArray(Banned_Username, req.body.username.toLowerCase())) throw (`You cannot use this Username`);
        req.body.phone = ValidatePhone(req.body.phone, 'Phone', { minlength: 10, maxlength: 15 })      
        req.body.password = ValidateText(req.body.password, 'Password', { minlength: 6, maxlength: 200 });
        req.body.confirmPassword = ValidateText(req.body.confirmPassword, 'Confirm Password', { minlength: 6, maxlength: 200 });
        if (req.body.confirmPassword !== req.body.password) throw (`The Passwords doesnt Match`);

        next();
    } catch (e) {
        res.status(200).send({
            e: e,
            errMessage: "validation Error",
            status: false
        })
    }
};

function Validate_Change_Email(req, res, next) {
    try {
        if (!validateEmail(req.body.email)) throw "invalid Email";

        req.body.username = ValidateText(req.body.username, 'Username', {
            minlength: 8,
            maxlength: 200
        });

        next();
    } catch (e) {
        res.status(400).json({
            state: false,
            data: e
        })
    }
}

function Validate_Support(req, res, next) {
    try {
        req.body.query = ValidateText(req.body.query, 'Query', {
            minlength: 40,
            maxlength: 5000
        });

        next();
    } catch (e) {
        res.status(400).json({
            state: false,
            data: e
        })
    }
}

const imageValidation = async(req, res, next) => {
    try {
        if (!req.files || !req.files.file) {
            throw "no file"
        }
        const file = req.files.file;
        const type = file.name.split('.')[file.name.split('.').length - 1].toLowerCase();
        if (imageTypes.indexOf(type) == -1) {
            throw "invalid file type"
        }
        if (file.size > limitedImageSize.value) throw `file size is limited by ${limitedImageSize.alias}`
        next();
    } catch (e) {
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}
const audioValidation = async(req, res, next) => {
    try {
        if (!req.files || !req.files.file) {
            throw "no file"
        }
        const file = req.files.file;
        const type = file.name.split('.')[file.name.split('.').length - 1].toLowerCase();
        if (audioTypes.indexOf(type) == -1) {
            throw "invalid file type"
        }
        if (file.size > limitedAudioSize) throw `file size is limited by ${limitedAudioSize.alias}`
        next();
    } catch (e) {
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}
const videoValidation = async(req, res, next) => {
    try {
        if (!req.files || !req.files.file) {
            throw "no file"
        }
        const file = req.files.file;
        const type = file.name.split('.')[file.name.split('.').length - 1].toLowerCase();
        if (videoTypes.indexOf(type) == -1) {
            throw "invalid file type"
        }
        if (file.size > limitedVideoSize) throw `file size is limited by ${limitedVideoSize.alias}`
        next();
    } catch (e) {
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}

function fileValidation(req, res, next) {
    try {
        if (!req.files || !req.files.file) {
            throw "no file"
        }

        // if (!req.body.title || !req.body.description || !req.body.location || !req.body.text || !req.body.type || postTypes.indexOf(req.body.type) === -1) {
        //     throw 'Invalid Param'
        // }

        
        if (!req.body.title || !req.body.description || !req.body.location ) {
            throw 'Invalid Param'
        }

        const file = req.files.file;
        const type = file.name.split('.')[file.name.split('.').length - 1].toLowerCase();
        if( req.body.type == null ) req.body.type = getPostType(file)
        if (req.body.type == "HELPME" || req.body.type == "PHOTO") {
            if (imageTypes.indexOf(type) == -1) {
                throw "invalid image type"
            }
            if (file.size > limitedImageSize) throw `file size is limited by ${limitedImageSize.alias}`
        } else if (req.body.type == "AUDIO") {
            if (audioTypes.indexOf(type) == -1) {
                throw "invalid audio type"
            }
            if (file.size > limitedVideoSize) throw `file size is limited by ${limitedAudioSize.alias}`
        } else if (req.body.type == "VIDEO") {
            if (videoTypes.indexOf(type) == -1) {
                throw "invalid video type"
            }
            if (file.size > limitedVideoSize) throw `file size is limited by ${limitedVideoSize.alias}`
        }
        next();
    } catch (e) {
        res.status(400).json({
            state: false,
            errMessage: e
        })
    }
}



module.exports = { Validate_Login, Validate_Register, Validate_Change_Email, Validate_Support, imageValidation, audioValidation, videoValidation, fileValidation }