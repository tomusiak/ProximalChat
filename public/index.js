socket = io('http://54.212.89.190:3000', {transports: ['websocket']});

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var circles = [];
var lines = [];
var audios = [];
var source_list = [];
var username = "";

var movement = {
  up: false,
  down: false,
  left: false,
  right: false
}

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
});

socket.on('state', function(online_users) {
  redrawCanvas(online_users);
});

socket.on("usernameAdded", function(user) {
  var modal = document.getElementById("myModal");
  modal.style.display = "none";
  online_user_x = 250;
  online_user_y = 250;
  redrawCanvas();
  setupAudios(250,250);
  username = user.username;
});

socket.on("newlyConnected", function () {
    var modal = document.getElementById("myModal");
    modal.style.display = "block";
});

socket.on('chat message', function(message) {
  $('#messages').append($('<li>').html('<b>' + message.username + '</b>  ' + message.msg));
  if (msg != '') {
    updateScroll();
  }
});

$(document).ready(function(){
  $('#chat_form').submit(function(e){
    e.preventDefault(); // prevents page reloading
    socket.emit('chat message', $('#chat_message').val());
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

var peerConnection = window.RTCPeerConnection ||
    window.mozRTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.msRTCPeerConnection;

var sessionDescription = window.RTCSessionDescription ||
    window.mozRTCSessionDescription ||
    window.webkitRTCSessionDescription ||
    window.msRTCSessionDescription;

    navigator.getUserMedia  = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;


var pc = new peerConnection({
    iceServers: [{
        url: "stun:stun.services.mozilla.com",
        username: "somename",
        credential: "somecredentials"
    }]
});

socket.on('offer-made', function (data) {
    offer = data.offer;

    pc.setRemoteDescription(new sessionDescription(data.offer), function () {
        pc.createAnswer(function (answer) {
            pc.setLocalDescription(new sessionDescription(answer), function () {
                console.log('MAKE ANSWER');
                socket.emit('make-answer', {
                    answer: answer,
                    to: data.socket
                });
            }, error);
        }, error);
    }, error);

});

function createOffer(id) {
    pc.createOffer(function (offer) {
        pc.setLocalDescription(new sessionDescription(offer), function () {
            socket.emit('make-offer', {
                offer: offer,
                to: id
            });
        }, error);
    }, error);
}

var answersFrom = {}, offer;

socket.on('answer-made', function (data) {
    pc.setRemoteDescription(new sessionDescription(data.answer), function () {
        document.getElementById(data.socket).setAttribute('class', 'active');
        if (!answersFrom[data.socket]) {
            createOffer(data.socket);
            answersFrom[data.socket] = true;
        }
    }, error);
});

pc.onaddstream = function (obj) {
    var vid = document.createElement('video');
    vid.setAttribute('class', 'video-small');
    vid.setAttribute('autoplay', 'autoplay');
    vid.setAttribute('id', 'video-small');
    document.getElementById('users-container').appendChild(vid);
    vid.srcObject = obj.stream;
}

navigator.getUserMedia({video: true, audio: true}, function (stream) {
    var video = document.querySelector('video');
    video.srcObject = stream;
    pc.addStream(stream);
}, error);

init();
