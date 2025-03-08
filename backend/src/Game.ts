import { WebSocket } from "ws";
import { Chess } from 'chess.js'
import { GAME_OVER, INIT_GAME, MOVE, VIDEO } from "./messages";

let GLOBAL_ROOM_ID = 1;

interface Room { 
    player1 : WebSocket;
    player2 : WebSocket;
    moveCount : number;
    board : Chess;
    startTime? : Date;
}

export class Game {
    // public player1: WebSocket;
    // public player2: WebSocket;
    // public board: Chess
    // private startTime: Date;
    // private moveCount = 0;

    // constructor(player1: WebSocket, player2: WebSocket) {
    //     this.player1 = player1;
    //     this.player2 = player2;
    //     this.board = new Chess();
    //     this.startTime = new Date();
    //     this.player1.send(JSON.stringify({
    //         type: INIT_GAME,
    //         payload: {
    //             color: "white"
    //         }
    //     }));
    //     this.player2.send(JSON.stringify({
    //         type: INIT_GAME,
    //         payload: {
    //             color: "black"
    //         }
    //     }));
    // }

    private rooms: Map<string, Room>
    constructor() {
        this.rooms = new Map<string, Room>()
    }

    createRoom(player1: WebSocket, player2: WebSocket) {
        const roomId = this.generate().toString(); 
        this.rooms.set(roomId.toString(), {
            player1,
            player2, 
            board : new Chess(),
            moveCount : 0,
            startTime : new Date()
        });

        // const board = new Chess();
        // const startTime = new Date();
        
        console.log("inside create room")
        player1.send(JSON.stringify({
            type: VIDEO,
            video: "send-offer",
            payload : {
                roomId
            }
        }));
        player2.send(JSON.stringify({
            type: VIDEO,
            video: "send-offer",
            payload : {
                roomId
            }
        }));
        console.log("created RRom")
        
        player1.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "white"
            }
        }));
        player2.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "black"
            }
        }));
    }

    makeMove(roomId: string, senderSocketId :WebSocket, move : {
        from : string;
        to : string;
    }) {

        //validation the user and the type of move using zod 
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log("room not found")
            return;
        }
        const { player1, player2, board, moveCount } = room;
        if (moveCount % 2 === 0 && senderSocketId !== player1) {
            console.log("not your turn")
            return;
        }
        if (moveCount % 2 === 1 && senderSocketId !== player2) {
            console.log("not your turn")
            return;
        }
        // we dont need to update the board as the library is handling the validation
        try {
            board.move(move);
        } catch(e) {
            console.log(e);
            return;
        }
        /* for the above 3 and updating the code we can use chess.js library 
        it pretty much handles a lot of validation */ 
    
        //Update the board 
        //push the move

        //check if the game is over 
        //TODO : add the time logic here 
        if (board.isGameOver()) { //both user will get the game over message
            player1.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: board.turn() === "w" ? "black" : "white"
                }
            }))
            player2.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: board.turn() === "w" ? "black" : "white"
                }
            }))
            return;
        }
    
        if (moveCount % 2 === 0) {
            player2.send(JSON.stringify({
                type: MOVE,
                payload: move
            }))
        } else {
            player1.send(JSON.stringify({
                type: MOVE,
                payload: move
            }))
        }
        console.log("moved....")
        room.moveCount++;
        //send the udpated board to both players  
        //anytime there is a move increment the move count
    }

    generate() {
        return GLOBAL_ROOM_ID++;
    }

    //adding video call logic here 
    onOffer(roomId: string, sdp: string, senderSocketid: WebSocket) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const { player1, player2} = room; 
        const receivingUser = player1 === senderSocketid ? player2: player1;
        receivingUser?.send(JSON.stringify({
            type : VIDEO,
            video : "offer",
            payload : {
                sdp,
            },
            roomId,
        }));
    }
    
    onAnswer(roomId: string, sdp: string, senderSocketid: WebSocket) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        console.log("room found : answer ", roomId)
        const {player1, player2} = room 
        const receivingUser = player1 === senderSocketid ? player2: player1;
        // const sendingUser = player1 === senderSocketid ? player1: player2;
        receivingUser?.send(JSON.stringify({
            type : VIDEO,
            video : "answer",
            payload : {
                sdp,
            },
            roomId, 
        }));
    }

    onIceCandidates(roomId: string, senderSocketid: WebSocket, candidate: any, role: "sender" | "receiver") {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const {player1, player2} = room;
        const receivingUser = player1 === senderSocketid ? player2: player1;
        receivingUser.send(JSON.stringify({
            type : VIDEO, 
            video : "add-ice-candidate",
            candidate, 
            role, 
            roomId, 
        }));
    }
}