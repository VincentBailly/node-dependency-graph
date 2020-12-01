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
  const nodes = getNodes(manifests);
  // TODO: sort links
  const links = getLinks(manifests, resolutionMap).map(l => {
    // TODO: use better data structure to avoid this searc
    const sourceId = nodes.filter(n => n.name === l.source.name && n.version === l.source.version)[0].id;
    const targetId = nodes.filter(n => n.name === l.target.name && n.version === l.target.version)[0].id;
    return { sourceId, targetId };
  });

  const result = {
    nodes,
    links
  };
  return result;
}

function getLinks(manifests: PackageManifest[], resolutionMap: ResolutionMap): { source: { name: string, version: string }, target: { name: string, version: string } }[] {
  const links = manifests.map(m => {
    const parentName = m.name;
    const parentVersion = m.version;
    // TODO: add conditionally devDependencies
    // TODO: add conditionally optional dependencies
    // TODO: fail gracefully if dependencies are unfulfilled
    const dependencies = {...m.dependencies};
    return Object.keys(dependencies).map(k => {
      const childName = k;
      const childRange = dependencies[k];
      const childVersion = resolutionMap[childName][childRange];
      return { source: { name: parentName, version: parentVersion }, target: { name: childName, version: childVersion } };
    });
  }).reduce((acc, next) => [...acc, ...next ], []);
  return links;
}

function getNodes(manifests: PackageManifest[]): Node[] {
  const nodes = manifests.sort((a, b) => {
    if (a.name > b.name) {
      return 1;
    }
    if (a.name < b.name) {
      return -1;
    }
    if (a.version > b.version) {
      return 1;
    }
    if (a.version < b.version) {
      return -1;
    }
    return 0
  }).map((m, i) => ({ id: i, name: m.name, version: m.version }));
  return nodes;
}
