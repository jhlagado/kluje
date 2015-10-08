'use strict';

jex.service('environ', ['types', 'utils'], function(types, utils) {
    
    return {
        assign: assign,
        create: create,
        define: define,
        find: find,
        get: get,
        set: set,
    }
    
    function assign(env, dict) {
        utils.assign(env, dict);
    }

    function create(dict, outer) {
        var env = Object.create(outer || {});
        env.__outer = outer;
        assign(env, dict);
        return env;
    }
    
    function define(env, v, value) {
        env[v] = value;
    }
    
    function find(env, v) {
        if (env.hasOwnProperty(v))
            return env;
        else if (env.__outer)
            return find(env.__outer, v);
        throw new types.RuntimeError('Could not lookup ' + v);
    }
    
    function get(env, v) {
        if (v in env)
            return env[v]
        else
            throw new types.RuntimeError('Could not lookup ' + v);
    }
    
    function set(env, v, value) {
        return find(env, v)[v] = value;
    }
    
});
