import React, { useEffect, useState, useMemo } from 'react';

import './style.css';

const ROWS = 40;
const COLS = 40;
const GAME_SPEED = 10;
const KEY_OFFSET = GAME_SPEED;
const FOOD_SPEED = GAME_SPEED;

const SQUARE_ENUM = {
    BLANK: 0,
    SNAKE: 1,
    FOOD: 2
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

const VALID_KEYPRESS_LIST = [KEYPRESS_ENUM.UP, KEYPRESS_ENUM.RIGHT, KEYPRESS_ENUM.DOWN, KEYPRESS_ENUM.LEFT];

const createDefaultGrid = _ => {
    return new Array(ROWS).fill(null).map(_ => new Array(COLS).fill(SQUARE_ENUM.BLANK));
}

const moveSnake = (snake, direction) => {
    const newPositions = [];
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

    newPositions.push([newX, newY], ...snake);
    newPositions.pop();

    return newPositions;
}

const growSnake = (snake, food) => {
    const newBodyPieces = [];
    const foodSpots = [];
    const snakeHead = snake[0];

    for (const [i, j] of food) {
        if (snakeHead[0] === i && snakeHead[1] === j) {
            newBodyPieces.push([i, j]);
        } else {
            foodSpots.push([i, j]);
        }
    }

    return [newBodyPieces, foodSpots];
}

const updateBoard = (snake, food) => {
    const newBoard = createDefaultGrid();

    for (const [i, j] of food) {
        newBoard[i][j] = SQUARE_ENUM.FOOD;
    }

    for (const [i, j] of snake) {
        newBoard[i][j] = SQUARE_ENUM.SNAKE;
    }

    return newBoard;
}

const updateGame = (snake, direction, food) => {
    const [newBodyPieces, updatedFoodSpots] = growSnake(snake, food);
    const updatedSnake = [...moveSnake(snake, direction), ...newBodyPieces];
    const updatedBoard = updateBoard(updatedSnake, food);
    return [updatedSnake, updatedBoard, updatedFoodSpots];
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

const getSquareType = squareValue => {
    switch (squareValue) {
        case SQUARE_ENUM.BLANK:
            return '';
        case SQUARE_ENUM.SNAKE:
            return 'snake';
        case SQUARE_ENUM.FOOD:
            return 'food';
        default:
            return '';
    }
}

const isGameOver = snake => {
    const seenBodyPieces = new Set();

    for (const [x, y] of snake) {
        if (seenBodyPieces.has(`${x}#${y}`)) return true;
        seenBodyPieces.add(`${x}#${y}`);
    }

    return false;
}

const getSquare = (grid, i, j) => <div key={`${i + KEY_OFFSET}-${j + KEY_OFFSET}`} className={`square ${getSquareType(grid[i][j])}`} />

const Grid = () => {
    const startingPoint = useMemo(() => ([Math.floor(Math.random() * ROWS), Math.floor(Math.random() * COLS)]), []);

    const [snake, setSnake] = useState([startingPoint]);
    const [food, setFood] = useState([]);
    const [grid, setGrid] = useState(updateBoard(snake, food));
    const [running, setRunning] = useState(false);
    const [direction, setDirection] = useState(null);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        const moveHandler = handleKeyPress(setRunning, setDirection);
        window.addEventListener('keydown', moveHandler);
        return () => window.removeEventListener('keydown', moveHandler);
    }, []);

    useEffect(() => {
        if (isGameOver(snake)) {
            setRunning(false);
            setGameOver(true);
        }
        
        if (running) {
            const id = setInterval(() => {
                const [updatedSnake, updatedBoard, updatedFoodSpots] = updateGame(snake, direction, food);
                setSnake(updatedSnake);
                setGrid(updatedBoard);
                setFood(updatedFoodSpots);
            }, GAME_SPEED);

            return () => clearInterval(id);
        }
    }, [snake, grid, direction, running, food]);

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
    }, [running, food])

    return (
        <>
            <div className='grid' style={{ display: 'grid', gridTemplateColumns: `repeat(${ROWS}, 20px)`}}>
                {grid.map((row, i) => {
                    return (
                        <div key={`${i + GAME_SPEED}`}>
                            {row.map((_, j) => getSquare(grid, i, j))}    
                        </div>
                    )
                })}
            </div>
        </>
    )
}

export default Grid;