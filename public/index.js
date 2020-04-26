socket = io('http://54.212.89.190:3000', {transports: ['websocket']});
socket.on('message', function(data) {
  console.log(data);
});
socket.on('name', function(data) {
  // data is a parameter containing whatever data was sent
});

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var circles = [];
var lines = [];
var audios = [];
var firstClick = false;
var sourceList = [];

var movement = {
  up: false,
  down: false,
  left: false,
  right: false
}

var player = {
  x: 0,
  y: 0
}

var clickLocation = {
  x: 0,
  y: 0
}

document.addEventListener('keydown', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = true;
      player.x = player.x -5;
      break;
    case 87: // W
      movement.up = true;
      player.y = player.y - 5;
      break;
    case 68: // D
      movement.right = true;
      player.x = player.x +5;
      break;
    case 83: // S
      movement.down = true;
      player.y = player.y +5;
      break;
  }
  if (firstClick == false) {
    audios.forEach(song => {
      (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(player.x-song.x,2)+Math.pow(player.y-song.y,2))),2) + 62500);
    });
  };
  console.log(player.x);
  console.log(player.y);
});

document.addEventListener("click", function(event) {
  if (firstClick == false) {
    player.x = event.pageX;
    player.y = event.pageY-50;
    clickLocation.x = event.pageX;
    clickLocation.y = event.pageY-50;
    socket.emit('click', clickLocation);
    redrawCanvas();
    firstClick=true;
    setupAudios(clickLocation.x,clickLocation.y);
  }
});

document.addEventListener('keyup', function(event) {
  switch (event.keyCode) {
    case 65: // A
      movement.left = false;
      break;
    case 87: // W
      movement.up = false;
      break;
    case 68: // D
      movement.right = false;
      break;
    case 83: // S
      movement.down = false;
      break;
  }
});

setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);

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
      gain: null,
      source: null,
    },
      {
        sound: "digger.ogg",
        x: 1000,
        y: 1000,
        context: null,
        element: null,
        gain: null,
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

function redrawCanvas(players) {
    ctx.clear();
    lines.forEach(lines =>  {
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
    for (var id in players) {
    	var player = players[id];
    	ctx.beginPath();
    	ctx.arc(player.x, player.y, 10, 0, 2 * Math.PI);
    	ctx.fillStyle = '#00FF00'
    	ctx.fill();
  }
}

socket.on('state', function(players) {
  redrawCanvas(players);
});

function setupAudios(circleX,circleY) {
  sourceList.forEach(source => {
    source.stop();
  });
  audios.forEach(song => {
    audioContext = new AudioContext();
    audioElement = document.querySelector('audio');
    gainNode = audioContext.createGain();
    let source = audioContext.createBufferSource();
    var myRequest = new Request(song.sound);
    fetch(myRequest).then(function(response) {
      return response.arrayBuffer();
    }).then(function(buffer) {
      audioContext.decodeAudioData(buffer, function(decodedData) {
        source.buffer = decodedData;
      });
    });
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    source.start(5);
    sourceList.push(source);
    song.context = audioContext;
    song.element = audioElement;
    song.gain = gainNode;
    song.source = source;
    (song.gain).gain.value = 62500 / (Math.pow((Math.sqrt(Math.pow(circleX-song.x,2)+Math.pow(circleY-song.y,2))),2) + 62500);
    source.connect(song.gain);
    (song.gain).connect((song.context).destination);
    //audioElement.play();
  });
}

init();
