// input types
export type Packages = { [name: string] : { [version: string]: string } };
type Link = { sourceId: string, targetId: string };
type PeerLink = { sourceId: string, name: string, range: string };


// output types
type VirtualPackages = { [name: string] : { [version: string]: { resolvedDeps: { [name: string]: string }, id: string } } };



export function resolvePeerDependencies(packages: Packages, links: Link[], peerLinks: PeerLink[]): { vPackages: VirtualPackages, links: Link[] } {
  
}
