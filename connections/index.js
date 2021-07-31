const SocketIO = require("socket.io");
var jwtAuth = require('socketio-jwt-auth');
const { secret } = require('../consts');
const user = require("../models/user");

module.exports = server => {

    const io = new SocketIO.Server(server, { cors: { origin: '*' } });
    io.use(jwtAuth.authenticate({ secret: secret, succeedWithoutToken: false }, (payload, done) => {
        if (payload && payload.data.id) {
            user.findOne({ _id: payload.data.id }, '_id', function (err, user) {
                if (err) return done(err);
                if (!user) return done(null, false, 'user does not exist')
                return done(null, user);
            });
        } else return done()
    }));

    let Users = {};
    // get All Users
    user.find({}, '_id userName name lastTimeActive', (err, _users) => {
        _users.forEach(_u => Users[_u._id] = _u)
    });
    // Updates the Users Object when it changes in the database
    // using mongo , the replicaSet option should be turned on
    const usersChangeStream = user.watch();
    usersChangeStream.on("change", next => {
        const { operationType, documentKey, fullDocument, updateDescription } = next
        switch (operationType) {
            case 'delete': delete Users[documentKey._id]; break;
            case 'insert':
                Users[documentKey._id] = fullDocument; break;
            case 'update':
                const { updatedFields, removedFields } = updateDescription;
                for (let i in updatedFields) { Users[documentKey._id][i] = updatedFields[i] }
                for (let i in removedFields) { delete Users[documentKey._id][removedFields[i]] }
                break;
        }
    });




    io.on('connection', socket => {
        console.log('new connection')
        if (socket.request.user) {
            const { _id, name, userName } = Users[socket.request.user._id];

            if ('activeSockets' in Users[_id] && Users[_id].activeSockets) {
                Users[_id].activeSockets.push(socket.id)
            } else Users[_id].activeSockets = [socket.id]
            


            socket.once('getAllUsers',()=>getAllUsers(socket))


            

            socket.on('disconnect', async () => {
                var socketIdIndex = Users[_id].activeSockets.indexOf(socket.id);
                if (socketIdIndex !== -1) { Users[_id].activeSockets.splice(socketIdIndex, 1) }

                if (Users[_id].activeSockets.length === 0) {
                    await user.updateOne({_id:_id}, {$set:{lastTimeActive:new Date()}}, { upsert: false })
                }
            });
        }
    });



    const getAllUsers = socket =>{
        const u = {}
        for(let i in Users){
            const {_id,userName,...userInfo} = Users[i];
            u[userName] = userInfo;
        }
        socket.send(u);
    }

}

