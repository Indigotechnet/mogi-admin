/* global moment */
angular.module('mogi-admin').controller('AnalyticsCtrl',function($scope, $http, $location, ServerUrl){
  $scope.results = [];
  $scope.search = {
    user : '',
    date : '',
    page : 0
  };

  $scope.search = function() {
    $http.get(ServerUrl + '/users',
      { params : {
          user : $scope.search.user,
          page : $scope.page
        }
      }
    ).success(function(data) {
      $scope.results = data;
    }).error(function(data) {

    });
  };

  $scope.goToUser = function(user) {
    var path = '/analytics/' + user.id;
    $location.path(path);
  };
});
