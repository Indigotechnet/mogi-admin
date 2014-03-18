/**
 * Created by brunosiqueira on 17/03/2014.
 */
describe('UserListCtrl', function() {

    beforeEach(module('mogi-admin'));

    var scope,ctrl, httpBackend, url = "http://test";

    beforeEach(inject(function($rootScope, $controller) {
        httpBackend = $injector.get('$httpBackend');
        httpBackend.when('GET', url + '/users').respond([{id: 1, name: 'John'}, {id: 2, name: 'Mary'}]);
        scope = $rootScope.$new();
        ctrl = $controller('UserListCtrl', {$scope: scope, $http: httpBackend, ServerUrl: url});
    }));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    it('should fetch users', inject(function() {
        httpBackend.expectGET( url + '/users');
        expect(scope.users.length).toEqual(2);
        httpBackend.flush();
    }));

});