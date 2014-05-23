'use strict';

/*
 * AngularJS Toaster
 * Version: 0.4.6
 *
 * Copyright 2013 Jiri Kavulak.  
 * All Rights Reserved.  
 * Use, reproduction, distribution, and modification of this code is subject to the terms and 
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * Author: Jiri Kavulak
 * Related to project of John Papa and Hans Fjällemark
 */

angular.module('toaster', ['ngAnimate'])
.service('toaster', ['$rootScope', function ($rootScope) {
    this.pop = function (type, title, body, timeout, bodyOutputType, clickHandler, genericObj) {
        this.toast = {
            type: type,
            title: title,
            body: body,
            timeout: timeout,
            bodyOutputType: bodyOutputType,
            clickHandler: clickHandler,
            genericObj: genericObj,
            id: genericObj.id
        };
        $rootScope.$broadcast('toaster-newToast');
    };

    this.clear = function () {
        $rootScope.$broadcast('toaster-clearToasts');
    };
    this.clearToastByUserId = function (userId) {
        $rootScope.$broadcast('toaster-clearByUserId', userId);  
    }
}])
.constant('toasterConfig', {
    'limit': 0,                   // limits max number of toasts 
    'tap-to-dismiss': true,
    'newest-on-top': true,
    //'fade-in': 1000,            // done in css
    //'on-fade-in': undefined,    // not implemented
    //'fade-out': 1000,           // done in css
    // 'on-fade-out': undefined,  // not implemented
    //'extended-time-out': 1000,    // not implemented
    'time-out': 5000, // Set timeOut and extendedTimeout to 0 to make it sticky
    'icon-classes': {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning'
    },
    'body-output-type': '', // Options: '', 'trustedHtml', 'template'
    'body-template': 'toasterBodyTmpl.html',
    'icon-class': 'toast-info',
    'position-class': 'toast-top-right',
    'title-class': 'toast-title',
    'message-class': 'toast-message'
})
.directive('toasterContainer', ['$compile', '$timeout', '$sce', 'toasterConfig', 'toaster',
function ($compile, $timeout, $sce, toasterConfig, toaster) {
    return {
        replace: true,
        restrict: 'EA',
        scope: true, // creates an internal scope for this directive
        link: function (scope, elm, attrs) {

            var id = 0,
                mergedConfig;

            mergedConfig = angular.extend({}, toasterConfig, scope.$eval(attrs.toasterOptions));

            scope.config = {
                position: mergedConfig['position-class'],
                title: mergedConfig['title-class'],
                message: mergedConfig['message-class'],
                tap: mergedConfig['tap-to-dismiss']
            };

            scope.configureTimer = function configureTimer(toast) {
                var timeout = typeof (toast.timeout) == "number" ? toast.timeout : mergedConfig['time-out'];
                if (timeout > 0)
                    setTimeout(toast, timeout);
            };

            function addToast(toast) {
                toast.type = mergedConfig['icon-classes'][toast.type];
                if (!toast.type)
                    toast.type = mergedConfig['icon-class'];

                id++;
                angular.extend(toast, { id: toast.id });

                // Set the toast.bodyOutputType to the default if it isn't set
                toast.bodyOutputType = toast.bodyOutputType || mergedConfig['body-output-type'];
                switch (toast.bodyOutputType) {
                    case 'trustedHtml':
                        toast.html = $sce.trustAsHtml(toast.body);
                        break;
                    case 'template':
                        toast.bodyTemplate = toast.body || mergedConfig['body-template'];
                        break;
                }

                scope.configureTimer(toast);

                if (mergedConfig['newest-on-top'] === true) {
                    scope.toasters.unshift(toast);
                    if (mergedConfig['limit'] > 0 && scope.toasters.length > mergedConfig['limit']) {
                        scope.toasters.pop();
                    }
                } else {
                    scope.toasters.push(toast);
                    if (mergedConfig['limit'] > 0 && scope.toasters.length > mergedConfig['limit']) {
                        scope.toasters.shift();
                    }
                }
            }

            function setTimeout(toast, time) {
                toast.timeout = $timeout(function () {
                    scope.removeToast(toast);
                }, time);
            }

            scope.toasters = [];
            scope.$on('toaster-newToast', function () {
                addToast(toaster.toast);
            });

            scope.$on('toaster-clearToasts', function () {
                scope.toasters.splice(0, scope.toasters.length);
            });
            scope.$on('toaster-clearByUserId', function (event, data){
                var i = 0;
                for (i; i < scope.toasters.length; i++) {
                    if (scope.toasters[i].id === data)
                        break;
                }
                scope.toasters.splice(i, 1);
                //think for a solution if we need to broadcast this event in future
                //$rootScope.$broadcast('toaster-removeToast', toast.genericObj);
            });
        },
        controller: ['$scope', '$element', '$attrs','$rootScope', function ($scope, $element, $attrs, $rootScope) {

            $scope.stopTimer = function (toast) {
                if (toast.timeout) {
                    $timeout.cancel(toast.timeout);
                    toast.timeout = null;
                }
            };

            $scope.restartTimer = function (toast) {
                if (!toast.timeout)
                    $scope.configureTimer(toast);
            };

            $scope.removeToast = function (toast) {
                var i = 0;
                for (i; i < $scope.toasters.length; i++) {
                    if ($scope.toasters[i].id === toast.id)
                        break;
                }
                $scope.toasters.splice(i, 1);
                $rootScope.$broadcast('toaster-removeToast', toast.genericObj);
                event.stopPropagation();
            };

            $scope.click = function (toaster) {
                if ($scope.config.tap === true) {
                    if (toaster.clickHandler) {
                        toaster.clickHandler(toaster.genericObj);
                    } 
                    $scope.removeToast(toaster);
                }
            };
        }],
        template:
        '<div id="toast-container" ng-class="config.position">' +
            '<div ng-repeat="toaster in toasters" class="toast" ng-class="toaster.type" ng-click="click(toaster)" ng-mouseover="stopTimer(toaster)"  ng-mouseout="restartTimer(toaster)">' +
              '<img alt="" ng-click="removeToast(toaster)" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAwOS8yNS8xMjFOUYwAAAAcdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzQGstOgAAACt0lEQVQokXXRMUtjaRjF8XPe994bk5DEmJWJwoIIoiyCBGEkxRSS3gXFbzB2U466EEEEi+0Va22yCFZbaKXFDogMaRxsBCvXhRn1chOMcuO9z/tssczCFns+wZ/foapia2vrbbfb/ZXkj6qaksT/zAPwZ7FY/GVzc/Mzt7e333a73d9V9Y1zTj3Po4iotZYiAgBqjKGqAgCcc/B9/2s2m/3Z1mq135xzP6mqWGu10+kgTVP1fR+qqsYYfX5+Rq/X01wupwCciBT7/f6UsdZWSarv+7y9vWWj0cDMzAyjKGIQBIiiiOPj42g0Gri7u4MxhsYYBVD1nHNCEmEYYmlpCcvLy4jjGPf399putzExMYGVlRWUSiV4noeTkxMMDw8DgJjvOJ7nIYoiJEmCgYEBrK6ucn5+Hs1mE6VSCc45vLy8IAiCf/VsvV7/oKo/ZDIZvb6+5s3NDWq1GnK5HOr1OrLZLOI4xu7uLi4uLjA0NATnHAGEhiRIQlVZrVZxfn6Og4OD//xzeHiI09NTjIyMQFXxvdZ4ngcA6vs+Hx4eMDU1xcXFRQAwAAgACwsLnJub4+PjI40xsNYSAEySJADATqfjJicnsbGxodVqFXEcu1arpXEco1wu69rams7OzurT0xNERAHAWGtBEmmacmxsDIVCASKCvb09tlot7Ozs4PX1FZlMBpVKBSICa+0/yCJiVRXlclmPjo4oIuj3+7i8vNTp6WlcXV1hf38f+Xwex8fHGB0dRZqmAGC5vr7+R5Ik76y1DoBGUUSSWqlUTJIkaozRXq9HEUG5XEaapkrSOuc+mXw+/9H3/W8iQhExg4ODLBaLJkkSqCpFxORyORYKBaZpSlW1JL+VSqWP9uzs7K92u/0pSZIJ55xYax+cc2EQBKFzLiQZkgwBhMaYLoAvlUrlfbPZ/Pw3lFhZ8soivesAAAAASUVORK5CYII=" />' +
              '<div ng-class="config.title">{{toaster.title}}</div>' +
              '<div ng-class="config.message" ng-switch on="toaster.bodyOutputType">' +
                '<div ng-switch-when="trustedHtml" ng-bind-html="toaster.html"></div>' +
                '<div ng-switch-when="template"><div ng-include="toaster.bodyTemplate"></div></div>' +
                '<div ng-switch-default >{{toaster.body}}</div>' +
              '</div>' +
            '</div>' +
        '</div>'
    };
}]);
