import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const DroneVisualization = ({ drones, selectedDrone, onDroneSelect }) => {
  const containerRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const droneMeshesRef = useRef({});
  const animationFrameRef = useRef();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const [hoveredDrone, setHoveredDrone] = useState(null);

  // Handle mouse movement
  const handleMouseMove = (event) => {
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  // Handle click
  const handleClick = () => {
    const raycaster = raycasterRef.current;
    const mouse = mouseRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const intersect of intersects) {
      const droneGroup = findParentDroneGroup(intersect.object);
      if (droneGroup) {
        const droneId = Object.keys(droneMeshesRef.current).find(
          id => droneMeshesRef.current[id] === droneGroup
        );
        if (droneId && onDroneSelect) {
          onDroneSelect(droneId);
        }
        break;
      }
    }
  };

  // Find parent drone group
  const findParentDroneGroup = (object) => {
    while (object && !object.userData.isDrone) {
      object = object.parent;
    }
    return object;
  };

  useEffect(() => {
    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add controls with enhanced settings
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 10;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI / 2;
    controls.enablePan = true;
    controls.panSpeed = 0.5;
    controlsRef.current = controls;

    // Add event listeners
    containerRef.current.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('click', handleClick);

    // Add ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a7d44,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(200, 20, 0x000000, 0x000000);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Animation loop with hover detection
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Check for hovered objects
      const raycaster = raycasterRef.current;
      const mouse = mouseRef.current;
      const camera = cameraRef.current;
      const scene = sceneRef.current;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let newHoveredDrone = null;
      for (const intersect of intersects) {
        const droneGroup = findParentDroneGroup(intersect.object);
        if (droneGroup) {
          const droneId = Object.keys(droneMeshesRef.current).find(
            id => droneMeshesRef.current[id] === droneGroup
          );
          if (droneId) {
            newHoveredDrone = droneId;
            break;
          }
        }
      }
      setHoveredDrone(newHoveredDrone);

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current.removeEventListener('mousemove', handleMouseMove);
      containerRef.current.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameRef.current);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const droneMeshes = droneMeshesRef.current;

    // Remove old drone meshes
    Object.values(droneMeshes).forEach(mesh => {
      scene.remove(mesh);
    });
    droneMeshesRef.current = {};

    // Add new drone meshes
    Object.entries(drones).forEach(([id, drone]) => {
      // Create drone body
      const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 2);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: getDroneColor(drone.status),
        roughness: 0.7,
        metalness: 0.3
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;

      // Create propellers
      const propellerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
      const propellerMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.5
      });

      const propellers = [
        new THREE.Mesh(propellerGeometry, propellerMaterial),
        new THREE.Mesh(propellerGeometry, propellerMaterial),
        new THREE.Mesh(propellerGeometry, propellerMaterial),
        new THREE.Mesh(propellerGeometry, propellerMaterial)
      ];

      // Position propellers
      propellers[0].position.set(1, 0.3, 1);
      propellers[1].position.set(-1, 0.3, 1);
      propellers[2].position.set(1, 0.3, -1);
      propellers[3].position.set(-1, 0.3, -1);

      // Create drone group
      const droneGroup = new THREE.Group();
      droneGroup.userData.isDrone = true;
      droneGroup.add(body);
      propellers.forEach(propeller => {
        propeller.castShadow = true;
        droneGroup.add(propeller);
      });

      // Position drone
      const { lat, lon, altitude } = drone.location;
      const x = (lon - 77.5946) * 1000;
      const z = (lat - 12.9716) * 1000;
      droneGroup.position.set(x, altitude / 10, z);

      // Add battery indicator
      const batteryIndicator = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({
          color: drone.battery_level > 20 ? 0x00ff00 : 0xff0000,
          emissive: drone.battery_level > 20 ? 0x00ff00 : 0xff0000,
          emissiveIntensity: 0.5
        })
      );
      batteryIndicator.position.set(0, 0.6, 0);
      droneGroup.add(batteryIndicator);

      // Add hover effect
      if (hoveredDrone === id || selectedDrone === id) {
        const outlineGeometry = new THREE.BoxGeometry(2.2, 0.7, 2.2);
        const outlineMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          side: THREE.BackSide
        });
        const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        outline.position.y = 0.1;
        droneGroup.add(outline);
      }

      scene.add(droneGroup);
      droneMeshes[id] = droneGroup;

      // Rotate propellers
      const animatePropellers = () => {
        propellers.forEach(propeller => {
          propeller.rotation.x += 0.1;
        });
      };
      const interval = setInterval(animatePropellers, 50);
      droneGroup.userData.interval = interval;
    });

    // Center camera on selected drone
    if (selectedDrone && droneMeshes[selectedDrone]) {
      const droneMesh = droneMeshes[selectedDrone];
      cameraRef.current.position.copy(droneMesh.position);
      cameraRef.current.position.y += 50;
      cameraRef.current.position.z += 50;
      cameraRef.current.lookAt(droneMesh.position);
    }

    // Cleanup intervals
    return () => {
      Object.values(droneMeshes).forEach(mesh => {
        if (mesh.userData.interval) {
          clearInterval(mesh.userData.interval);
        }
      });
    };
  }, [drones, selectedDrone, hoveredDrone]);

  const getDroneColor = (status) => {
    switch (status) {
      case 'en_route':
        return 0x1e90ff;
      case 'charging':
        return 0xffa500;
      case 'maintenance':
        return 0xff0000;
      default:
        return 0x808080;
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    />
  );
};

export default DroneVisualization; 