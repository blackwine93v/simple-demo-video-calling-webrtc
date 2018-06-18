$(document).ready(()=> {
  let UI = window.UI = {};
  let messageDom = $('#msg-list')[0];
  let userListDom = $('#user-list')[0];
  let localStreamDom = $('#local')[0];
  let remoteStreamDom = $('#remote')[0];
  let remoteStreamGroupDom = $('#remote-video-group')[0];

  UI.showMessage = (msg) => {
    let li = $("<li />").text(msg);
    $(messageDom).append(li);
  };

  UI.updateRoom = (userArray) => {
    $(userListDom).empty();
    _.remove(userArray, userId=> userId === SIGNAL.socket.id);
    userArray.forEach(user=> {
      let li = $('<li />');
      let callBtn = $('<button/>').text('Call');

      callBtn[0].onclick = function() {
        //do calling
        CONTROLLER.callTo(user);
      };

      li.append($('<span/>').text(String(user)));
      li.append(callBtn);
      
      $(userListDom).append(li);
    });
  }

  UI.setLocalStream = (stream) => {
    if(stream) {
      localStreamDom && (localStreamDom.srcObject = stream);
    }
  };

  UI.showMySocketId = (id) => {
    $('#my-id').text(`My ID: ${id}`);
  }

  UI.showRemoteStream = stream => {
    if(!stream) {
      stream = Object.values(CONTROLLER.peers)[0] && Object.values(CONTROLLER.peers)[0].stream;
    }

    const _stream = stream.clone();

    // Remove audio track to avoid echo on local player
    const audioTrack = _stream.getAudioTracks() && _stream.getAudioTracks()[0];
    audioTrack && _stream.removeTrack(audioTrack);

    remoteStreamDom.srcObject = _stream || null;
  }

  UI.addNewSmallVideoViewStream = (stream, streamId) => {
    const videoView = $(`<video autoplay class="clickable" id="${streamId}"/>`);
    videoView[0].onclick = UI.showRemoteStream.bind(this, stream);
    videoView[0].srcObject = stream;
    $(remoteStreamGroupDom).append(videoView);
    UI.showRemoteStream();
  };

  UI.removeSmallVideoView = (streamId) => {
    const videoView = $(`#${streamId}`);
    videoView && videoView.remove();
    UI.showRemoteStream();
  }
});