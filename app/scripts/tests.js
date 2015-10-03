"use strict";

jex.use(['funk', 'kluje', 'testdata'], function(funk, kluje, testdata) {
    
    var names = ('isarray isfunction isequal').split(' ');
    
    return jex.inject(funk, 
    function(isarray, isfunction, isequal) {
                
        angular.module("klujeTests", [])
        
        .controller('Tests', function($scope) {
            
            jex.get('funk');
            
            var output = new function Output() {
                this.lines = [];
                this.log = function(msg) {
                    this.lines.push(msg);
                }
                this.warn = this.log;
                this.error = this.log;
            }
            
            kluje.setoutput(output);
            
            $scope.results = testdata.tests.map(function(data) {
                
                output.lines = [];
                
                var result, error;
                try {
                    console.log(data.test);
                    result = kluje.run(data.test);
                } 
                catch (e) {
                    error = e;
                    output.lines.push(e.stack);
                }
                
                var line = {
                    name: data.name,
                    test: data.test,
                    result: error ? error.msg : kluje.tostring(result),
                    output: output.lines,
                }
                if (isfunction(data.expect)) {
                    line.passed = data.expect(data, result, error);
                } 
                else {
                    line.passed = isequal(data.expect, result);
                    line.expect = kluje.tostring(data.expect);
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


