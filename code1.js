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

    localConnection = new RTCPeerConnection({
        iceServers: [{
            url: 'stun:stun.l.google.com:19302'
        }]
    });

    // Create the data channel and establish its event listeners
    sendChannel = localConnection.createDataChannel("sendChannel");
    sendChannel.onopen = handleSendChannelStatusChange;
    sendChannel.onclose = handleSendChannelStatusChange;
    sendChannel.onmessage = handleSendChannelMessage;

    // Set up the ICE candidates for the two peers

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

    // Now create an offer to connect; this starts the process

    localConnection.createOffer()
    .then(
        offer => {
            localConnection.setLocalDescription(offer);
            //console.log("offer as base 64 encoded JSON");

            console.log(
                "setOffer(JSON.parse(atob(\"" +
                btoa(JSON.stringify(localConnection.localDescription))
                + "\")));");
        }
    )
    .catch(handleCreateDescriptionError);
}

function setAnswer(e) {
    localConnection.setRemoteDescription(e)
    .then(() => console.log("connection state " + localConnection.iceConnectionState))
    .catch(handleSetAnwserError);

    console.log("connection state " + localConnection.iceConnectionState);
}

function addIceCandidate(e) {

    if (!localConnection || !localConnection.localDescription) {
        console.log("add offer before");
        return;
    }

    var candidate = new RTCIceCandidate(e);
    localConnection.addIceCandidate(candidate)
    .catch(handleAddCandidateError);
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

function handleAddCandidateError(error) {
    console.log("Oh noes! addICECandidate failed!" + error);
}

function handleSetAnwserError() {
    console.log("Oh noes! setAnswer failed!");
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