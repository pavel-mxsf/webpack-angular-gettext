"use strict";
var fs = require('fs');
var _ = require('lodash');
var registry_1 = require('./registry');
var AngularGettextPlugin = (function () {
    function AngularGettextPlugin(options) {
        this.registry = new registry_1.default();
        this.options = _.extend({ fileName: 'translations.pot' }, options);
    }
    /**
     * Entry function from webpack that registers the plugin in the required-build-phases
     * @param compiler
     */
    AngularGettextPlugin.prototype.apply = function (compiler) {
        var _this = this;
        this.compiler = compiler;
        compiler.plugin('compilation', function (compilation) {
            _this.compilation = compilation;
            /**
             * Register the plugin to the normal-module-loader and expose the addGettextStrings function in the loaderContext.
             * This way the loader can communicate with the plugin.
             */
            compilation.plugin('normal-module-loader', function (loaderContext) {
                loaderContext.addGettextStrings = _this.addGettextStrings.bind(_this);
                loaderContext.pruneGettextStrings = _this.registry.pruneGetTextStrings.bind(_this.registry);
                loaderContext.fileNamesFilter = _this.filterFilename.bind(_this);
            });
        });
        compiler.plugin('emit', this.emitResult.bind(this));
    };
    AngularGettextPlugin.prototype.addGettextStrings = function (strings) {
        this.registry.addGetTextStrings(strings);
    };
    AngularGettextPlugin.prototype.filterFilename = function (filename) {
        if (this.options.fileNamesFilter) {
            return filename.replace(this.options.fileNamesFilter, '');
        }
        return filename;
    };
    AngularGettextPlugin.prototype.emitResult = function (compilation, callback) {
        var content = this.registry.toString();
        content = "#, fuzzy\n" + content;
        fs.writeFile(this.options.fileName, content, { encoding: 'utf-8' }, function (error) {
            callback();
        });
    };
    ;
    return AngularGettextPlugin;
}());
exports.AngularGettextPlugin = AngularGettextPlugin;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AngularGettextPlugin;
//# sourceMappingURL=plugin.js.map