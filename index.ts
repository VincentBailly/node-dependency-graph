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

type DependencyGraph = {
  nodes: { id: number, name: string, version: string }[],
  links: { sourceId: number, targetId: number }[]
}

export function createDependencyGraph(manifests: PackageManifest[], resolutionMap: ResolutionMap): DependencyGraph {
  return { nodes: [], links: []};
}
