const { copyFile } = require('fs');
const { path } = require('path');

function compareArray(array, value) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === value) return true;
    }
    return;
};

function generateRandomName(name) {
    return `${generateRandomString(17, 'letterAndnumber')}.${getFilesMimetype(name, '.')}`
}

function getFilesMimetype(string, symbol) {
    const mimetype = string.split(symbol);
    return `${mimetype[mimetype.length - 1]}`;
};

function createProfilePicture(name) {
    const randomImgName = generateRandomName(name, 17)
    const imgPath = `./uploads/userImg/${randomImgName}`

    copyFile('./public/default/male.png', imgPath, (err) => {
        if (err) throw err;
    });

    return `uploads/userImg/${randomImgName}`;
}

function generateRandomString(length, allowedCharacters) {
    allowedCharacters = getAllowedCharacters(allowedCharacters);

    var result = '',
        charactersLength = allowedCharacters.length;

    for (var i = 0; i < length; i++) {
        result += allowedCharacters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getAllowedCharacters(allowedCharacters) {
    if (allowedCharacters === 'letterAndnumber') return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    if (allowedCharacters === 'number') return '0123456789'
    if (allowedCharacters === 'letter') return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%&'
}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email)
};

function randomDegitalNumber(length) {
    let rst = Math.floor(Math.random() * Math.pow(10, length < 1 ? 1 : length)) + "";
    if (rst.length < 6) rst = "0" + rst;
    return rst;
}

function getChunkProps(range, fileSize) {
    const parts = range.replace(/bytes=/, '').split('-');

    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    return {
        start,
        end,
        chunkSize,
    };
};

function getFileSizeAndResolvedPath(filePath) {
    const resolvedPath = path.resolve(filePath);
    const stat = fs.statSync(resolvedPath);
    return { fileSize: stat.size, resolvedPath: resolvedPath };
};

module.exports = { 
    compareArray, 
    createProfilePicture, 
    generateRandomName, 
    getFilesMimetype, 
    validateEmail, 
    randomDegitalNumber, 
    getChunkProps, 
    getFileSizeAndResolvedPath
}
