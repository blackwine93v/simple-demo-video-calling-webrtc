var local, video2, pc1, pc2, localStream;
var server = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };
var peer;

function start() {
  local = document.getElementById('local');
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  }).then(stream => {
    local.srcObject = stream;
    localStream = stream;
    console.log('Starting local stream');
    addLocalTrack();
  }).catch(e => {
    throw e;
  })
}

function getPeer() {
  peer = peer || new RTCPeerConnection(server);
  return peer;
}

function addLocalTrack() {
  const pc = getPeer();
  localStream.getTracks().forEach(
    function (track) {
      pc.addTrack(
        track,
        localStream
      );
    }
  );
  console.log('Added localstream to peer');
}

function getIceCandidate() {
  return new Promise((resolve, reject) => {
    try {
      const pc = getPeer();
      pc.onicecandidate = function (e) {
        resolve(e.candidate);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function getSDP() {
  console.log('Creating offer');
  const pc = getPeer();
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

function setSDP(sdp) {
  const pc = getPeer();
  console.log('Doing setRemoteDescription')
  return pc.setRemoteDescription(sdp).then(setRemoteDescriptionSuccess, setRemoteDescriptionError);
}

function setIceCandidate(candidate) {
  const pc = getPeer();
  console.log('Doing addIceCandidate')
  return pc.addIceCandidate(candidate).then(setIceCandidateSuccess, setIceCandidateError);
}

function getAnswer() {
  const pc = getPeer();
  console.log('Creating answer')
  return pc.createAnswer().then(desc => {
    console.log('Created answer')
    pc.setLocalDescription(desc).then(setLocalDescriptionSuccess, setLocalDescriptionError);
    return desc
  }, e => {
    console.error('createAnswer failed');
  })
}

function setAnswer(answer) {
  console.log('Adding answer')
  const pc = getPeer();
  pc.setRemoteDescription(answer).then(setRemoteDescriptionSuccess, setRemoteDescriptionError);
}

function getRemoteStream() {
  const pc = getPeer();
  const remote = document.getElementById('remote');
  return new Promise((resolve, reject) => {
    try {
      pc.ontrack = function (e) {
        const remoteStream = e.streams[0];
        remote.srcObject = remoteStream;
        resolve(remoteStream);
      }
    } catch (e) {
      reject('Get remote stream failed');
    }
  })
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

function call() {
  pc1 = new RTCPeerConnection(server);
  pc1.onicecandidate = function (e) {
    e.candidate && pc2.addIceCandidate(e.candidate).then(function () {
      console.log('pc2 added new candidate', e.candidate);
    }, function (e) {
      throw e;
    })
  }


  pc2 = new RTCPeerConnection(server);
  pc2.onicecandidate = function (e) {
    e.candidate && pc1.addIceCandidate(e.candidate).then(function () {
      console.log('pc1 added new candidate', e.candidate);
    }, function (e) {
      throw e;
    })
  }

  pc2.ontrack = function (e) {
    video2 = document.getElementById('video2');
    if (video2.srcObject !== e.streams[0]) {
      video2.srcObject = e.streams[0];
      console.log('Added remote stream');
    }
  }

  localStream.getTracks().forEach(
    function (track) {
      pc1.addTrack(
        track,
        localStream
      );
    }
  );
  console.log('Added localstream to pc1');

  pc1.createOffer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1
  }).then(function (desc) {
    pc1.setLocalDescription(desc).then(function () {
      console.log('pc1 setLocalDescription ok')
    }, function (e) {
      console.error('pc1 setLocalDescription failed')
    });

    pc2.setRemoteDescription(desc).then(function () {
      console.log('pc2 setRemoteDescription ok')
    }, function (e) {
      console.error('pc2 setRemoteDescription failed')
    });

    pc2.createAnswer().then(function (desc) {
      pc2.setLocalDescription(desc).then(function () {
        console.log('pc2 setLocalDescription ok')
      }, function (e) {
        console.log('pc2 setLocalDescription failed')
      })

      pc1.setRemoteDescription(desc).then(function () {
        console.log('pc1 setRemoteDescription ok')
      }, function (e) {
        console.log('pc1 setRemoteDescription failed')
      })
    }, function (e) { throw e })
  }, function (e) { throw e })
}

function stop() {
  local = video2 = null;
  pc1.close();
  pc2.close();
}


window.onload = function () {
  //start local streaming
  start();
}
