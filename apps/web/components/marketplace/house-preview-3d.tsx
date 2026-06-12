"use client";

import { Home, Ruler, Rotate3D } from "lucide-react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { area, toNumber, type NumericValue } from "@/lib/format";
import type { Project, Terrain } from "@/types/domain";

type ProjectPreviewVariant = "stone" | "patio" | "compact";

type ProjectVisualProfile = {
  variant: ProjectPreviewVariant;
  footprint: "wide" | "linear";
  roof: "flat" | "pitched";
  wallColor: number;
  roofColor: number;
  accentColor: number;
  trimColor: number;
  glassColor: number;
  pavingColor: number;
  landscapeColor: number;
  showPatio: boolean;
  showPergola: boolean;
  showPool: boolean;
  showStone: boolean;
};

type BlockOptions = {
  roughness?: number;
  metalness?: number;
  opacity?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
};

function numeric(value: NumericValue) {
  return toNumber(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function projectText(project: Project) {
  return `${project.title} ${project.style ?? ""} ${project.description}`.toLowerCase();
}

function getVisualProfile(project: Project, terrain: Terrain): ProjectVisualProfile {
  const text = projectText(project);
  const projectFrontage = numeric(project.minFrontageM);
  const terrainArea = numeric(terrain.areaM2);
  const isLinear = text.includes("linear") || text.includes("patio") || text.includes("modular") || (projectFrontage > 0 && projectFrontage <= 6);
  const hasStoneFacade = text.includes("aurora") || text.includes("pedra") || text.includes("natural");
  const isContemporary = text.includes("contempor") || text.includes("minimalista");

  if (isLinear) {
    return {
      variant: "patio",
      footprint: "linear",
      roof: "flat",
      wallColor: 0xf1eee7,
      roofColor: 0x202926,
      accentColor: 0xb78c5e,
      trimColor: 0x2d332f,
      glassColor: 0xb9e2eb,
      pavingColor: 0xd6d0c3,
      landscapeColor: 0x6f9b6d,
      showPatio: true,
      showPergola: true,
      showPool: false,
      showStone: false
    };
  }

  if (hasStoneFacade || isContemporary) {
    return {
      variant: "stone",
      footprint: "wide",
      roof: "flat",
      wallColor: 0xf3eadf,
      roofColor: 0x1d2925,
      accentColor: 0x8f887a,
      trimColor: 0x46584d,
      glassColor: 0xbfe5f0,
      pavingColor: 0xd8d1c3,
      landscapeColor: 0x75a36e,
      showPatio: false,
      showPergola: true,
      showPool: terrainArea >= 430,
      showStone: true
    };
  }

  return {
    variant: "compact",
    footprint: "wide",
    roof: "pitched",
    wallColor: 0xf0e7da,
    roofColor: 0x25312e,
    accentColor: 0x68755d,
    trimColor: 0x29362f,
    glassColor: 0xbfe5f0,
    pavingColor: 0xd8d2c5,
    landscapeColor: 0x83aa72,
    showPatio: false,
    showPergola: false,
    showPool: terrainArea >= 560,
    showStone: false
  };
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;

    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}

function makeRoof(width: number, depth: number, height: number) {
  const overhang = 0.22;
  const halfWidth = width / 2 + overhang;
  const halfDepth = depth / 2 + overhang;
  const vertices = new Float32Array([
    -halfWidth,
    0,
    -halfDepth,
    halfWidth,
    0,
    -halfDepth,
    0,
    height,
    -halfDepth,
    -halfWidth,
    0,
    halfDepth,
    halfWidth,
    0,
    halfDepth,
    0,
    height,
    halfDepth
  ]);
  const indices = [0, 2, 1, 3, 4, 5, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4, 0, 1, 4, 0, 4, 3];
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function addBlock(
  parent: THREE.Object3D,
  width: number,
  height: number,
  depth: number,
  color: number,
  position: { x?: number; y?: number; z?: number } = {},
  options: BlockOptions = {}
) {
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness ?? 0,
    opacity: options.opacity ?? 1,
    roughness: options.roughness ?? 0.62,
    transparent: options.opacity !== undefined && options.opacity < 1
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);

  mesh.position.set(position.x ?? 0, position.y ?? 0, position.z ?? 0);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);

  return mesh;
}

function addOutlineRect(parent: THREE.Object3D, width: number, depth: number, x: number, z: number, color: number, opacity = 0.76) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-halfWidth, 0, -halfDepth),
    new THREE.Vector3(halfWidth, 0, -halfDepth),
    new THREE.Vector3(halfWidth, 0, halfDepth),
    new THREE.Vector3(-halfWidth, 0, halfDepth),
    new THREE.Vector3(-halfWidth, 0, -halfDepth)
  ]);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, opacity, transparent: opacity < 1 })
  );

  line.position.set(x, 0.06, z);
  parent.add(line);
}

