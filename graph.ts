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
  reversedNodes: Map<number, { name: string, version: string, peerDeps: { [name: string]: number } }>;
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
    this.reversedNodes.set(id, { name, version, peerDeps: {} });
  }

  createVirtualNode(sourceId: number, fulfilledPeerDepName: string, fulfilledPeerDep: number): number {
    const oldNode = this.reversedNodes.get(sourceId)!;

    const name = oldNode.name;
    const version = oldNode.version;
    const peerDeps = oldNode.peerDeps;

    const matchingNodeWithSamePeerDeps = this.nodes[name][version].filter(o => {
      if (Object.keys(o.peerDeps).length !== (Object.keys(peerDeps).length + 1)) { return false; }
      for(let pd in peerDeps) {
        if (o.peerDeps[pd] !== peerDeps[pd]) {
          return false;
        }
      }
      if (o.peerDeps[fulfilledPeerDepName] !== fulfilledPeerDep) {
        return false
      }
      return true;
    })[0];


    if (matchingNodeWithSamePeerDeps !== undefined) {
      return matchingNodeWithSamePeerDeps.id;
    }

    const newNodeId = this.nodeCounter++;
    // 1 creating the node
    this.nodes[name][version].push({ id: newNodeId, peerDeps: { ...peerDeps, [fulfilledPeerDepName]: fulfilledPeerDep } });
    // 2 duplicating links
    const newLinks = new Map(this.links.get(sourceId)!);
    this.links.set(newNodeId, newLinks);
    // 3 update reveredLinks
    newLinks.forEach((_, key) => {
      this.reversedLinks.set(key, this.reversedLinks.get(key) || new Map());
      this.reversedLinks.get(key)!.set(newNodeId, "link");
    })

    // 4 add resolved dep as link
    this.links.get(newNodeId)!.set(fulfilledPeerDep, "link");
    // If the resolvedPeerDependency is the root node, then it may not have have any reversedLinks yet.
    this.reversedLinks.set(fulfilledPeerDep, this.reversedLinks.get(fulfilledPeerDep) || new Map());
    
    this.reversedLinks.get(fulfilledPeerDep)!.set(newNodeId, "link");
    return newNodeId;
  }

  changeChildren(parentId: number, oldChildId: number, newChildId: number): void {
    this.links.get(parentId)!.delete(oldChildId);
    this.links.get(parentId)!.set(newChildId, "link");

    this.reversedLinks.get(oldChildId)!.delete(parentId);
    this.reversedLinks.set(newChildId, this.reversedLinks.get(newChildId) || new Map());
    this.reversedLinks.get(newChildId)!.set(parentId, "link");
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
    function getReachableNodes(graph: Graph) {
      const reached = new Set();
      // TODO: DANGER: undocumented assumption: the root of the graph is the first node.
      const waiting = [0];
      while (waiting.length > 0) {
        const next = waiting.pop();
        if (next === undefined || reached.has(next)) {
          continue;
        }
        reached.add(next);
        const deps = Array.from(graph.links.get(next)?.keys() || []);
        waiting.push(...deps);
      }
      return reached;
    }
    const reachableNodes = getReachableNodes(this);
    const sortedNodes = Object.keys(this.nodes).map(name => {
      return Object.keys(this.nodes[name]).map(version => {
        const list = this.nodes[name][version];
        return list.map(n => {
          return { internalId: n.id, name, version };
        }).filter(o => reachableNodes.has(o.internalId))
     }).reduce((a,n) => [...a, ...n], [])
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

    const links = Array.from(this.links.keys()).filter(k => reachableNodes.has(k)).map(sourceId => {
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
