declare module webpack {
    interface Compiler {
        plugin(phase:string, callback: Function): void;
    }

    interface Source {
    }

    interface Compilation {
        errors: Error[];
        warnings: Error[];
        plugin(phase:string, handler: Function): void;
        assets: { [name: string]: Source };
        children: [any];
        chunks: any;
        dependencyTemplates: any;
        entries: any;
        compiler: any;
    }

    interface Plugin {
        apply(compiler:Compiler): void;
    }

    interface LoaderContext {
        version?: number;
        context?: string;
        request?: string;
        query?: string;
        data?: any;
        resource?: string;
        resourcePath?: string;
        resourceQuery?: string;
        debug?: boolean;
        minimize?: boolean;
        sourceMap?: boolean;

        (content: string, sourceMaps: any): void;
        cacheable?: (flag?: boolean) => void;
        emitWarning(warning: string): void
        emitError(error: string): void;
        callback(error: any, result: string, sourceMaps: any): any;
        options: any;
    }
}


declare module "webpack" {
    export = webpack;
}
