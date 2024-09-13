import { Drawer } from "antd";
import React, { useState } from "react";

const TicTacToePanel = () => {
  const [gridSize, setGridSize] = useState(5);
  const [board, setBoard] = useState(Array(5 * 5).fill(null));
  const [xIsNext, setXIsNext] = useState(false);
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);

  const handleSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setGridSize(newSize);
    setBoard(Array(newSize * newSize).fill(null));
    setWinner(null);
    setXIsNext(true);
  };

  const handleClick = (index) => {
    if (board[index] || winner) return;

    const newBoard = board.slice();
    newBoard[index] = xIsNext ? "X" : "O";
    setBoard(newBoard);
    setXIsNext(!xIsNext);

    const result = calculateWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.winningLine); // Lưu đường thắng
    }
  };

  const calculateWinner = (board) => {
    const lines = generateWinningLines(gridSize);

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c, d, e] = lines[i];
      if (
        board[a] &&
        board[a] === board[b] &&
        board[a] === board[c] &&
        board[a] === board[d] &&
        board[a] === board[e]
      ) {
        return { winner: board[a], winningLine: [a, b, c, d, e] };
      }
    }
    return null;
  };

  const generateWinningLines = (size) => {
    const lines = [];

    // Các hàng
    for (let i = 0; i < size; i++) {
      for (let j = 0; j <= size - 5; j++) {
        lines.push([
          i * size + j,
          i * size + j + 1,
          i * size + j + 2,
          i * size + j + 3,
          i * size + j + 4,
        ]);
      }
    }

    // Các cột
    for (let i = 0; i < size; i++) {
      for (let j = 0; j <= size - 5; j++) {
        lines.push([
          j * size + i,
          (j + 1) * size + i,
          (j + 2) * size + i,
          (j + 3) * size + i,
          (j + 4) * size + i,
        ]);
      }
    }

    // Đường chéo chính
    for (let i = 0; i <= size - 5; i++) {
      for (let j = 0; j <= size - 5; j++) {
        lines.push([
          i * size + j,
          (i + 1) * size + j + 1,
          (i + 2) * size + j + 2,
          (i + 3) * size + j + 3,
          (i + 4) * size + j + 4,
        ]);
      }
    }

    // Đường chéo phụ
    for (let i = 0; i <= size - 5; i++) {
      for (let j = 4; j < size; j++) {
        lines.push([
          i * size + j,
          (i + 1) * size + j - 1,
          (i + 2) * size + j - 2,
          (i + 3) * size + j - 3,
          (i + 4) * size + j - 4,
        ]);
      }
    }

    return lines;
  };

  const renderSquare = (index) => {
    const isWinningSquare = winningLine.includes(index);
    return (
      <button
        className={`square ${isWinningSquare ? "winning-square" : ""}`}
        onClick={() => handleClick(index)}
      >
        {board[index]}
      </button>
    );
  };

  const renderBoard = () => {
    let squares = [];
    for (let i = 0; i < gridSize; i++) {
      let row = [];
      for (let j = 0; j < gridSize; j++) {
        row.push(renderSquare(i * gridSize + j));
      }
      squares.push(
        <div className="board-row" key={i}>
          {row}
        </div>
      );
    }
    return squares;
  };

  return (
    <Drawer>
      <button
        onClick={() => {
          setWinningLine([]);
          setBoard([]);
        }}
      >
        reset
      </button>
      <label>
        Board Size:
        <input
          type="number"
          value={gridSize}
          onChange={handleSizeChange}
          min="5"
          max="10"
        />
      </label>
      {winner ? (
        <h2>Winner: {winner}</h2>
      ) : (
        <h2>Next Player: {xIsNext ? "X" : "O"}</h2>
      )}
      <div className="board">{renderBoard()}</div>
    </Drawer>
  );
};

export default TicTacToePanel;
