"use client";
import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { gsap } from "gsap";

const Graph3D = ({ graphData,onNodeClick }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const nodesRef = useRef([]);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current;
  
    // Initialize the camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
  
    // Initialize the renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);
  
    // Initialize the controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enablePan = true;
  
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  
    // Handle window resizing
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
  }, []);// Depend on graphData to update the scene

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
  
    // Early return if graphData is not available
    if (!graphData || !camera) return;
  
    const { nodes, edges } = graphData; // Safe to destructure here
    const scalingFactor = 100;
  
    // Clear existing nodes
    nodesRef.current.forEach((node) => scene.remove(node));
    nodesRef.current = [];
  
    // Calculate maxDegree to be used in size scaling
    const maxDegree = Math.max(...nodes.map((node) => node.degree_centrality));
  
    // Define min and max sizes to match backend settings
    const minSize = 5;
    const maxSize = 20;
  
    const getNodeSize = (degree, maxDegree) => {
      return minSize + (degree / maxDegree) * (maxSize - minSize);
    };
  
    nodes.forEach((node) => {
      const nodeSize = getNodeSize(node.degree_centrality, maxDegree);
      createNode(node, scene, scalingFactor, nodeSize * 0.02);
    });
  
    edges.forEach((edge) => createEdge(edge, scene, scalingFactor));
  
    // Center the camera based on nodes' position
    const centerX =
      (Math.max(...nodes.map((node) => node.x)) +
        Math.min(...nodes.map((node) => node.x))) /
      2;
    const centerY =
      (Math.max(...nodes.map((node) => node.y)) +
        Math.min(...nodes.map((node) => node.y))) /
      2;
    const centerZ =
      (Math.max(...nodes.map((node) => node.z)) +
        Math.min(...nodes.map((node) => node.z))) /
      2;
  
    camera.position.set(100, 50, 50);
    camera.lookAt(new THREE.Vector3(centerX, centerY, centerZ));
  
  }, [graphData]); // Depend on graphData to update the scene
   // Depend on graphData to update the scene

  const animateCameraToPosition = (targetPosition) => {
    gsap.to(cameraRef.current.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 2, // Adjust duration as needed
      ease: "power2.out", // Choose an easing function for smooth deceleration
      onUpdate: () => {
        cameraRef.current.lookAt(targetPosition);
      },
    });
  };

  function calculateNewCameraFocus(clickedNodePosition) {
    const distanceToNode = cameraRef.current.position.distanceTo(clickedNodePosition);
    const zoomFactor = 2;
    const newPosition = clickedNodePosition.clone().add(cameraRef.current.position.clone().sub(clickedNodePosition).normalize().multiplyScalar(distanceToNode / zoomFactor));
    const newRotation = cameraRef.current.rotation.clone().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), clickedNodePosition.clone().sub(cameraRef.current.position).normalize()));
    return { newPosition, newRotation };
  }

  const handleMouseClick = useCallback(
    (event) => {
      if (!mountRef.current || !rendererRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const intersects = raycasterRef.current.intersectObjects(
        nodesRef.current
      );

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        console.log("Node clicked:", intersectedObject.userData);
        onNodeClick(intersectedObject.userData);

        const clickedNodePosition = intersectedObject.position;
        const { newPosition, newRotation } = calculateNewCameraFocus(clickedNodePosition);

        animateCameraToPosition(newPosition, newRotation);
      }
    },
    [onNodeClick]
  );

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
    nodesRef.current.push(sphere);
  };

  const createEdge = (edge, scene, scalingFactor) => {
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(0xbbbbbb),
      linewidth: 1,
      transparent: true,
      opacity: 0.08,
    });

    const points = [
      new THREE.Vector3(
        ...edge.source_pos.map((coord) => coord * scalingFactor)
      ),
      new THREE.Vector3(
        ...edge.target_pos.map((coord) => coord * scalingFactor)
      ),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);

    scene.add(line);
  };

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
