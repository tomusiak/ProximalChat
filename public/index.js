socket = io();
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var circles = [];
var lines = [];
var audios = [];
var source_list = [];
var username = "";
var stream;
var edit = "";

var movement = {
  up: false,
  down: false,
  left: false,
  right: false
}

var constraints = {
    video: true,
    audio: true,
};

const video_array = [
  "video_0",
  "video_1",
  "video_2",
  "video_3",
  "video_4",
  "video_5"
]

const peer_connections = {};

online_user_x = 0;
online_user_y = 0;

function updateScroll(){
    var element = document.getElementById("messages");
    element.scrollTop = element.scrollHeight;
}

document.addEventListener('keydown', function(event) {
    switch (event.keyCode) {
      case 37: // A
          movement.left = true;
          /*
          audios.forEach(song => {
            (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(online_user_x-song.x,2)+Math.pow(online_user_y-song.y,2))),2) + 62500);
          });
          */
          break;

      case 38: // W
          movement.up = true;
          /*
          audios.forEach(song => {
            (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(online_user_x-song.x,2)+Math.pow(online_user_y-song.y,2))),2) + 62500);
          });
          */
        break;
      case 39: // D
          movement.right = true;
          /*
          audios.forEach(song => {
            (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(online_user_x-song.x,2)+Math.pow(online_user_y-song.y,2))),2) + 62500);
          });
          */
          break;
      case 40: // S
          movement.down = true;
          /*
          audios.forEach(song => {
            (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(online_user_x-song.x,2)+Math.pow(online_user_y-song.y,2))),2) + 62500);
          });
          */
          break;
      };
});

document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
    case 37: // A
      movement.left = false;
      break;
    case 38: // W
      movement.up = false;
      break;
    case 39: // D
      movement.right = false;
      break;
    case 40: // S
      movement.down = false;
      break;
  }
});

setInterval(function() {
  socket.emit('movement', movement);
}, 2000 / 60);

CanvasRenderingContext2D.prototype.clear =
  CanvasRenderingContext2D.prototype.clear || function (preserveTransform) {
    if (preserveTransform) {
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (preserveTransform) {
      this.restore();
    }
}

function init(){
    audios.push ( {
      sound: "buzzcut.ogg",
      x: 0,
      y: 0,
      context: null,
      element: null,
      gain: 0,
      source: null,
    },
      {
        sound: "digger.ogg",
        x: 750,
        y: 500,
        context: null,
        element: null,
        gain: 0,
        source: null,
        }
    );
    for (i= 0; i < 5; i++) {
      for (j = 0; j < 5; j++) {
        circles.push({
          colour: '#FF0000',
          x: 0 + 250 * i,
          y: 0 + 250 * j,
          radius: 10
          }
        );
        lines.push( {
          start_x: 0 + 250*i,
          start_y: 0,
          end_x: 250*i,
          end_y: 1000,
          }
        );
        lines.push( {
          start_x: 0,
          start_y: 0 + 250*j,
          end_x: 1000,
          end_y: 0 + 250*j,
          }
        );
      }
    }
}

function redrawCanvas(online_users) {
    ctx.clear();
    lines.forEach(lines =>  {
      ctx.lineWidth = "3";
      ctx.beginPath();
      ctx.moveTo(lines.start_x,lines.start_y);
    	ctx.lineTo(lines.end_x,lines.end_y)
    	ctx.stroke();
    })
    circles.forEach(circle => {
   	ctx.beginPath();
    	ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI, false);
    	ctx.fillStyle = circle.colour;
    	ctx.fill();
    });
    for (var id in online_users) {
    	var online_user = online_users[id];
    	ctx.beginPath();
    	ctx.arc(online_user.x, online_user.y, 10, 0, 2 * Math.PI);
    	ctx.fillStyle = '#00FF00'
    	ctx.fill();
  }
}

