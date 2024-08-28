"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { gsap } from "gsap";

const Graph3D = ({ graphData, onNodeClick, simplified }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  const [cameraState, setCameraState] = useState({
    position: new THREE.Vector3(100, 50, 50),
    target: new THREE.Vector3(0, 0, 0),
    zoom: 1,
  });

  useEffect(() => {
    const scene = sceneRef.current;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enablePan = true;

    camera.position.copy(cameraState.position);
    controls.target.copy(cameraState.target);
    camera.zoom = cameraState.zoom;
    camera.updateProjectionMatrix();

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
  
    if (!graphData || !camera) return;
  
    // Clear existing nodes and edges
    nodesRef.current.forEach((node) => scene.remove(node));
    edgesRef.current.forEach((edge) => scene.remove(edge));
  
    nodesRef.current = [];
    edgesRef.current = [];
  
    const { nodes, edges } = graphData;
    const scalingFactor = 100;
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  
    if (simplified) {
      // Process for simplified graph
      const spokeGroups = new Map();
  
      nodes.forEach((node) => {
        if (node.isSpoke) {
          const sourceId = node.sourceId;
          if (!spokeGroups.has(sourceId)) {
            spokeGroups.set(sourceId, []);
          }
          spokeGroups.get(sourceId).push(node);
        }
      });
  
      spokeGroups.forEach((spokeNodes, sourceId) => {
        const node = spokeNodes[0];
        const coneObject = createConeForGroup(node, scalingFactor, node.color, spokeNodes.length, nodeMap);
        nodesRef.current.push(coneObject);
  
        // Remove old edges
        edgesRef.current = edgesRef.current.filter((edge) => {
          const shouldRemove = spokeNodes.some(
            (spokeNode) =>
              edge.userData.sourceId === spokeNode.id ||
              edge.userData.targetId === spokeNode.id
          );
          if (shouldRemove) scene.remove(edge);
          return !shouldRemove;
        });
  
        // Create single edge
        const originNode = nodeMap.get(sourceId);
        if (originNode) {
          const singleEdge = createEdge(
            { source: coneObject.name, target: originNode.id },
            scene,
            scalingFactor,
            nodeMap
          );
          if (singleEdge) edgesRef.current.push(singleEdge);
        }
      });
  
      // Add remaining nodes and edges
      nodes.forEach((node) => {
        if (!node.isSpoke) {
          const nodeObject = createNode(node, scene, scalingFactor, node.size * 0.02);
          nodesRef.current.push(nodeObject);
        }
      });
  
      edges.forEach((edge) => {
        if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
          const edgeObject = createEdge(edge, scene, scalingFactor, nodeMap);
          if (edgeObject) edgesRef.current.push(edgeObject);
        }
      });
    } else {
      // Process for non-simplified graph
      nodes.forEach((node) => {
        const nodeObject = createNode(node, scene, scalingFactor, node.size * 0.02);
        nodesRef.current.push(nodeObject);
      });
  
      edges.forEach((edge) => {
        if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
          const edgeObject = createEdge(edge, scene, scalingFactor, nodeMap);
          if (edgeObject) edgesRef.current.push(edgeObject);
        }
      });
    }
  
    // Update camera
    camera.position.copy(cameraState.position);
    controlsRef.current.target.copy(cameraState.target);
    camera.zoom = cameraState.zoom;
    camera.updateProjectionMatrix();
  }, [graphData, simplified, cameraState]);
  

  const createConeForGroup = (node, scalingFactor, color, spokeCount, nodeMap) => {
    const coneScale = 0.1;
    const radialSegments = spokeCount;

    const geometry = new THREE.ConeGeometry(2 * coneScale, 8 * coneScale, radialSegments);
    const material = new THREE.MeshBasicMaterial({ color: color || '#ff2e89', side: THREE.DoubleSide });
    const cone = new THREE.Mesh(geometry, material);

    cone.position.set(
      node.x * scalingFactor,
      node.y * scalingFactor,
      node.z * scalingFactor
    );

    const originNode = nodeMap.get(node.sourceId);
    if (originNode) {
      const originPosition = new THREE.Vector3(
        originNode.x * scalingFactor,
        originNode.y * scalingFactor,
        originNode.z * scalingFactor
      );
      const direction = originPosition.clone().sub(cone.position).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
      cone.setRotationFromQuaternion(quaternion);
      cone.rotation.x = Math.PI / 2;
    } else {
      console.warn(`Origin node with ID ${node.sourceId} not found.`);
    }

    cone.userData = { ...node };
    cone.name = node.id;

    sceneRef.current.add(cone);

    return cone;
  };

  const createNode = (node, scene, scalingFactor, nodeSize) => {
    const color = node.color || "#ff2e89";
    const geometry = new THREE.SphereGeometry(nodeSize, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color });
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.set(
      node.x * scalingFactor,
      node.y * scalingFactor,
      node.z * scalingFactor
    );

    sphere.userData = { ...node };
    sphere.name = node.id;

    scene.add(sphere);
    return sphere;
  };

  const createEdge = (edge, scene, scalingFactor, nodeMap) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) return null;

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(0xbbbbbb),
      linewidth: 1,
      transparent: true,
      opacity: 0.08,
    });

    const points = [
      new THREE.Vector3(
        sourceNode.x * scalingFactor,
        sourceNode.y * scalingFactor,
        sourceNode.z * scalingFactor
      ),
      new THREE.Vector3(
        targetNode.x * scalingFactor,
        targetNode.y * scalingFactor,
        targetNode.z * scalingFactor
      ),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    line.userData = {
      sourceId: edge.source,
      targetId: edge.target,
    };

    scene.add(line);
    return line;
  };

  const animateCameraToPosition = (targetPosition) => {
    gsap.to(cameraRef.current.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 2,
      ease: "power2.out",
      onUpdate: () => {
        cameraRef.current.lookAt(targetPosition);
      },
    });
  };

  const calculateNewCameraFocus = (clickedNodePosition) => {
    const distanceToNode = cameraRef.current.position.distanceTo(clickedNodePosition);
    const zoomFactor = 2;
    const newPosition = clickedNodePosition.clone().add(
      cameraRef.current.position
        .clone()
        .sub(clickedNodePosition)
        .normalize()
        .multiplyScalar(distanceToNode / zoomFactor)
    );
    return { newPosition };
  };

  const handleMouseClick = useCallback(
    (event) => {
      if (!mountRef.current || !rendererRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const intersects = raycasterRef.current.intersectObjects(nodesRef.current);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        console.log("Node clicked:", intersectedObject.userData);
        onNodeClick(intersectedObject.userData);

        const clickedNodePosition = intersectedObject.position;
        const { newPosition } = calculateNewCameraFocus(clickedNodePosition);

        animateCameraToPosition(newPosition);

        highlightConnectedNetwork(intersectedObject);
      } else {
        resetVisibility();
      }
    },
    [onNodeClick]
  );

  const highlightConnectedNetwork = (selectedNode) => {
    const connectedNodeIds = new Set();
    const connectedEdges = new Set();

    edgesRef.current.forEach((edge) => {
      if (
        edge.userData.sourceId === selectedNode.userData.id ||
        edge.userData.targetId === selectedNode.userData.id
      ) {
        connectedNodeIds.add(edge.userData.sourceId);
        connectedNodeIds.add(edge.userData.targetId);
        connectedEdges.add(edge);
      }
    });

    nodesRef.current.forEach((node) => {
      node.visible = connectedNodeIds.has(node.userData.id);
    });

    edgesRef.current.forEach((edge) => {
      edge.visible = connectedEdges.has(edge);
    });
  };

  const resetVisibility = () => {
    nodesRef.current.forEach((node) => {
      node.visible = true;
    });

    edgesRef.current.forEach((edge) => {
      edge.visible = true;
    });
  };

  useEffect(() => {
    if (mountRef.current) {
      mountRef.current.addEventListener("click", handleMouseClick);
    }

    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener("click", handleMouseClick);
      }
    };
  }, [handleMouseClick]);

  return (
    <div
      ref={mountRef}
      className="w-full h-full flex items-center justify-center"
    >
      {/* Three.js canvas will be rendered here */}
    </div>
  );
};

export default Graph3D;