function addWindow(group: THREE.Object3D, x: number, y: number, z: number, width: number, height: number, profile: ProjectVisualProfile) {
  addBlock(group, width + 0.08, height + 0.08, 0.05, profile.trimColor, { x, y, z }, { castShadow: false, receiveShadow: false, roughness: 0.5 });
  addBlock(
    group,
    width,
    height,
    0.06,
    profile.glassColor,
    { x, y, z: z + 0.02 },
    { castShadow: false, receiveShadow: false, metalness: 0.16, roughness: 0.18 }
  );
}

function addSideWindow(
  group: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  depth: number,
  height: number,
  profile: ProjectVisualProfile,
  side: "left" | "right"
) {
  const offset = side === "right" ? 0.02 : -0.02;

  addBlock(group, 0.05, height + 0.08, depth + 0.08, profile.trimColor, { x, y, z }, { castShadow: false, receiveShadow: false, roughness: 0.5 });
  addBlock(
    group,
    0.06,
    height,
    depth,
    profile.glassColor,
    { x: x + offset, y, z },
    { castShadow: false, receiveShadow: false, metalness: 0.16, roughness: 0.18 }
  );
}

function addStonePanel(group: THREE.Object3D, x: number, y: number, z: number, width: number, height: number, profile: ProjectVisualProfile) {
  const colors = [0x756f66, 0x9c9487, 0xb8ad9d, 0x676d61];
  const columns = 4;
  const rows = 5;
  const tileWidth = width / columns - 0.035;
  const tileHeight = height / rows - 0.035;

  addBlock(group, width, height, 0.07, profile.accentColor, { x, y, z }, { roughness: 0.92 });

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      addBlock(
        group,
        tileWidth,
        tileHeight,
        0.045,
        colors[(row + column) % colors.length],
        {
          x: x - width / 2 + tileWidth / 2 + column * (width / columns),
          y: y - height / 2 + tileHeight / 2 + row * (height / rows),
          z: z + 0.04
        },
        { castShadow: false, receiveShadow: true, roughness: 0.95 }
      );
    }
  }
}

function addPergola(parent: THREE.Object3D, x: number, z: number, width: number, depth: number, height: number, color: number) {
  const postHeight = height;
  const postSize = 0.06;
  const beamY = postHeight + 0.12;
  const postPositions = [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [-width / 2, depth / 2],
    [width / 2, depth / 2]
  ];

  postPositions.forEach(([postX, postZ]) => {
    addBlock(parent, postSize, postHeight, postSize, color, { x: x + postX, y: postHeight / 2 + 0.16, z: z + postZ }, { roughness: 0.78 });
  });

  addBlock(parent, width + 0.14, 0.05, 0.08, color, { x, y: beamY, z: z - depth / 2 }, { roughness: 0.76 });
  addBlock(parent, width + 0.14, 0.05, 0.08, color, { x, y: beamY, z: z + depth / 2 }, { roughness: 0.76 });

  for (let index = 0; index < 6; index += 1) {
    const slatX = x - width / 2 + (index * width) / 5;
    addBlock(parent, 0.045, 0.045, depth + 0.2, color, { x: slatX, y: beamY + 0.04, z }, { roughness: 0.76 });
  }
}

