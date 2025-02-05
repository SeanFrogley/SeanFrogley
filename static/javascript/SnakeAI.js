const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerWidth * (9 / 16);

const box = Math.floor(Math.min(canvas.width, canvas.height) / 20);
const rows = Math.floor(canvas.height / box);
const cols = Math.floor(canvas.width / box);

let snake;
let food;
let direction;
let nextDirection;
let isRunning;

const directions = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

const oppositeDirection = {
    UP: directions.DOWN,
    DOWN: directions.UP,
    LEFT: directions.RIGHT,
    RIGHT: directions.LEFT
};

function initializeGame() {
    snake = [
        { x: box * 5, y: box * 5 },
        { x: box * 4, y: box * 5 },
        { x: box * 3, y: box * 5 },
        { x: box * 2, y: box * 5 }
    ];

    food = {
        x: box * Math.floor(Math.random() * cols),
        y: box * Math.floor(Math.random() * rows)
    };

    direction = directions.RIGHT;
    nextDirection = directions.RIGHT;
    isRunning = true;
}

function aStarPathfinding(start, goal) {
    const openSet = [start];
    const cameFrom = {};
    const gScore = { [nodeKey(start)]: 0 };
    const fScore = { [nodeKey(start)]: heuristic(start, goal) };

    const snakeBodySet = new Set(snake.map(nodeKey));

    while (openSet.length > 0) {
        const current = openSet.reduce((acc, node) =>
            fScore[nodeKey(node)] < fScore[nodeKey(acc)] ? node : acc
        );

        if (current.x === goal.x && current.y === goal.y) {
            return reconstructPath(cameFrom, current);
        }

        openSet.splice(openSet.indexOf(current), 1);

        for (const dir of Object.values(directions)) {
            const neighbor = {
                x: current.x + dir.x * box,
                y: current.y + dir.y * box
            };

            if (
                neighbor.x < 0 || neighbor.y < 0 ||
                neighbor.x >= canvas.width || neighbor.y >= canvas.height ||
                snakeBodySet.has(nodeKey(neighbor))
            ) {
                continue;
            }

            const tentativeGScore = gScore[nodeKey(current)] + 1;

            if (tentativeGScore < (gScore[nodeKey(neighbor)] || Infinity)) {
                cameFrom[nodeKey(neighbor)] = current;
                gScore[nodeKey(neighbor)] = tentativeGScore;
                fScore[nodeKey(neighbor)] = tentativeGScore + heuristic(neighbor, goal);

                if (!openSet.some(node => nodeKey(node) === nodeKey(neighbor))) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    return null; // No path found
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance
}

function nodeKey(node) {
    return `${node.x},${node.y}`;
}

function reconstructPath(cameFrom, current) {
    const path = [current];
    while (cameFrom[nodeKey(current)]) {
        current = cameFrom[nodeKey(current)];
        path.unshift(current);
    }
    return path;
}

function draw() {
    if (!isRunning) return;

    const path = aStarPathfinding(snake[0], food);
    if (path && path.length > 1) {
        const nextStep = path[1];
        const newDirection = { x: nextStep.x - snake[0].x, y: nextStep.y - snake[0].y };

        if (
            newDirection.x !== -direction.x * box &&
            newDirection.y !== -direction.y * box
        ) {
            direction = {
                x: newDirection.x / box,
                y: newDirection.y / box
            };
        }
    }

    const head = { x: snake[0].x + direction.x * box, y: snake[0].y + direction.y * box };
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        spawnFood();
    } else {
        snake.pop();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    snake.forEach(segment => {
        ctx.fillStyle = 'lime';
        ctx.fillRect(segment.x, segment.y, box, box);
    });

    // Draw the food
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x, food.y, box, box);
}

// Spawn food at a random position ensuring it doesn't overlap with the snake
function spawnFood() {
    let isValidPosition = false;

    while (!isValidPosition) {
        food = {
            x: box * Math.floor(Math.random() * cols),
            y: box * Math.floor(Math.random() * rows)
        };

        isValidPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

initializeGame();

const game = setInterval(draw, 100);
