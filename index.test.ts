import { createDependencyGraph, PackageManifest } from ".";

it("resolves basic graph", () => {
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

it("resolves devDependency of local packages", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      devDependencies: {
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

it("does not resolve devDependency of remote packages", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: false,
      devDependencies: {
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
    links: []
  };

  expect(graph).toEqual(expected)
});

it("resolves optionalDependencies when available", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: false,
      optionalDependencies: {
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

it("ignore optionalDependencies when not available", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: false,
      optionalDependencies: {
        "B": "^1.0.0",
        "C": "^1.0.0"
      }
    }
  ];

  const resolutionMap = {
    "B": { "^1.0.0": "1.1.0" },
    "C": { "^1.0.0": "1.0.1" }
  } 
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
     { id: 0, name: "A", version: "1.0.0" }
    ],
    links: [
    ]
  };

  expect(graph).toEqual(expected)
});

it("sorts links", () => {
  const packageManifests = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        "C": "^1.0.0",
        "B": "^1.0.0"
      }
    },
    {
      name: "C",
      version: "1.0.1",
      isLocal: false
    },
    {
      name: "B",
      version: "1.1.0",
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

it("sorts nodes", () => {
  const packageManifests = [
    {
      name: "C",
      version: "1.0.1",
      isLocal: false
    },
    {
      name: "B",
      version: "1.1.0",
      isLocal: false
    },
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        "C": "^1.0.0",
        "B": "^1.0.0"
      }
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

it("resolves basic peer dependencies", () => {
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
      isLocal: false,
      peerDependencies: {
        "C": "*"
      }
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
      { sourceId: 0, targetId: 2 },
      { sourceId: 1, targetId: 2 }
    ]
  };

  expect(graph).toEqual(expected)
});

it("resolves parent as peer dependencies", () => {
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
      isLocal: false,
      peerDependencies: {
        "A": "*"
      }
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
      { sourceId: 0, targetId: 2 },
      { sourceId: 1, targetId: 0 }
    ]
  };

  expect(graph).toEqual(expected)
});

it("creates virtual packages when needed", () => {
  const packageManifests : PackageManifest[] = [
    {
      name: "A",
      version: "1.0.0",
      isLocal: true,
      dependencies: {
        "B": "^1.0.0",
        "C": "^1.0.0",
        "D": "^2.0.0"
      }
    },
    {
      name: "B",
      version: "1.1.0",
      peerDependencies: {
        "D": "*"
      }
    },
    {
      name: "C",
      version: "1.0.1",
      dependencies: {
        "B": "^1.0.0",
        "D": "^1.0.0"
      }
    },
    {
      name: "D",
      version: "1.0.0"
    },
    {
      name: "D",
      version: "2.0.0"
    }
  ];

  const resolutionMap = {
    "B": { "^1.0.0": "1.1.0" },
    "C": { "^1.0.0": "1.0.1" },
    "D": { "^1.0.0": "1.0.0", "^2.0.0": "2.0.0" }
  } 
  const graph = createDependencyGraph(packageManifests, resolutionMap);
  const expected = {
    nodes: [
      { id: 0, name: "A", version: "1.0.0" },
      { id: 1, name: "B", version: "1.1.0" },
      { id: 2, name: "B", version: "1.1.0" },
      { id: 3, name: "C", version: "1.0.1" },
      { id: 4, name: "D", version: "1.0.0" },
      { id: 5, name: "D", version: "2.0.0" }
    ],
    links: [
      { sourceId: 0, targetId: 1 },
      { sourceId: 0, targetId: 3 },
      { sourceId: 0, targetId: 5 },
      { sourceId: 1, targetId: 5 },
      { sourceId: 2, targetId: 4 },
      { sourceId: 3, targetId: 2 },
      { sourceId: 3, targetId: 4 }
    ]
  };

  expect(graph).toEqual(expected)
});
// TODO: dedup virtual packages