angular.module('mogi-admin').factory('autoCompleteService',function($http) {
    return {
        get: function(url) {
            return $http.get(url).then(function(resp) {
                return resp.data;
            });
        }
    };
}).directive('typeahead', function($timeout) {
    return {
        restrict: 'AEC',
        scope: {
            items: '=',
            prompt:'@',
            id: '@',
            title: '@',
            subtitle:'@',
            profilePicture:'@',
            model: '=',
            onSelect:'&'
        },
        link:function(scope,elem,attrs){
            scope.handleSelection=function(selectedItem){
                scope.model=selectedItem;
                scope.current=0;
                scope.selected=true;
                $timeout(function(){
                    scope.onSelect();
                },200);
            };
            scope.current=0;
            scope.selected=true;
            scope.isCurrent=function(index){
                return scope.current===index;
            };
            scope.setCurrent=function(index){
                scope.current=index;
            };
        },
        templateUrl: 'partial/autoComplete/autoComplete.html'
    };
});