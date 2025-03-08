import { useEffect, useRef, useState } from "react"
import { Game } from "../screens/Game";
// import { Game } from "./Game";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:3000");

export const GameLanding = () => {
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [joined, setJoined] = useState(false);

    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        //MediaStream 
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]
        setLocalAudioTrack(audioTrack);
        setlocalVideoTrack(videoTrack);
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])
        videoRef.current.play();
        //MediaStream 
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam()
        }
    }, [videoRef]);

    const handleJoin = () => {
        setJoined(true);
        // if(!name) setName("randomName")
        // socket.emit("join", { name });
    }

    if (!joined) {
        return (
            <div className="">
                <h1>Get Matched with new peoples </h1>
                <div className="flex justify-center mt-5">
                    <video autoPlay ref={videoRef}></video>
                </div>
                <br></br>
                <button onClick={handleJoin}>Join</button>
            </div>
        );
    }

    if(!localAudioTrack || !localVideoTrack) {
        <h1>Loading Media</h1>
    }
    console.log("localAudioTrack", localAudioTrack)
    console.log("localVideoTrack", localVideoTrack)
    return <Game localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} />
}