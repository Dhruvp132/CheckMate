import { useEffect, useRef } from "react";
import * as THREE from "three";

export const ThreeJSBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    
    containerRef.current.appendChild(renderer.domElement);
    
    // Create chess piece particles
    const particleCount = 100;
    const particles = new THREE.Group();
    
    // Geometry for particles
    const pawnGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
    const knightGeometry = new THREE.TorusKnotGeometry(0.1, 0.05, 64, 8);
    const rookGeometry = new THREE.BoxGeometry(0.15, 0.25, 0.15);
    
    // Materials with chess piece colors
    const whiteMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.6
    });
    
    const blackMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x222222,
      transparent: true,
      opacity: 0.6
    });
    
    // Create particles with random positions and rotations
    for (let i = 0; i < particleCount; i++) {
      // Randomly select geometry and material
      const geometryChoice = Math.floor(Math.random() * 3);
      const materialChoice = Math.random() > 0.5 ? whiteMaterial : blackMaterial;
      
      let geometry;
      switch (geometryChoice) {
        case 0:
          geometry = pawnGeometry;
          break;
        case 1:
          geometry = knightGeometry;
          break;
        default:
          geometry = rookGeometry;
      }
      
      const particle = new THREE.Mesh(geometry, materialChoice);
      
      // Random position
      particle.position.x = (Math.random() - 0.5) * 20;
      particle.position.y = (Math.random() - 0.5) * 20;
      particle.position.z = (Math.random() - 0.5) * 10 - 5;
      
      // Random rotation
      particle.rotation.x = Math.random() * Math.PI;
      particle.rotation.y = Math.random() * Math.PI;
      
      // Add velocity for animation
      particle.userData = {
        velocity: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.005
        },
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.005,
          y: (Math.random() - 0.5) * 0.005
        }
      };
      
      particles.add(particle);
    }
    
    scene.add(particles);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate and move particles
      particles.children.forEach((particle: THREE.Mesh) => {
        // Update position
        particle.position.x += particle.userData.velocity.x;
        particle.position.y += particle.userData.velocity.y;
        particle.position.z += particle.userData.velocity.z;
        
        // Update rotation
        particle.rotation.x += particle.userData.rotationSpeed.x;
        particle.rotation.y += particle.userData.rotationSpeed.y;
        
        // Wrap around if out of bounds
        if (Math.abs(particle.position.x) > 10) {
          particle.position.x = -Math.sign(particle.position.x) * 10;
        }
        if (Math.abs(particle.position.y) > 10) {
          particle.position.y = -Math.sign(particle.position.y) * 10;
        }
      });
      
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
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose geometries and materials
      pawnGeometry.dispose();
      knightGeometry.dispose();
      rookGeometry.dispose();
      whiteMaterial.dispose();
      blackMaterial.dispose();
    };
  }, []);
  
  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-0"
      style={{ 
        background: 'linear-gradient(to bottom, #0f172a, #1e293b)'
      }}
    />
  );
};
