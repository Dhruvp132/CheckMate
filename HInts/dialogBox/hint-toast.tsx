"use client"

import type React from "react"

import { useToast } from "../hooks/useToast"
import { Info, CastleIcon as ChessKnight, Video } from "lucide-react"

type HintType = "welcome" | "video" | "chess"

const hintMessages: { [key in HintType]: { title: string; description: string; icon: React.ReactNode } } = {
  welcome: {
    title: "Welcome to Chess Connect!",
    description: "Start a new game and challenge a random player.",
    icon: <Info className="h-4 w-4" />,
  },
  video: {
    title: "Live Video Chat",
    description: "See your opponent's reactions in real-time.",
    icon: <Video className="h-4 w-4" />,
  },
  chess: {
    title: "Strategic Gameplay",
    description: "Outsmart your opponent with clever moves.",
    icon: <ChessKnight className="h-4 w-4" />,
  },
}

// export const showHint = (type: HintType) => {
//   const { toast } = useToast()
//   const hint = hintMessages[type]

//   toast({
//     variant: "hint",
//     title: hint.title,
//     description: hint.description,
//   })
// }

// React hooks can only be called inside React function components or other custom hooks. 
export const useShowHint = () => {
    const { toast } = useToast()
  
    const showHint = (type: HintType) => {
      const hint = hintMessages[type]
  
      toast({
        variant: "hint",
        title: hint.title,
        description: hint.description,
      })
    }
  
    return showHint
  }