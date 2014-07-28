/* global google */
angular.module('mogi-admin').controller('AnalyticsUserCtrl',function($scope, $routeParams, $http, ServerUrl, $window, $sce, $document, $location){
    $scope.selected = undefined;

    $scope.myStyle = {
        "height": "400px",
        "width": "100%"
    };

    $http.get(ServerUrl + '/users').success(function(data) {
        angular.forEach(data, function(user) {
            if (user.profilePicture != null) {
                user.profilePicture = data.baseUrl = ServerUrl + '/pictures/' + user.id + '/original/show';
            }
        });
        $scope.users=data;
    });


    $scope.onItemSelected = function ($item, $model, $label) {

            var path = '/analytics/' + $model.id;
            if ( $scope.currentDate ) {
                path += '/date/' + moment($scope.currentDate).format('YYYY-MM-DD');
            }
            $location.path(path);
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

    function cleanMap(){
        $scope.locations = [];
        $scope.videos = [];
        changeMap();
        $scope.updateLocationOnMap();
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

    $http.get(ServerUrl + '/users/'+userId).success(function(data) {
        $scope.targetUserName = data.username;
        $scope.targetName = data.name;
        var date = new Date(data.lastLocationUpdateDate);
        $scope.lastLocationDate = date.toLocaleString();

        //Placed the url of the picture in a autheticated request - only loads if logged
        $http.get(ServerUrl + '/pictures/'+userId+'/small/show').success(function(data) {
            $scope.hasPicture = true;
            $scope.pictureUrl = ServerUrl + '/pictures/'+userId+'/small/show';
        });
    });
  $scope.videos = [];
  $scope.locations = [];
  $scope.enabledDates = [];
  $scope.currentVideo = null;
  $scope.currentDate = ($routeParams.date) ? moment($routeParams.date).toDate() : new Date();
  $scope.currentTime = ($routeParams.date) ? moment($routeParams.date).toDate() : new Date();
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
            $scope.loadLocations();
            $scope.loadVideos();
            $scope.loadEnabledDates();
        }
    });

    $scope.$watch('currentTime', function(newVal) {
        if (newVal) {
            $scope.updateLocationOnMap();
            $scope.scrollVideoToCurrentTime();
        }
    });

  $scope.formatTime = function (value) {
    var hour = value / 60;
    var minutes = value % 60;

    return hour + ':' + minutes;
  };

    $scope.loadEnabledDates = function() {
        $http.get(ServerUrl + '/users/' + userId + '/dates/enabled')
            .success(function(data) {
               $scope.enabledDates = data;
            }).error(function (data, status, headers, config) {

            });
    };

    $scope.loadLocations = function() {
        var date = moment($scope.currentDate).format('YYYY-MM-DD');
        $http.get(ServerUrl + '/users/' + userId + '/locations/' + date )
            .success(function(data) {
                $scope.currentMap = HEATMAP_OPT;
                if(data.length === 0){
                    $scope.userMessage = "This user didn't login at this date.";
                    cleanMap();
                    return;
                }
                $scope.userMessage = '';
                $scope.locations = data;

                var pos = new google.maps.LatLng($scope.locations[0].lat, $scope.locations[0].lng);
                $scope.currentTime = moment($scope.locations[0].date).valueOf();

                currentPositionMarker.setPosition(pos);
                currentPositionMarker.setMap($scope.locationMap);

                changeMap();
                $scope.updateSlider();
            });
    };

    $scope.loadVideos = function() {
        var date = moment($scope.currentDate).format('YYYY-MM-DD');
        $http.get(ServerUrl + '/users/' + userId + '/videos/from/' + date )
            .success(function(data) {
                $scope.videos = data;
                for(var i=0; i<$scope.videos.length; i++){
                    $scope.videos[i].src=getVideoUrlWithId(ServerUrl, userId, $scope, $scope.videos[i].id);
                }
            });
    };

    $scope.updateSlider = function() {
        if(!$scope.locations){
            $scope.sliderFrom = 0;
            $scope.sliderTo = 0;
            return;
        }
        var oldest = moment($scope.currentTime);
        var newest = moment($scope.currentTime);
        _.some($scope.locations, function(loc) {
            if(moment(loc.date).isBefore(oldest)){
                oldest = moment(loc.date);
            }
            if(moment(loc.date).isAfter(newest)){
                newest = moment(loc.date);
            }
        });
        $scope.sliderFrom = oldest.valueOf();
        $scope.sliderTo = newest.valueOf();
    };

  $scope.changeMap = changeMap;

  $scope.showVideo = function(video) {
    $scope.currentVideo = video;
    $scope.currentVideo.src = getVideoUrl(ServerUrl, userId, $scope);
  };

    $scope.trustSrc = function(src) {
        return $sce.trustAsResourceUrl(src);
    };

  $scope.updateVideos = function() {
    var isoDate = moment($scope.currentDate).toISOString();
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
  };

    $scope.updateLocationOnMap = function () {
        var isoDate = moment($scope.currentTime).toISOString(), location;
        _.some($scope.locations, function(loc) {
            if ( loc.date >= isoDate ) {
                location = loc;
                return true;
            }
            return false;
        });
        if ( location ) {
            var latLng = new google.maps.LatLng(location.lat, location.lng);
            currentPositionMarker.setMap($scope.locationMap);
            currentPositionMarker.setPosition(latLng);
            $scope.locationMap.panTo(latLng);
        } else {
            currentPositionMarker.setMap(null);
        }
    };

    $scope.scrollVideoToCurrentTime = function () {
        if(!$scope.videos || $scope.videos.length <= 0){
            return;
        }
        var nOfVideos = $scope.videos.length;
        var isoDate = moment($scope.currentTime).toISOString();
        var video = _.find($scope.videos, function (video) {
            var formatDate = Date.parse(isoDate);
            return formatDate >= Date.parse(video.from) && formatDate <= Date.parse(video.to);
        });
        if ( video ) {
            var videoEL = angular.element($document)[0].getElementById(video.id);
            if(videoEL){
                var x = window.scrollX, y = window.scrollY;
                videoEL.focus();
                window.scrollTo(x, y);
            }
        }else{
            var curHour = moment($scope.currentTime).unix();
            var curFrom = moment($scope.sliderFrom).unix();
            var curTo = moment($scope.sliderTo).unix();
            var sliderPercentage = Math.round((curHour - curFrom)/(curTo - curFrom)*100);
            if(sliderPercentage>0){
                var targetVideo = Math.round(nOfVideos * sliderPercentage / 100);
                if(targetVideo>0){
                    scrollToVideoId($scope.videos[targetVideo-1].id);
                }else{
                    scrollToVideoId($scope.videos[targetVideo].id);
                }
            }else if(nOfVideos){
                scrollToVideoId($scope.videos[0].id);
            }
        }
    };

    var scrollToVideoId = function(id){
        var videoEL = angular.element($document)[0].getElementById(id);
        if(videoEL){
            var x = window.scrollX, y = window.scrollY;
            videoEL.focus();
            window.scrollTo(x, y);
        }
    };

  if ($routeParams.date) {
      $scope.loadLocations();
      $scope.loadVideos();
      $scope.loadEnabledDates();
  }

    var dateIsInArray = function(date,arrayOfDates) {
        var dateToQuery = moment(date);
        for(var i=0; i<arrayOfDates.length; i++){
            if(moment(arrayOfDates[i]).isSame(dateToQuery)){
                return true;
            }
        }
        return false;
    };

    $scope.isDateEnabled = function(date, mode) {
        if (dateIsInArray(date, $scope.enabledDates)) {
            return true;
        }
        return false;
    };

    window.setTimeout(function(){
        google.maps.event.trigger($scope.locationMap, 'resize');
        if($scope.defaultPos){
            $scope.locationMap.setCenter($scope.defaultPos);
        }
    },10);

    angular.element($window).bind('resize', function() {
        $scope.myStyle["height"] = "400px";
        google.maps.event.trigger($scope.locationMap, 'resize');
        //changeMap();
    });

    //$scope.updateSlider();
});