function addTree(parent: THREE.Object3D, x: number, z: number, scale = 1, yBase = 0) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06 * scale, 0.08 * scale, 0.45 * scale, 10),
    new THREE.MeshStandardMaterial({ color: 0x7a5438, roughness: 0.7 })
  );
  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(0.34 * scale, 18, 14),
    new THREE.MeshStandardMaterial({ color: 0x2f7d57, roughness: 0.72 })
  );

  trunk.position.set(x, yBase + 0.23 * scale, z);
  crown.position.set(x, yBase + 0.65 * scale, z);
  trunk.castShadow = true;
  crown.castShadow = true;
  parent.add(trunk, crown);
}

function addShrub(parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) {
  const shrub = new THREE.Mesh(
    new THREE.SphereGeometry(0.13 * scale, 16, 10),
    new THREE.MeshStandardMaterial({ color: 0x477a4f, roughness: 0.76 })
  );

  shrub.scale.set(1.4, 0.7, 1);
  shrub.position.set(x, y, z);
  shrub.castShadow = true;
  parent.add(shrub);
}

function addFlatVolume(
  parent: THREE.Object3D,
  width: number,
  depth: number,
  height: number,
  x: number,
  z: number,
  profile: ProjectVisualProfile
) {
  addBlock(parent, width, height, depth, profile.wallColor, { x, y: height / 2 + 0.16, z }, { roughness: 0.58 });
  addBlock(parent, width + 0.24, 0.16, depth + 0.24, profile.roofColor, { x, y: height + 0.29, z }, { roughness: 0.56 });
}

function buildLinearPatioHouse(house: THREE.Group, houseWidth: number, houseDepth: number, houseHeight: number, profile: ProjectVisualProfile) {
  const frontDepth = houseDepth * 0.36;
  const rearDepth = houseDepth * 0.34;
  const connectorWidth = houseWidth * 0.26;
  const connectorDepth = houseDepth * 0.32;
  const frontZ = houseDepth / 2 - frontDepth / 2;
  const rearZ = -houseDepth / 2 + rearDepth / 2;

  addFlatVolume(house, houseWidth, frontDepth, houseHeight, 0, frontZ, profile);
  addFlatVolume(house, houseWidth, rearDepth, houseHeight, 0, rearZ, profile);
  addFlatVolume(house, connectorWidth, connectorDepth, houseHeight * 0.94, -houseWidth / 2 + connectorWidth / 2, -0.04, profile);

  addBlock(house, houseWidth + 0.34, 0.12, houseDepth + 0.34, profile.pavingColor, { y: 0.06 }, { receiveShadow: true, castShadow: false, roughness: 0.72 });
  addBlock(house, houseWidth * 0.52, 0.045, houseDepth * 0.22, profile.landscapeColor, { x: houseWidth * 0.11, y: 0.19, z: -0.04 }, { receiveShadow: true, castShadow: false, roughness: 0.78 });

  addWindow(house, -houseWidth * 0.16, houseHeight * 0.55 + 0.16, houseDepth / 2 + 0.05, houseWidth * 0.32, houseHeight * 0.3, profile);
  addWindow(house, houseWidth * 0.3, houseHeight * 0.55 + 0.16, houseDepth / 2 + 0.05, houseWidth * 0.2, houseHeight * 0.3, profile);
  addSideWindow(house, houseWidth / 2 + 0.05, houseHeight * 0.58 + 0.16, -0.04, houseDepth * 0.2, houseHeight * 0.28, profile, "right");

  addBlock(house, houseWidth * 0.14, houseHeight * 0.48, 0.07, 0x8a6547, { x: -houseWidth * 0.36, y: houseHeight * 0.24 + 0.16, z: houseDepth / 2 + 0.065 }, { roughness: 0.66 });

  for (let index = 0; index < 8; index += 1) {
    addBlock(
      house,
      0.035,
      houseHeight * 0.74,
      0.06,
      profile.accentColor,
      {
        x: houseWidth * 0.17 + index * houseWidth * 0.032,
        y: houseHeight * 0.42 + 0.16,
        z: houseDepth / 2 + 0.085
      },
      { roughness: 0.78 }
    );
  }

  addPergola(house, houseWidth * 0.08, houseDepth * 0.03, houseWidth * 0.46, houseDepth * 0.2, houseHeight * 0.72, profile.accentColor);
  addShrub(house, houseWidth * 0.05, 0.36, -0.05, 0.9);
  addShrub(house, houseWidth * 0.24, 0.34, -0.1, 0.7);
}

