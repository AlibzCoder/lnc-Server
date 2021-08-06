const User = require('../models/user');
const checkAuthMiddleware = require('../checkAuthMiddleware')
const { body, validationResult } = require('express-validator');
let multer = require('multer');

var { promisify } = require('util');
var sizeOf = promisify(require('image-size'));
const fs = require("fs");
const { tempDir, ImgsDir } = require('../consts');


//Initializes an instance of the Router class.
const router = require('express').Router()

router.use(checkAuthMiddleware)




router.get('/profile', (req, res) => {
    User.findOne({ _id: req.tokenPayload.data.id }, 'userName name profileImgVersion description', (err, user) => {
        if (err) return res.status(404).json({ error: 'user not found' })
        res.status(200).json(user)
    })
})




router.post('/editProfile',
    body('name').notEmpty().isString().trim().escape(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array({ onlyFirstError: true }) });
        }

        let name = req.body.name;
        let description = req.body.description ?? '';
        description = description.trim() ?? '';

        User.findOne({ _id: req.tokenPayload.data.id }, (err, user) => {
            if (err) return res.status(404).json({ error: 'user not found' })

            user.name = name;
            user.description = description;
            user.save();

            res.status(200).send()
        })
    })



var ImageUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, tempDir),
        filename: (req, file, cb) => cb(null, `${req.tokenPayload.data.id}.jpg`)
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});

router.post('/uploadProfileImage', (req, res) => {
    ImageUpload.single('profile_img')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            switch (err.code) {
                case 'LIMIT_PART_COUNT':
                case 'LIMIT_FILE_SIZE':
                case 'LIMIT_FILE_COUNT':
                case 'LIMIT_FIELD_KEY':
                case 'LIMIT_FIELD_VALUE':
                case 'LIMIT_FIELD_COUNT':
                case 'LIMIT_UNEXPECTED_FILE':
                    return res.status(400).send(err.message)
                default:
                    console.log(err)
                    return res.status(500).send()
            }
        } else if (err) {
            return res.status(400).send(err.message)
        }
        if (!req.file) return res.status(400).send('No File Provided')


        sizeOf(`${tempDir}${req.tokenPayload.data.id}.jpg`)
            .then(dimensions => {
                if(dimensions.width === dimensions.height){
                    fs.rename(`${tempDir}${req.tokenPayload.data.id}.jpg`,`${ImgsDir}${req.tokenPayload.data.id}.jpg`,
                        err=>{
                            if(err)return res.status(500).send();
                            User.findOne({ _id: req.tokenPayload.data.id }, (err, user) => {
                                if(err)return res.status(500).send();
                                user.profileImgVersion += 1;
                                user.save()
                                return res.status(200).send();
                            });
                        })
                }else{
                    fs.unlink(`${tempDir}${req.tokenPayload.data.id}.jpg`, err => console.log(err));
                    return res.status(400).send('Image Aspect Ratio Should Be 1/1')
                }
            }).catch(err => {console.error(err);return res.status(500).send()});
    })
})




module.exports = router;