angular.module('mogi-admin').controller('UserListCtrl', function($scope, $routeParams, $http, $location, ServerUrl){

    // callback for ng-click 'editUser':
    $scope.editUser = function (userId) {
        $location.path('/user-detail/' + userId);
    };

    // callback for ng-click 'deleteUser':
    $scope.deleteUser = function (userId) {
        //UserFactory.delete({ id: userId });
        //$scope.users = UsersFactory.query();
    };

    // callback for ng-click 'createUser':
    $scope.createNewUser = function () {
        $location.path('/user-creation');
    };


    $http.get(ServerUrl + '/users',
        { params : {
            page : $scope.page
        }
       }
    ).success(function(data) {
        $scope.users = data;
    }).error(function(data) {

   });

}).controller('UserDetailCtrl', function($scope, $routeParams, $http, $location, ServerUrl){

    // callback for ng-click 'updateUser':
    $scope.updateUser = function () {
        $http.post(ServerUrl + '/users/' + $scope.user.id, $scope.user).success(function(data){
            $location.path('/user-list');
        }).error(function(data) {
            $scope.serverMessage = data;
        });
    };

    // callback for ng-click 'cancel':
    $scope.cancel = function () {
        $location.path('/user-list');
    };

    $http.get(ServerUrl + '/users/'+ $routeParams.id).success(function(data) {
            $scope.user = data;
    }).error(function(data) {
    });
    $http.get(ServerUrl + '/groups').success(function(data){
        $scope.groups = data;
    });
}).controller('UserCreationCtrl', function($scope, $routeParams, $http, $location, ServerUrl){

    // callback for ng-click 'createNewUser':
    $scope.createNewUser = function () {
        $http.post(ServerUrl + '/users',
        $scope.user).success(function(data) {
            $location.path('/user-list');
        }).error(function(data) {
            $scope.serverMessage = data;
        });
    };
    $http.get(ServerUrl + '/groups').success(function(data){
        $scope.groups = data;
    });
});