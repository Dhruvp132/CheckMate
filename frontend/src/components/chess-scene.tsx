import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/Addons.js"

export default function ChessScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111111)

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.set(0, 10, 10)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.enableZoom = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.5

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7.5)
    scene.add(directionalLight)

    // Create chessboard
    const boardSize = 8
    const tileSize = 1

    const boardGroup = new THREE.Group()
    scene.add(boardGroup)

    // Create chess board tiles
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        const isWhite = (i + j) % 2 === 0
        const tileGeometry = new THREE.BoxGeometry(tileSize, 0.2, tileSize)
        const tileMaterial = new THREE.MeshStandardMaterial({
          color: isWhite ? 0xe0c4a8 : 0x6e4c41,
          metalness: 0.1,
          roughness: 0.8,
        })

        const tile = new THREE.Mesh(tileGeometry, tileMaterial)
        tile.position.set((i - boardSize / 2 + 0.5) * tileSize, 0, (j - boardSize / 2 + 0.5) * tileSize)

        boardGroup.add(tile)
      }
    }

    // Add some chess pieces (simplified)
    const addPiece = (x: number, z: number, color: number, isPawn: boolean) => {
      const pieceGeometry = isPawn
        ? new THREE.CylinderGeometry(0.2, 0.3, 0.6, 16)
        : new THREE.ConeGeometry(0.3, 0.8, 16)

      const pieceMaterial = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.7,
      })

      const piece = new THREE.Mesh(pieceGeometry, pieceMaterial)
      piece.position.set((x - boardSize / 2 + 0.5) * tileSize, isPawn ? 0.5 : 0.7, (z - boardSize / 2 + 0.5) * tileSize)

      boardGroup.add(piece)
    }

    // Add some pieces for visual effect
    for (let i = 0; i < boardSize; i++) {
      // White pawns
      addPiece(i, 1, 0xffffff, true)
      // Black pawns
      addPiece(i, 6, 0x333333, true)
    }

    // Add some non-pawn pieces
    for (let i = 0; i < boardSize; i++) {
      // White pieces
      addPiece(i, 0, 0xffffff, false)
      // Black pieces
      addPiece(i, 7, 0x333333, false)
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}