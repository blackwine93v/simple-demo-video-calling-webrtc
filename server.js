const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 8000;

let rooms = {};

app.use('/static', express.static('static'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(PORT, () => {
  console.log('App is running on ', PORT);
});

io.on('connection', (socket) => {
  console.log('New connection', socket.id);
  io.to(socket.id).emit('welcome', { msg: `You is online now` });

  socket.on('room', (data) => {
    roomHandler(data, socket);
  });

  socket.on('send-to-room', (data) => {
    io.to(data.roomId).emit('message', { msg: data.msg });
  })

  socket.on('send-to-user', (data) => {
    io.to(data.socketId).emit('message', { msg: data.msg });
  })

  socket.on('request-call', ({ user, candidate, sdp }) => {
    // console.log('request-call', user, sdp);
    io.to(user).emit('request-call', { caller: socket.id, candidate, sdp });
  });

  socket.on('send-answer', ({ user, answer }) => {
    // console.log('send-answer', user, answer);
    io.to(user).emit('send-answer', { answer });
  });
});

function roomHandler({ room }, socket) {
  console.log('roomHandler', room);
  socket.join(room, () => {
    rooms[room] = rooms[room] || [];
    rooms[room].push(socket);

    console.log('Rooms', Object.keys(rooms).map(room => ({ [room]: rooms[room].length })));
    // broadcast to each room
    // Object.keys(rooms).map(room=> broadcastRoom(room, `Welcome to room ${room}. We have ${rooms[room].length} online(s).`));

    updateRoomUser(room, rooms[room].map(r => r.id));
    broadcastRoom(room, `${socket.id} has joined`);
  })
}

function broadcastRoom(roomId, msg) {
  io.to(roomId).emit('broadcast', { msg });
}

function updateRoomUser(roomId, listOfUser) {
  io.to(roomId).emit('update-room-user', { users: listOfUser });
}