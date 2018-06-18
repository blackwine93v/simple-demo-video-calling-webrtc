$(document).ready(() => {
  let CONTROLLER = window.CONTROLLER = {};
  CONTROLLER.peers = {}; // use socket id for peer's id
  let configuration = {
    "iceServers": [
      { "url": "stun:stun.l.google.com:19302" },
      { url: 'turn:numb.viagenie.ca', username: 'daoquocvuong@gmail.com', credential: "Vuong0165" }
    ]
  };

  CONTROLLER.startLocalStream = () => {
    const constraint = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      }, video: { width: 320, height: 240 }
    };
    navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;

    trace('Getting local stream');
    if (navigator.getUserMedia) {
      navigator.getUserMedia(constraint,
        function (stream) {
          successHandler('Got local stream', stream);
          CONTROLLER.localStream = stream.clone();

          // Remove audio track to avoid echo on local player
          const audioTrack = stream.getAudioTracks() && stream.getAudioTracks()[0];
          audioTrack && stream.removeTrack(audioTrack);
          UI.addNewSmallVideoViewStream(stream, 'local');
        },
        function (err) {
          errorHandler("The following error occurred: " + err.name);
        }
      );
    } else {
      errorHandler("getUserMedia not supported");
    }
  };

  CONTROLLER.callTo = (callee) => {
    trace('Calling to ', callee);

    // creating webRTC connection
    CONTROLLER.createWebRTCSession(true, callee);
  };

  /**
   * Create new WebRTC connection
   * @param {Boolean} isCaller 
   */
  CONTROLLER.createWebRTCSession = (isCaller, socketPartnerId) => {
    let pc = CONTROLLER.pc(socketPartnerId).pc;
    if (pc) {
      trace('Reuse peer', pc);
      return pc;
    }

    trace('Creating new peer for ', socketPartnerId);
    pc = new RTCPeerConnection(configuration);

    //save to peer array
    CONTROLLER.peers[socketPartnerId] = {};

    //set local stream to peer
    pc.addStream(CONTROLLER.localStream);
    trace('Added local stream ', CONTROLLER.localStream);

    pc.onnegotiationneeded = function () {
      // Make offer if this is caller
      if (isCaller) {
        trace('Making offer');
        pc.createOffer().then(offer => {
          successHandler('Maked offer', offer);
          // setLocalDescription first
          pc.setLocalDescription(offer)
            .then(() => successHandler('Set offfer setLocalDescription', offer))
            .catch(e => {
              errorHandler('Set offer setLocalDescription', e);
            });

          // pass to remote peer
          trace(`Sending offer to ${socketPartnerId}`, offer);
          SIGNAL.exchange('sdp', socketPartnerId, offer);
        }, e => {
          errorHandler('Failed to make offer', e);
        });
      }
    }

    pc.onicecandidate = function (event) {
      if (event.candidate) {
        trace('Got local candidate', event.candidate);
        trace(`Sending candidate to ${socketPartnerId}`, event.candidate);
        // pass candidate to remote peer
        SIGNAL.exchange('candidate', socketPartnerId, event.candidate);
      }
    }

    pc.onaddstream = function (event) {
      if (event.stream) {
        trace('Got new remote stream', event);
        //save stream to peer array
        CONTROLLER.peers[socketPartnerId].stream = event.stream;
        UI.addNewSmallVideoViewStream(event.stream, socketPartnerId);
      }
    }

    //save pc to peer array
    CONTROLLER.peers[socketPartnerId].pc = pc;
    return pc;
  };

  /**
   * Get peer
   * @param {String} peerId 
   */
  CONTROLLER.pc = (peerId) => {
    return CONTROLLER.peers[peerId] || {};
  }

  /**
   * Set remote ice candidate
   * @param {Object} candidate 
   */
  CONTROLLER.setNewIceCandidate = (candidate, fromSocketId) => {
    trace('Setting new ICE candidate', candidate);
    return CONTROLLER.pc(fromSocketId).pc.addIceCandidate(new RTCIceCandidate(candidate))
      .then(() => successHandler('Set candidate', candidate), e => {
        errorHandler('Set candidate', e);
      });
  }

  CONTROLLER.setOffer = (offer, fromSocketId) => {
    trace('Setting new offer', offer);
    return CONTROLLER.pc(fromSocketId).pc.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => successHandler('Set new offer', offer), e => errorHandler('Set new offer', e));
  }

  CONTROLLER.answerToSocket = (fromSocketId) => {
    trace('Answering to ', fromSocketId);
    trace('Creating answer for ', fromSocketId);
    CONTROLLER.pc(fromSocketId).pc.createAnswer().then(answer => {
      successHandler(`Created answer for ${fromSocketId}`, answer);
      //set to local sdp first
      trace('Save answer to local ', answer);
      CONTROLLER.pc(fromSocketId).pc.setLocalDescription(answer).then(() => {
        successHandler('Save answer to local', answer);

        trace('Sending answer to ', fromSocketId);
        SIGNAL.exchange('sdp', fromSocketId, answer);
      }, e => errorHandler('Save answer to local', e));
    }, e => errorHandler(`createAnswer for ${fromSocketId}`, e))
  }

  CONTROLLER.setRemoteSDP = (sdp, fromSocketId) => {
    trace('Got new remote SDP', sdp);
    CONTROLLER.pc(fromSocketId).pc.setRemoteDescription(new RTCSessionDescription(sdp))
      .then(() => successHandler('Save remote SDP', sdp), e => errorHandler('Save remote SDP', e));
  }



  // Start local stream
  CONTROLLER.startLocalStream();
});