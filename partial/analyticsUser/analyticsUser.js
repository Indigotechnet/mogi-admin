/* global google */
angular.module('mogi-admin').controller('AnalyticsUserCtrl',function($scope, $routeParams, $http, ServerUrl, $window, $sce){

    $scope.myStyle = {
        "height": "450px",
        "width": "100%"
    };

  var userId = $routeParams.id,
      currentPositionMarker = new google.maps.Marker({
        position : new google.maps.LatLng(0,0)
      }),
    HEATMAP_OPT = "HEATMAP",
    videoElement = document.getElementById('video'),
    heatmap = null, pathmap = null;

    function getVideoUrl(ServerUrl, userId, $scope) {
        return ServerUrl + '/users/' + userId + '/videos/' + $scope.currentVideo.id + '.mp4';
    }
    function getVideoUrlWithId(ServerUrl, userId, $scope, videoId) {
        return ServerUrl + '/users/' + userId + '/videos/' + videoId + '.mp4';
    }

    function changeMap() {
        var path = [];
        var bounds = new google.maps.LatLngBounds();
        angular.forEach($scope.locations, function(loc) {
            var coord = new google.maps.LatLng(loc.lat, loc.lng);
            path.push(coord);
            bounds.extend(coord);
        });
        if ($scope.currentMap === HEATMAP_OPT){
            if (pathmap != null){
                pathmap.setMap(null);
            }
            if (heatmap == null){
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: path
                });
            } else {
                heatmap.setData(path);
            }
            heatmap.setMap($scope.locationMap);
        } else {
            heatmap.setMap(null);
            if (pathmap == null){
                pathmap = new google.maps.Polyline({
                    path: path ,
                    strokeColor: '#428bca',
                    strokeOpacity: 1.0,
                    strokeWeight: 2
                });
            }
            pathmap.setMap($scope.locationMap);
        }
        $scope.locationMap.fitBounds(bounds);
        $scope.locationMap.setCenter(currentPositionMarker.getPosition());
    }
    $scope.hasPicture = false;
    $http.get(ServerUrl + '/pictures/'+userId+'/small/show').success(function(data) {
        $scope.hasPicture = true;
        $scope.pictureUrl = ServerUrl + '/pictures/'+userId+'/small/show';
    });
    $http.get(ServerUrl + '/users/'+userId).success(function(data) {
        $scope.targetUserName = data.username;
        var date = new Date(data.lastLocationUpdateDate);
        $scope.lastLocationDate = date.toLocaleString();
    });
  $scope.videos = [];
  $scope.locations = [];
  $scope.currentVideo = null;
  $scope.currentDate = ($routeParams.date) ? moment($routeParams.date).toDate() : new Date();
  $scope.sliderFrom = moment($scope.currentDate).hour(0).minute(0).seconds(0).valueOf();
  $scope.sliderTo = moment($scope.currentDate).hour(23).minute(59).seconds(59).valueOf();
  $scope.userMessage = '';
  $scope.gpsOnly = true;

  $scope.mapOptions = {
    center: new google.maps.LatLng(0,0),
    zoom: 11,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

    $http.get(ServerUrl + '/users/me').success(function(data) {
        if(data.length === 0){
            return;
        }
        if(!data.group.lat || !data.group.lng || isNaN(data.group.lat) || isNaN(data.group.lat)){
            return;
        }
        var pos = new google.maps.LatLng(data.group.lat, data.group.lng);
        $scope.locationMap.panTo(pos);
        $scope.defaultPos = pos;
    });

  $scope.$watch('currentDate', function(newVal) {
    if (newVal) {
        $scope.skipTime();
        $scope.loadData();
    }
  });

  $scope.formatTime = function (value) {
    var hour = value / 60;
    var minutes = value % 60;

    return hour + ':' + minutes;
  };

  $scope.loadData = function() {
    var date = moment($scope.currentDate).format('YYYY-MM-DD');
    $scope.sliderFrom = moment($scope.currentDate).hour(0).minute(0).seconds(0).valueOf();
    $scope.sliderTo = moment($scope.currentDate).hour(23).minute(59).seconds(59).valueOf();
    $http.get(ServerUrl + '/users/' + userId + '/videos/from/' + date )
      .success(function(data) {
        $scope.videos = data;
            if(data){
                console.log('videos length =['+data.length+']');
            }
        if ( $scope.videos.length > 0 ) {
          //$scope.skipTime();
        }
        for(var i=0; i<$scope.videos.length; i++){
            $scope.videos[i].src=getVideoUrlWithId(ServerUrl, userId, $scope, $scope.videos[i].id);
        }
      });

    $http.get(ServerUrl + '/users/' + userId + '/locations/' + date )
      .success(function(data) {

        $scope.currentMap = HEATMAP_OPT;

        if(data.length === 0){
            $scope.userMessage = "This user didn't login at this date.";
            return;
        }
        $scope.userMessage = '';
        console.log(data);
        $scope.locations = data;
        var pos = new google.maps.LatLng($scope.locations[0].lat, $scope.locations[0].lng);
        currentPositionMarker.setPosition(pos);
        currentPositionMarker.setMap($scope.locationMap);

        changeMap();
      });
  };

  $scope.changeMap = changeMap;

  $scope.showVideo = function(video) {
    $scope.currentVideo = video;
    $scope.currentVideo.src = getVideoUrl(ServerUrl, userId, $scope);
  };

    $scope.trustSrc = function(src) {
        return $sce.trustAsResourceUrl(src);
    };

  $scope.skipTime = function() {
    var isoDate = moment($scope.currentDate).toISOString(), location;
    var video = _.find($scope.videos, function (video) {
        var formatDate = Date.parse(isoDate);
        return formatDate >= Date.parse(video.from) && formatDate <= Date.parse(video.to);
    });

    if ( video ) {
      $scope.currentVideo = video;
      $scope.currentVideo.src = getVideoUrl(ServerUrl, userId, $scope);
    } else {

        if(videoElement){
            videoElement.pause();
            videoElement.src = '';
            angular.element(videoElement).children('source').prop('src', '');
        }
      $scope.currentVideo = {};
      $scope.currentVideo.src = null;
    }

    _.some($scope.locations, function(loc) {
      if ( loc.date >= isoDate ) {
        location = loc;
        return true;
      }
      return false;
    });

    if ( location ) {
      currentPositionMarker.setMap($scope.locationMap);
      currentPositionMarker.setPosition(new google.maps.LatLng(location.lat, location.lng));
    } else {
      currentPositionMarker.setMap(null);
    }
  };

  if ($routeParams.date) {
    $scope.loadData();
  }

    window.setTimeout(function(){
        google.maps.event.trigger($scope.locationMap, 'resize');
        if($scope.defaultPos){
            $scope.locationMap.setCenter($scope.defaultPos);
        }
    },10);

    angular.element($window).bind('resize', function() {
        $scope.myStyle["height"] = "450px";
        google.maps.event.trigger($scope.locationMap, 'resize');
        changeMap();
    });
});