/*
function setupAudios(circle_x, circle_y) {
  source_list.forEach(source => {
    source.stop();
  });
  audios.forEach(song => {
    audio_context = new AudioContext();
    audio_element = document.querySelector('audio');
    gain_node = audio_context.createGain();
    let source = audio_context.createBufferSource();
    var my_request = new Request(song.sound);
    fetch(my_request).then(function(response) {
      return response.arrayBuffer();
    }).then(function(buffer) {
      audio_context.decodeAudioData(buffer, function(decoded_data) {
        source.buffer = decoded_data;
      });
    });
    if (audio_context.state === 'suspended') {
      audio_context.resume();
    }
    source.start(5);
    source_list.push(source);
    song.context = audio_context;
    song.element = audio_element;
    song.gain = gain_node;
    song.source = source;
    (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(circle_x-song.x,2)+Math.pow(circle_y-song.y,2))),2) + 62500);
    source.connect(song.gain);
    (song.gain).connect((song.context).destination);
    //audio_element.play();
  });
}
*/

socket.on('hasMoved',function(online_user) {
  online_user_x = online_user.x;
  online_user_y = online_user.y;
});

socket.on('usersChanged', function(online_users) {
  $('#users').empty();
  for (var id in online_users) {
    online_user = online_users[id];
    if (online_user.username == username) {
      $('#users').append($('<li>').html("<b>" + online_user.username + "</b"));
    } else {
      $('#users').append($('<li>').text(online_user.username));
    }
  };
  online_users_local = online_users;
});

socket.on('state', function(online_users) {
  redrawCanvas(online_users);
});

socket.on("usernameAdded", function(user) {
  var modal = document.getElementById("myModal");
  modal.style.display = "none";
  online_user_x = user.x;
  online_user_y = user.y;
  redrawCanvas();
  //setupAudios(online_user_x,online_user_y);
  username = user.username;
  local_video_slot = user.room_number;
});

socket.on("newlyConnected", function () {
    var modal = document.getElementById("myModal");
    modal.style.display = "block";
});

socket.on('messageSent', function(message) {
  $('#messages').append($('<li>').html('<b>' + message.username + '</b>  ' + message.msg));
  if (message.msg != '') {
    updateScroll();
  }
});


$(document).ready(function(){
  $('#chat_form').submit(function(e){
    e.preventDefault(); // prevents page reloading
    socket.emit('messageSent', $('#chat_message').val());
    $('#chat_message').val('');
    return false;
  });

  $('#username_form').submit(function(e){
    e.preventDefault(); // prevents page reloading
    socket.emit('username', $('#username_input').val());
    $('#username_input').val('');
    return false;
  });
});

const peerConnections = {};
const config = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
};

socket.on("watcher", data => {
  const caller = data.caller;
  var stream;
  users = data.users;
  placeholder_caller = users[caller];
  local_video_slot = placeholder_caller.room_number;
  socket.emit("log",local_video_slot);
  socket.emit("log",video_arary[local_video_slot]);
  navigator.mediaDevices.getUserMedia({audio: true, video: true})
  .then(mediaStream => {
    document.querySelector(video_array[local_video_slot]).srcObject = mediaStream;
    stream = mediaStream;
  })
  for (id in data.users) {
    const callee = id;
    if (callee != caller) {
      saveCaller = callee;
      const peerConnection = new RTCPeerConnection(config);
      peerConnections[callee] = peerConnection;
      stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          socket.emit("candidateCaller", callee, event.candidate, caller);
        }
      };
      peerConnection
          .createOffer()
          .then(sdp => peerConnection.setLocalDescription(sdp))
          .then(() => {
            socket.emit("offer", callee, peerConnection.localDescription, caller);
          });
      }
    }
});

socket.on("answer", (caller, description, callee) => {
  peerConnections[callee].setRemoteDescription(description);
});

let peerConnection;

socket.on("offer", (callee, description, caller) => {
  user_room = online_users_local[callee].room_number;
  video = document.getElementById(video_array[user_room]);
  peerConnection = new RTCPeerConnection(config);
  peerConnections[caller] = peerConnection;
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", caller, peerConnection.localDescription, callee);
    });
  peerConnection.ontrack = event => {
    socket.emit("log","in ontrack");
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidateCallee", caller, event.candidate, callee);
    }
  };
});

// caller
socket.on("candidateCaller", (callee, candidate, caller) => {
  peerConnections[caller].addIceCandidate(new RTCIceCandidate(candidate));
});

//callee
socket.on("candidateCallee", (caller, candidate, callee) => {
  peerConnections[callee]
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
  socket.emit("watcher");
});

init();
