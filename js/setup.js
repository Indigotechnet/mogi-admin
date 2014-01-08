angular.module('mogi-admin', ['ngRoute','ngAnimate','ui.bootstrap','ui','ui.map','http-auth-interceptor']);

angular.module('mogi-admin').constant('ServerUrl', 'http://localhost:3000');

angular.module('mogi-admin')
.config(function($routeProvider) {

    $routeProvider.
	  when('/',{templateUrl: 'partial/home/home.html'}).
	  when('/analytics',{templateUrl: 'partial/analytics/analytics.html'}).
	  when('/analytics/:id',{templateUrl: 'partial/analyticsUser/analyticsUser.html'}).
	  /* Add New Routes Above */
    when('/analytics/:id/date/:date',{templateUrl: 'partial/analyticsUser/analyticsUser.html'}).
    otherwise({redirectTo:'/'});

});

angular.module('mogi-admin').run(function($rootScope, loginService, socket) {

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

});
