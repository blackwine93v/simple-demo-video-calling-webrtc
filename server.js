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
  io.to(socket.id).emit('welcome', { msg: `You are online now` });
  console.log('AA',io.sockets.adapter.rooms);

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
    io.to(user).emit('send-answer', { answer, user: socket.id });
  });

  socket.on('send-candidate', ({ user, candidate })=> {
    io.to(user).emit('send-candidate', { candidate, user: socket.id });
  })

  socket.on('disconnect', () => {
    userLeaveRoom(socket.id);
  })
});

function userLeaveRoom(userId) {
  const roomId = findRoomFromUserId(userId);

  if (roomId && rooms[roomId]) {
    console.log(`${userId} has leaved room ${roomId}`);
    userDisconnectFromRoom(roomId, userId);
    delete rooms[roomId][userId];
    updateRoomUser(roomId, Object.keys(rooms[roomId]));
  }
}

function findRoomFromUserId(userId) {
  let foundRoom;
  for (roomId of Object.keys(rooms)) {
    console.log('findRoomFromUserId', roomId)
    if (rooms[roomId].hasOwnProperty(userId)) {
      foundRoom = roomId;
      break;
    }
  }

  return foundRoom;
}

function roomHandler({ room }, socket) {
  console.log('roomHandler', room);
  socket.join(room, () => {
    rooms[room] = rooms[room] || {};
    rooms[room][socket.id] = socket;

    console.log('Rooms', Object.keys(rooms).map(room => ({ [room]: Object.keys(rooms[room]).length })));
    // broadcast to each room
    // Object.keys(rooms).map(room=> broadcastRoom(room, `Welcome to room ${room}. We have ${rooms[room].length} online(s).`));
    updateRoomUser(room, Object.keys(rooms[room]));
    broadcastRoom(room, `${socket.id} has joined`);
  })
}

function broadcastRoom(roomId, msg) {
  io.to(roomId).emit('broadcast', { msg });
}

function userDisconnectFromRoom(roomId, userId) {
  io.to(roomId).emit('user-disconnect', { user: userId });
}

function updateRoomUser(roomId, listOfUser) {
  io.to(roomId).emit('update-room-user', { users: listOfUser });
}