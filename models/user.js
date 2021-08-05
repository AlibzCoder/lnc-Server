const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    name: {
        type:String,
        default: '',
    },
    description: {
        type:String,
        default: '',
    },
    profileImgVersion:{
        type:Number,
        default: 0,
    },
    lastTimeActive:{
        type:Date,
        default: null,
    },
    userName: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
});
module.exports = User = mongoose.model('User', UserSchema);