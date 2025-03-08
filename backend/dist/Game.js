"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const messages_1 = require("./messages");
let GLOBAL_ROOM_ID = 1;
class Game {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(player1, player2) {
        const roomId = this.generate().toString();
        this.rooms.set(roomId.toString(), {
            player1,
            player2,
            board: new chess_js_1.Chess(),
            moveCount: 0,
            startTime: new Date()
        });
        // const board = new Chess();
        // const startTime = new Date();
        console.log("inside create room");
        player1.send(JSON.stringify({
            type: messages_1.VIDEO,
            video: "send-offer",
            payload: {
                roomId
            }
        }));
        player2.send(JSON.stringify({
            type: messages_1.VIDEO,
            video: "send-offer",
            payload: {
                roomId
            }
        }));
        console.log("created RRom");
        player1.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "white"
            }
        }));
        player2.send(JSON.stringify({
            type: messages_1.INIT_GAME,
            payload: {
                color: "black"
            }
        }));
    }
    makeMove(roomId, senderSocketId, move) {
        //validation the user and the type of move using zod 
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log("room not found");
            return;
        }
        const { player1, player2, board, moveCount } = room;
        if (moveCount % 2 === 0 && senderSocketId !== player1) {
            console.log("not your turn");
            return;
        }
        if (moveCount % 2 === 1 && senderSocketId !== player2) {
            console.log("not your turn");
            return;
        }
        // we dont need to update the board as the library is handling the validation
        try {
            board.move(move);
        }
        catch (e) {
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
                type: messages_1.GAME_OVER,
                payload: {
                    winner: board.turn() === "w" ? "black" : "white"
                }
            }));
            player2.send(JSON.stringify({
                type: messages_1.GAME_OVER,
                payload: {
                    winner: board.turn() === "w" ? "black" : "white"
                }
            }));
            return;
        }
        if (moveCount % 2 === 0) {
            player2.send(JSON.stringify({
                type: messages_1.MOVE,
                payload: move
            }));
        }
        else {
            player1.send(JSON.stringify({
                type: messages_1.MOVE,
                payload: move
            }));
        }
        console.log("moved....");
        room.moveCount++;
        //send the udpated board to both players  
        //anytime there is a move increment the move count
    }
    generate() {
        return GLOBAL_ROOM_ID++;
    }
    //adding video call logic here 
    onOffer(roomId, sdp, senderSocketid) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const { player1, player2 } = room;
        const receivingUser = player1 === senderSocketid ? player2 : player1;
        receivingUser === null || receivingUser === void 0 ? void 0 : receivingUser.send(JSON.stringify({
            type: messages_1.VIDEO,
            video: "offer",
            payload: {
                sdp,
            },
            roomId,
        }));
    }
    onAnswer(roomId, sdp, senderSocketid) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        console.log("room found : answer ", roomId);
        const { player1, player2 } = room;
        const receivingUser = player1 === senderSocketid ? player2 : player1;
        // const sendingUser = player1 === senderSocketid ? player1: player2;
        receivingUser === null || receivingUser === void 0 ? void 0 : receivingUser.send(JSON.stringify({
            type: messages_1.VIDEO,
            video: "answer",
            payload: {
                sdp,
            },
            roomId,
        }));
    }
    onIceCandidates(roomId, senderSocketid, candidate, role) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const { player1, player2 } = room;
        const receivingUser = player1 === senderSocketid ? player2 : player1;
        receivingUser.send(JSON.stringify({
            type: messages_1.VIDEO,
            video: "add-ice-candidate",
            candidate,
            role,
            roomId,
        }));
    }
}
exports.Game = Game;
