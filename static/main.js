var local, video2, pc1, pc2, localStream;
var server = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };
var connections = {}; // use partner socket Id for connection id
window.connections = connections;
function start() {
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  }).then(stream => {
    addVideoView('local', stream);
    localStream = stream;
    console.log('Starting local stream');
  }).catch(e => {
    throw e;
  })
}

function removeConnection(connectionId) {
  delete connections[connectionId];
  displayRemoteStream();
}

function updateConnectionStore(id, data = {}) {
  const connection = connections[id] || {};
  const newConnection = { ...connection, ...data };
  connections[id] = newConnection;
  if(data.stream) {
    console.log('Add new view');
    addVideoView(id, data.stream);
    displayRemoteStream();
  }
  return connections;
}

function addVideoView(id, stream) {
  const groupVideo = document.getElementById('remote-video-group');
  const videoView = document.createElement('video');
  videoView.width = 200;
  videoView.autoplay = true;
  videoView.id = id;
  videoView.srcObject = stream;
  videoView.onclick = displayRemoteStream.bind(this, stream);
  videoView.className = "clickable";
  groupVideo.appendChild(videoView);
}

function removeVideoView(id) {
  const groupVideo = document.getElementById('remote-video-group');
  const videoView = document.getElementById(id);
  groupVideo.removeChild(videoView);
}

function getPeer(peerId, opt = {}) {
  console.log('getPeer ', peerId);
  const connection = connections[peerId] || {};
  let peer = connection.peer;
  // reuse instance
  if (peer && !opt.forceNew)
    return peer;
  peer = new RTCPeerConnection(server);

  peer.onaddstream = function (e) {
    console.log('Added new stream', e);
    updateConnectionStore(peerId, { stream: e.stream });
  }
  console.log('Added localstream to peer');
  localStream.getTracks().forEach(
    function (track) {
      peer.addTrack(
        track,
        localStream
      );
    }
  );

  updateConnectionStore(peerId, { peer });
  window.peer = peer;

  return peer;
}


function getIceCandidate(peerId) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Getting Ice Candidate');
      const pc = getPeer(peerId);
      pc.onicecandidate = function (e) {
        console.log('Got Ice Candidate');
        resolve(e.candidate);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function getSDP(peerId) {
  console.log('Creating offer');
  const pc = getPeer(peerId);
  return pc.createOffer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }).then(desc => {
    console.log('Created offer');
    console.log('Doing setLocalDescription')
    pc.setLocalDescription(desc).then(setLocalDescriptionSuccess, setLocalDescriptionError);
    return desc;
  }, e => {
    console.error('createOffer failed');
  })
}

function setSDP(sdp, caller) {
  const pc = getPeer(caller);
  console.log('Doing setRemoteDescription of ', caller);
  return pc.setRemoteDescription(sdp).then(setRemoteDescriptionSuccess, setRemoteDescriptionError);
}

function setIceCandidate(candidate, caller) {
  const pc = getPeer(caller);
  console.log('Doing addIceCandidate of ', caller);
  return pc.addIceCandidate(candidate).then(setIceCandidateSuccess, setIceCandidateError);
}

function getAnswer(peerId) {
  const pc = getPeer(peerId);
  console.log('Creating answer')
  return pc.createAnswer().then(desc => {
    console.log('Created answer')
    pc.setLocalDescription(desc).then(setLocalDescriptionSuccess, setLocalDescriptionError);
    return desc
  }, e => {
    console.error('createAnswer failed');
  })
}

function setAnswer(answer, peerId) {
  console.log('Adding answer')
  const pc = getPeer(peerId);
  pc.setRemoteDescription(answer).then(setRemoteDescriptionSuccess, setRemoteDescriptionError);
}

function displayRemoteStream(stream) {
  if(!stream) {
    stream = connections[Object.keys(connections)[0]] && connections[Object.keys(connections)[0]].stream;
  }

  const remote = document.getElementById('remote');
  remote.srcObject = stream || null;
  console.log('Displayed RemoteStream');
}

function setLocalDescriptionSuccess() {
  console.log('setLocalDescription Success');
}

function setLocalDescriptionError(e) {
  console.log('setLocalDescription Error', e);
}

function setRemoteDescriptionSuccess() {
  console.log('setRemoteDescription Success');
}

function setRemoteDescriptionError(e) {
  console.log('setRemoteDescription Error', e);
}

function setIceCandidateSuccess() {
  console.log('setIceCandidateSuccess Success');
}

function setIceCandidateError(e) {
  console.log('setIceCandidateError Success', e);
}

window.onload = function () {
  //start local streaming
  start();
}
