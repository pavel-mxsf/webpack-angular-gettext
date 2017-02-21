"use strict";
var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var registry_1 = require('./registry');
var AngularGettextPlugin = (function () {
    function AngularGettextPlugin(options) {
        this.registry = new registry_1.default();
        this.coreRegistry = new registry_1.default();
        this.options = _.extend({ fileName: 'translations.pot', corePaths: [] }, options);
        this.store = {};
        this.stringsStore = [];
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
                loaderContext.fileNamesFilter = _this.filterFilename.bind(_this);
            });
            compilation.plugin('after-optimize-chunk-assets', function (chunks) {
                var objStrings = [];
                var checkFilename = function (filename) {
                    return _.some(_this.options.corePaths, function (pattern) { return _.includes(filename, pattern); });
                };
                var isCore = function (data, filename) {
                    if (checkFilename(filename)) {
                        return true;
                    }
                    if (!data[filename] || data[filename].length == 0) {
                        return false;
                    }
                    return _(data[filename]).map(function (fname) { return isCore(data, fname); }).some();
                };
                var toGTString = function (obj) {
                    var res = {};
                    res[obj.string] = {};
                    res[obj.string][obj.context] = obj.data;
                    return res;
                };
                // Store dependencies {file: [requiredByFile, requiredByFile2...], file2: [...]}
                chunks.forEach(function (chunk) {
                    chunk.modules.forEach(function (module) {
                        _this.store[module.resource] = _this.store[module.resource] || [];
                        module.reasons.forEach(function (reason) {
                            if (reason.module.resource && !_.includes(_this.store[module.resource], reason.module.resource)) {
                                _this.store[module.resource].push(reason.module.resource);
                            }
                        });
                    });
                });
                // unpack [filename, angularGettextTools.Strings] entries to objects - one for every po string.
                _this.stringsStore.forEach(function (strings) {
                    _.forIn(strings[1], function (val, str) {
                        _.forIn(val, function (data, context) {
                            objStrings.push({
                                filename: strings[0],
                                string: str,
                                context: context,
                                data: data
                            });
                        });
                    });
                });
                // split strings to core and rest part
                var partitions = _.partition(objStrings, function (strObj) {
                    return isCore(_this.store, strObj.filename);
                });
                var coreObjs = partitions[0];
                var restObjs = partitions[1];
                // Move duplicities from rest to core.
                var toAddToCore = _.filter(restObjs, function (obj) { return _.find(coreObjs, { context: obj.context, string: obj.string }); });
                coreObjs = coreObjs.concat(toAddToCore);
                restObjs = _.difference(restObjs, toAddToCore);
                // Push to registries.
                coreObjs.forEach(function (obj) {
                    // this.coreRegistry.pruneGetTextStrings(obj.filename);
                    _this.coreRegistry.addGetTextStrings(toGTString(obj));
                });
                restObjs.forEach(function (obj) {
                    // this.registry.pruneGetTextStrings(obj.filename);
                    _this.registry.addGetTextStrings(toGTString(obj));
                });
            });
        });
        compiler.plugin('emit', this.emitResult.bind(this));
    };
    AngularGettextPlugin.prototype.addGettextStrings = function (filename, strings) {
        if (!_.isEmpty(strings)) {
            this.stringsStore.push([filename, strings]);
        }
    };
    AngularGettextPlugin.prototype.filterFilename = function (filename) {
        if (this.options.fileNamesFilter) {
            return filename.replace(this.options.fileNamesFilter, '');
        }
        return filename;
    };
    AngularGettextPlugin.prototype.savePot = function (filename, registry, callback) {
        var content = registry.toString();
        content = "#, fuzzy\n" + content;
        fs.writeFile(filename, content, { encoding: 'utf-8' }, function (error) {
            callback();
        });
    };
    AngularGettextPlugin.prototype.emitResult = function (compilation, callback) {
        var _this = this;
        this.savePot(this.options.fileName, this.registry, function () {
            var coreFilename = path.parse(_this.options.fileName);
            coreFilename.base = 'core-' + coreFilename.base;
            _this.savePot(path.format(coreFilename), _this.coreRegistry, function () {
                callback();
            });
        });
    };
    ;
    return AngularGettextPlugin;
}());
exports.AngularGettextPlugin = AngularGettextPlugin;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AngularGettextPlugin;
//# sourceMappingURL=plugin.js.map