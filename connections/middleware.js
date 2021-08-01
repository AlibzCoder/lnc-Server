const { secret } = require('../consts');
const user = require("../models/user");
const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, secret, (err, decoded) => {
            if (err) return next(err)
            user.findOne({ _id: decoded.data.id }, '_id', function (err, user) {
                let customError = new Error('');
                if (err) {
                    customError.message = 'Server Interal Error';
                    customError.name = 'InternalError';
                    return next(customError);
                }
                if (!user) {
                    customError.message = 'user does not exist';
                    customError.name = 'UserNotFound';
                    return next(customError);
                }
                socket.token_payload = decoded;
                next();
            });
        });
    } else {
        let err = new Error('no auth token was provided');
        err.name = 'TokenMissingError';
        return next(err);
    }
}