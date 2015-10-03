'use strict';

jex.service('types', ['funk'], function(funk) {
    
    return {
        newDict: newDict,
    }
    
    function newDict(init) {
        var dict = Object.create(null);
        return init ? funk.assign(dict, init) : dict;
    }

});
