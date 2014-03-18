///**
// * Created by brunosiqueira on 16/03/2014.
// */
//angular.module('mogi-admin').directive('mogiResizable', function($window) {
//    return function($scope) {
//        $scope.initializeWindowSize = function() {
//            $scope.windowHeight = $window.innerHeight;
//            $scope.windowWidth = $window.innerWidth;
//            return google.maps.event.trigger($scope.myMap,'resize');
//        };
//        $scope.initializeWindowSize();
//        return angular.element($window).bind('resize', function() {
//            $scope.initializeWindowSize();
//            return $scope.$apply();
//        });
//    };
//});