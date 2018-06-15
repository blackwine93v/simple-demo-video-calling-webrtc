var server = {
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" },
    { urls: 'turn:numb.viagenie.ca', username: 'daoquocvuong@gmail.com', credential: "Vuong0165" }
  ]
};

var socket = io();
var pc, localVideo, remoteVideo;

socket.on('candidate', candidate => {
  console.log('Got candidate', candidate);
  addCandidate(candidate);
})

socket.on('sdp', sdp => {
  console.log('Got sdp', sdp);
  addRemoteSdp(sdp);
})



function addRemoteSdp(sdp) {
  pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
    if (pc.remoteDescription.type === 'offer') {
      pc.createAnswer().then(answer=> {
        pc.setLocalDescription(answer).then(()=>{
          send('sdp', answer);
        }).catch(e=> {
          console.error('setLocalDescription failed [answer addRemoteSdp]', e)
        })
      }).catch(e=> {
        console.error('createAnswer failed [addRemoteSdp]', e)
      });
    }
  }).catch(e => {
    console.error('setRemoteDescription failed [addRemoteSdp]', e)
  })
}

function addCandidate(candidate) {
  pc.addIceCandidate(candidate).then(() => {
    console.log('addIceCandidate success')
  }).catch(e => {
    console.error('addIceCandidate failed', e)
  })
}

window.onload = function () {
  localVideo = document.getElementById('local');
  remoteVideo = document.getElementById('remote');

  createWebRTC();
}

function createWebRTC() {
  pc = new RTCPeerConnection(server);
  pc.onicecandidate = onIceCandidate;
  pc.onaddstream = onAddStream;
  pc.onnegotiationneeded = onNegotiationNeeded;
  pc.oniceconnectionstatechange = onIceConnectionStateChange
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { width: { exact: 320 }, height: { exact: 240 }, frameRate: { max: 15 } },
  }).then(stream => {
    pc.addStream(stream);
    localVideo.srcObject = stream;
  }).catch(e => {
    console.error('Get stream error', e);
  })
}

function onIceConnectionStateChange(event) {
  console.log('onIceConnectionStateChange', event)
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.log('Got local ice candidate', event);
    send('candidate', event.candidate)
  }
}

function onAddStream(event) {
  console.log('Got remote stream', event);
  remoteVideo.srcObject = event.stream;
}

function onNegotiationNeeded(event) {
  pc.createOffer().then(offer => {
    console.log('Create offer success', offer)
    pc.setLocalDescription(offer).then(() => {
      console.log('setLocalDescription success [offer]')
      send('sdp', offer);
    }).catch(e => {
      console.error('setLocalDescription failed [offer]', e)
    })
  }).catch(e => {
    console.error('Create offer failed', e);
  })
}

function send(eventName, data) {
  socket.emit(eventName, data);
}