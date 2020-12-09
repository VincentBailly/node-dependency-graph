import { Graph, NodeId } from "./graph";

type PackageManifest = {
  name: string,
  version: string,
  isLocal: boolean,
  dependencies?: { [name: string]: string },
  devDependencies?: { [name: string]: string },
  optionalDependencies?: { [name: string]: string },
  peerDependencies?: { [name: string]: string },
  peerDependenciesMeta?: { [name: string]: { optional?: boolean } }
};

type ResolutionMap = { [name: string]: { [range: string]: string } };

type Node = { id: number, name: string, version: string };
type Link = { sourceId: number, targetId: number };

type DependencyGraph = {
  nodes: Node[],
  links: Link[]
}

export function createDependencyGraph(manifests: PackageManifest[], resolutionMap: ResolutionMap): DependencyGraph {
  const graph = new Graph();

  // Adding nodes to the graph
  manifests.forEach(m => {
    graph.addNode(m.name, m.version);
  })

  // Adding dependencies to the graph
  manifests.forEach(m => {
    const sourceId = graph.getNode(m.name, m.version);
    if (!sourceId) {
      // TODO this is impossible, do something about it.
      throw new Error("cannot find node");
      return;
    }
    const dependencies = m.dependencies;
    if (dependencies) {
      Object.keys(dependencies).forEach(k => {
        const targetName = k;
        const targetRange = dependencies[k];
        const targetVersion = resolutionMap[targetName][targetRange];
        const targetId = graph.getNode(targetName, targetVersion);
        if (!targetId) {
          // TODO this is impossible, do something about it.
          return;
        }
        graph.addLink(sourceId, targetId)
      })
    }
  })

  // Adding devDependencies to the graph
  manifests.forEach(m => {
    if (!m.isLocal) {
      return;
    }

    const sourceId = graph.getNode(m.name, m.version);
    if (!sourceId) {
      // TODO this is impossible, do something about it.
      return;
    }
    const dependencies = m.devDependencies;
    if (dependencies) {
      Object.keys(dependencies).forEach(k => {
        const targetName = k;
        const targetRange = dependencies[k];
        const targetVersion = resolutionMap[targetName][targetRange];
        const targetId = graph.getNode(targetName, targetVersion);
        if (!targetId) {
          // TODO this is impossible, do something about it.
          return;
        }
        graph.addLink(sourceId, targetId)
      })
    }
  })

  manifests.forEach(m => {
    const sourceId = graph.getNode(m.name, m.version);
    if (!sourceId) {
      // TODO this is impossible, do something about it.
      return;
    }
    const dependencies = m.optionalDependencies;
    if (dependencies) {
      Object.keys(dependencies).forEach(k => {
        const targetName = k;
        const targetRange = dependencies[k];
        const targetVersion = resolutionMap[targetName][targetRange];
        const targetId = graph.getNode(targetName, targetVersion);
        if (!targetId) {
          // This is legal, it means the optional dependency is not installed.
          return;
        }
        graph.addLink(sourceId, targetId)
      })
    }
  })

  manifests.forEach(m => {
    const sourceId = graph.getNode(m.name, m.version);
    if (!sourceId) {
      // TODO this is impossible, do something about it.
      return;
    }
    const dependencies = m.peerDependencies;
    if (dependencies) {
      Object.keys(dependencies).forEach(k => {
        const targetName = k;
        const targetRange = dependencies[k];
        graph.addPeerLink(sourceId, targetName, targetRange);
      })
    }
  })

  // Resolve PeerLinks
  // TODO: optimize this
  graph.getPeerLinks().forEach(pl => {
    function resolveChild(parent: NodeId, name: string): NodeId {
      const childrenMap = graph.links.get(parent.id);
      if (childrenMap === undefined) {
        // TODO: this cannot happen, make TS able to understand this.
        throw new Error();
      }

      const siblings = Array.from(childrenMap.keys());
      const result = siblings.filter(s => graph.reversedNodes.get(s)?.name === name)[0];
      if (!result) {
        // TODO: fail for unmet peer dependencies
          throw new Error();
      }
      return { id: result, type: "nodeId" };
    }
    const result = graph.reversedNodes.get(pl.parentId.id)?.name === pl.targetName ? pl.parentId : resolveChild(pl.parentId, pl.targetName);
    // TODO: don't manually create node id
    graph.addLink(pl.sourceId, result );
    graph.removePeerLink(pl.id);
    
  });


  return graph.toJson();
}
