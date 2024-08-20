'use client';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';

// Function to create a node in Three.js
const createNode = (node, scene, scalingFactor) => {
  const degree = node.degree_centrality || 1;
  const nodeSize = Math.log(degree + 1) * 0.15;
  const color = node.color || '#ff0000';

  const geometry = new THREE.SphereGeometry(nodeSize, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color });
  const sphere = new THREE.Mesh(geometry, material);

  sphere.position.set(
    node.x * scalingFactor,
    node.y * scalingFactor,
    node.z * scalingFactor
  );

  scene.add(sphere);
};

// Function to create an edge in Three.js
const createEdge = (edge, scene, scalingFactor) => {
    const material = new THREE.LineBasicMaterial({ 
        color: new THREE.Color(0xbbbbbb),  // Light gray color
        linewidth: 1,
        transparent: true,
        opacity: 0.1  // 30% opacity
      });

  const points = [
    new THREE.Vector3(...edge.source_pos.map(coord => coord * scalingFactor)),
    new THREE.Vector3(...edge.target_pos.map(coord => coord * scalingFactor))
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);

  scene.add(line);
};

const Graph3D = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enablePan = true;

    axios.get('http://127.0.0.1:5000/process_graph')
      .then(response => {
        const { nodes, edges } = response.data;
        const scalingFactor = 100;

        // Create nodes and edges using helper functions
        nodes.forEach(node => createNode(node, scene, scalingFactor));
        edges.forEach(edge => createEdge(edge, scene, scalingFactor));

        camera.position.set(100, 100, 100);
        camera.lookAt(scene.position);

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
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
          mountRef.current.removeChild(renderer.domElement);
        };
      })
      .catch(error => {
        console.error('Error fetching graph data:', error);
      });

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default Graph3D;
