﻿'use strict';
var ast = require('./ast/ast');
var utils = require('gulp-util');
var match = require('gulp-match');
var _ = require('lodash');
var through = require('through2');
var path = require('path');
var PluginError = utils.PluginError;

var PLUGIN_NAME = 'gulp-module-wrapper';

function getOptions(file, opts) {
    var filename = path.basename(file.path),
        defaults = {
            deps: ["require", "exports", "module"],
            args: ["require", "exports", "module"]
        },
        result;

    result  = _.defaults(_.clone(opts[filename] || opts), {
        root: null,
        name: null,
        deps: null,
        args: null,
        exports: null,
        file: file
    });

    result.deps = defaults.deps.concat(result.deps || []);
    result.args = defaults.args.concat(result.args || []);

    if (typeof result.root === 'string' && !result.name) {
        result.name = path.relative(result.root, result.file.path).slice(0, -path.extname(result.file.path).length);
    } else if (!result.name) {
        result.name = path.basename(result.file.path, path.extname(result.file.path));
    }

    return result;
}

module.exports = function (options, ignore) {
    return through.obj(function (file, enc, cb) {
        var self = this, opts;

        function err(message) {
            self.emit('error', new PluginError(PLUGIN_NAME, message));
            return cb();
        }

        ignore = ignore || [];

        if (!ignore.length || !match(file, ignore)) {
            opts = getOptions(file, options || {});

            if (file.isStream()) {
                return err('Streaming not supported');
            }

            if (file.isBuffer()) {
                try {
                    file.contents = new Buffer(ast(String(file.contents), opts));
                } catch (ex) {
                    return err(ex.message);
                }
            }
        }

        this.push(file);
        cb();
    });
};