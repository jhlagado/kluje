"use strict";

jex.use(['funk', 'kluje', 'testdata', 'types', 'utils'], function(funk, kluje, testdata, types, utils) {
    
    var names = ('isarray isfunction isequal').split(' ');
    
    return jex.inject(funk, 
    function(isarray, isfunction, isequal) {
                
        angular.module("klujeTests", [])
        
        .controller('Tests', function($scope) {
            
            utils.output = new function Output() {
                this.lines = [];
                this.log = function(msg) {
                    this.lines.push(msg);
                }
                this.warn = this.log;
                this.error = this.log;
            }
            
            $scope.results = testdata.tests.map(function(data) {
                
                utils.output.lines = [];
                
                var result, error;
                try {
                    console.log(data.test);
                    result = kluje.run(data.test);
                } 
                catch (e) {
                    error = e;
                    utils.output.lines.push(e.stack);
                }
                
                var line = {
                    name: data.name,
                    test: data.test,
                    result: error ? error.msg : types.tostring(result),
                    output: utils.output.lines,
                }
                if (isfunction(data.expect)) {
                    line.passed = data.expect(data, result, error);
                } 
                else {
                    line.passed = isequal(data.expect, result);
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
    
    }, names);

});


