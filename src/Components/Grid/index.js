import React, { useEffect, useState } from 'react';
import produce, {enableMapSet} from 'immer';

import './style.css';

enableMapSet();

const ROWS = 40;
const COLS = 40;
const GAME_SPEED = 0;
const KEY_OFFSET = GAME_SPEED;
const FOOD_SPEED = GAME_SPEED;

const SQUARE_ENUM = {
    BLANK: 0,
    SNAKE: 1,
    FOOD: 2,
    WALL: 3
}

const DIRECTION_ENUM = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
}

const KEYPRESS_ENUM = {
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    LEFT: 37
}

const getSquareType = squareValue => {
    switch (squareValue) {
        case SQUARE_ENUM.BLANK:
            return '';
        case SQUARE_ENUM.SNAKE:
            return 'snake';
        case SQUARE_ENUM.FOOD:
            return 'food';
        case SQUARE_ENUM.WALL:
            return 'wall';
        default:
            return '';
    }
}

const VALID_KEYPRESS_LIST = [KEYPRESS_ENUM.UP, KEYPRESS_ENUM.RIGHT, KEYPRESS_ENUM.DOWN, KEYPRESS_ENUM.LEFT];

const createDefaultGrid = _ => new Array(ROWS).fill(null).map(_ => new Array(COLS).fill(SQUARE_ENUM.BLANK));

const getNewHeadLocation = (snake, direction) => {
    const [x, y] = snake[0];
    let newX;
    let newY;

    switch (direction) {
        case DIRECTION_ENUM.UP:
            newX = x;
            newY = y - 1;
            break;
        case DIRECTION_ENUM.RIGHT:
            newX = x + 1;
            newY = y;
            break;
        case DIRECTION_ENUM.DOWN:
            newX = x;
            newY = y + 1;
            break;
        case DIRECTION_ENUM.LEFT:
            newX = x - 1;
            newY = y;
            break;
        default:
            newX = x;
            newY = y;
    }

    newX = newX < 0 ? ROWS - 1 : newX;
    newX = newX >= ROWS ? 0 : newX;
    newY = newY < 0 ? COLS - 1 : newY;
    newY = newY >= COLS ? 0 : newY;

    return [newX, newY];
}

const updateSnake = (snake, direction, food) => {
    const newPositions = [];
    const newHeadPosition = getNewHeadLocation(snake, direction);    

    newPositions.push(newHeadPosition, ...snake);
    
    const removedTail = newPositions.pop();
    const [x, y] = newHeadPosition;

    for (const [i, j] of food) {
        if (x === i && y === j) {
            newPositions.push(removedTail);
            break;       
        }
    }

    return newPositions;
}

const updateFood = (snake, food) => {
    const newPositions = [];
    const [x, y] = snake[0];

    for (const [i, j] of food) {
        if (x !== i || y !== j) {
            newPositions.push([i, j]);
        }
    }

    return newPositions;
}

const updateBoard = (snake, food, wall) => {
    const newBoard = createDefaultGrid();

    for (const [i, j] of food) {
        newBoard[i][j] = SQUARE_ENUM.FOOD;
    }

    for (const [i, j] of snake) {
        newBoard[i][j] = SQUARE_ENUM.SNAKE;
    }

    for (const value of wall.values()) {
        const [i, j] = value.split('#');
        newBoard[i][j] = SQUARE_ENUM.WALL;
    }

    return newBoard;
}

const updateGame = (snake, direction, food, wall) => {
    const updatedSnake = updateSnake(snake, direction, food);
    const updatedFood = updateFood(snake, food);
    const updatedBoard = updateBoard(updatedSnake, food, wall);
    return [updatedSnake, updatedFood, updatedBoard];
}

const handleKeyPress = (setRunning, setDirection) => e => {
    const keyPress = e.keyCode;

    if (!VALID_KEYPRESS_LIST.includes(keyPress)) return;
    
    setRunning(true);

    switch (keyPress) {
        case KEYPRESS_ENUM.UP:
            return setDirection(DIRECTION_ENUM.UP);
        case KEYPRESS_ENUM.RIGHT:
            return setDirection(DIRECTION_ENUM.RIGHT);
        case KEYPRESS_ENUM.DOWN:
            return setDirection(DIRECTION_ENUM.DOWN);
        case KEYPRESS_ENUM.LEFT:
            return setDirection(DIRECTION_ENUM.LEFT);
        default:
            return;
    }
}

const isGameOver = (grid, snake) => {
    const seenBodyPieces = new Set();
    const [x, y] = snake[0];

    for (const [x, y] of snake) {
        if (seenBodyPieces.has(`${x}#${y}`)) return true;
        seenBodyPieces.add(`${x}#${y}`);
    }

    return grid[x][y] === SQUARE_ENUM.WALL;
}

