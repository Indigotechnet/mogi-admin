/* global moment */
angular.module('mogi-admin').directive('timeSlider', function() {
	return {
    template : '<div><input type="range" /><div>',
		require: '^ngModel',
    restrict: 'E',
      scope: {
        min: '=',
        max: '=',
        ngModel: '='
      },
      link: function(scope, element, attrs) {
        var adjusting, curTimeDiv, rangeInput, rangeInputElement, rangeInputOffset, spans;
        rangeInput = element.find('input')[0];
        rangeInputElement = angular.element(rangeInput);
        adjusting = false;
        rangeInput.min = scope.min;
        rangeInput.max = scope.max;
        rangeInput.step = attrs.step;
        rangeInput.value = moment(scope.ngModel).valueOf();

        scope.$watch('ngModel', function(newVal) {
          if (newVal) {
            rangeInput.value = moment(newVal).valueOf();
            rangeInput.min = scope.min;
            rangeInput.max = scope.max;
          }
        });

        rangeInputElement.bind('change', function(event) {
          var curValue;
          adjusting = true;
          curValue = parseInt(event.target.value, 10);

          scope.$apply(function() {
            scope.ngModel = moment(parseInt(event.target.value, 10)).toDate();
          });

        });
        rangeInputElement.bind('mouseup', function(event) {
          adjusting = false;

        });
      }
    };
});
