/* eslint-disable @typescript-eslint/no-unused-vars */
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";
import { MOVE } from "../screens/Game1";

export const ChessBoard = ({ chess, board, socket, setBoard, color, roomId, started }: {
    chess: Chess;
    setBoard: React.Dispatch<React.SetStateAction<({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][]>>;
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket: WebSocket | null;
    color : "white" | "black";  
    roomId : string, 
    started : boolean
}) => {
    const [from, setFrom] = useState<null | Square>(null);
    const [selectedSquare, setSelectedSquare] = useState<null | Square>(null);

    const getPieceColor = (square: Square) => {
        const piece = chess.get(square);
        return piece ? piece.color : null;
    };

    if(!started) { 
        return <div className="m-6 text-white-200">
            {board.map((row, i) => {
                return <div key={i} className="flex">
                    {row.map((square, j) => {
                        return <div key={j} className={`w-16 h-16 ${(i+j)%2 === 0 ? 'bg-light-brown' : 'bg-slate-500'}`}>
                            <div className="w-full justify-center flex h-full">
                                <div className="h-full justify-center flex flex-col">
                                    {square ? <img className="w-4" src={`/${square?.color === "b" ? square?.type : `${square?.type?.toUpperCase()} copy`}.png`} /> : null} 
                                </div>
                            </div>
                        </div>
                    })}
                </div>
            })}
        </div>
    }
    return <div className="m-6 text-white-200">
        {board.map((row, i) => {
            return <div key={i} className="flex">
                {row.map((square, j) => {
                    const squareRepresentation = String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;
                    const isSelected = squareRepresentation === selectedSquare;

                    return <div onClick={() => {
                        const pieceColor = getPieceColor(squareRepresentation);
                        const mappedPieceColor = pieceColor === 'w' ? 'white' : 'black';

                        if (!from) {
                            // If no piece is selected, ensure the player selects their own piece
                            if (pieceColor && mappedPieceColor === color) {
                                setFrom(squareRepresentation);
                                setSelectedSquare(squareRepresentation);
                            } else {
                                alert(`You are not allowed to move ${mappedPieceColor} pieces.`);
                            }
                            setFrom(squareRepresentation);
                        } else {
                            socket?.send(JSON.stringify({
                                type: MOVE,
                                roomId,
                                payload: {
                                    move: {
                                        from: from,
                                        to: squareRepresentation
                                    }
                                }
                            }));        
                            setFrom(null);
                            setSelectedSquare(null);
                            chess.move({
                                from: from,
                                to: squareRepresentation
                            });
                            setBoard(chess.board());
                            console.log({
                                from: from,
                                to: squareRepresentation
                            });
                        }

                    }} key={j} className={`w-16 h-16 ${(i+j)%2 === 0 ? 'bg-light-brown' : 'bg-slate-500'} ${isSelected ? 'border-4 border-cyan-500 rounded-full' : ''}`}>
                        <div className="w-full justify-center flex h-full">
                            <div className="h-full justify-center flex flex-col">
                                {square ? <img className="w-4" src={`/${square?.color === "b" ? square?.type : `${square?.type?.toUpperCase()} copy`}.png`} /> : null} 
                            </div>
                        </div>
                    </div>
                })}
            </div>
        })}
    </div>
}