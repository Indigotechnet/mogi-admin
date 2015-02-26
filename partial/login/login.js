angular.module('mogi-admin')
.factory('loginService',function($rootScope, $cookieStore, $modal, $http, authService, socket) {

  var loginService = {},
      modal = null;

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
    if ($rootScope.globals == null && !$cookieStore.get('globals')){
      return null;
    }
    if ($rootScope.globals == null){
      $rootScope.globals = $cookieStore.get('globals');
    }
    return $rootScope.globals.currentUser.token;
  };

  loginService.setToken = function(userName, accessToken) {
    $rootScope.globals = {
      currentUser: {
        username: userName,
        token: accessToken
      }
    };
    $cookieStore.put('globals', $rootScope.globals);
    authService.loginConfirmed();
    socket.connect($rootScope.globals.currentUser.token);
  };

  loginService.isAuthenticated = function() {
    return loginService.getToken() != null && loginService.getToken().length > 0;
  };

  return loginService;
}).controller('LoginCtrl',function($scope, $modalInstance, $http, loginService, ServerUrl, $rootScope, $cookieStore){

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
        loginService.setToken($scope.username, token.token);
        $modalInstance.close();
    }).error(function (data, status, headers, config) {
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
}).run(['$rootScope', '$location', '$cookieStore', '$http',
    function ($rootScope, $location, $cookieStore, $http) {
      $rootScope.globals = $cookieStore.get('globals');
      if ($rootScope.globals && $rootScope.globals.currentUser  ) {
        $http.defaults.headers.common['Authorization'] = 'Bearer ' + $rootScope.globals.currentUser.token;
      }
    }]);
