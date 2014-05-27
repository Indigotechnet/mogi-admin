angular.module('mogi-admin')
.factory('loginService',function($modal, $http, authService, socket) {

  var loginService = {},
      modal = null,
      token = '';

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
    $scope.email = '';
    $scope.selected = 'login';

    $scope.forgotPass = function(){
        $scope.selected = 'forgotPass';
        $scope.errorMessage = '';
        $scope.emailMessage = '';
    };

    $scope.sendEmail = function(){
        $scope.errorMessage = '';
        $scope.emailMessage = '';
        if(!$scope.email || $scope.email === ''){
            $scope.errorMessage = 'Type an valid email address';
            return;
        }
        $scope.emailMessage = 'Trying to send email...';
        $http.post(ServerUrl + '/users/'+$scope.email+'/reset_password', {
            email:$scope.email
        }).success(function(data) {
            $scope.emailMessage = 'Email sent successfully';
            $scope.selected = 'login';
            $scope.email='';
        }).error(function (data){
            $scope.emailMessage = '';
            $scope.errorMessage = data;
            $scope.email='';
        });
    };

  $scope.login = function() {
    $http.post(ServerUrl + '/token', {
      username : $scope.username,
      password : $scope.password,
      scope : 'admin'
    }).success(function(token) {
        loginService.setToken(token.token);
        $modalInstance.close();
    }).error(function (data, status, headers, config) {
        //TODO improve here...
        $scope.errorMessage = 'Wrong login/pass combination';
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
