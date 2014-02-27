/* global google, flowplayer */
angular.module('mogi-admin').controller('HomeCtrl',function($scope, $http, socket, ServerUrl){

  $scope.mapOptions = {
    center: new google.maps.LatLng(0,0),
    zoom: 5,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  $scope.activeUsers = {};
  $scope.activeStreams = {};
  $scope.currentUser = null;

  var markerIcons = {
    'red' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    'green' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
  };

  var loadUser = function (data) {
    console.log("Socket: Location received!");
    if ( $scope.activeUsers[data.id] ) {
      $scope.activeUsers[data.id]
        .marker.setPosition(new google.maps.LatLng(data.lat, data.lng));
    } else {
      var marker = new google.maps.Marker({
        map: $scope.myMap,
        position: new google.maps.LatLng(data.lat, data.lng)
      });

      google.maps.event.addListener(marker, 'click', function() {
        $scope.showUser(data.id);
        $scope.$digest();
      });

      $scope.activeUsers[data.id] = {
        id : data.id,
        name : data.name,
        deploymentGroup : data.deploymentGroup,
        marker : marker
      };
    }
  };

  socket.on('connect', function() {
    socket.on('users:location', loadUser);
    socket.on('streaming:start', function(data) {
      var user = $scope.activeUsers[data.userId];
      if ( ! user ) {
        return console.log('Unable to find user for streaming');
      }

      showStream($scope.activeUsers[data.userId]);
    });
    socket.on('streaming:stop', function(data) {
      delete $scope.activeStreams[data.userId];
      $scope.activeUsers[data.userId].marker.setIcon(markerIcons['red']);
    });
  });

  $scope.filterUsers = function() {
    var usersFound = [];

    angular.forEach($scope.activeUsers, function(user) {
      if ( $scope.usersFilter.length === 0 ||
          user.deploymentGroup.indexOf($scope.usersFilter) > -1 ||
          user.userId.indexOf($scope.usersFilter) > -1 ||
          user.name.indexOf($scope.usersFilter) > -1
      ) {
        user.marker.setMap($scope.myMap);
      } else {
        user.marker.setMap(null);
      }
    });
  };

  $scope.showUser = function(userId) {
    $scope.currentUser = $scope.activeUsers[userId];
    $scope.streamingMessage = '';
    if ( $scope.currentUser ) {
      google.maps.event.trigger($scope.myMap, "resize");
      $scope.myMap.setCenter($scope.currentUser.marker.getPosition());
      $scope.userWindow.open($scope.myMap, $scope.currentUser.marker);
    }
  };

  $scope.requestStream = function(user) {
    $scope.streamingMessage = 'Sending request';
    $http.post(ServerUrl + '/streams/' + user.id + '/start')
      .success(function(data) {
        $scope.streamingMessage = 'Request sent.';
        $scope.activeStreams[user.id] = {
          status : 'waiting',
          streamId : user.id,
          userName : user.name
        };
      })
      .error(function(data) {
        $scope.streamingMessage = data.message;
      });
  };

  $scope.stopStream = function(user) {
    $http.post(ServerUrl + '/streams/' + user.id + '/stop')
      .success(function(data) {
        if ( data.success ) {
          delete $scope.activeStreams[user.id];
        }
      }).error(function(data) {

      });
  };

  $scope.refreshUsers = function() {
    $http.get(ServerUrl + '/users/online')
      .success(function(data) {
        var bounds = new google.maps.LatLngBounds();

        angular.forEach(data, function(user) {
            loadUser(user);
            var coord = new google.maps.LatLng(user.lat, user.lng);
            bounds.extend(coord);
        });

        $scope.myMap.fitBounds(bounds);
      });
  };

  function showStream(user) {
    $scope.activeStreams[user.id] = {
      status : 'streaming',
      streamId : user.id,
      userName : user.name
    };

    user.marker.setIcon(markerIcons['green']);

    flowplayer('stream', "/flowplayer/flowplayer-3.2.16.swf", {
         clip: {
            url: user.id + '.sdp',
            scaling: 'fit',
            // configure clip to use hddn as our provider, referring to our rtmp plugin
            provider: 'rtmp'
        },

        // streaming plugins are configured under the plugins node
        plugins: {

            // here is our rtmp plugin configuration
            rtmp: {
                url: "/flowplayer/flowplayer.rtmp-3.2.12.swf",

                // netConnectionUrl defines where the streams are found
                netConnectionUrl: user.stream_server
            }
        },
        canvas: {
            backgroundGradient: 'none'
        }
    });
  }

  $scope.refreshUsers();
});
