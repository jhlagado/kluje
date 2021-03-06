jex.use(['kluje','types'], function(kluje,types) {
    
    angular.module("klujeRepl", [])
    
    .controller('Main', function($scope) {
        var lines = localStorage['lines'];
        $scope.lines = lines ? JSON.parse(lines) : [];
        
        $scope.go = function() {
            if (!$scope.command)
                return;
            try {
                var result = kluje.run($scope.command);
            } 
            catch (e) {
                var error = e.message;
            }
            
            $scope.lines.push({
                command: $scope.command,
                result: types.tostring(result),
                error: error,
            });
            if ($scope.lines.length > 1000)
                $scope.lines.unshift();
            $scope.command = '';
            store();
        }
        
        $scope.clear = function() {
            $scope.lines.length = 0;
            store();
        }
        
        $scope.setcommand = function(command) {
            $scope.command = command;
        }
        
        function store() {
            localStorage['lines'] = JSON.stringify($scope.lines);
        }
    })
    
    .directive('scrolltobottom', function() {
        return {
            link: function(scope, element) {
                scope.$watch(function() {
                    var cs = element.children();
                    return cs.length ? cs[0].scrollHeight : undefined;
                }, function(h) {
                    element[0].scrollTop = h;
                })
            }
        }
    })

});
