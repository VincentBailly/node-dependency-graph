export type NodeId = {
  id: number;
  type: "nodeId";
}
type PeerLinkId = {
  id: number;
  type: "peerLinkId";
}
type PeerLink = {
  targetName: string,
  targetRange: string
};

export class Graph {
  nodes: { [name: string] : { [version: string]: { id: number, peerDeps: { [name: string]: number } }[] } };
  reversedNodes: Map<number, { name: string, version: string }>;
  links: Map<number, Map<number, "link">>;
  reversedLinks: Map<number, Map<number, "link">>;
  nodeCounter: number;
  peerLinks: Map<number, Map<number, PeerLink[]>>;

  constructor() {
    this.nodes = {};
    this.links = new Map();
    this.reversedNodes = new Map();
    this.reversedLinks = new Map();
    this.nodeCounter = 0;
    this.peerLinks = new Map();
  }
  addNode(name: string, version: string): void {
    const id = this.nodeCounter++;
    this.nodes[name] = this.nodes[name] || {};
    this.nodes[name][version] = [{ id, peerDeps: {} }];
    this.reversedNodes.set(id, { name, version });
  }
  getNodeWithoutPeerDependencies(name: string, version: string): NodeId | undefined {
    if (!this.nodes[name] || this.nodes[name][version] === undefined) {
      return undefined;
    }
    
    const list = this.nodes[name][version];
    const id = list.find(o => Object.keys(o.peerDeps).length === 0)!.id;
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
      const parentId: NodeId = { type: "nodeId", id: key }
      const mapFromSource = this.peerLinks.get(sourceId.id) || new Map();
      this.peerLinks.set(sourceId.id, mapFromSource);
      const mapFromParent: PeerLink[] = mapFromSource.get(parentId.id) || [];
      mapFromSource.set(parentId.id, mapFromParent);
      mapFromParent.push({ targetName, targetRange });
      next = keys.next();
    }
  }

  removePeerLink(sourceId: number, parentId: number, name: string): void {
    // TODO: avoid using bang
    const list = this.peerLinks.get(sourceId)!.get(parentId)!;
    this.peerLinks.get(sourceId)!.set(parentId, list.filter(o => o.targetName !== name));;
  }

  addLink(source: number, target: number): void {
    if (!this.links.get(source)) {
      this.links.set(source, new Map());
    }
    (this.links.get(source) as Map<number, "link">).set(target, "link");

    if (!this.reversedLinks.get(target)) {
      this.reversedLinks.set(target, new Map());
    }
    (this.reversedLinks.get(target) as Map<number, "link">).set(source, "link");
  }

  toJson(): { nodes:  { name: string, version: string, id: number }[], links: { sourceId: number, targetId: number }[] } {
    const sortedNodes = Object.keys(this.nodes).map(name => {
      return Object.keys(this.nodes[name]).map(version => {
        const list = this.nodes[name][version];
        const id = list[0].id;
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
