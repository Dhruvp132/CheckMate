/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/ban-ts-comment */

import { useEffect, useRef, useState } from "react";
import { GameInfo } from "./game-info.tsx";
import { motion } from "framer-motion";
import { ThreeJSBackground } from "./three-js-background.tsx";
import { ChessBoard } from "../components/ChessBoard"
import { Chess } from 'chess.js'

declare global {
    interface Window {
        pcr: RTCPeerConnection | null;
    }
}

const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// TODO: Move together, there's code repetition here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const VIDEO = "video"; 

const WS_URL = "wss://checkmate-4vmo.onrender.com/";

export const Game = ({
    localAudioTrack,
    localVideoTrack
}: {
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
}) => {

    // const socket = useSocket();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [chess] = useState<Chess>(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false)
    // const [wait, setWait] = useState(0)
    const [color, setColor] = useState<"white" | "black">("white"); 
    const [roomId, setRoomId] = useState<string>("");
    const [gameStatus, setGameStatus] = useState<string>("Waiting for opponent...");
    const [, setCurrentTurn] = useState<"white" | "black">("white");
  
    const [, setLobby] = useState(true);
    const [, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [, setError] = useState<Error | null>(null);


    useEffect(() => {
        console.log("Creating socket connection..")
        const socket = new WebSocket(WS_URL);
        setSocket(socket);
        socket.onopen = () => {
            console.log("Socket opened");
            socket.send(JSON.stringify({    
                type: INIT_GAME,
            }));
        }

        socket.onerror = (error) => {
            console.error("Socket error:", error);
            setError(new Error("WebSocket error"));
        }

        //created seperate handler functions for the different message types 
        const handleInitGame = (payload: any) => {
            setBoard(chess.board());
            setStarted(true);
            setColor(payload.color);
            setCurrentTurn("white");
        };
    
        const handleMove = (payload: any) => {
            chess.move(payload);
            setBoard(chess.board());
            setCurrentTurn(chess.turn() === "w" ? "white" : "black");
            console.log("Move made");
        };
    
        const handleGameOver = () => {
            setGameStatus("Game Over");
            console.log("Game over");
        };

        // Video call handlers
        const handleSendOffer = async (message: any) => {        
            console.log("Handling send-offer and the message is ");
            console.log(message)
            console.log("message roomId is ", message.roomId);
            setLobby(false);

            const currentRoomId = message.roomId;
            setRoomId(currentRoomId);
            
            const pc = new RTCPeerConnection(configuration);
            
            setSendingPc(pc);
            if (localVideoTrack) {
                console.log("Adding video track");
                pc.addTrack(localVideoTrack);
            }
            
            if (localAudioTrack) {
                console.log("Adding audio track");
                pc.addTrack(localAudioTrack);
            }

            pc.onicecandidate = async (e) => {
                console.log("receiving ice candidate locally");
                if (e.candidate && currentRoomId) {
                    socket.send(JSON.stringify({
                        type: VIDEO,
                        video: "add-ice-candidate", 
                        candidate: e.candidate,
                        roomId: currentRoomId,
                        role: "sender",
                    }));
                }
            };

            pc.onnegotiationneeded = async () => {
                console.log("Negotiation needed, sending offer");
                const sdp = await pc.createOffer();
                await pc.setLocalDescription(sdp);
                socket.send(JSON.stringify({
                    type: VIDEO,
                    video: "offer",
                    payload: { sdp }, 
                    roomId: currentRoomId,
                }));
            };

            pc.oniceconnectionstatechange = () => {
                console.log("ICE connection state:", pc.iceConnectionState);
            };
        };

        const handleOffer = async (message: { payload: { sdp: RTCSessionDescriptionInit }, roomId: string }) => {
            console.log("Handling offer from handler offer");
            console.log(message); 
            setLobby(false);

            const pc = new RTCPeerConnection(configuration);
            await pc.setRemoteDescription(message.payload.sdp);
            const sdp = await pc.createAnswer();
            await pc.setLocalDescription(sdp);
            
            const stream = new MediaStream(); 
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            
            setRemoteMediaStream(stream);
            setReceivingPc(pc); // Ensure receivingPc is set here
            window.pcr = pc; 

            pc.ontrack = (e) => {
                console.error("inside ontrack");

                const {track, type} = e;
                if (type == 'audio') {
                    // setRemoteAudioTrack(track);
                    //@ts-expect-error
                    remoteVideoRef.current.srcObject.addTrack(track)
                } else {
                    // setRemoteVideoTrack(track);
                    //@ts-expect-error
                    remoteVideoRef.current.srcObject.addTrack(track)
                }
                remoteVideoRef?.current?.play().then(() => {
                    console.log("Remote video is playing");
                }
                ).catch(err => console.error("Error playing remote video:", err));
            }

            pc.onicecandidate = async (e) => {
                if (!e.candidate) {
                    return;     
                }

                console.log("on ice candidate on receiving seide");
                socket.send(JSON.stringify({
                    type: VIDEO, 
                    video: "add-ice-candidate",
                    candidate: e.candidate,
                    roomId: message.roomId,
                    role: "receiver"
                }));
            };
                
            socket.send(JSON.stringify({
                type: VIDEO,
                video: "answer",
                payload: { sdp },
                roomId: message.roomId,  
            }));

            setTimeout(() => {
                const track1 = pc.getTransceivers()[0].receiver.track
                const track2 = pc.getTransceivers()[1].receiver.track
                console.log(track1);
                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2)
                    setRemoteVideoTrack(track1)
                } else {
                    setRemoteAudioTrack(track1)
                    setRemoteVideoTrack(track2)
                }
                //@ts-expect-error
                remoteVideoRef.current.srcObject.addTrack(track1)
                //@ts-expect-error
                remoteVideoRef.current.srcObject.addTrack(track2)
                //@ts-expect-error
                remoteVideoRef.current.play();
            }, 2000)
        };

        const handleAnswer = (message: any) => {
            setLobby(false);
            console.log("Handling answer");
            // You're setting receivingPc here, but it should likely be sendingPc
            // since you're handling an answer to your offer
            setSendingPc(pc => {  
                pc?.setRemoteDescription(new RTCSessionDescription(message.payload.sdp))
                    .catch(error => {
                        console.error("Error setting remote description:", error);
                    });
                return pc;
            }); 
            console.log("loop closed")
        }

        const handleIceCandidate = (payload: any) => {
            if (payload.role == "sender") {
                setReceivingPc(pc => {
                    if (!pc) {
                        console.error("receiving pc not found");
                        return pc;
                    }
                    pc.addIceCandidate(payload.candidate)
                        .catch(error => {
                            console.error("Error adding ICE candidate:", error);
                        });
                    return pc;
                });
            } else {
                setSendingPc(pc => {
                    if (!pc) {
                        console.error("sending pc not found");
                        return pc;
                    }
                    pc.addIceCandidate(payload.candidate)
                        .catch(error => {
                            console.error("Error adding ICE candidate:", error);
                        });
                    return pc;
                });
            }
        };

        const handleLobby = () => {
            setLobby(true);
            setGameStatus("In Game")
        };

    // Main message handler that delegates to specific handlers
        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("Received message:", message.type, message.video || "");
        
                switch (message.type) {
                    case INIT_GAME:
                        handleInitGame(message.payload);
                        break;
                    case MOVE:
                        handleMove(message.payload);
                        break;
                    case GAME_OVER:
                        handleGameOver();
                        break;
                    case VIDEO:
                        switch (message.video) {
                            case "send-offer":
                                handleSendOffer(message.payload);
                                break;
                            case "offer":
                                handleOffer(message);
                                break;
                            case "answer":
                                handleAnswer(message);
                                break;
                            case "lobby":
                                handleLobby();
                                break;
                            case "add-ice-candidate":
                                handleIceCandidate(message);
                                break;
                            default:
                                console.warn("Unknown video message type:", message.video);
                        }
                        break;
                    default:
                        console.warn("Unknown message type:", message.type);
                }
            } catch (error) {
                console.error("Error handling WebSocket message:", error, event.data);
            }
        };

        return () => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    // setSocket(socket);
}, [localAudioTrack, localVideoTrack]);

    useEffect(() => {
        if (localVideoRef.current) {
            if (localVideoTrack) {
                localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
                localVideoRef.current.play().then(() => {
                    console.log("Local video is playing");
                }).catch(err => console.error("Error playing local video:", err));
            }
        }
    }, [localVideoTrack]);


    // if (!socket) return <div>Connecting...</div>

    return (
        <div className="relative min-h-screen w-full overflow-hidden">
          <ThreeJSBackground />
          
          <div className="relative z-10 flex flex-col items-center min-h-screen">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="container mx-auto px-4 py-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                  className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-xl flex flex-col justify-center items-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <ChessBoard 
                    roomId={roomId} 
                    chess={chess} 
                    setBoard={setBoard} 
                    socket={socket} 
                    board={board} 
                    color={color} 
                  />
                </motion.div>
                <motion.div 
                  className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-xl flex flex-col items-center justify-center"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex-1 p-4">
                    <video autoPlay height={300} width={400} className="object-cover" ref={localVideoRef} />
                  </div> 
                  <div className="flex-1 p-4">
                    <video autoPlay height={300} width={400} className="object-cover" ref={remoteVideoRef} />
                  </div>
                </motion.div>
              </div>
              
              <motion.div 
                className="mt-6 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <GameInfo 
                  started={started} 
                  color={color} 
                  gameStatus={gameStatus}
                  chess={chess}
                />
              </motion.div>
            </motion.div>
          </div>
      </div>
  );
};