import { useEffect, useRef, useState } from "react";
import { Loader2, Users} from 'lucide-react';
import { motion } from "framer-motion";
import ChessScene from "../components/chess-scene";
import { Card } from "../components/ui/Card";
import { Game } from "./Game";
import { Button } from "../components/ui/button";

export const GameLanding = () => {
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [searchingForOpponent, ] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getCam = async () => {
    try {
      setIsLoading(true);
      const stream = await window.navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      
      setLocalAudioTrack(audioTrack);
      setLocalVideoTrack(videoTrack);
      
      if (!videoRef.current) {
        return;
      }
      
      videoRef.current.srcObject = new MediaStream([videoTrack]);
      await videoRef.current.play();
    } catch (error) {
      console.error("Error accessing media devices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (videoRef && videoRef.current) {
      getCam();
    }
  }, [videoRef]);

  const handleJoin = () => {
    setJoined(true);
  };

  if (!joined) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        {/* 3D Chess Animation Background */}
        <div className="absolute inset-0 z-0">
          <ChessScene />
        </div>
        
        <div className="z-10 w-full max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">Chess Connect</h1>
            <p className="text-xl text-blue-200">Play chess with people around the world</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-navy-800/80 backdrop-blur-sm border-navy-700 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-white mb-4">Your Video</h2>
                  <div className="relative aspect-video bg-navy-950 rounded-lg overflow-hidden">
                    {isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                      </div>
                    ) : null}
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover"
                      muted
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-navy-800/80 backdrop-blur-sm border-navy-700 h-full">
                <div className="p-6 flex flex-col h-full">
                  <h2 className="text-2xl font-semibold text-white mb-4">Find an Opponent</h2>
                  <p className="text-blue-200 mb-6">
                    Get matched with chess players from around the world and challenge them to a game while video chatting.
                  </p>
                  
                  <div className="mt-auto">
                    {searchingForOpponent ? (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                          <span className="text-blue-200">Searching for opponent...</span>
                        </div>
                        <div className="w-full bg-navy-700 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, ease: "linear" }}
                          />
                        </div>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleJoin}  
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="lg"
                      >
                        <Users className="mr-2 h-5 w-5" />
                        Find Opponent
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (!localAudioTrack || !localVideoTrack) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-400 animate-spin mx-auto mb-4" />
          <h1 className="text-xl text-white">Loading Media...</h1>
        </div>
      </div>
    );
  }

  return <Game localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />;
};
