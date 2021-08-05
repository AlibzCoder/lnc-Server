const SocketIO = require("socket.io");
const user = require("../models/user");
const socketIOMiddleware = require('./middleware');

module.exports = server => {

    const io = new SocketIO.Server(server, { cors: { origin: '*' } });
    io.use(socketIOMiddleware)

    let Users = {};
    // get All Users
    user.find({}, '_id userName name profileImgVersion description lastTimeActive', (err, _users) => {
        _users.forEach(_u => {
            _u.isOnline = false;
            Users[_u._id] = _u
        })
    });
    // Updates the Users Object when it changes in the database
    // using mongo , the replicaSet option should be turned on
    const usersChangeStream = user.watch();
    usersChangeStream.on("change", next => {
        const { operationType, documentKey, fullDocument, updateDescription } = next
        switch (operationType) {
            case 'delete': 
                delete Users[documentKey._id];
                io.local.emit('usersChange',{type: 'USER_REMOVED',id: documentKey._id})
                break;
            case 'insert':
                Users[documentKey._id] = fullDocument;
                const { _id, userName, name,profileImgVersion,description, lastTimeActive } = fullDocument;
                io.local.emit('usersChange',{
                    type: 'USER_ADDED',
                    id: documentKey._id,
                    fields:{_id,userName,name,profileImgVersion,description,lastTimeActive,isOnline:false}
                })
                break;
            case 'update':
                const { updatedFields, removedFields } = updateDescription;
                for (let i in updatedFields) { Users[documentKey._id][i] = updatedFields[i] }
                io.local.emit('usersChange',{type: 'USER_UPDATE',id: documentKey._id,fields:updatedFields})
                //for (let i in removedFields) { delete Users[documentKey._id][removedFields[i]] }
                break;
        }
    });









    io.on('connection', socket => {
        console.log('new connection', socket.token_payload)
        if (socket.token_payload) {
            const { _id, name, userName } = Users[socket.token_payload.data.id];

            if ('activeSockets' in Users[_id] && Users[_id].activeSockets) {
                Users[_id].activeSockets.push(socket.id)
            } else Users[_id].activeSockets = [socket.id]
            isOnline(socket,Users[_id])


            socket.once('getAllUsers', () => getAllUsers(socket))


            

            socket.on('disconnect', async () => {
                var socketIdIndex = Users[_id].activeSockets.indexOf(socket.id);
                if (socketIdIndex !== -1) { Users[_id].activeSockets.splice(socketIdIndex, 1) }
                isOnline(socket,Users[_id])

                if (Users[_id].activeSockets.length === 0) {
                    await user.updateOne({ _id: _id }, { $set: { lastTimeActive: new Date() } }, { upsert: false })
                }
            });
        }
    });



    const getAllUsers = socket => {
        const u = []
        for (let i in Users) {
            const { _id, userName, name,profileImgVersion ,description, lastTimeActive, isOnline } = Users[i];
            if (socket.token_payload.data.id !== i)
                u.push({ _id, userName, name,profileImgVersion ,description, lastTimeActive, isOnline })
        }
        socket.emit('users', u);
    }

    const isOnline = (socket,user) => {
        if (user.activeSockets && user.activeSockets.length > 0) {
            user.isOnline = true;
        } else user.isOnline = false;

        socket.broadcast.emit('usersChange',{
            type: user.isOnline ? 'USER_ONLINE' : 'USER_OFFLINE',
            id: user._id
        })
    }


}