function buildStoneHouse(house: THREE.Group, houseWidth: number, houseDepth: number, houseHeight: number, profile: ProjectVisualProfile) {
  addBlock(house, houseWidth + 0.38, 0.14, houseDepth + 0.38, profile.pavingColor, { y: 0.07 }, { receiveShadow: true, castShadow: false, roughness: 0.72 });
  addBlock(house, houseWidth, houseHeight, houseDepth, profile.wallColor, { y: houseHeight / 2 + 0.16 }, { roughness: 0.58 });
  addBlock(house, houseWidth + 0.36, 0.18, houseDepth + 0.34, profile.roofColor, { y: houseHeight + 0.31 }, { roughness: 0.56 });
  addBlock(house, houseWidth * 0.48, 0.12, houseDepth * 0.54, profile.roofColor, { x: houseWidth * 0.22, y: houseHeight + 0.5, z: houseDepth * 0.15 }, { roughness: 0.5 });

  if (profile.showStone) {
    addStonePanel(house, -houseWidth * 0.3, houseHeight * 0.5 + 0.16, houseDepth / 2 + 0.055, houseWidth * 0.24, houseHeight * 0.88, profile);
  }

  addWindow(house, houseWidth * 0.14, houseHeight * 0.58 + 0.16, houseDepth / 2 + 0.055, houseWidth * 0.34, houseHeight * 0.34, profile);
  addWindow(house, houseWidth * 0.42, houseHeight * 0.58 + 0.16, houseDepth / 2 + 0.055, houseWidth * 0.12, houseHeight * 0.34, profile);
  addSideWindow(house, houseWidth / 2 + 0.05, houseHeight * 0.55 + 0.16, -houseDepth * 0.12, houseDepth * 0.42, houseHeight * 0.28, profile, "right");

  addBlock(house, houseWidth * 0.12, houseHeight * 0.5, 0.07, 0x7a5940, { x: -houseWidth * 0.1, y: houseHeight * 0.25 + 0.16, z: houseDepth / 2 + 0.07 }, { roughness: 0.62 });

  if (profile.showPergola) {
    addPergola(house, -houseWidth * 0.33, houseDepth / 2 + 0.76, houseWidth * 0.32, 1.22, houseHeight * 0.66, 0x8d6f50);
  }
}

function buildCompactHouse(house: THREE.Group, houseWidth: number, houseDepth: number, houseHeight: number, profile: ProjectVisualProfile) {
  addBlock(house, houseWidth + 0.32, 0.14, houseDepth + 0.32, profile.pavingColor, { y: 0.07 }, { receiveShadow: true, castShadow: false, roughness: 0.72 });
  addBlock(house, houseWidth, houseHeight, houseDepth, profile.wallColor, { y: houseHeight / 2 + 0.16 }, { roughness: 0.58 });
  addBlock(house, houseWidth * 0.22, houseHeight * 0.92, 0.08, profile.accentColor, { x: -houseWidth * 0.32, y: houseHeight / 2 + 0.18, z: houseDepth / 2 + 0.045 }, { roughness: 0.64 });

  if (profile.roof === "flat") {
    addBlock(house, houseWidth + 0.34, 0.16, houseDepth + 0.34, profile.roofColor, { y: houseHeight + 0.29 }, { roughness: 0.56 });
  } else {
    const roof = new THREE.Mesh(
      makeRoof(houseWidth + 0.15, houseDepth + 0.1, 0.72),
      new THREE.MeshStandardMaterial({ color: profile.roofColor, roughness: 0.56 })
    );

    roof.position.y = houseHeight + 0.18;
    roof.castShadow = true;
    house.add(roof);
  }

  addWindow(house, houseWidth * 0.18, houseHeight * 0.58 + 0.16, houseDepth / 2 + 0.05, houseWidth * 0.22, houseHeight * 0.28, profile);
  addWindow(house, houseWidth * 0.41, houseHeight * 0.58 + 0.16, houseDepth / 2 + 0.05, houseWidth * 0.12, houseHeight * 0.28, profile);
  addBlock(house, houseWidth * 0.12, houseHeight * 0.5, 0.07, 0x7a5940, { x: -houseWidth * 0.15, y: houseHeight * 0.25 + 0.16, z: houseDepth / 2 + 0.06 }, { roughness: 0.62 });
}

