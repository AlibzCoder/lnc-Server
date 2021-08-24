var mongoose = require('mongoose');
module.exports = initDB = callback => {
    var HOST_NAME = '127.0.0.1';
    var DATABASE_NAME = 'lncDB';
    var DATABASE_USERNAME = 'lnc';
    var DATABASE_PASSWORD = '1234';
    mongoose.connect(
        `mongodb://${DATABASE_USERNAME}:${DATABASE_PASSWORD}@${HOST_NAME}/${DATABASE_NAME}?replicaSet=rs0`,
        {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology:true
        }
    ).then(callback).catch(()=>console.log('Unable To Connect To Database'));
}