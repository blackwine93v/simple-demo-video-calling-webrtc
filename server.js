const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 8000;

app.use('/static', express.static('static'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/callee.html');
});

app.get('/caller', (req, res) => {
  res.sendFile(__dirname + '/caller.html');
});

http.listen(PORT, () => {
  console.log('App is running on ', PORT);
});

io.on('connection', (socket) => {
  console.log('New connection', socket.id);

  socket.on('candidate', candidate=> {
    socket.broadcast.emit('candidate', candidate);
  })

  socket.on('sdp', sdp=> {
    socket.broadcast.emit('sdp', sdp);
  })
});