function buildScene(scene: THREE.Scene, project: Project, terrain: Terrain) {
  const profile = getVisualProfile(project, terrain);
  const terrainFrontage = numeric(terrain.frontageM) || 10;
  const terrainDepth = numeric(terrain.depthM) || 24;
  const projectFrontage = numeric(project.minFrontageM) || terrainFrontage * 0.56;
  const projectDepth = numeric(project.minDepthM) || terrainDepth * 0.5;

  const lotWidth = 8;
  const lotDepth = clamp((terrainDepth / Math.max(terrainFrontage, 1)) * lotWidth, 9, 13.5);
  const houseWidth = profile.footprint === "linear"
    ? clamp((projectFrontage / terrainFrontage) * lotWidth * 0.95, 2.7, lotWidth * 0.55)
    : clamp((projectFrontage / terrainFrontage) * lotWidth * 0.88, 3.2, lotWidth * 0.82);
  const houseDepth = profile.footprint === "linear"
    ? clamp((projectDepth / terrainDepth) * lotDepth * 0.95, 5.2, lotDepth * 0.82)
    : clamp((projectDepth / terrainDepth) * lotDepth * 0.82, 3.1, lotDepth * 0.72);
  const houseHeight = clamp(numeric(project.areaM2) / 190, 0.86, 1.35);
  const root = new THREE.Group();

  scene.add(root);

  const lot = addBlock(root, lotWidth, 0.16, lotDepth, 0x93b982, { y: -0.08 }, { castShadow: false, receiveShadow: true, roughness: 0.82 });
  lot.receiveShadow = true;

  const terrainText = `${terrain.title} ${terrain.description}`.toLowerCase();
  if (terrainText.includes("declive") || terrainText.includes("serra")) {
    addBlock(root, lotWidth * 0.95, 0.26, 0.13, 0x8f897d, { y: 0.13, z: -lotDepth / 2 + 1.15 }, { roughness: 0.85 });
    addBlock(root, lotWidth * 0.88, 0.07, 1.1, 0xc8c1b2, { y: 0.04, z: -lotDepth / 2 + 1.72 }, { roughness: 0.8 });
  }

  addOutlineRect(root, lotWidth, lotDepth, 0, 0, 0xf5fff4, 0.82);
  addOutlineRect(root, houseWidth + 0.7, houseDepth + 0.7, -0.2, -0.35, 0xffffff, 0.58);

  const drivewayWidth = profile.footprint === "linear" ? houseWidth * 0.42 : houseWidth * 0.34;
  const driveway = addBlock(
    root,
    drivewayWidth,
    0.05,
    lotDepth / 2 - houseDepth / 2 + 0.4,
    profile.pavingColor,
    { x: -houseWidth * 0.24, y: 0.02, z: lotDepth / 4 + houseDepth / 4 - 0.16 },
    { castShadow: false, receiveShadow: true, roughness: 0.86 }
  );
  driveway.receiveShadow = true;

  if (profile.showPool) {
    const poolWidth = clamp(lotWidth - houseWidth - 1.1, 1.2, 2.2);
    addBlock(root, poolWidth + 0.22, 0.065, 1.47, 0xd8d1c3, { x: lotWidth / 2 - poolWidth / 2 - 0.55, y: 0.035, z: -houseDepth * 0.25 }, { castShadow: false, receiveShadow: true, roughness: 0.86 });
    addBlock(root, poolWidth, 0.07, 1.25, 0x5fc4d8, { x: lotWidth / 2 - poolWidth / 2 - 0.55, y: 0.08, z: -houseDepth * 0.25 }, { castShadow: false, receiveShadow: true, metalness: 0.1, roughness: 0.22 });
  }

  const house = new THREE.Group();
  house.position.set(-0.2, 0, -0.35);
  root.add(house);

  if (profile.variant === "patio") {
    buildLinearPatioHouse(house, houseWidth, houseDepth, houseHeight, profile);
  } else if (profile.variant === "stone") {
    buildStoneHouse(house, houseWidth, houseDepth, houseHeight, profile);
  } else {
    buildCompactHouse(house, houseWidth, houseDepth, houseHeight, profile);
  }

  addTree(root, -lotWidth / 2 + 0.72, -lotDepth / 2 + 0.95, 0.9);
  addTree(root, lotWidth / 2 - 0.85, lotDepth / 2 - 0.9, 0.72);
  addShrub(root, lotWidth / 2 - 1.6, 0.18, -lotDepth / 2 + 1.25, 1.1);
  addShrub(root, -lotWidth / 2 + 1.35, 0.18, lotDepth / 2 - 1.35, 0.95);

  return root;
}