const getStartingPoint = () => [Math.floor(Math.random() * ROWS), Math.floor(Math.random() * COLS)];

// const getLevel = length => {
//     switch (true) {
//         case length > 30:
//             return 'an expert';
//         case length > 20:
//             return 'a seasoned'
//         case length > 10:
//             return 'an intermediate'
//         default:
//             return 'a beginner';
//     }
// }

const Grid = () => {
    const [gameOver, setGameOver] = useState(false);
    const [snake, setSnake] = useState([getStartingPoint()]);
    const [food, setFood] = useState([]);
    const [wall, setWall] = useState(new Set());
    const [grid, setGrid] = useState(updateBoard(snake, food, wall));
    const [running, setRunning] = useState(false);
    const [direction, setDirection] = useState(null);

    const resetGame = () => {
        setSnake([getStartingPoint()]);
        setFood([]);
        setWall(new Set());
        setDirection(null);
        setGameOver(false);        
    }

    const handleSquareClick = (i, j) => _ => {
        const updatedWallList = produce(wall, wallCopy => {
            if (wallCopy.has(`${i}#${j}`)) {
                wallCopy.delete(`${i}#${j}`);
            } else {
                wallCopy.add(`${i}#${j}`);
            }
        });

        setWall(updatedWallList);
        const updatedBoard = updateBoard(snake, food, updatedWallList);
        setGrid(updatedBoard);
    }

    const handleRandomButtonClick = () => {
        const wallList = new Set();

        for (let i = 0; i < ROWS; i++) {
            const randomXCoord = Math.floor(Math.random() * ROWS);
            const randomYCoord = Math.floor(Math.random() * COLS);
            wallList.add(`${randomXCoord}#${randomYCoord}`);
        }

        setWall(wallList);
        const updatedBoard = updateBoard(snake, food, wallList);
        setGrid(updatedBoard);
    }

    useEffect(() => {
        setGrid(updateBoard(snake, food, wall));
    }, [gameOver])

    useEffect(() => {
        const moveHandler = handleKeyPress(setRunning, setDirection);
        window.addEventListener('keydown', moveHandler);
        return () => window.removeEventListener('keydown', moveHandler);
    }, []);

    useEffect(() => {
        if (isGameOver(grid, snake)) {
            setRunning(false);
            setGameOver(true);
        }
        
        if (running) {
            const id = setInterval(() => {
                const [updatedSnake, updatedFood, updatedBoard] = updateGame(snake, direction, food, wall);
                setSnake(updatedSnake);
                setFood(updatedFood);
                setGrid(updatedBoard);
            }, GAME_SPEED);

            return () => clearInterval(id);
        }
    }, [snake, grid, direction, running, food, wall]);

    useEffect(() => {
        if (running) {
            const id = setInterval(() => {
                if (food.length === ROWS * COLS) return;

                while (true) {
                    const foodPos = [Math.floor(Math.random() * ROWS), Math.floor(Math.random() * COLS)];
                    
                    if (!food.some(pos => pos[0] === foodPos[0] && pos[1] === foodPos[1])) {
                        return setFood(foodList => [...foodList, foodPos]);
                    }
                }

            }, FOOD_SPEED);

            return () => clearInterval(id);
        }
    }, [running, food]);

    return (
        <div className='app'>
            <div className='container'>
                <h1 className='title'>&#128013; Frenzy</h1>
                <h3>Instructions:</h3>
                <ul>
                    <li>1. Place walls by clicking on any square or if you're feeling adventurous, by clicking <span className='random-walls-text'onClick={handleRandomButtonClick}>here</span><span className='hand-emoji'>&#128072;</span></li>
                    <li>2. Eat as much as you can without hitting a wall or eating yourself</li>
                    <li>3. Press any arrow key on your keyboard to get started</li>
                </ul>
                { gameOver && (
                    <div className='game-over'>
                        <h1>Ouch! You are dead</h1>
                        {/* <p>{`A snake ${snake.length} ${snake.length === 1 ? 'block' : 'blocks'} long makes you ${getLevel(snake.length)} snake`}</p> */}
                        <div className='restart' onClick={resetGame}><span>Try Again</span></div>
                    </div>
                )}
                <div className='grid' style={{ display: 'grid', gridTemplateColumns: `repeat(${ROWS}, 20px)`}}>
                    {grid.map((row, i) => {
                        return (
                            <div key={`${i + GAME_SPEED}`}>
                                {row.map((_, j) => (
                                    <div
                                        key={`${i + KEY_OFFSET}-${j + KEY_OFFSET}`}
                                        className={`square ${getSquareType(grid[i][j])}`}
                                        onClick={handleSquareClick(i, j)}
                                    />
                                ))}    
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default Grid;