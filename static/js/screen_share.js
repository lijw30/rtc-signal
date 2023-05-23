'use strict';

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const startPushBtn = document.getElementById('btnStartPush');
const startPullBtn = document.getElementById('btnStartPull');

startPushBtn.addEventListener('click', startPush);
startPullBtn.addEventListener('click', startPull);

const config = {};

const offerOptions = {
    offerToReceiveAudio: false,
    offerToReceiveVideo: false
};

let pc1 = new RTCPeerConnection(config); // local pc
let pc2 = new RTCPeerConnection(config); // remote pc

function startPush() {
    console.log("start push stream");

    window.postMessage({type: 'SS_UI_REQUEST', text: "push"}, '*');
}

function startPull() {
    console.log("start pull stream");

    pc2.createAnswer().then(
        onCreateAnswerSuccess,
        onCreateSessionDescriptionError
    );
}

function onCreateAnswerSuccess(desc) {
    console.log('answer from pc2: \n' + desc.sdp);

    console.log('pc2 set local description start');
    pc2.setLocalDescription(desc).then(
        function() {
            onSetLocalSuccess(pc2);
        },
        onSetSessionDescriptionError
    );

    // 交换sdp
    pc1.setRemoteDescription(desc).then(
        function() {
            onSetRemoteSuccess(pc1);
        },
        onSetSessionDescriptionError
    );
}

window.addEventListener('message', function(event) {
    if (event.origin != window.location.origin) {
        return;
    }

    if (event.data.type && event.data.type === 'SS_DIALOG_SUCCESS') {
        console.log("用户同意屏幕共享, streamId: " + event.data.streamId);
        startScreenStreamFrom(event.data.streamId);
    } else if (event.data.type && event.data.type === 'SS_DIALOG_CANCEL') {
        console.log("用户取消屏幕共享");
    }
});

function startScreenStreamFrom(streamId) {
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: streamId,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height
            }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);
}

function handleSuccess(stream) {
    console.log("get screen stream success");
    localVideo.srcObject = stream;

    pc1.oniceconnectionstatechange = function(e) {
        onIceStateChange(pc1, e);
    };

    pc1.onicecandidate = function(e) {
        onIceCandidate(pc1, e);
    }

    pc1.addStream(stream);

    pc1.createOffer(offerOptions).then(
        onCreateOfferSuccess,
        onCreateSessionDescriptionError
    );
}

function getPc(pc) {
    return pc == pc1 ? 'pc1' : 'pc2';
}

function onCreateOfferSuccess(desc) {
    console.log('offer from pc1: \n' + desc.sdp);

    console.log('pc1 set local description start');
    pc1.setLocalDescription(desc).then(
        function() {
            onSetLocalSuccess(pc1);
        },
        onSetSessionDescriptionError
    );

    // sdp交换
    pc2.oniceconnectionstatechange = function(e) {
        onIceStateChange(pc2, e);
    }

    pc2.onicecandidate = function(e) {
        onIceCandidate(pc2, e);
    }

    pc2.onaddstream = function(e) {
        console.log('pc2 receive stream, stream_id: ' + e.stream.id);
        remoteVideo.srcObject = e.stream;
    }

    pc2.setRemoteDescription(desc).then(
        function() {
            onSetRemoteSuccess(pc2);
        },
        onSetSessionDescriptionError
    );
}

function onSetLocalSuccess(pc) {
    console.log(getPc(pc) + ' set local success');
}

function onSetRemoteSuccess(pc) {
    console.log(getPc(pc) + ' set remote success');
}

function onCreateSessionDescriptionError(err) {
    console.log('create session description error: ' + err.toString());
}

function onSetSessionDescriptionError(err) {
    console.log('set session description error: ' + err.toString());
}

function onIceStateChange(pc, e) {
    console.log(getPc(pc) + ' ice state change: ' + pc.iceConnectionState);
}

function getOther(pc) {
    return pc  == pc1 ? pc2 : pc1;
}

function onIceCandidate(pc, e) {
    console.log(getPc(pc) + ' get new ice candidate: ' +
        (e.candidate ? e.candidate.candidate : '(null)'));

    getOther(pc).addIceCandidate(e.candidate).then(
        function() {
            console.log(getPc(getOther(pc)) + ' add ice candidate success');
        },
        function(err) {
            console.log(getPc(getOther(pc)) + ' add ice candidate error: ' + err.toString());
        }
    );
}

function handleError(err) {
    console.log("get screen stream error: " + err.toString());
}



