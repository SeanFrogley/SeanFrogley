// Get the canvas element and its 2D context for drawing
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Function to resize the canvas based on the window size while maintaining the 16:9 aspect ratio
function resizeCanvas() {
    // Get the width and height of the browser window
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    // Set a fixed box size (can be adjusted based on game requirement)
    const fixedBoxSize = 40; // Size of each box (pixels)

    // Calculate the number of rows based on the height
    const rows = Math.floor(canvasHeight / fixedBoxSize); // Based on window height and box size

    // Calculate the number of columns based on the width
    let cols = Math.floor(canvasWidth / fixedBoxSize); // Based on window width and box size

    // If the width is too small, reduce the number of columns to 20
    if (cols > 20) {
        cols = 20; // Set a maximum of 20 columns
    }

    // Set canvas size based on the window size
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Return the box size, rows, and columns
    return { box: fixedBoxSize, rows, cols };
}


// Recalculate game dimensions on window resize (call the resizeCanvas function)
let { box, rows, cols } = resizeCanvas();

// Initialize game state variables
let snake;
let food;
let direction;
let nextDirection;
let isRunning;

// Define directions for the snake movement (UP, DOWN, LEFT, RIGHT)
const directions = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Define opposite directions to prevent moving in the opposite direction immediately
const oppositeDirection = {
    UP: directions.DOWN,
    DOWN: directions.UP,
    LEFT: directions.RIGHT,
    RIGHT: directions.LEFT
};

// Initialize the game by setting the snake and food
function initializeGame() {
    // Initialize the snake as an array of segments (with starting position)
    snake = [
        { x: box * 5, y: box * 5 },
        { x: box * 4, y: box * 5 },
        { x: box * 3, y: box * 5 },
        { x: box * 2, y: box * 5 }
    ];

    // Randomly generate the food position ensuring it's not on the snake
    food = {
        x: box * Math.floor(Math.random() * cols),
        y: box * Math.floor(Math.random() * rows)
    };

    // Set initial direction and next direction (snake will start moving right)
    direction = directions.RIGHT;
    nextDirection = directions.RIGHT;

    // Set the game state to running
    isRunning = true;
}

// A* Pathfinding algorithm to find the shortest path from the snake to the food
function aStarPathfinding(start, goal) {
    const openSet = [start]; // Set of nodes to be evaluated
    const cameFrom = {}; // Stores the best path
    const gScore = { [nodeKey(start)]: 0 }; // Store the cost of moving from the start to a node
    const fScore = { [nodeKey(start)]: heuristic(start, goal) }; // Estimated cost to reach the goal

    const snakeBodySet = new Set(snake.map(nodeKey)); // Set of snake body positions to avoid

    while (openSet.length > 0) {
        // Get the node in the open set with the lowest fScore
        const current = openSet.reduce((acc, node) =>
            fScore[nodeKey(node)] < fScore[nodeKey(acc)] ? node : acc
        );

        // If the current node is the goal, reconstruct the path
        if (current.x === goal.x && current.y === goal.y) {
            return reconstructPath(cameFrom, current);
        }

        // Remove current node from the open set
        openSet.splice(openSet.indexOf(current), 1);

        // Explore all neighbors of the current node
        for (const dir of Object.values(directions)) {
            const neighbor = {
                x: current.x + dir.x * box,
                y: current.y + dir.y * box
            };

            // If the neighbor is out of bounds or is on the snake, ignore it
            if (
                neighbor.x < 0 || neighbor.y < 0 ||
                neighbor.x >= canvas.width || neighbor.y >= canvas.height ||
                snakeBodySet.has(nodeKey(neighbor))
            ) {
                continue;
            }

            // Calculate the cost to move to this neighbor
            const tentativeGScore = gScore[nodeKey(current)] + 1;

            // If this path to the neighbor is better, update the scores
            if (tentativeGScore < (gScore[nodeKey(neighbor)] || Infinity)) {
                cameFrom[nodeKey(neighbor)] = current;
                gScore[nodeKey(neighbor)] = tentativeGScore;
                fScore[nodeKey(neighbor)] = tentativeGScore + heuristic(neighbor, goal);

                // Add the neighbor to the open set if not already there
                if (!openSet.some(node => nodeKey(node) === nodeKey(neighbor))) {
                    openSet.push(neighbor);
                }
            }
        }
    }
    isRunning = false;
    return null; // No path found
}

// Heuristic function to estimate the distance from node 'a' to node 'b' (Manhattan distance)
function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); // Manhattan distance (sum of horizontal and vertical distances)
}

// Create a unique key for each node (to use in objects and sets)
function nodeKey(node) {
    return `${node.x},${node.y}`;
}

// Reconstruct the path from the start to the goal by following the 'cameFrom' map
function reconstructPath(cameFrom, current) {
    const path = [current]; // Start the path with the current node
    while (cameFrom[nodeKey(current)]) {
        current = cameFrom[nodeKey(current)]; // Move to the previous node in the path
        path.unshift(current); // Add the previous node to the start of the path
    }
    return path;
}

// Function to draw the game on the canvas
function draw() {
    if (!isRunning) return; // If the game is not running, do nothing

    // Find the path to the food using A* pathfinding
    const path = aStarPathfinding(snake[0], food);
    if (path && path.length > 1) {
        // If there's a path, follow the next step
        const nextStep = path[1];
        const newDirection = { x: nextStep.x - snake[0].x, y: nextStep.y - snake[0].y };

        // If the new direction is valid, update the direction
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

    // Move the snake's head in the current direction
    const head = { x: snake[0].x + direction.x * box, y: snake[0].y + direction.y * box };
    snake.unshift(head); // Add the new head to the front of the snake

    // If the snake eats food, spawn new food; otherwise, remove the tail
    if (head.x === food.x && head.y === food.y) {
        spawnFood();
    } else {
        snake.pop(); // Remove the last segment of the snake
    }

    // Clear the canvas before redrawing the game
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each segment of the snake
    snake.forEach(segment => {
        ctx.fillStyle = '#9bffa0'; // Set the fill color for the snake
        ctx.fillRect(segment.x, segment.y, box, box); // Fill the snake segment with lime color
    });

    ctx.fillStyle = 'pink'; // Set the fill color for the food
    ctx.fillRect(food.x, food.y, box, box); // Fill the food with red color
}

// Function to spawn food at a random position not on the snake
function spawnFood() {
    let isValidPosition = false;

    // Keep generating random food positions until it's not on the snake
    while (!isValidPosition) {
        food = {
            x: box * Math.floor(Math.random() * cols),
            y: box * Math.floor(Math.random() * rows)
        };

        // Check if the food is on the snake's body
        isValidPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
    }
}

// Initialize the game state
initializeGame();

// Start the game loop (draw every 100ms)
const game = setInterval(draw, 100);

// Recalculate the game grid and dimensions whenever the window is resized
window.addEventListener('resize', () => {
    // Update the grid dimensions based on the new window size
    ({ box, rows, cols } = resizeCanvas());
    // Re-initialize the game state (this is done to reset the game when resizing)
    initializeGame();
});