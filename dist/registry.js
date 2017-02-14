"use strict";
var _ = require('lodash');
var Po = require('pofile');
function referenceMatches(oldRef, newRef) {
    return _(oldRef).split(':').first() === _(newRef).split(':').first();
}
function mergeReferences(oldRefs, newRefs) {
    return _(oldRefs)
        .concat(newRefs)
        .uniq()
        .sort()
        .value();
}
var Registry = (function () {
    function Registry() {
        this.strings = {};
        this.msgidsByResource = {};
    }
    Registry.prototype.pruneGetTextStrings = function (resource) {
        var msgids = this.msgidsByResource[resource] || [];
        for (var _i = 0, msgids_1 = msgids; _i < msgids_1.length; _i++) {
            var msgid = msgids_1[_i];
            var contextObject = this.strings[msgid];
            var contexts = Object.keys(contextObject);
            for (var _a = 0, contexts_1 = contexts; _a < contexts_1.length; _a++) {
                var context = contexts_1[_a];
                var item = contextObject[context];
                for (var _b = 0, _c = item.references; _b < _c.length; _b++) {
                    var ref = _c[_b];
                    if (referenceMatches(ref, resource)) {
                        item.references.splice(item.references.indexOf(ref), 1);
                        if (item.references.length === 0) {
                            delete contextObject[context];
                        }
                        break;
                    }
                }
            }
        }
        delete this.msgidsByResource[resource];
    };
    Registry.prototype.addGetTextStrings = function (strings) {
        var _this = this;
        _.forIn(strings, function (contextObject, msgid) {
            if (!_this.strings[msgid]) {
                _this.strings[msgid] = {};
            }
            _.forIn(contextObject, function (item, context) {
                // Keep track of current references, so we can tidy them when re-compiling
                for (var _i = 0, _a = item.references; _i < _a.length; _i++) {
                    var ref = _a[_i];
                    var resource = _(ref).split(':').first();
                    var msgids = _this.msgidsByResource[resource] = _this.msgidsByResource[resource] || [];
                    msgids.push(item.msgid);
                }
                var existing = _this.strings[msgid][context];
                if (!existing) {
                    _this.strings[msgid][context] = item;
                }
                else {
                    existing.comments = _.uniq(existing.comments.concat(item.comments)).sort();
                    existing.references = mergeReferences(existing.references, item.references);
                }
            });
        });
    };
    Registry.prototype.toString = function () {
        var catalog = new Po();
        catalog.headers = {
            'Content-Type': 'text/plain; charset=UTF-8',
            'Content-Transfer-Encoding': '8bit',
            'Project-Id-Version': ''
        };
        _.forIn(this.strings, function (msg, msgid) {
            var contexts = _.keys(msg).sort();
            _.forEach(contexts, function (context) {
                catalog.items.push(msg[context]);
            });
        });
        catalog.items.sort(function (a, b) {
            var idComparison = a.msgid.localeCompare(b.msgid);
            if (idComparison !== 0) {
                return idComparison;
            }
            if (a.msgctxt && b.msgctxt) {
                return a.msgctxt.localeCompare(b.msgctxt);
            }
            return 0;
        });
        return catalog.toString();
    };
    return Registry;
}());
exports.Registry = Registry;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Registry;
//# sourceMappingURL=registry.js.map