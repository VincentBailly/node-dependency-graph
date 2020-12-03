declare type NodeId = {
    id: number;
    type: "nodeId";
};
export declare class Graph {
    nodes: {
        [name: string]: {
            [version: string]: number;
        };
    };
    links: Map<number, Map<number, "link">>;
    counter: number;
    constructor();
    addNode(name: string, version: string): void;
    getNode(name: string, version: string): NodeId | undefined;
    addLink(source: NodeId, target: NodeId): void;
    toJson(): {
        nodes: {
            name: string;
            version: string;
            id: number;
        }[];
        links: {
            sourceId: number;
            targetId: number;
        }[];
    };
}
export {};
