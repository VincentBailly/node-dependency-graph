import { createDependencyGraph } from ".";

it("works", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        "B": "^1.0.0",
        "C": "^1.0.0"
      }
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false
    }
  ];

  const resolutionMap = {
    "B": { "^1.0.0": "1.1.0" },
    "C": { "^1.0.0": "1.0.1" }
  } 
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "C", version: "1.0.1" }
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 2 }
    ]
  };

  expect(graph).toEqual(expected)
});
