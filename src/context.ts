import LoaderContext = webpack.LoaderContext;

export interface GettextLoaderContext extends LoaderContext {
    pruneGettextStrings?: (resource: string) => void;
    addGettextStrings?: (strings: angularGettextTools.Strings) => void;
    fileNamesFilter?: (filename: string) => string;
}

export default GettextLoaderContext;
