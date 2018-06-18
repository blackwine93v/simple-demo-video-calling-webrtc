
$(document).ready(() => {
  let SIGNAL = window.SIGNAL = {};
  const socket = SIGNAL.socket = io();

  socket.on('welcome', msg => {
    UI.showMessage(msg);

    UI.showMySocketId(socket.id);
  });

  socket.on('message', msg => {
    UI.showMessage(msg);
  });

  socket.on('disconnect', socketId => {
    UI.showMessage(`${socketId} has leaved`);
    UI.removeSmallVideoView(socketId);
  });

  socket.on('user-list-update', userArray => {
    UI.updateRoom(userArray);
  });

  socket.on('exchange', ({ type, data, fromSocketId }) => {
    CONTROLLER.createWebRTCSession(false, fromSocketId);
    if (type === 'candidate') {
      // got new ice candidate
      CONTROLLER.setNewIceCandidate(data, fromSocketId).then(() => {
        console.log(`Set candidate from ${fromSocketId} success`);
      }, e => {
        console.error(`Set candidate from ${fromSocketId} failed`, e);
      });
    } else if (type === 'sdp') {
      if (data.type === 'offer') {
        // save offer and anwser this offer
        CONTROLLER.setOffer(data, fromSocketId).then(() => CONTROLLER.answerToSocket(fromSocketId), e => {
          console.error(`Set offer from ${fromSocketId} failed`, e);
        })
      } else {
        CONTROLLER.setRemoteSDP(data, fromSocketId);
      }
    }

  });


  SIGNAL.exchange = (type, toSocketId, data) => {
    socket.emit('exchange', { type, data, toSocketId });
  };
});
