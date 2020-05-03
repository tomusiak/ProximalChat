var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookie_parser = require('cookie-parser');
var body_parser = require('body-parser');
var socket_IO = require('socket.io');
var routes = require('./routes/index');
var users = require('./routes/users');
var http = require('http');
var bodyParser = require('body-parser')
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon());
app.use(logger('dev'));
app.use(body_parser.json());
app.use(body_parser.urlencoded());
app.use(cookie_parser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
app.use('/', routes);
app.use('/users', users);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var server = http.Server(app);
var io = socket_IO(server);
app.set('port', 3000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(3000, function() {
  console.log('Starting server on port 5000');
});

var online_users = {};

var filled_rooms = [
  false,
  false,
  false,
  false,
  false,
  false
];

var num_users = 0;

io.on('connection', function(socket) {
  function obtainFirstOpenRoom() {
    for (i = 0; i < filled_rooms.length; i++) {
      if (filled_rooms[i] == false) {
        return i;
      }
    }
    return false;
  }

  socket.emit("newlyConnected");

  socket.on('movement', function(data) {
    var online_user = online_users[socket.id] || {};
      if (data.left) {
        if (online_user.x > 5) {
          online_user.x -= 5;
        } else {
          data.left = false;
        }
      }
      if (data.up) {
        if (online_user.y > 5) {
          online_user.y -= 5;
        } else {
          data.up = false;
        }
      }
      if (data.right) {
        if (online_user.x < 745) {
          online_user.x += 5;
        } else {
          data.right = false;
        }
      }
      if (data.down) {
        if (online_user.y < 495) {
          online_user.y += 5;
        } else {
          data.up = false;
        }
      }
      socket.emit("hasMoved",online_user);
  });

  socket.on('disconnect', function() {
    for (i = 0; i < filled_rooms.length;i ++) {
      if (filled_rooms[i] == socket.id) {
        filled_rooms[i] = false;
        break;
      }
    }
    delete online_users[socket.id];
    io.sockets.emit("usersChanged", online_users);
    num_users = num_users - 1;
  });

  socket.on('username', (data) => {
    room_number = obtainFirstOpenRoom();
    filled_rooms[room_number] = socket.id;
    online_users[socket.id] = {
      username: data,
      x: 333,
      y: 250,
      room_number: room_number
    };
    socket.emit('usernameAdded', online_users[socket.id]);
    io.sockets.emit("usersChanged", online_users);
    num_users = num_users + 1;
  });

  socket.on('messageSent', (msg) => {
    var message = {
      username: online_users[socket.id].username,
      msg: msg
    };
    io.sockets.emit('messageSent', message);
  });

});

setInterval(function() {
  io.sockets.emit('state', online_users);
}, 1000 / 60);
