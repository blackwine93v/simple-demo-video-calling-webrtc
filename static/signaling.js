var socket = io();
var room, message, roomUser;

window.io = socket;

socket.on('welcome', (data) => {
  showMessage(`Welcome message: ${data.msg}`);
  setMyId(socket.id);
});

socket.on('broadcast', (data) => {
  showMessage(`Broadcast from server ${data.msg}`);
});

socket.on('message', (data) => {
  showMessage(`You got a message ${data.msg}`);
});

socket.on('update-room-user', ({ users }) => {
  updateRoomUser(users);
});

socket.on('user-disconnect', ({ user }) => {
  showMessage(`${user} has leaved`);
  removeConnection(user);
  removeVideoView(user);
});

// receive a call from another user
socket.on('request-call', ({ caller, candidate, sdp }) => {
  if (candidate) {
    console.log('You got new request, candidate: ', candidate);
    setIceCandidate(candidate, caller);
  }

  if (sdp) {
    console.log('You got new request, sdp: ', sdp);
    setSDP(sdp, caller).then(() => {
      getAnswer(caller).then(answer => {
        sendAnswer(caller, answer);
      });
    })
  }
});

// recieve answer from user
socket.on('send-answer', ({ answer, user }) => {
  setAnswer(answer, user);
});

function setMyId(id) {
  const myId = document.getElementById('my-id');
  myId.innerText = id;
}

function sendAnswer(caller, answer) {
  socket.emit('send-answer', { user: caller, answer });
}

function enterRoom() {
  room = document.getElementById('room').value;
  if (room) {
    socket.emit('room', { room });
    document.getElementById('room').disabled = true;
    document.getElementById('enter-room-btn').disabled = true;
  }
}

function showMessage(msg) {
  message = document.getElementById('message');
  let messageText = document.createElement('p');
  messageText.innerText = `>> ${msg}`;
  message.appendChild(messageText);
}

function callToUser(user) {
  console.log('Calling to ', user);

  getSDP(user).then(desc => {
    desc && requestCall({ user, sdp: desc });
  });

  getIceCandidate(user).then(candidate => {
    candidate && requestCall({ user, candidate });
  }, e => {
    console.error(e);
  })
}

function requestCall(data) {
  socket.emit('request-call', { ...data });
}

function updateRoomUser(users) {
  roomUser = document.getElementById('online-list');
  roomUser.innerHTML = '';
  users.forEach(user => {
    if (user === socket.id) {
      return;
    }

    let li = document.createElement('li');
    li.innerText = user;
    li.className = "clickable";
    li.addEventListener('click', function () {
      callToUser(user);
    });
    roomUser.appendChild(li);
  })
}

