type NodeId = {
  id: number;
  type: "nodeId";
}
type PeerLinkId = {
  id: number;
  type: "peerLinkId";
}

export class Graph {
  nodes: { [name: string] : { [version: string]: number } };
  links: Map<number, Map<number, "link">>
  counter: number;

  constructor() {
    this.nodes = {};
    this.links = new Map();
    this.counter = 0;
  }
  addNode(name: string, version: string): void {
    const id = this.counter++;
    this.nodes[name] = this.nodes[name] || {};
    this.nodes[name][version] = id;
  }
  getNode(name: string, version: string): NodeId | undefined {
    if (!this.nodes[name] || this.nodes[name][version] === undefined) {
      return undefined;
    }
    
    const id = this.nodes[name][version];
    return { id, type: "nodeId" };
  }

  addLink(source: NodeId, target: NodeId): void {
    if (!this.links.get(source.id)) {
      this.links.set(source.id, new Map());
    }
    (this.links.get(source.id) as Map<number, "link">).set(target.id, "link");
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
