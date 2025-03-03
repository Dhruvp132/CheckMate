/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { useSocket } from "../hooks/useSocket";
import { Chess } from 'chess.js'

// TODO: Move together, there's code repetition here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const VIDEO = "video"; 

const WS_URL = "ws://localhost:8080";

export const Game = (
//     {
//     localAudioTrack,
//     localVideoTrack
// }: {
//     localAudioTrack: MediaStreamTrack | null,
//     localVideoTrack: MediaStreamTrack | null,
// }
) => {
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);;

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
    const [cameraInitialized, setCameraInitialized] = useState(false);
    
    const getCam = async () => {
        try {
            const stream = await window.navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];
            
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = new MediaStream([videoTrack]);
                localVideoRef.current.play();
            }
            
            setCameraInitialized(true);
        } catch (error) {
            console.error("Error accessing camera:", error);
        }
    }

    useEffect(() => {
        // Initialize camera when component mounts
        if (!cameraInitialized) {
            getCam();
        }
    }, [cameraInitialized]);

    useEffect(() => {
        console.log("Creating socket")
        const socket = new WebSocket(WS_URL);
        if (!socket) {
            return;
        }
        setSocket(socket);
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
        if (sendingPc) {
            console.log("Sending PC already exists, not creating a new one");
            return;
        }
        
        console.log("Handling send-offer and the message is ");
        console.log(message)
        console.log("message roomId is ", message.roomId);
        setLobby(false);
        if (message.roomId !== undefined){
            console.log("Setting room id", message.roomId);
            console.log(typeof message.roomId);
            setRoomId(message.roomId);
            console.log("Room id set", roomId);
        } 
        
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
            if (e.candidate) {
                socket.send(JSON.stringify({
                    type: VIDEO,
                    video: "add-ice-candidate", 
                    candidate: e.candidate,
                    roomId: roomId,
                    role: "sender"
                }));
            }
        };

        pc.onnegotiationneeded = async () => {
            console.log("Negotiation needed, sending offer");
            const sdp = await pc.createOffer();
            pc.setLocalDescription(sdp);
            socket.send(JSON.stringify({
                type: VIDEO,
                video: "offer",
                payload: { sdp }, 
                roomId: roomId
            }));
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
        };
    };

    const handleOffer = async (message: any) => {
        if (receivingPc) {
            console.log("Receiving PC already exists, not creating a new one");
            return;
        }
        
        console.log("Handling offer from handler offer");
        console.log(message); 
        setLobby(false);
        if (message.roomId !== undefined) {
            console.log("Setting room id");
            console.log(typeof message.roomId);
            setRoomId(message.roomId);
        }
        
        const pc = new RTCPeerConnection();
        console.log("Setting remote description", message.sdp);
        await pc.setRemoteDescription(new RTCSessionDescription(message.sdp));
        const sdp = await pc.createAnswer();
        await pc.setLocalDescription(sdp);
        
        const stream = new MediaStream(); 
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
        }
        
        setRemoteMediaStream(stream);
        setReceivingPc(pc);
        window.pcr = pc; 

        pc.ontrack = () => {
            console.log("Track received");
        };

        pc.onicecandidate = async (e) => {
            if (!e.candidate) return;
            
            socket.send(JSON.stringify({
                type: VIDEO, 
                video: "add-ice-candidate",
                candidate: e.candidate,
                roomId: roomId,
                role: "receiver"
            }));
        };

        console.log("before sending answer")
        socket.send(JSON.stringify({
            type: VIDEO,
            video: "answer",
            payload: { sdp },
            roomId: roomId,
        }));
        console.log("after sending answer")

        setTimeout(() => {
            try {
                const transceivers = pc.getTransceivers();
                if (transceivers.length < 2) {
                    console.error("Not enough transceivers available");
                    return;
                }
                
                const track1 = transceivers[0].receiver.track;
                const track2 = transceivers[1].receiver.track;
                
                if (track1.kind === "video") {
                    setRemoteAudioTrack(track2);
                    setRemoteVideoTrack(track1);
                } else {
                    setRemoteAudioTrack(track1);
                    setRemoteVideoTrack(track2);
                }

                if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                    (remoteVideoRef.current.srcObject as MediaStream).addTrack(track1);
                    (remoteVideoRef.current.srcObject as MediaStream).addTrack(track2);
                    remoteVideoRef.current.play().catch(e => console.error("Error playing remote video:", e));
                }
            } catch (error) {
                console.error("Error setting up remote tracks:", error);
            }
        }, 2000);
    };

    const handleAnswer = async(message: any) => {
        console.log("Handling answer");
        console.log(message); 
        console.log(message?.payload); 
        setLobby(false);
        // setReceivingUser(message.sendingUser);
        
        if (sendingPc) {
            await sendingPc.setRemoteDescription(new RTCSessionDescription(message.payload.sdp))
                .catch(e => console.error("Error setting remote description:", e));
        } else {
            console.error("No sending PC available to receive answer");
        }
    };

    const handleIceCandidate = (payload: any) => {
        console.log(`Handling ICE candidate for role: ${payload.role}`);
        
        if (payload.role === "sender") {
            if (receivingPc && receivingPc.signalingState !== "closed") {
                receivingPc.addIceCandidate(payload.candidate)
                    .catch(e => console.error("Error adding ICE candidate to receiving PC:", e));
            } else {
                console.log("Receiving PC unavailable or closed, ignoring ICE candidate");
            }
        } else {
            if (sendingPc && sendingPc.signalingState !== "closed") {
                sendingPc.addIceCandidate(payload.candidate)
                    .catch(e => console.error("Error adding ICE candidate to sending PC:", e));
            } else {
                console.log("Sending PC unavailable or closed, ignoring ICE candidate");
            }
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
                            console.log("++++++++send-offer payload of it");
                            console.log(message.payload); 
                            handleSendOffer(message.payload);
                            break;
                        case "offer":
                            console.log("++++++++offer message : " + message);
                            console.log("++++++++offer message.payload : " + message.payload);
                            console.log(message.payload); 
                            handleOffer(message.payload);
                            break;
                        case "answer":
                            console.log("++++++++answer");
                            console.log(message); 
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
            console.error("Error handling WebSocket message:", error);
        }
    };

    setSocket(socket);
    // Cleanup
    // return () => {
    //     socket.onmessage = null;
        
    //     // Clean up peer connections if component unmounts
    //     if (sendingPc) {
    //         sendingPc.close();
    //     }
        
    //     if (receivingPc) {
    //         receivingPc.close();
    //     }
    // };
    //make sure you are not re-rendering 
}, [localAudioTrack, localVideoTrack]);

    const handlePlayClick = () => {
        // Ensure camera is initialized before starting the game
        if (!cameraInitialized) {
            getCam().then(() => {
                socket?.send(JSON.stringify({
                    type: INIT_GAME
                }));
            });
        } else {
            socket?.send(JSON.stringify({
                type: INIT_GAME
            }));
        }
        // socket?.send(JSON.stringify({
        //     type: INIT_GAME
        // }));
    };

    if (!socket) return <div>Connecting...</div>

    return <div className="justify-center flex">
        <div className="pt-8 max-w-screen-lg w-full">
            <div className="grid grid-cols-6 gap-4 w-full">
                <div className="col-span-4 w-full flex justify-center">
                    <ChessBoard roomId={roomId} chess={chess} setBoard={setBoard} socket={socket} board={board} color={color} />
                </div>
                <div className="col-span-2 bg-slate-900 w-full flex justify-center">
                    <div className="pt-8">
                        {!started && <Button onClick={() => {
                            // socket.send(JSON.stringify({
                            //     type: INIT_GAME
                            // }))
                            handlePlayClick(); 
                        }} >
                            Play
                        </Button>}

                        {/* Video preview area */}
                        <div className="mb-4 w-full max-w-xs px-3">
                            <video 
                                ref={localVideoRef} 
                                className="w-full rounded-md border border-gray-700" 
                                autoPlay 
                                playsInline 
                                muted
                            />
                        </div>

                        {/* {!started && <Button onClick={handlePlayClick}>
                            Play
                        </Button>} */}
                        {/* adding heading to see what color i am */}
                        {started && color && (
                            <div>
                                <h3 className="text-white font-bold text-1xl">
                                    You are playing as 
                                </h3>
                                <h1 className="text-white font-bold text-5xl">
                                    {color}
                                </h1>
                            </div>
                        )}

                    <div>other party </div>
                    <div className="p-4">
                        <video autoPlay width={600} height={600} ref={remoteVideoRef} />
                    </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}