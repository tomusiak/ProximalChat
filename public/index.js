socket = io();
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var circles = [];
var lines = [];
var audios = [];
var source_list = [];
var username = "";
var edit = "";

var movement = {
  up: false,
  down: false,
  left: false,
  right: false
}

const video_array = [
  "video_0",
  "video_1",
  "video_2",
  "video_3",
  "video_4",
  "video_5"
]

var video = "video_0";

const { RTCPeerConnection, RTCSessionDescription } = window;

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
          audios.forEach(song => {
            (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(online_user_x-song.x,2)+Math.pow(online_user_y-song.y,2))),2) + 62500);
          });
          break;

      case 38: // W
          movement.up = true;
          audios.forEach(song => {
            (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(online_user_x-song.x,2)+Math.pow(online_user_y-song.y,2))),2) + 62500);
          });
        break;
      case 39: // D
          movement.right = true;
          audios.forEach(song => {
            (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(online_user_x-song.x,2)+Math.pow(online_user_y-song.y,2))),2) + 62500);
          });
          break;
      case 40: // S
          movement.down = true;
          audios.forEach(song => {
            (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(online_user_x-song.x,2)+Math.pow(online_user_y-song.y,2))),2) + 62500);
          });
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
  setupAudios(online_user_x,online_user_y);
  username = user.username;
  video = document.getElementById(video_array[user.room_number]);
  var constraints = {
      video: true,
      audio: false,
  };
  navigator.mediaDevices.getUserMedia(constraints).then(function(mediaStream) {
    video.srcObject = mediaStream;
  })
  video.muted = true;
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

socket.on('callingInitiated', function(online_users) {
  for (var id in online_users) {
    online_user = online_users[id];
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(new RTCSessionDescription(offer));
    socket.emit("userCalled", {
      offer,
      to: online_user
    });
  }
});

socket.on("callMade", async data => {
 await peerConnection.setRemoteDescription(
   new RTCSessionDescription(data.offer)
 );
 const answer = await peerConnection.createAnswer();
 await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

 socket.emit("answerCall", {
   answer,
   to: data.socket
 });
});

socket.on("answerMade", async data => {
 await peerConnection.setRemoteDescription(
   new RTCSessionDescription(data.answer)
 );

 if (!isAlreadyCalling) {
   callUser(data.socket);
   isAlreadyCalling = true;
 }
});

navigator.getUserMedia(
 { video: true, audio: true },
 stream => {
   const localVideo = video;
   if (localVideo) {
     localVideo.srcObject = stream;
   }
   stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
 },
 error => {
   console.warn(error.message);
 }
);


peerConnection.ontrack = function({ streams: [stream] }) {
 const remoteVideo = document.getElementById("video_5");
 if (remoteVideo) {
   remoteVideo.srcObject = stream;
 }
};

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

init();
