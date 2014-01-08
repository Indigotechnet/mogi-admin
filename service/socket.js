/* global io */
angular.module('mogi-admin').factory('socket',function(ServerUrl) {

  // Loads the socket from the server
  var body = document.getElementsByTagName('body')[0],
      socket = {},
      socketIo = null,
      connected = false,
      onConnect = [],
      tag = document.createElement('script');

  tag.src = ServerUrl + '/socket.io/socket.io.js';
  tag.id = 'socket-io';
  body.appendChild(tag);

  socket.connect = function(token) {
    if ( typeof io === 'undefined' ) {
      tag.onload = function() {
        socket.connect(token);
      };
      return;
    }

    socketIo = io.connect(ServerUrl, { query : 'token=' + token });
    socketIo.on('connect', function() {
      connected = true;
      angular.forEach(onConnect, function(cb) {
        cb();
      });
    });

    socketIo.on('error', function(err) {
      console.log('Socket Error:', err);
    });
  };

  socket.on = function(ev, cb) {
    if ( !connected ) {
      if ( ev !== 'connect' ) {
        throw new Error('Socket not connected');
      } else {
        return onConnect.push(cb);
      }
    }

    socketIo.on(ev,cb);
  };

	return socket;
});