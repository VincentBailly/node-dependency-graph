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
declare type Node = {
    id: number;
    name: string;
    version: string;
};
declare type Link = {
    sourceId: number;
    targetId: number;
};
declare type DependencyGraph = {
    nodes: Node[];
    links: Link[];
};
export declare function createDependencyGraph(manifests: PackageManifest[], resolutionMap: ResolutionMap): DependencyGraph;
export {};
