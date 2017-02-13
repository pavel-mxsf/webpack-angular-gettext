"use strict";
/// <reference path="../typings/tsd.d.ts" />
var plugin_1 = require('./plugin');
exports.Plugin = plugin_1.default;
function loader(options, before) {
    var loader = require.resolve('./loader');
    options = options ? "?" + JSON.stringify(options) : '';
    loader = "" + loader + options;
    if (before) {
        loader = loader + "!" + before;
    }
    return loader;
}
exports.loader = loader;
//# sourceMappingURL=index.js.map