import { WebSocket } from "ws";
import { INIT_GAME, MOVE, VIDEO } from "./messages";
import { Game } from "./Game";

//User class and Game Class 
export class GameManager {
    private games: Game[];
    private pendingUser: WebSocket | null;
    private users: WebSocket[];
    private Game: Game; 

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
        this.Game = new Game(); 
    }

    addUser(socket: WebSocket) {
        this.users.push(socket);
        console.log("inside adduser")
        this.clearQueue(socket); 
        socket.send(JSON.stringify({type : VIDEO, video : "lobby"}));
        this.initHandler(socket)
    }

    clearQueue(socket: WebSocket) { 
        // console.log("inside clear games")
        // console.log(this.games.length)
        // if(this.users.length < 2) return; 

        // const user1 = this.users.pop();
        // const user2 = this.users.pop();
        
        // if(!user1 || !user2) return;

        // console.log("creating game")
        // const game = this.Game.createRoom(user1, user2);
        // // this.games.push(game);
        // this.clearQueue();
        console.log("inside initgame")
        if (this.pendingUser) {
            // const game = new Game(this.pendingUser, socket);
            this.Game.createRoom(this.pendingUser, socket);
            // this.games.push(game);
            console.log("=+===============")
            console.log(this.games.length)
            this.pendingUser = null;
            //maintain a list of all the users 100 games where there are 100 current users
        } else {
            this.pendingUser = socket;
        }
    }

    removeUser(socket: WebSocket) {
        this.users = this.users.filter(user => user !== socket);
        // Stop the game here because the user left 
        //TODO: this is also not the great as because you also need to have the reconnect logic here 
    }

    //TODO : use grpc call to the game server
    private initHandler(socket: WebSocket) {
        console.log("inside addHandler")
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());

            // if (message.type === INIT_GAME) {
            //     console.log("inside initgame")
            //     if (this.pendingUser) {
            //         // const game = new Game(this.pendingUser, socket);
            //         this.Game.createRoom(this.pendingUser, socket);
            //         // this.games.push(game);
            //         console.log("=+===============")
            //         console.log(this.games.length)
            //         this.pendingUser = null;
            //         //maintain a list of all the users 100 games where there are 100 current users
            //     } else {
            //         this.pendingUser = socket;
            //     }
            //     // this.clearQueue();
            // }

            if (message.type === MOVE) {
                console.log("inside move")

                const roomId = message.roomId;
                console.log("roomId is " + roomId + "and move made is " + message.payload.move)
                // const game = this.games.find(game => game.player1 === socket || game.player2 === socket);
                // if (game) {
                //     console.log("inside makemove")
                this.Game.makeMove(roomId, socket, message.payload.move);
                // }
            }


            if (message.type === VIDEO) {
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
                    console.log("inside offer")
                    const { sdp } = message.payload;
                    if (sdp && roomId) {
                        console.log(`Processing offer for room: ${roomId}`)
                        this.Game.onOffer(roomId, sdp, socket);
                    } else {
                        console.error("Invalid offer: missing sdp or roomId");
                    }
                } else if (video === "answer") {
                    console.log("inside answer")
                    const { sdp } = message.payload;
                    if (sdp && roomId) {
                        console.log(`Processing answer for room: ${roomId}`)
                        this.Game.onAnswer(roomId, sdp, socket);
                    } else {
                        console.error("Invalid answer: missing sdp or roomId");
                    }
                } else if (video === "add-ice-candidate") {
                    console.log("inside add ice candidate from : ", role)
                    if (candidate && roomId) {
                        this.Game.onIceCandidates(roomId, socket, candidate, role);
                    } else {
                        console.error("Invalid ice candidate: missing candidate or roomId");
                    }
                }
            }
        })
    }
}