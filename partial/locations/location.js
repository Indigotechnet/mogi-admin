angular.module('mogi-admin')
.factory('locationService', function($http) {
    var locationService = {
        async: function(ServerUrl, date, accuracy, userId) {
            if(!ServerUrl || !userId || !date){
                console.error('wrong usage of locationService. missing params!');
                return null;
            }
            var baseUrl = ServerUrl + '/users/' + userId + '/locations/' + date;
            var url;
            if(accuracy){
                url = baseUrl.concat('/'+accuracy);
            }else{
                url = baseUrl;
            }
            console.log('url=['+url+']');
            var promise = $http.get(url).then(function (response) {
                return response.data;
            });
            return promise;
        }
    };
    return locationService;
});