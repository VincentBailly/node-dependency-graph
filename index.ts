import { Graph } from "./graph";

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

  return graph.toJson();
}
