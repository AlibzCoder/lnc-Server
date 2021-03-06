const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { secret, refreshSecret, expiresIn, refreshExpiresIn } = require('../consts');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const checkAuthMiddleware = require('../checkAuthMiddleware')

//Initializes an instance of the Router class.
const router = require('express').Router()




router.post('/register',
    body('name').notEmpty().isString().trim().escape(),
    body('userName').notEmpty().isString().trim().escape()
        .isLength({ min: 3, max: 30 }).matches(/^[A-Za-z][A-Za-z0-9_]{3,30}$/),
    body('password').notEmpty().isString().trim().escape()
        .isLength({ min: 8 }).matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/),
    (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array({ onlyFirstError: true }) });
        }

        User.findOne({ userName: req.body.userName })
            .then(user => {
                if (user) {
                    let error = { errorCode: 'USER_EXISTS', errorMessage: 'User Name Allready in use' };
                    return res.status(400).json(error);
                } else {
                    const newUser = new User({
                        name: req.body.name,
                        userName: req.body.userName,
                        password: req.body.password
                    });
                    bcrypt.genSalt(10, (err, salt) => {
                        if (err) throw err;
                        bcrypt.hash(newUser.password, salt,
                            (err, hash) => {
                                if (err) throw err;
                                newUser.password = hash;
                                newUser.save().then(user => res.status(200).json({}))
                                    .catch(err => res.status(400).json(err));
                            });
                    });
                }
            });
    });


router.post('/login',
    body('userName').notEmpty().isString().trim().escape(),
    body('password').notEmpty().isString().trim().escape(),
    (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array({ onlyFirstError: true }) });
        }

        const userName = req.body.userName;
        const password = req.body.password;
        User.findOne({ userName: userName })
            .then(user => {
                if (!user) {
                    return res.status(404).json({ errorCode: 'USER_NOT_FOUND', errorMessage: "No Account Found" });
                }
                bcrypt.compare(password, user.password)
                    .then(isMatch => {
                        if (isMatch) {
                            const payload = {
                                id: user._id,
                                userName: user.userName
                            };

                            var token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + expiresIn, data: payload }, secret);
                            var refreshToken = jwt.sign({ exp: Math.floor(Date.now() / 1000) + refreshExpiresIn, data: payload }, refreshSecret);

                            res.json({
                                Authorization: token,
                                RefreshToken: refreshToken
                            });
                        } else {
                            res.status(400).json({ errorCode: 'INCORRECT_PASSWORD', errorMessage: "Password is incorrect" });
                        }
                    });
            });
    });

router.post('/refreshToken', (req, res) => {
    var refreshToken = req.headers['refreshtoken'];
    jwt.verify(refreshToken, refreshSecret, (err, payload) => {
        if (err) {
            return res.sendStatus(401);
        }
        payload.exp = Math.floor(Date.now() / 1000) + expiresIn
        const token = jwt.sign(payload, secret);
        return res.status(200).json({ Authorization: token });
    });

});




module.exports = router;