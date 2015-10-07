"use strict";

jex.use(['funcs', 'kluje', 'output', 'testdata', 'types', 'utils'], 
function(_, kluje, output, testdata, types, utils) {
    
    angular.module("klujeTests", [])
    
    .controller('Tests', function($scope) {
        
        output.out = new function Output() {
            this.lines = [];
            this.log = function(msg) {
                this.lines.push(msg);
            }
            this.warn = this.log;
            this.error = this.log;
            this.clear = function() {
                this.lines = [];
            }
        }
        
        $scope.results = testdata.tests.map(function(data) {
            
            output.out.clear();
            
            var result, error;
            try {
                console.log(data.test);
                result = kluje.run(data.test);
            } 
            catch (e) {
                error = e;
                output.out.lines.push(e.stack);
            }
            
            var line = {
                name: data.name,
                test: data.test,
                result: error ? error.msg : types.tostring(result),
                output: angular.copy(output.out.lines),
            }
            if (_.isfunction(data.expect)) {
                line.passed = data.expect(data, result, error);
            } 
            else {
                line.passed = _.isequal(data.expect, result);
                line.expect = types.tostring(data.expect);
            }
            return line;
        });
        
        $scope.fails = $scope.results.reduce(function(acc, item) {
            if (!item.passed)
                acc++;
            return acc;
        }, 0);
    
    })

});


