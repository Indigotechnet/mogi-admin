angular.module('mogi-admin', ['ngRoute','ngAnimate','ui.bootstrap','ui.map','http-auth-interceptor', 'angular-jwplayer' , 'toaster', 'angularFileUpload']);

angular.module('mogi-admin').constant('ServerUrl', 'http://mogi-api.igarape.org');
//angular.module('mogi-admin').constant('ServerUrl', 'http://localhost:3000');

angular.module('mogi-admin')
.config(['$routeProvider','$httpProvider', function($routeProvider, $httpProvider) {

    $routeProvider.
	  when('/',{templateUrl: 'partial/home/home.html'}).
      when('/analytics',{templateUrl: 'partial/analytics/analytics.html'}).
     when('/analytics2/:id',{templateUrl: 'partial/analyticsUser/analyticsUser2.html'}).
	  when('/analytics/:id',{templateUrl: 'partial/analyticsUser/analyticsUser.html'}).
	  /* Add New Routes Above */
      when('/analytics/:id/date/:date',{templateUrl: 'partial/analyticsUser/analyticsUser.html'}).
      when('/user-list', {templateUrl: 'partial/users/user-list.html', controller: 'UserListCtrl'}).
      when('/user-detail/:id', {templateUrl: 'partial/users/user-detail.html', controller: 'UserDetailCtrl'}).
      when('/user-creation', {templateUrl: 'partial/users/user-creation.html', controller: 'UserCreationCtrl'}).
      otherwise({redirectTo:'/'});

        var interceptor = ['$rootScope', '$q', function (scope, $q) {
            function success(response) {
                return response;
            }
            function error(response) {
                var status = response.status;
                if (status === 401 && response.config.url.indexOf('token') >-1) {
                    scope.errorMessage = 'Wrong login/pass combination';
                }
                return $q.reject(response);
            }
            return function (promise) {
                return promise.then(success, error);
            };
        }];
        $httpProvider.responseInterceptors.push(interceptor);

}]);

angular.module('mogi-admin').run(function($rootScope, loginService, socket) {

    $rootScope.usersFilter = '';

    $rootScope.$on("event:auth-loginRequired", function(data) {
        loginService.show();
    });

    if ( !loginService.isAuthenticated() ) {
        loginService.show();
    } else {
        socket.connect(loginService.getToken());
    }

    $rootScope.safeApply = function(fn) {
        var phase = $rootScope.$$phase;
        if (phase === '$apply' || phase === '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $rootScope.filterUsers = function () {
        $rootScope.$broadcast('event:filter-Users', $rootScope.usersFilter);
    };

});
