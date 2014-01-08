angular.module('mogi-admin')
.factory('loginService',function($modal, authService, socket) {

  var loginService = {},
      modal = null,
      token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5MzViMWNlMC03N2ZkLTExZTMtYmU5Zi0yOTQxOGI4MWU1YTgiLCJleHAiOjYwMDEzODkxNDE2MTMzODh9.DWEoHYK-7a9m6iSrrgBw2YXDTyqUPabHZ94593jwIds';

  loginService.show = function() {
    if ( !modal ) {
      modal = $modal.open({
        templateUrl : 'partial/login/login.html',
        controller : 'LoginCtrl',
        backdrop : 'static'
      });
    }
  };

  loginService.getToken = function() {
    return token;
  };

  loginService.setToken = function(accessToken) {
    token = accessToken;
    authService.loginConfirmed();
    socket.connect(token);
  };

  loginService.isAuthenticated = function() {
    return token != null && token.length > 0;
  };

  return loginService;
}).controller('LoginCtrl',function($scope, $modalInstance, $http, loginService, ServerUrl){

  $scope.username = '';
  $scope.password = '';

  $scope.login = function() {
    $http.post(ServerUrl + '/token', {
      username : $scope.username,
      password : $scope.password,
      scope : 'admin'
    }).success(function(token) {
      loginService.setToken(token);
      $modalInstance.close();
    }).error(function (data) {
      $scope.errorMessage = data.message;
    });
  };

}).config(function ($httpProvider) {
  $httpProvider.interceptors.push(['$injector', function($injector) {
    return {
      request : function(config) {

        var loginService = $injector.get('loginService');
        var serverUrl = $injector.get('ServerUrl');
        if ( config.url.indexOf(serverUrl) > -1  && loginService.getToken() ) {
          config.headers.Authorization = 'Bearer ' + loginService.getToken();
        }

        return config;
      }
    };
  }]);
});
