/* global google */
angular.module('mogi-admin').controller('ModalInstanceCtrl',function ($scope, $modalInstance, $http, ServerUrl, user, streamUrl) {
    console.log('controller created: ' + streamUrl);
    $scope.user = user;
    $scope.jwOptions = {
        file: streamUrl,
        height: 300,
        autostart: true,
        width: "100%"

    };

    $scope.ok = function () {
        $modalInstance.close();
        $http.post(ServerUrl + '/streams/' + user.id + '/stop')
            .success(function (data) {
                if (data.success) {
                    delete $scope.activeStreams[user.id];
                }
            }).error(function (data) {

            });
    };
}).controller('HomeCtrl', function ($scope, $modal, $http, socket, ServerUrl, toaster, $window, $rootScope, $location, $timeout) {

    $scope.windowHeight = window.innerHeight;
    $scope.windowWidth = window.innerWidth;
    $rootScope.selected = 'realtime';
  $scope.modalInstance = null;

  $scope.mapOptions = {
    center: new google.maps.LatLng(0,0),
    zoom: 11,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.LEFT_CENTER
    },
    panControl: true,
    panControlOptions: {
      position: google.maps.ControlPosition.LEFT_CENTER
    },
    zoomControl: true,
    zoomControlOptions: {
      style: google.maps.ZoomControlStyle.LARGE,
      position: google.maps.ControlPosition.LEFT_CENTER
    },
    scaleControl: true,
    streetViewControl: true,
    streetViewControlOptions: {
      position: google.maps.ControlPosition.LEFT_CENTER
    }
  };

  $scope.myStyle = {
    "height": (window.innerHeight) + "px",
    "width": "100%"
  };

    $scope.activeUsers = {};
    $scope.activeStreams = {};
    $scope.currentUser = null;

    $scope.$watch('selected', function () {
        window.setTimeout(function(){
            google.maps.event.trigger($scope.myMap, 'resize');
            if($scope.defaultPos){
                $scope.myMap.setCenter($scope.defaultPos);
            }
            $scope.refreshUsers();
        },10);
    });

    angular.element($window).bind('resize', function() {
        $scope.myStyle["height"] = window.innerHeight + "px";
        google.maps.event.trigger($scope.myMap, 'resize');
        $scope.refreshUsers();
    });

  var markerIcons = {
    'red': 'http://www.google.com/intl/en_ALL/mapfiles/marker.png',
    'green': 'http://www.google.com/intl/en_ALL/mapfiles/marker_green.png',
    'grey': 'http://www.google.com/intl/en_ALL/mapfiles/marker_grey.png'
  };

  var timeoutUser = function (user) {
    user.marker.setIcon(markerIcons['grey']);
  };
  var loadUser = function (data) {
    console.log("Socket: Location received!");
    var pos = null;
    if ( $scope.activeUsers[data.id] ) {
      pos = new google.maps.LatLng(data.lat, data.lng);
      $scope.activeUsers[data.id].marker.setPosition(pos);
      if ($scope.activeUsers[data.id].marker.icon === markerIcons['grey']) {
        $scope.activeUsers[data.id].marker.setIcon(markerIcons['red']);
      }
    } else {
      pos = new google.maps.LatLng(data.lat, data.lng);
      var bounds = new google.maps.LatLngBounds();
      var marker = new google.maps.Marker({
        map: $scope.myMap,
        position: pos,
        icon: markerIcons['red']
      });

      google.maps.event.addListener(marker, 'click', function() {
        $scope.showUser(data.id);
        $scope.$digest();
      });

      $scope.activeUsers[data.id] = {
        id : data.id,
        userName : data.name,
        login: data.username,
        deploymentGroup : data.group,
        marker : marker,
        groupId: data.groupId,
        streamUrl: data.streamUrl,
        picture: data.profilePicture ? ServerUrl + data.profilePicture : null,
        timeoutPromisse: null
      };

      for (var key in $scope.activeUsers){
          bounds.extend($scope.activeUsers[key].marker.getPosition());
      }
      $scope.myMap.fitBounds(bounds);
    }
    if ($scope.activeUsers[data.id].timeoutPromisse != null) {
      $timeout.cancel($scope.activeUsers[data.id].timeoutPromisse);
    }
    $scope.activeUsers[data.id].timeoutPromisse = $timeout(function () {
      timeoutUser($scope.activeUsers[data.id]);
    }, 60000);
  };


  socket.on('connect', function() {
    socket.on('users:location', loadUser);

    socket.on('streaming:start', function(data) {
        var user = $scope.activeUsers[data.id];
        if ( ! user ) {
            return console.log('Unable to find user for streaming');
        }
        $http.get(ServerUrl + '/users/me').success(function(data) {
            if(data.length === 0){
                return;
            }
            var foundAdminOnline = false;
            if(data.group.id === user.groupId){
                showStream(user);
                showNotification(user);
                foundAdminOnline = true;
            }
            if(!foundAdminOnline){
                $scope.stopStream(user);
            }
        });
    });
    socket.on('streaming:stop', function(data) {
        delete $scope.activeStreams[data.id];
        $scope.activeUsers[data.id].marker.setIcon(markerIcons['red']);
        toaster.clearToastByUserId(data.id);
      if ($scope.modalInstance != null && $scope.modalInstance !== undefined) {
        $scope.modalInstance.close();
      }
        $scope.$apply();
    });
  });

    $rootScope.$on("event:filter-Users", function(data) {
        $scope.filterUsers(data);
    });

  $scope.filterUsers = function(data) {
      var searchString = data.targetScope.usersFilter;
      if(!searchString){
          //TODO
          return;
      }else{
          var usersFound = [];
          angular.forEach($scope.activeUsers, function(user) {
              //TODO add group so we can search for specific groups
              if(user.userName === searchString || user.login === searchString){
                  user.marker.setMap($scope.myMap);
              }else{
                  user.marker.setMap(null);
              }
          });
      }
  };

    $scope.goToUser = function(user) {
        var path = '/analytics/' + user.id;
        $location.path(path);
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
    $scope.streamingMessage = 'Sending request...';
    $http.post(ServerUrl + '/streams/' + user.id + '/start')
      .success(function(data) {
            user.streamUrl = data.streamUrl;
            setStreamingUser(user);
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
            $scope.refreshMap();
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

    $scope.refreshMap = function() {
        $http.get(ServerUrl + '/users/me').success(function(data) {
            if(data.length === 0){
                return;
            }
            if(!data.lastPos || isNaN(data.lastPos.lat) || isNaN(data.lastPos.lng)){
                return;
            }else{
                changeMapPos(data.lastPos.lat, data.lastPos.lng);
                return;
            }
            if(!data.group.lat || !data.group.lng ||
                isNaN(data.group.lat) || isNaN(data.group.lat)){
                return;
            }else{
                changeMapPos(data.group.lat, data.group.lng);
            }
        });
    };

    $scope.popNotification = function(user){
      toaster.pop('note', '', user.userName + " is streaming",0, 'trustedHtml', function(user){
          $scope.userWindow.close();
          showModal(user);
      }, user);
    };

    function changeMapPos(lat, lng){
        var pos = new google.maps.LatLng(lat, lng);
        $scope.myMap.panTo(pos);
        $scope.defaultPos = pos;
    }

  function showModal(user){
      console.log('showModal with user=['+user+']');
    $scope.modalInstance = $modal.open({
          templateUrl: 'partial/home/player.html',
          controller: 'ModalInstanceCtrl',
          backdrop: false,
          resolve: {
              user: function(){return user;},
              streamUrl: function(){return user.streamUrl;},
              ServerUrl: function(){return ServerUrl;}
          }
      });
  }

    function setStreamingUser(user) {
        $scope.activeStreams[user.id] = {
            status: 'streaming',
            streamId: user.id,
            userName: user.userName,
            groupId: user.groupId,
            streamUrl: user.streamUrl
        };
    }

    function showStream(user) {
        setStreamingUser(user);
        user.marker.setIcon(markerIcons['green']);
  }

    function showNotification(user){
        $scope.popNotification(user);
    }

  $scope.refreshUsers();
});
