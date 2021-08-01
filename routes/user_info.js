const User = require('../models/user');
const checkAuthMiddleware = require('../checkAuthMiddleware')

//Initializes an instance of the Router class.
const router = require('express').Router()

router.use(checkAuthMiddleware)



router.get('/profile', (req, res) => {
    User.findOne({_id:req.tokenPayload.data.id},'userName name',(err,user)=>{
        if(err) res.status(404).json({error:'user not found'})
        res.status(200).json(user)
    })
})





module.exports = router;