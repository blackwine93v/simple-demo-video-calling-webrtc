const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const _ = require('lodash');

const PORT = process.env.PORT || 8000;

app.use('/static', express.static('static'));
app.use('/lib', express.static(__dirname + '/node_modules'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(PORT, () => {
  console.log('App is running on ', PORT);
});

io.on('connection', (socket) => {
  // notify all client about new client
  userListChangeBroadcast(socket);
  broadcastMsgNotMe(`${socket.id} has joined`, socket);

  // Welcome msg
  emitToSocket('welcome', socket.id, `You're now online`);

  socket.on('disconnect', () => {
    userListChangeBroadcast(socket);
    broadcastUserDisconnect(socket.id);
  });

  socket.on('exchange', data => {
    exchangeHandler(data, socket);
  });
});

function broadcastUserDisconnect(socketId) {
  io.emit('disconnect', socketId);
}

/**
 * Handle candidate & sdp data, exchange from each peer
 */
function exchangeHandler({ type, toSocketId, data }, fromSocket) {
  emitToSocket('exchange', toSocketId, { type, data, fromSocketId: fromSocket.id });
}

/**
 * Broadcast to all client about new changes on room
 */
function userListChangeBroadcast(socket) {
  const userArray = Object.keys(io.sockets.adapter.rooms);
  io.emit('user-list-update', userArray);
  console.log('Room change', userArray);
}

/**
 * Broadcast to all client
 * @param {String} msg 
 */
function broadCastMsg(msg) {
  io.emit('message', msg);
}

/**
 * Emit an event to specific socket
 * @param {String} event 
 * @param {String} socketId 
 * @param {any} data 
 */
function emitToSocket(event, socketId, data) {
  io.to(socketId).emit(event, data);
}

/**
 * Broadcast message to all client, not this socket
 * @param {String} msg 
 * @param {Socket} socket 
 */
function broadcastMsgNotMe(msg, socket) {
  socket.broadcast.emit('message', msg);
}
