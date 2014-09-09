/* global google */
angular.module('mogi-admin').controller('AnalyticsUserCtrl',function($scope, $compile,$routeParams, $http, ServerUrl, $window, $sce, $document, $location, locationService){
    /* scope variables*/
    $scope.selected = undefined;
    $scope.currentDate = new Date();
    $scope.users = [];
    $scope.myStyle = {
        "height": "400px",
        "width": "100%"
    };

    /* variables */
    var userId = $routeParams.id,
        heatmap = null,
        pathmap = null,
        path,
        bounds,
        currentPositionMarker = new google.maps.Marker({
            position : new google.maps.LatLng(0,0)
        }),
        HEATMAP_OPT = "HEATMAP";

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
        $location.path(path);
    };

    $http.get(ServerUrl + '/users/'+userId).success(function(data) {
        $scope.loadEnabledDates();
        $scope.targetUserName = data.username;
        $scope.targetName = data.name;
        if (data.lastLocationUpdateDate != null) {
            var dateLocation = new Date(data.lastLocationUpdateDate);
            $scope.lastLocationDate = dateLocation.toLocaleString();
            $scope.currentDate = dateLocation;
        } else {
            $scope.lastLocationDate = null;
            $scope.currentDate = new Date();
            $scope.userMessage = "This user never logged in.";
        }
        //Placed the url of the picture in a authenticated request - only loads if logged
        $http.get(ServerUrl + '/pictures/'+userId+'/small/show').success(function(data) {
            $scope.hasPicture = true;
            $scope.pictureUrl = ServerUrl + '/pictures/'+userId+'/small/show';
        });
        loadLocations();
        loadVideos();
    });

    $scope.loadEnabledDates = function() {
        $http.get(ServerUrl + '/users/' + userId + '/dates/enabled')
            .success(function(data) {
                $scope.enabledDates = data;

                var calendarElement = angular.element(document.querySelector("div.calendar"));
                calendarElement.html("<datepicker ng-model=\"currentDate\" min-date=\"minDate\" show-weeks=\"false\" class=\"well well-sm\" date-disabled=\"isDateDisabled(date, mode)\"></datepicker>");
                $compile(calendarElement.contents())($scope);

            }).error(function (data, status, headers, config) {
                console.log(data);
            });
    };

    var isDateInArray = function(date,arrayOfDates) {
        var dateToQuery = moment(date);
        for(var i=0; i<arrayOfDates.length; i++){
            var dateCalendar = moment(arrayOfDates[i].enabled_dates);
            if(dateCalendar.isSame(dateToQuery)){
                return true;
            } else if (!dateCalendar.isBefore(dateToQuery)){
                return false;
            }
        }
        return false;
    };

    $scope.isDateDisabled = function(date, mode) {
        if (isDateInArray(date, $scope.enabledDates)) {
            return false;
        }
        return true;
    };


    var loadLocations = function() {
        if(!moment($scope.currentDate).isValid()) {
            return;
        }
        var date = moment($scope.currentDate).format('YYYY-MM-DD');
        var accuracy;
        if($scope.highPrecision && !$scope.disableHighPrecision){
            accuracy = 15;
        }
        locationService.async(ServerUrl, date, accuracy, userId).then(function(data) {
            $scope.currentMap = HEATMAP_OPT;
            if(data.length === 0){
                $scope.locations = [];
                $scope.disableHighPrecision = true;
                $scope.highPrecision = false;
                console.log('load via low precision locations');
                return;
            }
            $scope.userMessage = '';
            $scope.locations = data;

            resetMap();
            $scope.updateSlider();
        });
    };

    $scope.$watch('highPrecision', function(newVal) {
        loadLocations();
    });

    var loadVideos = function() {
        var date = moment($scope.currentDate).format('YYYY-MM-DD');
        $http.get(ServerUrl + '/users/' + userId + '/videos/from/' + date )
            .success(function(data) {
                $scope.videos = data;
                for(var i=0; i<data.length; i++){
                    $scope.videos[i].src=ServerUrl + '/users/' + userId + '/videos/' + $scope.videos[i].id + '.mp4';
                }

            });
    };
    $scope.updateMap = function() {
        if ($scope.currentMap === HEATMAP_OPT) {
            if (pathmap != null) {
                pathmap.setMap(null);
            }
            if (heatmap == null) {
                heatmap = new google.maps.visualization.HeatmapLayer({
                    data: path
                });
            } else {
                heatmap.setData(path);
            }
            heatmap.setMap($scope.locationMap);
        } else {
            heatmap.setMap(null);

            pathmap = new google.maps.Polyline({
                path: path,
                strokeColor: '#428bca',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            pathmap.setMap($scope.locationMap);
        }
        $scope.locationMap.fitBounds(bounds);
        $scope.locationMap.setCenter(currentPositionMarker.getPosition());
    };

    function resetMap() {
        path = [];
        bounds = new google.maps.LatLngBounds();
        angular.forEach($scope.locations, function(loc) {
            var coord = new google.maps.LatLng(loc.lat, loc.lng);
            path.push(coord);
            bounds.extend(coord);
        });
        google.maps.event.trigger($scope.locationMap, 'resize');
        $scope.updateMap();
    }

    $scope.updateSlider = function() {
        var oldest = moment($scope.locations[0].date);
        var newest = moment($scope.locations[$scope.locations.length -1].date);

        $scope.sliderFrom = oldest.valueOf();
        $scope.sliderTo = newest.valueOf();
        $scope.currentTime = oldest.valueOf();

        var pos = new google.maps.LatLng($scope.locations[0].lat, $scope.locations[0].lng);
        currentPositionMarker.setPosition(pos);
        currentPositionMarker.setMap($scope.locationMap);
    };

    $scope.$watch('currentDate', function(newVal) {
        if (newVal) {
            $scope.disableHighPrecision = false;
            $scope.highPrecision = true;
            loadLocations();
            loadVideos();
        }
    });

    $scope.$watch('currentTime', function(newVal) {
        if (newVal) {
            updateLocationOnMap();
            scrollVideoToCurrentTime();
        }
    });

    var updateLocationOnMap = function () {
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
            currentPositionMarker.setPosition(latLng);
            $scope.locationMap.panTo(latLng);
        }
    };

    $scope.trustSrc = function(src) {
        return $sce.trustAsResourceUrl(src);
    };

    var scrollVideoToCurrentTime = function () {
        if(!$scope.videos || $scope.videos.length <= 0){
            return;
        }
        var nOfVideos = $scope.videos.length,
            isoDate = moment($scope.currentTime).toISOString(),
            video,
            formatDate = Date.parse(isoDate),
            videoAux,videoAuxNext;

        for(var i=0; i<nOfVideos; i++){
            videoAux = $scope.videos[i];
            if (i < nOfVideos-2){
                videoAuxNext = $scope.videos[i+1];
            }
            if ((formatDate >= Date.parse(videoAux.from) && formatDate <= Date.parse(videoAux.to)) ||
                (videoAuxNext && formatDate >= Date.parse(videoAux.to) && formatDate <= Date.parse(videoAuxNext.from))){
                video = videoAux;
                break;
            }
        }
        if ( video ) {
            var videoEL = angular.element($document)[0].getElementById(video.id);
            if(videoEL){
                var x = window.scrollX, y = window.scrollY;
                videoEL.focus();
                window.scrollTo(x, y);
            }
        }
    };
});
