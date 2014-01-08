angular.module('mogi-admin').directive('timeSlider', function() {
	return {
    template : '<div><input type="range" /><div>',
		restrict: 'E',
      scope: {
        min: '=',
        max: '=',
        callback: '='
      },
      link: function(scope, element, attrs) {
        var adjusting, curTimeDiv, rangeInput, rangeInputElement, rangeInputOffset, spans;
        rangeInput = element.find('input')[0];
        rangeInputElement = angular.element(rangeInput);
        adjusting = false;
        rangeInput.min = scope.min;
        rangeInput.max = scope.max;
        rangeInput.step = attrs.step;
        rangeInput.value = scope.min;

        rangeInputElement.bind('change', function(event) {
          var curValue;
          adjusting = true;
          curValue = parseInt(event.target.value);
          //return moveCurTimeDiv(curValue);
        });
        rangeInputElement.bind('mouseup', function(event) {
          adjusting = false;
          scope.callback.call(this, parseInt(event.target.value));
        });
        scope.$watch('min', function(newValue, oldValue) {
          rangeInput.min = scope.min;
          rangeInput.value = scope.min;
        });
        scope.$watch('max', function(newValue, oldValue) {
          rangeInput.max = scope.max;
        });
      }
    };
});
