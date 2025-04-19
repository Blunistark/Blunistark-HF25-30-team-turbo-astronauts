import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ThreeDView = ({ drones, selectedDrone }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const droneMeshesRef = useRef({});

  useEffect(() => {
    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Add ground
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x90EE90,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current.removeChild(renderer.domElement);
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

    // Create new drone meshes
    Object.entries(drones).forEach(([id, drone]) => {
      const color = drone.status === 'en_route' ? 0x0000FF : 
                   drone.status === 'charging' ? 0xFFA500 : 0x808080;

      // Create drone body
      const bodyGeometry = new THREE.BoxGeometry(2, 0.5, 2);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.castShadow = true;

      // Create drone propellers
      const propellerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 32);
      const propellerMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
      const propellers = [
        new THREE.Mesh(propellerGeometry, propellerMaterial),
        new THREE.Mesh(propellerGeometry, propellerMaterial),
        new THREE.Mesh(propellerGeometry, propellerMaterial),
        new THREE.Mesh(propellerGeometry, propellerMaterial)
      ];

      // Position propellers
      propellers[0].position.set(-1, 0.3, -1);
      propellers[1].position.set(1, 0.3, -1);
      propellers[2].position.set(-1, 0.3, 1);
      propellers[3].position.set(1, 0.3, 1);

      // Create drone group
      const droneGroup = new THREE.Group();
      droneGroup.add(body);
      propellers.forEach(propeller => droneGroup.add(propeller));

      // Position drone
      droneGroup.position.set(
        drone.location.lon - 77.5946, // Offset from Bangalore center
        drone.location.altitude,
        drone.location.lat - 12.9716  // Offset from Bangalore center
      );

      // Add battery level indicator
      const batteryGeometry = new THREE.BoxGeometry(1, 0.2, 0.2);
      const batteryMaterial = new THREE.MeshStandardMaterial({ 
        color: drone.battery_level > 20 ? 0x00FF00 : 0xFF0000 
      });
      const battery = new THREE.Mesh(batteryGeometry, batteryMaterial);
      battery.position.set(0, 0.6, 0);
      droneGroup.add(battery);

      scene.add(droneGroup);
      droneMeshes[id] = droneGroup;
    });

    // Center on selected drone
    if (selectedDrone && drones[selectedDrone]) {
      const drone = drones[selectedDrone];
      const targetPosition = new THREE.Vector3(
        drone.location.lon - 77.5946,
        drone.location.altitude,
        drone.location.lat - 12.9716
      );
      cameraRef.current.position.copy(targetPosition).add(new THREE.Vector3(0, 50, 100));
      cameraRef.current.lookAt(targetPosition);
    }
  }, [drones, selectedDrone]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default ThreeDView; 