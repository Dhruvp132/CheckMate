"use client";

import { motion } from "framer-motion";

interface GameInfoProps {
  started: boolean;
  color: "white" | "black";
  gameStatus: string;
  turnIndicator: string;
}

export const GameInfo = ({ started, color, gameStatus, turnIndicator }: GameInfoProps) => {
  return (
    <motion.div 
      className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h2 className="text-xl font-semibold text-white mb-4">Game Info</h2>
      
      <div className="space-y-4">
        {started ? (
          <>
            {/* <div className="flex items-center justify-between">
              <span className="text-gray-300">Status:</span>
              <span className="text-white font-medium">{gameStatus}</span>
            </div> */}
            
            <div className="flex items-center justify-between">
              <span className="text-gray-300">You are playing as:</span>
              <motion.span 
                className={`font-bold text-lg ${color === "white" ? "text-white" : "text-white-800"}`}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                {color}
              </motion.span>
            </div>
            
            {/* <div className="flex items-center justify-between">
              <span className="text-gray-300">Turn:</span>
              <span className="text-white font-medium">{turnIndicator}</span>
            </div> */}
            
          </>
        ) : (
          <div className="text-center py-4">
            <div className="animate-pulse text-white mb-2">Waiting for opponent...</div>
            <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
