import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import {Plugin, Compiler, Compilation} from 'webpack';
import Registry from './registry';
import GettextLoaderContext from './context';

interface PluginOptions {
  /**
   * The name of the output file
   */
  fileName?: string;
  fileNamesFilter?: RegExp;
  corePaths?: string[];
}

export class AngularGettextPlugin implements Plugin {
  private options: PluginOptions;
  private compiler: Compiler;
  private compilation: Compilation;
  private registry = new Registry();
  private coreRegistry = new Registry();
  private store: any;
  private stringsStore: any[];

  constructor (options: PluginOptions) {
    this.options = _.extend({fileName: 'translations.pot', corePaths: []}, options);
    this.store = {};
    this.stringsStore = [];
  }

  /**
   * Entry function from webpack that registers the plugin in the required-build-phases
   * @param compiler
   */
  apply(compiler: Compiler): void {
    this.compiler = compiler;

    compiler.plugin('compilation', (compilation: Compilation) => {
      this.compilation = compilation;
      /**
       * Register the plugin to the normal-module-loader and expose the addGettextStrings function in the loaderContext.
       * This way the loader can communicate with the plugin.
       */

      compilation.plugin('normal-module-loader', (loaderContext: GettextLoaderContext) => {
        loaderContext.addGettextStrings = this.addGettextStrings.bind(this);
        loaderContext.fileNamesFilter = this.filterFilename.bind(this);
      });

      compilation.plugin('after-optimize-chunk-assets', (chunks: any) => {
        let objStrings: any[] = [];
        let checkFilename = (filename: string) => {
          return _.some(this.options.corePaths, (pattern) => _.includes(filename, pattern));
        };

        let isCore = (data: any, filename: string): boolean => {
          if (checkFilename(filename)) {
            return true;
          }
          if (!data[filename] || data[filename].length == 0) {
            return false;
          }
          return _(data[filename]).map((fname: string) => isCore(data, fname)).some();
        };

        let toGTString = (obj: any): angularGettextTools.Strings => {
          let res:any = {};
          res[obj.string] = {};
          res[obj.string][obj.context] = obj.data;
          return res;
        };

        // Store dependencies {file: [requiredByFile, requiredByFile2...], file2: [...]}
        chunks.forEach((chunk: any) => {
          chunk.modules.forEach((module:any) => {
            this.store[module.resource] = this.store[module.resource] || [];
            module.reasons.forEach((reason: any) => {
              if (reason.module.resource && ! _.includes(this.store[module.resource], reason.module.resource)) {
                this.store[module.resource].push(reason.module.resource);
              }
            })
          });
        });

        // unpack [filename, angularGettextTools.Strings] entries to objects - one for every po string.
        this.stringsStore.forEach((strings) => {
          _.forIn(strings[1], (val, str) => {
            _.forIn(val, (data, context) => {
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
        let partitions = _.partition(objStrings, (strObj) => {
          return isCore(this.store, strObj.filename);
        });
        let coreObjs = partitions[0];
        let restObjs = partitions[1];

        // Move duplicities from rest to core.
        let toAddToCore = _.filter(restObjs, (obj) => { return _.find(coreObjs, {context: obj.context, string: obj.string}) });
        coreObjs = coreObjs.concat(toAddToCore);
        restObjs = _.difference(restObjs, toAddToCore);

        // Push to registries.
        coreObjs.forEach((obj) => {
          // this.coreRegistry.pruneGetTextStrings(obj.filename);
          this.coreRegistry.addGetTextStrings(toGTString(obj));
        });

        restObjs.forEach((obj) => {
          // this.registry.pruneGetTextStrings(obj.filename);
          this.registry.addGetTextStrings(toGTString(obj));
        });
      });
    });

    compiler.plugin('emit', this.emitResult.bind(this));
  }

  addGettextStrings(filename: string, strings: angularGettextTools.Strings): void {
    if (!_.isEmpty(strings)) {
      this.stringsStore.push([filename, strings]);
    }
  }

  filterFilename(filename: string): string {
    if (this.options.fileNamesFilter) {
      return filename.replace(this.options.fileNamesFilter, '');
    }
    return filename;
  }

  savePot(filename: string, registry: Registry, callback: () => void): void {
    let content = registry.toString();
    content = `#, fuzzy\n${content}`;
    fs.writeFile(filename, content, {encoding: 'utf-8'}, (error) => {
      callback();
    });
  }

  emitResult(compilation: Compilation, callback: () => void): void {
    this.savePot(this.options.fileName, this.registry, () => {
      let coreFilename = path.parse(this.options.fileName);
      coreFilename.base = 'core-' + coreFilename.base;
      this.savePot(path.format(coreFilename), this.coreRegistry, () => {
        callback();
      })
    })
  };
}

export default AngularGettextPlugin;
