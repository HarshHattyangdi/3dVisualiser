"use client";
import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import axios from "axios";
import { gsap } from "gsap";

const Graph3D = ({ onNodeClick }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const nodesRef = useRef([]);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  // This useEffect initializes the scene, camera, renderer, and controls once on mount
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

    axios
      .get("http://127.0.0.1:5000/process_graph")
      .then((response) => {
        const { nodes, edges } = response.data;
        const scalingFactor = 100;

        nodesRef.current.forEach((node) => scene.remove(node));
        nodesRef.current = [];

        nodes.forEach((node) => createNode(node, scene, scalingFactor));
        edges.forEach((edge) => createEdge(edge, scene, scalingFactor));

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

        camera.position.set(
        //   centerX,
        //   centerY,
        //   2 * Math.max(centerX, centerY, centerZ)
        100,50,50
        );
        camera.lookAt(
            // centerX, centerY, centerZ
            100,50,50
        );

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
          mountRef.current.removeEventListener("click", handleMouseClick);
          mountRef.current.removeChild(renderer.domElement);
        };
      })
      .catch((error) => {
        console.error("Error fetching graph data:", error);
      });

    // Cleanup when unmounting the component
    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []); // Empty dependency array to run this effect only once on mount

  const animateCameraToPosition = (targetPosition) => {
    gsap.to(cameraRef.current.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration: 2, // Adjust duration as needed
      ease: "power2.out", // Choose an easing function for smooth deceleration
      onUpdate: () => {
        // Update camera rotation to look at the target node during animation
        cameraRef.current.lookAt(targetPosition);
      },
    });
  };

  function calculateNewCameraFocus(clickedNodePosition) {
    // Calculate the distance between the current camera position and the clicked node
    const distanceToNode = cameraRef.current.position.distanceTo(clickedNodePosition);
  
    // Determine the desired zoom factor (adjust as needed)
    const zoomFactor = 2; // A higher factor means a closer zoom
  
    // Calculate the new camera position
    const newPosition = clickedNodePosition.clone().add(cameraRef.current.position.clone().sub(clickedNodePosition).normalize().multiplyScalar(distanceToNode / zoomFactor));
  
    // Calculate the new camera rotation
    const newRotation = cameraRef.current.rotation.clone().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), clickedNodePosition.clone().sub(cameraRef.current.position).normalize()));
  
    return { newPosition, newRotation };
  }

  // Memoize handleMouseClick to avoid re-creating it on each render
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
        onNodeClick(intersectedObject.userData); // Pass node data to parent component

        // Example: You can log the data or update some other UI element with it
        // onNodeClick should not trigger a re-render of this component
        // **New Code:**
        const clickedNodePosition = intersectedObject.position;
        // Calculate the new camera position and rotation
        const { newPosition, newRotation } =
          calculateNewCameraFocus(clickedNodePosition);

        // Animate the camera to the new position and rotation
        animateCameraToPosition(newPosition, newRotation);
      }
    },
    [onNodeClick]
  );

  useEffect(() => {
    // Attach event listeners for clicks once on mount
    if (mountRef.current) {
      mountRef.current.addEventListener("click", handleMouseClick);
    }

    return () => {
      if (mountRef.current) {
        mountRef.current.removeEventListener("click", handleMouseClick);
      }
    };
  }, [handleMouseClick]); // Only re-run if handleMouseClick changes

  const createNode = (node, scene, scalingFactor) => {
    const degree = node.degree_centrality || 1;
    const nodeSize = Math.log(degree + 1) * 0.15;
    const color = node.color || "#ff0000";

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
      opacity: 0.1,
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
