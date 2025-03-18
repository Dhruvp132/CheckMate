import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "../components/ui/dialog"
import { ChevronLeft, ChevronRight, X, CastleIcon as ChessKnight, Video, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "../components/ui/button"

const slides = [
  {
    title: "Welcome to Chess Connect",
    description: "Play chess with people from around the world while video chatting in real-time.",
    icon: <ChessKnight className="h-12 w-12 text-primary" />,
    image: "/placeholder.svg?height=200&width=300",
    tip: "Click 'Play Now' to start a new game and get matched with an opponent.",
  },
  {
    title: "Live Video Chat",
    description: "See your opponent's reactions as you make your strategic moves.",
    icon: <Video className="h-12 w-12 text-primary" />,
    image: "/placeholder.svg?height=200&width=300",
    tip: "You can toggle your camera and microphone using the controls below your video.",
  },
  {
    title: "Global Community",
    description: "Connect with chess enthusiasts from all over the world.",
    icon: <Users className="h-12 w-12 text-primary" />,
    image: "/placeholder.svg?height=200&width=300",
    tip: "Our matchmaking system pairs you with players of similar skill level.",
  },
]

export function OnboardingDialog() {
  const [open, setOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has seen onboarding before
    const onboardingSeen = localStorage.getItem("chessConnectOnboardingSeen")

    if (!onboardingSeen) {
      // Show dialog after a short delay
      const timer = setTimeout(() => {
        setOpen(true)
      }, 1000)

      return () => clearTimeout(timer)
    } else {
      setHasSeenOnboarding(true)
    }
  }, [])

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      completeOnboarding()
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const completeOnboarding = () => {
    localStorage.setItem("chessConnectOnboardingSeen", "true")
    setHasSeenOnboarding(true)
    setOpen(false)
  }

  if (hasSeenOnboarding) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <div className="absolute right-4 top-4 z-10">
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={completeOnboarding}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="relative overflow-hidden px-1 py-4">
          {/* Progress indicators */}
          <div className="mb-4 flex justify-center space-x-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  index === currentSlide ? "bg-primary" : "bg-gray-600"
                }`}
              />
            ))}
          </div>

          {/* Slides */}
          <div className="relative h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <div className="flex h-full flex-col items-center justify-between p-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      {slides[currentSlide].icon}
                    </div>
                    <h2 className="mb-2 text-2xl font-bold">{slides[currentSlide].title}</h2>
                    <p className="mb-6 text-gray-400">{slides[currentSlide].description}</p>
                  </div>

                  <div className="relative mb-6 mt-4 overflow-hidden rounded-lg">
                    <img
                      src={slides[currentSlide].image || "/placeholder.svg"}
                      alt={slides[currentSlide].title}
                      className="h-auto w-full max-w-xs rounded-lg object-cover"
                    />
                  </div>

                  <div className="rounded-lg bg-gray-800 p-4">
                    <p className="text-sm text-gray-300">
                      <span className="mr-2 font-bold text-primary">TIP:</span>
                      {slides[currentSlide].tip}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              className={currentSlide === 0 ? "invisible" : ""}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <Button onClick={handleNext} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {currentSlide < slides.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

