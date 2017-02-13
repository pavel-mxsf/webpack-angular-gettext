"use strict";
var path = require('path');
var loaderUtils = require('loader-utils');
var _ = require('lodash');
var angular_gettext_tools_1 = require('angular-gettext-tools');
function extractLoader(source, sourceMaps) {
    var loader = this;
    if (!loader.addGettextStrings) {
        return this.callback(new Error("The WebpackAngularGettext plugin is missing, Add the plugin to your webpack configurations 'plugins' selection."), source, sourceMaps);
    }
    if (loader.cacheable) {
        loader.cacheable();
    }
    extractTranslations.call(this, loader, source, sourceMaps);
}
function findRoot(context, entries) {
    if (_.isString(entries)) {
        return path.dirname(path.join(context, entries));
    }
    else {
        return _.reduce(entries, function (memo, entry) {
            if (!_.isString(entry)) {
                return memo;
            }
            var dir = path.dirname(path.join(context, entry));
            if (memo) {
                var memoTokens = memo.split(path.sep);
                var dirTokens = dir.split(path.sep);
                var result = [];
                // find the minimum matching route
                for (var i = 0; i < memo.length; i++) {
                    if (memoTokens[i] === dirTokens[i]) {
                        result.push(memoTokens[i]);
                    }
                    else {
                        return result.join(path.sep);
                    }
                }
            }
            else {
                return dir;
            }
        }, '');
    }
}
function extractTranslations(loader, source, sourceMaps) {
    var options = loaderUtils.parseQuery(this.query);
    var extractor = new angular_gettext_tools_1.Extractor(options);
    var root = findRoot(this.options.context, this.options.entry.main);
    var filename = path.relative(root, this.resourcePath).replace(/^(\.\.\/)*(node_modules\/)?/, '');
    extractor.parse(filename, source);
    loader.pruneGettextStrings(filename);
    loader.addGettextStrings(_.clone(extractor.strings));
    loader.callback(null, source, sourceMaps);
}
module.exports = extractLoader;
//# sourceMappingURL=loader.js.map