declare type NodeId = {
    id: number;
    type: "nodeId";
};
declare type PeerLinkId = {
    id: number;
    type: "peerLinkId";
};
declare type PeerLink = {
    parentId: NodeId;
    sourceId: NodeId;
    targetName: string;
    targetRange: string;
    id: PeerLinkId;
};
export declare class Graph {
    nodes: {
        [name: string]: {
            [version: string]: number;
        };
    };
    reversedNodes: Map<number, {
        name: string;
        version: string;
    }>;
    links: Map<number, Map<number, "link">>;
    reversedLinks: Map<number, Map<number, "link">>;
    nodeCounter: number;
    peerLinkCounter: number;
    peerLinks: Map<number, PeerLink>;
    constructor();
    addNode(name: string, version: string): void;
    getNode(name: string, version: string): NodeId | undefined;
    addPeerLink(sourceId: NodeId, targetName: string, targetRange: string): void;
    removePeerLink(id: PeerLinkId): void;
    getPeerLinks(): PeerLink[];
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
