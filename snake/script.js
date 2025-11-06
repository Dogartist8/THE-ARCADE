// --- ⚙️ DEFAULT GAME SETTINGS ---
let settings = {
    gridSize: 20,
    tileSize: 20,
    gameSpeed: 150,       // Default speed (Medium)
    headColor: '#00AA00',
    tailColor: '#00FF00',
    foodColor: '#FF0000',
    bgColor: '#000000',
    wallsAreSolid: true,
    zenMode: false
};
// --- End of Settings ---


// --- Gradient Helper Functions ---
function hexToRgb(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function lerp(start, end, amount) {
    return Math.floor(start + (end - start) * amount);
}
// --- END Helper Functions ---

// --- Game Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// --- Settings Menu DOM Elements ---
const saveBtn = document.getElementById('settings-save');
// Inputs
const easyRadio = document.getElementById('diff-easy');
const mediumRadio = document.getElementById('diff-medium');
const hardRadio = document.getElementById('diff-hard');
const wallsCheck = document.getElementById('toggle-walls');
const zenCheck = document.getElementById('toggle-zen');
const headColorInput = document.getElementById('color-head');
const tailColorInput = document.getElementById('color-tail');
const foodColorInput = document.getElementById('color-food');
const bgColorInput = document.getElementById('color-bg');

// --- Game State ---
let snake = [];
let food = {};
let direction = { x: 0, y: 0 };
let score = 0;
let isGameOver = false;
let gameLoop;
let isPaused = false; // Pause is now independent

// Color variables (will be set from settings)
let START_COLOR_RGB;
let END_COLOR_RGB;

/**
 * Applies settings from the 'settings' object to the game
 */
function applySettings() {
    canvas.width = settings.gridSize * settings.tileSize;
    canvas.height = settings.gridSize * settings.tileSize;
    START_COLOR_RGB = hexToRgb(settings.headColor);
    END_COLOR_RGB = hexToRgb(settings.tailColor);
}

/**
 * Initializes or resets the game state
 */
function resetGame() {
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    applySettings(); 

    snake = [];
    const startX = Math.floor(settings.gridSize / 2);
    const startY = Math.floor(settings.gridSize / 2);
    snake.push({ x: startX, y: startY });

    direction = { x: 1, y: 0 };
    score = 0;
    scoreElement.textContent = score;
    isGameOver = false;
    isPaused = false;

    placeFood();
    gameLoop = setInterval(mainGameLoop, settings.gameSpeed);
}

/**
 * The main loop that runs every frame
 */
function mainGameLoop() {
    if (isGameOver) {
        // ... (Game Over logic) ...
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FF0000';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText('Press "Space" to Restart', canvas.width / 2, canvas.height / 2 + 20);
        
        clearInterval(gameLoop);
        return;
    }

    if (isPaused) {
        drawPausedScreen("PAUSED"); // Simplified pause
        return; 
    }

    update();
    draw();
}

/**
 * Draws the "Paused" overlay
 */
function drawPausedScreen(text) {
    draw(); // Draw the game state first
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

/**
 * Updates the game state
 */
function update() {
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    if (settings.wallsAreSolid) {
        if (head.x < 0 || head.x >= settings.gridSize || head.y < 0 || head.y >= settings.gridSize) {
            if (!settings.zenMode) isGameOver = true;
            return;
        }
    } else {
        if (head.x < 0) head.x = settings.gridSize - 1;
        if (head.x >= settings.gridSize) head.x = 0;
        if (head.y < 0) head.y = settings.gridSize - 1;
        if (head.y >= settings.gridSize) head.y = 0;
    }
    
    if (!settings.zenMode) {
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                isGameOver = true;
                return;
            }
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        placeFood();
    } else {
        snake.pop();
    }
}

/**
 * Draws everything on the canvas
 */
function draw() {
    ctx.fillStyle = settings.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const snakeLength = snake.length;
    for (let i = 0; i < snakeLength; i++) {
        const segment = snake[i];
        const percentage = (snakeLength === 1) ? 0 : i / (snakeLength - 1);

        const r = lerp(START_COLOR_RGB.r, END_COLOR_RGB.r, percentage);
        const g = lerp(START_COLOR_RGB.g, END_COLOR_RGB.g, percentage);
        const b = lerp(START_COLOR_RGB.b, END_COLOR_RGB.b, percentage);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        
        ctx.fillRect(segment.x * settings.tileSize, segment.y * settings.tileSize, settings.tileSize, settings.tileSize);
        ctx.strokeStyle = settings.bgColor;
        ctx.strokeRect(segment.x * settings.tileSize, segment.y * settings.tileSize, settings.tileSize, settings.tileSize);
    }

    ctx.fillStyle = settings.foodColor;
    ctx.fillRect(food.x * settings.tileSize, food.y * settings.tileSize, settings.tileSize, settings.tileSize);
}

/**
 * Places food in a random, valid spot
 */
function placeFood() {
    let newFoodPosition;
    let validPosition = false;
    while (!validPosition) {
        newFoodPosition = {
            x: Math.floor(Math.random() * settings.gridSize),
            y: Math.floor(Math.random() * settings.gridSize)
        };
        validPosition = !snake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y);
    }
    food = newFoodPosition;
}

/**
 * Toggles the pause state
 */
function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
}

/**
 * Populates the menu inputs with the current settings
 */
function loadSettingsToMenu() {
    if (settings.gameSpeed === 200) easyRadio.checked = true;
    else if (settings.gameSpeed === 150) mediumRadio.checked = true;
    else hardRadio.checked = true;

    wallsCheck.checked = settings.wallsAreSolid;
    zenCheck.checked = settings.zenMode;

    headColorInput.value = settings.headColor;
    tailColorInput.value = settings.tailColor;
    foodColorInput.value = settings.foodColor;
    bgColorInput.value = settings.bgColor;
}

/**
 * Reads values from menu, saves them, and restarts the game
 */
function saveSettings() {
    settings.gameSpeed = parseInt(document.querySelector('input[name="difficulty"]:checked').value);
    settings.wallsAreSolid = wallsCheck.checked;
    settings.zenMode = zenCheck.checked;
    settings.headColor = headColorInput.value;
    settings.tailColor = tailColorInput.value;
    settings.foodColor = foodColorInput.value;
    settings.bgColor = bgColorInput.value;

    resetGame();
}

/**
 * Handles keyboard input
 */
function handleKeyDown(e) {
    const key = e.key;

    if (isGameOver && key === ' ') {
        resetGame();
        return;
    }

    // Check for pause key
    if (key === 'p' || key === 'P' || key === 'Escape') {
        togglePause();
        return;
    }
    
    if (isPaused || isGameOver) return; // Stop movement

    const goingUp = direction.y === -1;
    const goingDown = direction.y === 1;
    const goingLeft = direction.x === -1;
    const goingRight = direction.x === 1;

    if ((key === 'ArrowUp' || key === 'w') && !goingDown) direction = { x: 0, y: -1 };
    else if ((key === 'ArrowDown' || key === 's') && !goingUp) direction = { x: 0, y: 1 };
    else if ((key === 'ArrowLeft' || key === 'a') && !goingRight) direction = { x: -1, y: 0 };
    else if ((key === 'ArrowRight' || key === 'd') && !goingLeft) direction = { x: 1, y: 0 };
}

// --- Event Listeners ---
document.addEventListener('keydown', handleKeyDown);
saveBtn.addEventListener('click', saveSettings);

// --- Start Game ---
loadSettingsToMenu(); // Load defaults into the menu on startup
resetGame();          // Start the game for the first time
