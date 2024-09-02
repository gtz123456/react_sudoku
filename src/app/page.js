'use client'

import { useState, useEffect, useRef } from 'react';

import Timer from '../components/timer.js';

function Cell({ value, updateCell, getCandidates, generated, conflict }) {
  // display the value in a cell if value is not null, otherwise display Candidate component

  return (
    <div className={`w-20 h-20 text-2xl border border-gray-300 flex items-center justify-center ${!generated && 'bg-emerald-50'} ${!generated && conflict && 'text-red-600'}`} onClick={() => {if(value&&!generated) updateCell(null)}}>
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

  const [steps, setSteps] = useState([]); // Record user's steps so that we can undo the steps

  const [vacant, setVacant] = useState(30);

  const timerRef = useRef(null);

  function undo() {
    // Undo the last step
    if (steps.length > 0) {
      let newsteps = [...steps];
      let [row, col] = newsteps.pop();
      setSteps(newsteps);

      const newBoard = board.map(row => row.slice());
      newBoard[row][col] = null;
      setBoard(newBoard);
      checkBoard(newBoard);
    }
  }

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

    let newBoard;

    while (true) {
      newBoard = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null));

      // Fill the 1, 5, 9 blocks
      let block1 = getShuffledArray();
      let block5 = getShuffledArray();
      let block9 = getShuffledArray();
  
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          newBoard[i][j] = block1[i*3+j];
          newBoard[i+3][j+3] = block5[i*3+j];
          newBoard[i+6][j+6] = block9[i*3+j];
        }
      }   

      let solvedBoard = solveBoard(newBoard);
      
      if (solveBoard) {
        newBoard = solvedBoard;
        break;
      }
    }

    // Remove some numbers to create a puzzle
    // Doesn't guarantee a unique solution
    console.log(timerRef);
    if (timerRef.current) {
      console.log('reset timer');
      
      timerRef.current.resetTimer();  // Reset the timer
      timerRef.current.startTimer();  // Start the timer
    }

    console.log(vacant, 81 - vacant);
    let remove = [...Array(81).keys()].map((i) => i < vacant); // Array(vacant).fill(true).concat(Array(81 - vacant).fill(false));

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
      row.map((value, colIndex) => (!remove[rowIndex*9+colIndex]))
    )));

    setSteps([]);
  }

  function updateCell(row, col) {
    // Update the current board with the new value
    return function(newValue) {
      const newBoard = board.map(row => row.slice());
      newBoard[row][col] = newValue;
      setBoard(newBoard);
      checkBoard(newBoard);
      setSteps([...steps, [row, col]]);
    }
  }

  function clearBoard() {
    // Clear the current board
    setBoard(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null)));
    setGenerated(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => false)));
  }

  function saveBoard() {
    // Save the current board to local storage
    localStorage.setItem('board', JSON.stringify(board));
    localStorage.setItem('generated', JSON.stringify(generated));
  }

  function loadBoard() {
    // Load the board from local storage
    const savedBoard = JSON.parse(localStorage.getItem('board'));
    const savedGenerated = JSON.parse(localStorage.getItem('generated'));
    if (savedBoard) {
      setBoard(savedBoard);
      setGenerated(savedGenerated);
    }
  }

  function checkBoard(board) {
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

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (!board[i][j] || conflict[i][j]) {
          solved = false;
        }
      }
    }

    if (solved) {
      if (timerRef.current) {
        timerRef.current.stopTimer();
      }
      alert('Congratulations! You have solved the puzzle!');
    }
  }

  function solveBoard(board) {
    // Solve the board using backtracking algorithm
    let newBoard = board.map(row => row.slice());

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

    return solve() ? newBoard : null;

  }

  function solve() {
    // Solve the current board
    let newBoard = solveBoard(board);
    if (newBoard) {
      setBoard(newBoard);
    }
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
      <Timer ref={timerRef} />
      <div className={'grid grid-cols-9 grid-rows-9 gap-1'}>
        {board.map((row, rowIndex) => (
          row.map((value, colIndex) => (
            <Cell key={rowIndex*9+colIndex} value={value} updateCell={updateCell(rowIndex,colIndex)} getCandidates={getCandidates(rowIndex,colIndex)} generated={generated[rowIndex][colIndex]} conflict={conflict[rowIndex][colIndex]}/>
          ))
        ))}
      </div>
      <div className={'flex space-x-4'}>
        <button className="w-32 h-12 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={generateBoard}>Generate</button>
        <button className="w-32 h-12 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={clearBoard}>Clear</button>
        <button className="w-32 h-12 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={saveBoard}>Save</button>
        <button className="w-32 h-12 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={loadBoard}>Load</button>
        <button className="w-32 h-12 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={solve}>Solve</button>
        <button className="w-32 h-12 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={undo}>Undo</button>
      </div>

      <div className={'flex flex-col items-center'}>
        <div> Settings </div>
        <div className={'flex space-x-4 items-center'}>
          <p className='w-16'> Vacant </p>
          <input className='w-16 text-center border rounded border-emerald-200' type="number" value={vacant} onChange={(e) => setVacant(e.target.value)} />
        </div>
        
      </div>
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
