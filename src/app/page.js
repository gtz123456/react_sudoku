'use client'

import { useState } from 'react';

function Cell({ value, updateCell, getCandidates, generated }) {
  // display the value in a cell if value is not null, otherwise display Candidate component

  return (
    <div className={`w-20 h-20 text-2xl border border-gray-300 flex items-center justify-center ${!generated && 'bg-emerald-50'}`} onClick={() => {if(value&&!generated) updateCell(null)}}>
      {value ? value : <Candidate candidates={getCandidates()} updateCell={updateCell} />}
    </div>
  );
}

function Candidate({ candidates, updateCell }) {
  // display the possible values in a cell
  // display numbers 1-9 in a 3x3 grid, and hide the numbers that are already in the row, column, or 3x3 grid

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1 text-lg">
      {candidates.map((candidate, index) => (
        <div key={index} className={`w-5 h-5 border border-gray-300 flex items-center justify-center ${candidate ? 'text-black' : 'text-gray-300'} hover:bg-green-100`} onClick={() => updateCell(index+1)}>
          {index + 1}
        </div>
      ))}
    </div>
  );

}

function Board() {
  // The board is a 9x9 grid for a sudoku puzzle
  
  const [board, setBoard] = useState(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null)));
  const [conflict, setConflict] = useState(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false)));

  const [generated, setGenerated] = useState(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false)));

  const [vacant, setVacant] = useState(30);

  function generateBoard() {
    // Generate a new board
    
    // Ramdomly fill the 1, 5, 9 blocks, and try to solve the board.
    // If the board is not solvable, reset the board and try again.
    // If the board is solvable, remove some numbers to create a puzzle.

    // generate a shuffled array to initialize the 1, 5, 9 blocks
    function getShuffledArray() {
      let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    // fill the 1, 5, 9 blocks
    function fillblocks() {
      let block1 = getShuffledArray();
      let block5 = getShuffledArray();
      let block9 = getShuffledArray();
  
      let newBoard = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null));
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          newBoard[i][j] = block1[i*3+j];
          newBoard[i+3][j+3] = block5[i*3+j];
          newBoard[i+6][j+6] = block9[i*3+j];
        }
      }  
      return newBoard;
      
    }

    let newBoard;

    while (true) {
      newBoard = fillblocks();
      console.log("try to generate board");
      if (solveBoard(newBoard)) {
        break;
      }
    }

    // Remove some numbers to create a puzzle
    // Doesn't guarantee a unique solution

    const remove = Array(vacant).fill(true).concat(Array(81 - vacant).fill(false));

    for (let i = remove.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [remove[i], remove[randomIndex]] = [remove[randomIndex], remove[i]];
    }

    setBoard(newBoard.map((row, rowIndex) => (
      row.map((value, colIndex) => (
        remove[rowIndex*9+colIndex] ? null : value
      ))
    )));

    setGenerated(newBoard.map((row, rowIndex) => (
      row.map((value, colIndex) => (
        remove[rowIndex*9+colIndex] ? false : true
      ))
    )));
  }

  function updateCell(row, col) {
    // Update the current board with the new value
    return function(newValue) {
      const newBoard = board.map((r, rowIndex) => (
        r.map((v, colIndex) => (
          rowIndex === row && colIndex === col ? newValue : v
        ))
      ));
      setBoard(newBoard);
    }
  }

  function clearBoard() {
    // Clear the current board
    setBoard(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null)));
  }

  function saveBoard() {
    // Save the current board to local storage
    localStorage.setItem('board', JSON.stringify(board));
  }

  function loadBoard() {
    // Load the board from local storage
    const savedBoard = JSON.parse(localStorage.getItem('board'));
    if (savedBoard) {
      setBoard(savedBoard);
    }
  }

  function checkBoard() {
    // Check the current board and mark conflict cells
    // If the puzzle is solved, display a success message

    let conflict = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false));

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j]) {
          let value = board[i][j];
          for (let k = 0; k < 9; k++) {
            if (board[i][k] === value && k !== j) {
              conflict[i][k] = true;
              conflict[i][j] = true;
            }
            if (board[k][j] === value && k !== i) {
              conflict[k][j] = true;
              conflict[i][j] = true;
            }
          }

          let r = i - i % 3;
          let c = j - j % 3;
          for (let k = r; k < r + 3; k++) {
            for (let l = c; l < c + 3; l++) {
              if (board[k][l] === value && k !== i && l !== j) {
                conflict[k][l] = true;
                conflict[i][j] = true;
              }
            }
          }
        }
      }
    }

    setConflict(conflict);

    let solved = true;
  }

  function solveBoard(newBoard) {
    // Solve the board using backtracking algorithm

    function solve() {
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (newBoard[i][j] === null) {
            for (let value = 1; value <= 9; value++) {
              newBoard[i][j] = value;
              if (isValid(i, j) && solve()) {
                return true;
              }
              newBoard[i][j] = null;
            }
            return false;
          }
        }
      }
      return true;
    }

    function isValid(row, col) {
      let value = newBoard[row][col];

      for (let i = 0; i < 9; i++) {
        if (newBoard[row][i] === value && i !== col) {
          return false;
        }
        if (newBoard[i][col] === value && i !== row) {
          return false;
        }
      }

      let r = row - row % 3;
      let c = col - col % 3;
      for (let i = r; i < r + 3; i++) {
        for (let j = c; j < c + 3; j++) {
          if (newBoard[i][j] === value && i !== row && j !== col) {
            return false;
          }
        }
      }

      return true;
    }

    return solve();

  }

  function getCandidates(row, col) {
    // get the possible values for the cell
    return function() {
      let res = [true, true, true, true, true, true, true, true, true];

      // check the row, column
      for (let i = 0; i < 9; i++) {
        if (board[row][i]) {
          res[board[row][i] - 1] = false;
        }
        if (board[i][col]) {
          res[board[i][col] - 1] = false;
        }
      }

      // check the 3x3 grid
      let r = row - row % 3;
      let c = col - col % 3;
      for (let i = r; i < r + 3; i++) {
        for (let j = c; j < c + 3; j++) {
          if (board[i][j]) {
            res[board[i][j] - 1] = false;
          }
        }
      }

      return res;
    }

  }

  // Display the board as a 9x9 grid of cells
  return (
    <>
      <div className="grid grid-cols-9 grid-rows-9 gap-1">
        {board.map((row, rowIndex) => (
          row.map((value, colIndex) => (
            <Cell key={rowIndex*9+colIndex} value={value} updateCell={updateCell(rowIndex,colIndex)} getCandidates={getCandidates(rowIndex,colIndex)} generated={generated[rowIndex][colIndex]} />
          ))
        ))}
      </div>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={generateBoard}>Generate</button>
    </>
  );


}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold text-center">Sudoku</h1>
      <Board />
    </main>
  );
}
