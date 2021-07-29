const {secret} = require('./consts');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token == null) return res.sendStatus(401)
    jwt.verify(token, secret, (err, payload) => {
        if (err) {
            return res.sendStatus(401);
        }
        req.tokenPayload = payload;
        next()
    });
}

