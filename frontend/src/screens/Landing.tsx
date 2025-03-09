import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Globe, Users, Video } from "lucide-react"
import { Button } from "../components/ui/button"
import VideoChat from "../components/video-chat"
import ChessScene from "../components/chess-scene"
import { useNavigate } from "react-router-dom"

export default function Landing() {
  const [isLoaded, setIsLoaded] = useState(false)
  const navigate = useNavigate(); 
  
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* 3D Chess Scene Background */}
        <div className="absolute inset-0 z-0 opacity-40">
          <ChessScene />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
              Play Chess & Connect <span className="text-primary">Globally</span>
            </h1>
            <p className="mb-8 text-xl text-gray-300">
              Challenge random players from around the world while video chatting in real-time
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={() => navigate("/game")} size="lg" className="rounded-full bg-primary px-8 py-6 text-lg font-semibold">
                Play Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why Chess Connect?</h2>
            <div className="mx-auto h-1 w-20 bg-primary"></div>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Globe className="h-10 w-10 text-primary" />,
                title: "Global Community",
                description: "Connect with chess enthusiasts from every corner of the world",
              },
              {
                icon: <Video className="h-10 w-10 text-primary" />,
                title: "Live Video Chat",
                description: "See your opponent's reactions in real-time as you make your moves",
              },
              {
                icon: <Users className="h-10 w-10 text-primary" />,
                title: "Random Matching",
                description: "Meet new people and test your skills against unpredictable opponents",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.2 }}
                className="rounded-xl bg-gray-800/50 p-6 text-center backdrop-blur-sm"
              >
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -30 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">Experience Chess Like Never Before</h2>
              <p className="mb-6 text-gray-300">
                Our platform combines the strategic depth of chess with the personal connection of video chat. See your
                opponent's reactions, make friends, and improve your game all at once.
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  "Advanced matchmaking system",
                  "Secure video connections",
                  "Interactive 3D chess board",
                  "Global leaderboards",
                ].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black">
                      ✓
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                Learn More
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="relative rounded-xl bg-gray-800/30 p-4 backdrop-blur-sm"
            >
              <VideoChat />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="container mx-auto px-4"
        >
          <div className="rounded-2xl bg-gradient-to-r from-primary/20 to-gray-800/50 p-12 text-center backdrop-blur-md">
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">Ready to Play?</h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-300">
              Join thousands of players already enjoying chess with a personal touch
            </p>
            <Button
              size="lg"
              className="rounded-full bg-white px-8 py-6 text-lg font-semibold text-gray-900 hover:bg-gray-200"
              onClick={() => navigate("/game")}
            >
              Start Playing Now
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

