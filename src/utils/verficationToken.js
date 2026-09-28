const crypto = require('crypto');

const createVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
}

const createPasswordResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
}
const createOneTimeToken = () => {
    return crypto.randomBytes(32).toString('hex');
}
module.exports = {
    createVerificationToken,
    createPasswordResetToken,
    createOneTimeToken
}