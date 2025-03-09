/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useRef, useState } from "react";

declare global {
    interface Window {
        pcr: RTCPeerConnection | null;
    }
}
import { Button } from "../components/Button"
import { ChessBoard } from "../components/ChessBoard"
import { Chess } from 'chess.js'

// TODO: Move together, there's code repetition here
export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const VIDEO = "video"; 

const WS_URL = "ws://localhost:8080";

export const Game1 = (
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
    const [chess, ] = useState<Chess>(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [started, setStarted] = useState(false)
    // const [wait, setWait] = useState(0)
    const [color, setColor] = useState<"white" | "black">("white"); 
    const [roomId, setRoomId] = useState<string>("");

    const [, setLobby] = useState(true);
    const [sendingPc, setSendingPc] = useState<null | RTCPeerConnection>(null);
    const [receivingPc, setReceivingPc] = useState<null | RTCPeerConnection>(null);
    // const [receivingUser, setReceivingUser] = useState<string | null>(null);
    const [, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [, setRemoteMediaStream] = useState<MediaStream | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [cameraInitialized, setCameraInitialized] = useState(false);
    
    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];
        
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);
        if (!localVideoRef.current) {
            return;
        }
        localVideoRef.current.srcObject = new MediaStream([videoTrack]);
        localVideoRef.current.play();
        
        setCameraInitialized(true);
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
        console.log("Handling send-offer and the message is ");
        console.log(message)
        console.log("message roomId is ", message.roomId);
        setLobby(false);

        const currentRoomId = message.roomId;
        
        // if (currentRoomId !== undefined){
        //     console.log("Setting room id 1    ", currentRoomId);
        //     console.log(typeof currentRoomId);
        //     setRoomId(currentRoomId);
        //     console.log("Room id set 1   ", currentRoomId);
        // } 
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
            if (e.candidate) {
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
            pc.setLocalDescription(sdp);
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
        console.log("Setting remote description", message.payload.sdp);
        await pc.setRemoteDescription(message.payload.sdp);
        const sdp = await pc.createAnswer();
        await pc.setLocalDescription(sdp);
        
        const stream = new MediaStream(); 
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
        }
        
        setRemoteMediaStream(stream);
        setReceivingPc(pc);
        window.pcr = pc; 

        pc.ontrack = (e) => {
            console.log("Track received");
            const track = e.track;
            console.log("Track kind:", track.kind);
            if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                //@ts-ignore
                remoteVideoRef.current.srcObject.addTrack(track);
                console.log("Track added to remote video element");
            } else {
                console.error("Remote video element or srcObject is not set");
            }
            remoteVideoRef?.current?.play().catch(error => {
                console.error("Error playing remote video:", error);
            });
        };

        // pc.ontrack = (e) => {
                // console.error("inside ontrack");
                // const {track, type} = e;
                // if (type == 'audio') {
                //     // setRemoteAudioTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // } else {
                //     // setRemoteVideoTrack(track);
                //     // @ts-ignore
                //     remoteVideoRef.current.srcObject.addTrack(track)
                // }
                // //@ts-ignore
                // remoteVideoRef?.current?.play();
            // }

        pc.onicecandidate = async (e) => {
            if (!e.candidate) return;
            
            socket.send(JSON.stringify({
                type: VIDEO, 
                video: "add-ice-candidate",
                candidate: e.candidate,
                roomId: message.roomId,
                role: "receiver"
            }));
        };

        console.log("before sending answer and thr roomId is curr", roomId)
        socket.send(JSON.stringify({
            type: VIDEO,
            video: "answer",
            payload: { sdp },
            roomId: message.roomId,  // Include the roomId here
        }));
        console.log("after sending answer")

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
            //@ts-ignore
            remoteVideoRef.current.srcObject.addTrack(track1)
            //@ts-ignore
            remoteVideoRef.current.srcObject.addTrack(track2)
            //@ts-ignore
            remoteVideoRef.current.play();
        }, 2000)
    };

    // const handleAnswer = async(message: any) => {
    //     console.log("Handling answer");
    //     console.log(message); 
    //     console.log(message?.payload); 
    //     setLobby(false);
        
    //     // setSendingPc(pc => {
    //     //     if (pc) {
    //     //         pc.setRemoteDescription(new RTCSessionDescription(message.payload.sdp))
    //     //             .catch(error => {
    //     //                 console.error("Error setting remote description:", error);
    //     //             });
    //     //     }
    //     //     return pc;
    //     // });
    //     const pc = sendingPc; 
    //     await pc?.setRemoteDescription(new RTCSessionDescription(message.payload.sdp))
    //     setSendingPc(pc); 

    //     // sendingPc?.setRemoteDescription(new RTCSessionDescription(message.payload.sdp))
    //     //     .catch(error => {
    //     //         console.error("Error setting remote description:", error);
    //     //     });
            
    //     // sendingPc(sendingPc); 
    //     // await sendingPc?.setRemoteDescription(new RTCSessionDescription(message.payload.sdp))
    // };

    const handleAnswer = async (message: any) => {
        console.log("Handling answer");
        console.log(message); 
        console.log(message?.payload); 
        setLobby(false);
        
        try {
            if (sendingPc) {
                // Only proceed if in the correct state
                if (sendingPc.signalingState === "have-local-offer") {
                    // const remoteSdp = new RTCSessionDescription(message.payload.sdp);
                    // await sendingPc.setRemoteDescription(remoteSdp);
                    setSendingPc(pc => {
                        pc?.setRemoteDescription(message.payload.sdp)
                        return pc; 
                    })
                    logSignalingState(sendingPc, "After setting remote description");
                } else {
                    console.error(`Invalid state for setting remote answer: ${sendingPc.signalingState}`);
                }
            }
        } catch (error) {
            console.error("Error setting remote description:", error);
        }
    };

    const logSignalingState = (pc: RTCPeerConnection | null, label: string) => {
        if (!pc) {
          console.log(`${label} PC is null`);
          return;
        }
        console.log(`${label} signaling state: ${pc.signalingState}`);
      };


    const handleIceCandidate = (payload: any) => {
        console.log(payload); 
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

            socket.onclose = () => {
                console.log("WebSocket connection closed");
            };

            socket.onerror = (error) => {
                console.error("WebSocket error:", error);
            };
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
                        <div className="p-4">
                <video autoPlay width={600} height={600} ref={localVideoRef} />
            </div> 
            <div className="p-4">
                <video autoPlay width={600} height={600} ref={remoteVideoRef} />
            </div>
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
                    </div>
                </div>
            </div>
        </div>
    </div>
}