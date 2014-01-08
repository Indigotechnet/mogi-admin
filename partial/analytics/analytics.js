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
          date : ($scope.search.date) ? moment($scope.search.date).format('YYYY-MM-DD') : '',
          page : $scope.page
        }
      }
    ).success(function(data) {
      //$scope.total = data.count;
      $scope.results = data;
    }).error(function(data) {

    });
  };

  $scope.goToUser = function(user) {
    var path = '/analytics/' + user.id;
    if ( $scope.search.date ) {
      path += '/date/' + moment($scope.search.date).format('YYYY-MM-DD');
    }

    $location.path(path);
  };
});
