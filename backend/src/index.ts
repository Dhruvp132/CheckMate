import {WebSocketServer} from "ws"
import { GameManager } from "./GameManager";

const wss = new WebSocketServer({ port: 8080 })

const gameManager = new GameManager();

wss.on("connection", function connection(ws) {
    // ws.on('join', () => {
    gameManager.addUser(ws)
    // })
    ws.on('disconnect', () => { gameManager.removeUser(ws)})
    // On your server when a WebSocket closes
    ws.on('close', () => {
        // Find the room and other user
        gameManager.removeUser(ws)
    });
})