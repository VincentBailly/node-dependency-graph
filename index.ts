import { Graph } from "./graph";
import * as semver from "semver";

export interface PackageManifest {
  name: string,
  version: string,
  isLocal?: boolean,
  dependencies?: { [name: string]: string },
  devDependencies?: { [name: string]: string },
  optionalDependencies?: { [name: string]: string },
  peerDependencies?: { [name: string]: string },
  peerDependenciesMeta?: { [name: string]: { optional?: boolean } }
};

type ResolutionMap = { [name: string]: { [range: string]: string } };

type Node = { id: number, name: string, version: string, resolvedPeerDependencies?: { [name: string]: number } };
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
    const sourceId = graph.getNodeWithoutPeerDependencies(m.name, m.version);
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
        const targetId = graph.getNodeWithoutPeerDependencies(targetName, targetVersion);
        if (!targetId) {
          throw new Error("cannot find target");
          // TODO this is impossible, do something about it.
          return;
        }
        graph.addLink(sourceId.id, targetId.id)
      })
    }
  })

  // Adding devDependencies to the graph
  manifests.forEach(m => {
    if (!m.isLocal) {
      return;
    }

    const sourceId = graph.getNodeWithoutPeerDependencies(m.name, m.version);
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
        const targetId = graph.getNodeWithoutPeerDependencies(targetName, targetVersion);
        if (!targetId) {
          // TODO this is impossible, do something about it.
          return;
        }
        graph.addLink(sourceId.id, targetId.id)
      })
    }
  })

  manifests.forEach(m => {
    const sourceId = graph.getNodeWithoutPeerDependencies(m.name, m.version);
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
        const targetId = graph.getNodeWithoutPeerDependencies(targetName, targetVersion);
        if (!targetId) {
          // This is legal, it means the optional dependency is not installed.
          return;
        }
        graph.addLink(sourceId.id, targetId.id)
      })
    }
  })

  manifests.forEach(m => {
    const sourceId = graph.getNodeWithoutPeerDependencies(m.name, m.version);
    if (!sourceId) {
      // TODO this is impossible, do something about it.
      return;
    }
    const dependencies = m.peerDependencies;
    if (dependencies) {
      Object.keys(dependencies).forEach(k => {
        const targetName = k;
        const targetRange = dependencies[k];
        const optional = Boolean(m.peerDependenciesMeta && m.peerDependenciesMeta[k] && m.peerDependenciesMeta[k].optional)
        graph.addPeerLink(sourceId, targetName, targetRange, optional);
      })
    }
  })

  // Resolve PeerLinks
  // TODO: fail if peer dependency don't match version range
  let nextPeerDep = graph.getNextPeerLink();
  while (nextPeerDep !== undefined) {
    const { parentId, sourceId, targetName, optional, targetRange } = nextPeerDep;
    function resolveChild(parent: number, name: string, optional: boolean): number | undefined {
      const childrenMap = graph.links.get(parent);
      if (childrenMap === undefined) {
        // TODO: this cannot happen, make TS able to understand this.
        throw new Error();
      }

      const siblings = Array.from(childrenMap.keys());
      const result = siblings.filter(s => graph.reversedNodes.get(s)?.name === name)[0];
      if (!result) {
        // TODO: fail for unmet peer dependencies
          if (optional) {
            return undefined;
          } else {
            throw new Error(`Unmet peer dependency: ${name} in ${parent}`);
          }
      }
      const version = graph.reversedNodes.get(result)!.version;
      if (!semver.satisfies(version, targetRange)) {
        console.error(`[WARNING] unmatching peer dependency`);
      }
      return result
    }
    const result = graph.reversedNodes.get(parentId)?.name === targetName ? parentId : resolveChild(parentId, targetName, optional);
    if (result !== undefined) {
      const newPackageId = graph.createVirtualNode(sourceId, targetName, result);
      graph.changeChildren(parentId, sourceId, newPackageId);
    } else {
      graph.ignoredOptionalPeerDependencies.push({ parentId, sourceId, requestedName: targetName });
    }

    nextPeerDep = graph.getNextPeerLink();
  }

  return graph.toJson();
}
