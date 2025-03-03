"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const messages_1 = require("./messages");
const Game_1 = require("./Game");
//User class and Game Class 
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
        this.Game = new Game_1.Game();
    }
    addUser(socket) {
        this.users.push(socket);
        console.log("inside adduser");
        // this.clearQueue(); 
        socket.send(JSON.stringify({ type: messages_1.VIDEO, video: "lobby" }));
        this.initHandler(socket);
    }
    clearQueue() {
        console.log("inside clear games");
        console.log(this.games.length);
        if (this.users.length < 2)
            return;
        const user1 = this.users.pop();
        const user2 = this.users.pop();
        if (!user1 || !user2)
            return;
        console.log("creating game");
        const game = this.Game.createRoom(user1, user2);
        // this.games.push(game);
        this.clearQueue();
    }
    removeUser(socket) {
        this.users = this.users.filter(user => user !== socket);
        // Stop the game here because the user left 
        //TODO: this is also not the great as because you also need to have the reconnect logic here 
    }
    //TODO : use grpc call to the game server
    initHandler(socket) {
        console.log("inside addHandler");
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === messages_1.INIT_GAME) {
                console.log("inside initgame");
                if (this.pendingUser) {
                    // const game = new Game(this.pendingUser, socket);
                    this.Game.createRoom(this.pendingUser, socket);
                    // this.games.push(game);
                    console.log("=+===============");
                    console.log(this.games.length);
                    this.pendingUser = null;
                    //maintain a list of all the users 100 games where there are 100 current users
                }
                else {
                    this.pendingUser = socket;
                }
                // this.clearQueue();
            }
            if (message.type === messages_1.MOVE) {
                console.log("inside move");
                const roomId = message.roomId;
                console.log("roomId is " + roomId + "and move made is " + message.payload.move);
                // const game = this.games.find(game => game.player1 === socket || game.player2 === socket);
                // if (game) {
                //     console.log("inside makemove")
                this.Game.makeMove(roomId, socket, message.payload.move);
                // }
            }
            if (message.type === messages_1.VIDEO) {
                // console.log(message)
                const { roomId, candidate, role, video } = message;
                // const game = this.games.find(game => game.player1 === socket || game.player2 === socket);
                // if (!game) return;
                // if (video === "send-offer") {
                //     console.log("inside send offer")
                //     const { sdp } = message.payload;
                //     this.Game.onOffer(roomId, socket);
                // } else
                if (video === "offer") {
                    console.log("inside offer");
                    const { sdp } = message.payload;
                    console.log(sdp + " and " + roomId);
                    this.Game.onOffer(roomId, sdp, socket);
                }
                else if (video === "answer") {
                    console.log("inside answer");
                    const { sdp } = message.payload;
                    this.Game.onAnswer(roomId, sdp, socket);
                }
                else if (video === "add-ice-candidate") {
                    console.log("inside add ice candidate from : ", role);
                    this.Game.onIceCandidates(roomId, socket, candidate, role);
                }
            }
        });
    }
}
exports.GameManager = GameManager;
