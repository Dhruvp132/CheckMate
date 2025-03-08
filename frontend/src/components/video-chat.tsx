import { useState } from "react"
import { motion } from "framer-motion"
import { Mic, MicOff, Video, VideoOff } from "lucide-react"
import { Button } from "./ui/button"

export default function VideoChat() {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  // This is a demo component, so we'll use placeholder images
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl">
      {/* Main video chat display */}
      <div className="relative h-full w-full">
        {/* Opponent's video (placeholder) */}
        <div className="h-full w-full bg-gray-900">
          <img
            src="/placeholder.svg?height=400&width=600"
            alt="Opponent"
            className="h-full w-full object-cover opacity-80"
          />

          {/* Chess board overlay */}
          <div className="absolute left-1/2 top-1/2 w-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-lg border border-white/20 bg-black/40 p-2 backdrop-blur-sm">
            <img src="/placeholder.svg?height=300&width=300" alt="Chess board" className="aspect-square w-full" />
          </div>
        </div>

        {/* Your video (small overlay) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-4 right-4 h-32 w-32 overflow-hidden rounded-lg border-2 border-primary shadow-lg md:h-40 md:w-40"
        >
          <div className={`h-full w-full ${isVideoOff ? "bg-gray-800" : ""}`}>
            {!isVideoOff && (
              <img src="/placeholder.svg?height=160&width=160" alt="You" className="h-full w-full object-cover" />
            )}
            {isVideoOff && (
              <div className="flex h-full w-full items-center justify-center">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Video controls */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform space-x-2 rounded-full bg-gray-900/80 p-2 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${isMuted ? "bg-red-500/20 text-red-500" : "text-white"}`}
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full ${isVideoOff ? "bg-red-500/20 text-red-500" : "text-white"}`}
            onClick={() => setIsVideoOff(!isVideoOff)}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        </div>

        {/* Connection status */}
        <div className="absolute left-4 top-4 rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
          Connected • 00:42
        </div>
      </div>
    </div>
  )
}

