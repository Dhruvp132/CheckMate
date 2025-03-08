/* eslint-disable @typescript-eslint/ban-ts-comment */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useRef, useState } from "react";

// import { useEffect, useRef } from "react";

declare global {
    interface Window {
        pcr: RTCPeerConnection | null;
    }
}

import { ChessBoard } from "../components/ChessBoard"
import { Chess } from 'chess.js'

// TODO: Move together, there's code repetition here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const VIDEO = "video"; 

const WS_URL = "ws://localhost:8080";


export const Game = ({
    localAudioTrack,
    localVideoTrack
}: {
    localAudioTrack: MediaStreamTrack | null,
    localVideoTrack: MediaStreamTrack | null,
}) => {

    // const socket = useSocket();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [chess, setChess] = useState<Chess>(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false)
    const [wait, setWait] = useState(0)
    const [color, setColor] = useState<"white" | "black">("white"); 
    const [roomId, setRoomId] = useState<string>("");

    const [lobby, setLobby] = useState(true);
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    const [receivingUser, setReceivingUser] = useState<string | null>(null);
    const [remoteVideoTrack, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteAudioTrack, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<Error | null>(null);


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
        };
    
        const handleMove = (payload: any) => {
            chess.move(payload);
            setBoard(chess.board());
            console.log("Move made");
        };
    
        const handleGameOver = () => {
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
            
            const pc = new RTCPeerConnection();
            
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

        const handleOffer = async (message: any) => {
            console.log("Handling offer from handler offer");
            console.log(message); 
            setLobby(false);

            const pc = new RTCPeerConnection();
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

    return <div className="justify-center flex">
        <div className="pt-8 max-w-screen-lg w-full">
            <div className="grid grid-cols-6 gap-4 w-full">
                <div className="col-span-4 w-full flex justify-center">
                    <ChessBoard roomId={roomId} chess={chess} setBoard={setBoard} socket={socket} board={board} color={color} />
                </div>
                <div className="col-span-2 bg-slate-900 w-full flex justify-center">
                    <div className="pt-8">
                        {started && color && (
                            <div className="flex flex-col items-center">
                                <h3 className="text-white font-bold text-1xl">
                                    You are playing as 
                                </h3>
                                <h1 className="text-white font-bold text-5xl">
                                    {color}
                                </h1>
                            </div>
                        )}

                        {/* Video preview area */}
                        <div className="mb-4 w-full max-w-xs px-3">
                        <div className="p-4">
                            <video autoPlay width={600} height={600} ref={localVideoRef} />
                        </div> 
                       <div className="p-4">
                            <video autoPlay width={600} height={600} ref={remoteVideoRef} />
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}
