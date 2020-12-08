type NodeId = {
  id: number;
  type: "nodeId";
}
type PeerLinkId = {
  id: number;
  type: "peerLinkId";
}
type PeerLink = {
  parentId: NodeId,
  sourceId: NodeId,
  targetName: string,
  targetRange: string,
  id: PeerLinkId;
};

export class Graph {
  nodes: { [name: string] : { [version: string]: number } };
  reversedNodes: Map<number, { name: string, version: string }>;
  links: Map<number, Map<number, "link">>;
  reversedLinks: Map<number, Map<number, "link">>;
  nodeCounter: number;
  peerLinkCounter: number;
  peerLinks: Map<number, PeerLink>;

  constructor() {
    this.nodes = {};
    this.links = new Map();
    this.reversedNodes = new Map();
    this.reversedLinks = new Map();
    this.nodeCounter = 0;
    this.peerLinkCounter = 0;
    this.peerLinks = new Map();
  }
  addNode(name: string, version: string): void {
    const id = this.nodeCounter++;
    this.nodes[name] = this.nodes[name] || {};
    this.nodes[name][version] = id;
    this.reversedNodes.set(id, { name, version });
  }
  getNode(name: string, version: string): NodeId | undefined {
    if (!this.nodes[name] || this.nodes[name][version] === undefined) {
      return undefined;
    }
    
    const id = this.nodes[name][version];
    return { id, type: "nodeId" };
  }

  addPeerLink(sourceId: NodeId, targetName: string, targetRange: string): void {
    const parents = this.reversedLinks.get(sourceId.id);
    if (parents === undefined) {
      // TODO fail hard, peerDependencies should be fullfilled
      return
    }
    const keys = parents.keys();
    let next = keys.next();
    while(!next.done) {
      const key = next.value;
      const id: PeerLinkId = { type: "peerLinkId", id: this.peerLinkCounter++ };
      const parentId: NodeId = { type: "nodeId", id: key }
      this.peerLinks.set(id.id, { parentId, sourceId, targetName, targetRange, id });
      next = keys.next();
    }
  }

  removePeerLink(id: PeerLinkId): void {
    this.peerLinks.delete(id.id);
  }

  // TODO return an iterator instead of a list for better perf
  getPeerLinks(): PeerLink[] {
    return Array.from(this.peerLinks.values());
  }

  addLink(source: NodeId, target: NodeId): void {
    if (!this.links.get(source.id)) {
      this.links.set(source.id, new Map());
    }
    (this.links.get(source.id) as Map<number, "link">).set(target.id, "link");

    if (!this.reversedLinks.get(target.id)) {
      this.reversedLinks.set(target.id, new Map());
    }
    (this.reversedLinks.get(target.id) as Map<number, "link">).set(source.id, "link");
  }

  toJson(): { nodes:  { name: string, version: string, id: number }[], links: { sourceId: number, targetId: number }[] } {
    const sortedNodes = Object.keys(this.nodes).map(name => {
      return Object.keys(this.nodes[name]).map(version => {
        const id = this.nodes[name][version];
        return { internalId: id, name, version };
      })
    }).reduce((a,n) => [...a,...n], [])
    .sort((a,b) => {
      if (a.name > b.name) { return 1; }
      if (a.name < b.name) { return -1; }
      if (a.version > b.version) { return 1; }
      if (a.version < b.version) { return -1; }
      return 0;
    });
    const idMapping = sortedNodes.map((n, i) => {
      return { [n.internalId]: i };
    }).reduce((a,n) => ({...a, ...n}), {});
    const nodes = sortedNodes.map(n => ({ name: n.name, version: n.version, id: idMapping[n.internalId]}));

    const links = Array.from(this.links.keys()).map(sourceId => {
      return Array.from((this.links.get(sourceId) as Map<number, "link">).keys()).map(targetId => {
        return { sourceId: idMapping[sourceId], targetId: idMapping[targetId] };
      })
    }).reduce((a,n) => [...a, ...n], []).sort((a,b) => {
      if (a.sourceId > b.sourceId) { return 1; }
      if (a.sourceId < b.sourceId) { return -1; }
      if (a.targetId > b.targetId) { return 1; }
      if (a.targetId < b.targetId) { return -1; }
      return 0;
    });
    return { nodes, links };
  }
}
