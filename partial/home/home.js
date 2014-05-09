/* global google */
angular.module('mogi-admin').controller('ModalInstanceCtrl',function ($scope, $modalInstance, $http, ServerUrl, user, streamUrl) {
    console.log('controller created: '+streamUrl);
    $scope.user = user;
    $scope.jwOptions = {
        file: streamUrl,
        height: 300,
        width: "100%"

    };

    $scope.ok = function () {
        $modalInstance.close();
        $http.post(ServerUrl + '/streams/' + user.id + '/stop')
            .success(function(data) {
                if ( data.success ) {
                    delete $scope.activeStreams[user.id];
                }
            }).error(function(data) {

            });
    };
}).controller('HomeCtrl',function($scope, $modal, $http, socket, ServerUrl){
    $http.get(ServerUrl + '/users/me').success(function(data) {
        if(data.length === 0){
            return;
        }
        var pos = new google.maps.LatLng(data.group.lat, data.group.lng);
        $scope.myMap.panTo(pos);
    });
    $scope.windowHeight = window.innerHeight;
    $scope.windowWidth = window.innerWidth;

  $scope.mapOptions = {
    center: new google.maps.LatLng(0,0),
    zoom: 11,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  $scope.myStyle = {
    "height": (window.innerHeight - 50) + "px",
    "width": "100%"
  };

  $scope.activeUsers = {};
  $scope.activeStreams = {};
  $scope.currentUser = null;

  angular.element(window).bind('resize',function(){
      $scope.myStyle["height"] = (window.innerHeight - 50) + "px";
      google.maps.event.trigger($scope.myMap, 'resize');
  });

  var markerIcons = {
    'red' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
    'green' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
  };

  var loadUser = function (data) {
    console.log("Socket: Location received!");
    var pos = null;
    if ( $scope.activeUsers[data.id] ) {
      pos = new google.maps.LatLng(data.lat, data.lng);
      $scope.activeUsers[data.id].marker.setPosition(pos);
    } else {
      pos = new google.maps.LatLng(data.lat, data.lng);
      var bounds = new google.maps.LatLngBounds();
      var marker = new google.maps.Marker({
        map: $scope.myMap,
        position: pos
      });

      google.maps.event.addListener(marker, 'click', function() {
        $scope.showUser(data.id);
        $scope.$digest();
      });

      $scope.activeUsers[data.id] = {
        id : data.id,
        userName : data.name,
        deploymentGroup : data.group,
        marker : marker
      };
      for (var key in $scope.activeUsers){
          bounds.extend($scope.activeUsers[key].marker.getPosition());
      }
      $scope.myMap.fitBounds(bounds);
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
          user.userName.indexOf($scope.usersFilter) > -1
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
        $scope.streamingMessage = data.message;
        $scope.activeStreams[user.id] = {
          status : 'waiting',
          streamId : user.id,
          userName : user.name
        };
            console.log('creating modal');
        $modal.open({
            templateUrl: 'partial/home/player.html',
            controller: 'ModalInstanceCtrl',
            backdrop: false,
            resolve: {
                user: function(){return user;},
                streamUrl: function(){return data.streamUrl;},
                ServerUrl: function(){return ServerUrl;}
            }
        });
      })
      .error(function(data) {
        $scope.streamingMessage = data.message;
      });
  };

  $scope.stopStream = function(user){
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
        if(data.length === 0){
            return;
        }
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

  }

  $scope.refreshUsers();
});