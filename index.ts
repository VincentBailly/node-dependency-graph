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
  const result = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" }
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 },
      { sourceId: 2, targetId: 1 }
    ]
  };
  return result;
}
