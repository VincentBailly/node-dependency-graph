declare type PackageManifest = {
    name: string;
    version: string;
    isLocal: boolean;
    dependencies?: {
        [name: string]: string;
    };
    devDependencies?: {
        [name: string]: string;
    };
    optionalDependencies?: {
        [name: string]: string;
    };
    peerDependencies?: {
        [name: string]: string;
    };
    peerDependenciesMeta?: {
        [name: string]: {
            optional?: boolean;
        };
    };
};
declare type ResolutionMap = {
    [name: string]: {
        [range: string]: string;
    };
};
declare type DependencyGraph = {
    nodes: {
        id: number;
        name: string;
        version: string;
    }[];
    links: {
        sourceId: number;
        targetId: number;
    }[];
};
export declare function createDependencyGraph(manifests: PackageManifest[], resolutionMap: ResolutionMap): DependencyGraph;
export {};
