const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//Connect to mongo
mongo.connect('mongodb://localhost/mongochat', (err, db) => {
    if (err) {
        throw err;
    }

    console.log('MongoDb connected...');


    //connect to Socket.io
    client.on('connection', (socket) => {
        let chat = db.collection('chats');

        //send status to client
        let sendStatus = function(msg) {
            socket.emit('status', msg);
        };

        //get chats from mongo
        chat.find().limit(100).sort({_id: 1}).toArray((err, res) => {
            if (err){
                throw err;
            }

            //emit the message
            socket.emit('output', res);
        });

        //handle input events
        socket.on('input', (data) => {
            let name = data.name;
            let message = data.message;

            //check for name and message
            if (name === '' || message === ''){
                //send error status
                sendStatus('Please enter a name and message');
            }
            else {
                //insert message
                chat.insert({name, message}, () => {
                    client.emit('output', [data]);

                    //send status
                    sendStatus({
                        message: 'Message send',
                        clear: true
                    });
                });
            }
        });

        //handle clear
        socket.on('clear', (data) => {
            //remove all chats from db
            chat.remove({}, () => {
                socket.emit('cleared');
            });
        });
    });
});