export function HousePreview3D({ project, terrain }: { project: Project; terrain: Terrain }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rooms = `${project.bedrooms} quartos, ${project.bathrooms} banheiros`;
  const terrainFrontage = numeric(terrain.frontageM) || 5;
  const terrainDepth = numeric(terrain.depthM) || 20;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x86a97f, 2.2);
    const sun = new THREE.DirectionalLight(0xffffff, 3.1);
    sun.position.set(5, 8, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    scene.add(ambient, sun);

    const root = buildScene(scene, project, terrain);

    camera.position.set(7.6, 6.4, 10.5);
    camera.lookAt(0, 0.55, 0);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frameId = 0;
    const startedAt = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startedAt;
      root.rotation.y = Math.sin(elapsed * 0.00045) * 0.12;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [project, terrain]);

  return (
    <div className="overflow-hidden rounded-[8px] border border-[var(--line)] bg-[#eff5ff] dark:bg-[#071b35]">
      <div className="relative min-h-[260px] sm:min-h-[340px] lg:min-h-[420px]">
        <div className="absolute inset-0" ref={containerRef} />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3 sm:gap-3 sm:p-4">
          <div className="max-w-[min(100%,22rem)] rounded-[8px] bg-white/90 px-3 py-2 shadow-xl backdrop-blur dark:bg-black/62 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--muted)]">
              <Rotate3D size={15} />
              Maquete do projeto
            </div>
            <h3 className="mt-1 text-lg font-semibold sm:text-2xl">{project.title}</h3>
            <p className="mt-1 line-clamp-2 max-w-md text-xs leading-5 text-[var(--muted)] sm:text-sm sm:leading-6">
              Visualização do projeto no terreno escolhido.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 border-t border-[var(--line)] bg-[var(--panel)] p-3 text-xs sm:gap-3 sm:p-4 sm:text-sm md:grid-cols-3">
        <div className="flex items-center justify-between gap-4 rounded-[8px] border border-[var(--line)] px-3 py-2">
          <span className="inline-flex items-center gap-2 text-[var(--muted)]">
            <Ruler size={16} />
            Terreno
          </span>
          <strong>
            {terrainFrontage}m x {terrainDepth}m
          </strong>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-[8px] border border-[var(--line)] px-3 py-2">
          <span className="inline-flex items-center gap-2 text-[var(--muted)]">
            <Home size={16} />
            Ambientes
          </span>
          <strong className="text-right">{rooms}</strong>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-[8px] border border-[var(--line)] px-3 py-2">
          <span className="text-[var(--muted)]">Area construida</span>
          <strong>{area(project.areaM2)}</strong>
        </div>
      </div>
    </div>
  );
}
