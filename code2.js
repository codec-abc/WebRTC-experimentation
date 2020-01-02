// https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel
// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Simple_RTCDataChannel_sample

var connectButton = null;
var disconnectButton = null;
var sendButton = null;
var messageInputBox = null;
var receiveBox = null;

var localConnection = null;   // RTCPeerConnection for our "local" connection
var sendChannel = null;       // RTCDataChannel for the local (sender)

// Set things up, connect event listeners, etc.

function startup() {
    connectButton = document.getElementById('connectButton');
    disconnectButton = document.getElementById('disconnectButton');
    sendButton = document.getElementById('sendButton');
    messageInputBox = document.getElementById('message');
    receiveBox = document.getElementById('receivebox');

    // Set event listeners for user interface widgets

    connectButton.addEventListener('click', connectPeers, false);
    disconnectButton.addEventListener('click', disconnectPeers, false);
    sendButton.addEventListener('click', sendMessage, false);
}

// Connect the two peers. Normally you look for and connect to a remote
// machine here, but we're just connecting two local objects, so we can
// bypass that step.

function connectPeers() {
    // Create the local connection and its event listeners

    localConnection =  new RTCPeerConnection({
        iceServers: [{
            urls: 'stun:stun.l.google.com:19302'
        }]
    });

    localConnection.ondatachannel = function(event) {
        sendChannel = event.channel;
        sendChannel.onopen = handleSendChannelStatusChange;
        sendChannel.onclose = handleSendChannelStatusChange;
        sendChannel.onmessage = handleSendChannelMessage;
    }

    // Create the remote connection and its event listeners

    localConnection.onicecandidate = function (e) {
        // send candidate connection to other;
        var x = {};
        if (e.candidate) {
            x = e.candidate;
        }

        console.log(
            "addIceCandidate(JSON.parse('" + 
            JSON.stringify(x)
            + "'));"
        );
        
    };

    localConnection.oniceconnectionstatechange = function (e) {
        console.log("new ice connection state: " + localConnection.iceConnectionState);
        console.log(e);
    };

    localConnection.onicegatheringstatechange = function() {
        let label = "Unknown";
      
        switch(localConnection.iceGatheringState) {
          case "new":
          case "complete":
            label = "Idle";
            break;
          case "gathering":
            label = "Determining route";
            break;
        }

        console.log("iceGatheringState " + label);
    }

    console.log("now ready for offer then ice candidate");
}

function addIceCandidate(e) {
    
    if (!localConnection) {
        console.log("add offer before");
        return;
    }

    var candidate = new RTCIceCandidate(e);
    localConnection.addIceCandidate(candidate)
    .catch(handleAddCandidateError);
}

function setOffer(e) {

    if (!localConnection) {
        console.log("click the connect button before");
        return;
    }
    
    let offer = new RTCSessionDescription(e);

    localConnection.setRemoteDescription(offer)
    .then(() => localConnection.createAnswer())
    .then(answer => {
            localConnection.setLocalDescription(answer);
            //console.log("answer as base 64 encoded JSON");
            console.log(
                "setAnswer(JSON.parse(atob(\"" +
                btoa(JSON.stringify(answer))
                + "\")));");
        }
    )
    .catch(handleCreateDescriptionError);

}

// Handle errors attempting to create a description;
// this can happen both when creating an offer and when
// creating an answer. In this simple example, we handle
// both the same way.

function handleCreateDescriptionError(error) {
    console.log("Unable to create an offer: " + error.toString());
}

// Handle successful addition of the ICE candidate
// on the "local" end of the connection.

function handleLocalAddCandidateSuccess() {
    connectButton.disabled = true;
}

// Handle successful addition of the ICE candidate
// on the "remote" end of the connection.

function handleRemoteAddCandidateSuccess() {
    disconnectButton.disabled = false;
}

// Handle an error that occurs during addition of ICE candidate.

function handleAddCandidateError() {
    console.log("Oh noes! addICECandidate failed!");
}

// Handles clicks on the "Send" button by transmitting
// a message to the remote peer.

function sendMessage() {
    var message = messageInputBox.value;
    sendChannel.send(message);

    // Clear the input box and re-focus it, so that we're
    // ready for the next message.

    messageInputBox.value = "";
    messageInputBox.focus();

    var el = document.createElement("p");
    var txtNode = document.createTextNode("me: " + message);

    el.appendChild(txtNode);
    receiveBox.appendChild(el);
}

// Handle status changes on the local end of the data
// channel; this is the end doing the sending of data
// in this example.

function handleSendChannelStatusChange(event) {
    console.log("handleSendChannelStatusChange");
    if (sendChannel) {
        var state = sendChannel.readyState;

        if (state === "open") {
            messageInputBox.disabled = false;
            messageInputBox.focus();
            sendButton.disabled = false;
            disconnectButton.disabled = false;
            connectButton.disabled = true;
        } else {
            messageInputBox.disabled = true;
            sendButton.disabled = true;
            connectButton.disabled = false;
            disconnectButton.disabled = true;
        }
    }
}

function handleSendChannelMessage(event) {
    var el = document.createElement("p");
    var txtNode = document.createTextNode("other: " + event.data);

    el.appendChild(txtNode);
    receiveBox.appendChild(el);
}

// Close the connection, including data channels if they're open.
// Also update the UI to reflect the disconnected status.

function disconnectPeers() {

    // Close the RTCDataChannels if they're open.

    sendChannel.close();
    receiveChannel.close();

    // Close the RTCPeerConnections

    localConnection.close();
    remoteConnection.close();

    sendChannel = null;
    receiveChannel = null;
    localConnection = null;
    remoteConnection = null;

    // Update user interface elements

    connectButton.disabled = false;
    disconnectButton.disabled = true;
    sendButton.disabled = true;

    messageInputBox.value = "";
    messageInputBox.disabled = true;
}

// Set up an event listener which will run the startup
// function once the page is done loading.

window.addEventListener('load', startup, false);
