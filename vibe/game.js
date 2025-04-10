const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const board = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 100,
    rotation: 0,
    rotationSpeed: 0.01,
    baseSpeed: 0.01,  // Initial speed (reduced)
    speedIncrement: 0.00001,  // How much to increase speed per frame (reduced)
    maxSpeed: 0.05,    // Maximum rotation speed (reduced)
    color: '#4CAF50'
};

const heart = {
    size: 15,  // Reduced from 30 to 15
    x: canvas.width / 2,  // Position at center horizontally
    y: canvas.height - 50,  // Position at bottom of screen
    color: '#FF0066',
    // Animation properties
    isThrowing: false,
    startX: 0,
    startY: 0,
    targetX: 0,
    targetY: 0,
    progress: 0,
    speed: 0.1
};

// Array to store stuck hearts
let stuckHearts = [];

let score = 0;
let hits = 0;
let misses = 0;
let gameTime = 0;  // Track game time

// Message display
let showMessage = false;
let messageTimer = 0;
let hitMessage = "";

// Game state
let gameRunning = true;

// Level system
let currentLevel = 1;
const heartsRequiredPerLevel = 4;
const totalLevels = 10;
const maxMissesPerLevel = 5;  // Maximum number of misses allowed per level
const timeLimitPerLevel = 30; // Time limit in seconds for each level
let levelTimeRemaining = timeLimitPerLevel;
let levelStartTime = 0;

// Event listeners
canvas.addEventListener('click', (event) => {
    if (gameRunning && !heart.isThrowing) {
        throwHeart(event);
    }
});

function throwHeart(event) {
    // Get mouse position for aiming
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    const mouseY = event.clientY - canvas.getBoundingClientRect().top;
    
    // Calculate angle from heart to mouse position
    const dx = mouseX - heart.x;
    const dy = mouseY - heart.y;
    const angle = Math.atan2(dy, dx);
    
    // Calculate the closest point on the board's circle to the mouse position
    const boardDx = mouseX - board.x;
    const boardDy = mouseY - board.y;
    const distanceToBoard = Math.sqrt(boardDx * boardDx + boardDy * boardDy);
    
    // Normalize the direction vector and multiply by board radius to get hit point
    const targetX = board.x + (boardDx / distanceToBoard) * board.radius;
    const targetY = board.y + (boardDy / distanceToBoard) * board.radius;
    
    // Start throwing animation
    heart.isThrowing = true;
    heart.startX = heart.x;
    heart.startY = heart.y;
    heart.targetX = targetX;
    heart.targetY = targetY;
    heart.progress = 0;
    
    // Check for hit after animation completes
    setTimeout(() => {
        checkHit(targetX, targetY);
        heart.isThrowing = false;
        heart.x = heart.startX;
        heart.y = heart.startY;
    }, 500);
}

function checkHit(targetX, targetY) {
    const dx = targetX - board.x;
    const dy = targetY - board.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate how far the heart is from the board's edge
    const distanceFromEdge = Math.abs(distance - board.radius);
    
    if (distanceFromEdge <= 10) {
        hits++;
        score += 100;
        
        // Show distance message
        hitMessage = `Distance: ${Math.round(distanceFromEdge)}`;
        showMessage = true;
        messageTimer = 60;
        
        const angle = Math.atan2(dy, dx);
        const newHeartX = board.x + Math.cos(angle) * board.radius;
        const newHeartY = board.y + Math.sin(angle) * board.radius;
        
        for (let otherHeart of stuckHearts) {
            const heartDx = newHeartX - otherHeart.x;
            const heartDy = newHeartY - otherHeart.y;
            const heartDistance = Math.sqrt(heartDx * heartDx + heartDy * heartDy);
            
            if (heartDistance < heart.size) {
                // Hearts collided! Game over
                hitMessage = "Game Over!";
                showMessage = true;
                messageTimer = 180;
                gameRunning = false;
                return;
            }
        }
        
        stuckHearts.push({
            x: newHeartX,
            y: newHeartY,
            angle: angle,
            rotationOffset: board.rotation
        });
        
        // Check if level is complete
        if (stuckHearts.length >= heartsRequiredPerLevel) {
            levelComplete();
        }
    } else {
        misses++;
        // Show how far the miss was
        hitMessage = `Miss by: ${Math.round(distanceFromEdge)}`;
        showMessage = true;
        messageTimer = 60;
        
        // Check if player has failed the level
        if (misses >= maxMissesPerLevel) {
            levelFailed();
        }
    }
}

function levelComplete() {
    if (currentLevel < totalLevels) {
        currentLevel++;
        // Increase difficulty for next level
        board.rotationSpeed += 0.005;
        board.maxSpeed += 0.01;
        // Clear hearts for next level
        stuckHearts = [];
        // Reset level timer
        levelTimeRemaining = timeLimitPerLevel;
        levelStartTime = gameTime;
        hitMessage = `Level ${currentLevel}!`;
        showMessage = true;
        messageTimer = 120;
    } else {
        // Game completed
        gameRunning = false;
        hitMessage = "Game Complete!";
        showMessage = true;
        messageTimer = 180;
    }
}

function levelFailed() {
    // Reset the level
    stuckHearts = [];
    misses = 0;
    
    // Show failure message
    hitMessage = "Level Failed!";
    showMessage = true;
    messageTimer = 120;
    
    // Decrease score as penalty
    score = Math.max(0, score - 200);
    
    // Reset level timer
    levelTimeRemaining = timeLimitPerLevel;
    levelStartTime = gameTime;
}

function drawHeart(x, y, size, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(size/30, size/30);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    
    // Draw heart shape
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-15, -10, -30, 0, 0, 30);
    ctx.bezierCurveTo(30, 0, 15, -10, 0, 10);
    
    ctx.fillStyle = heart.color;
    ctx.fill();
    ctx.restore();
}

function drawMessage() {
    if (showMessage && messageTimer > 0) {
        ctx.save();
        ctx.fillStyle = '#FF0066';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hitMessage, canvas.width/2, canvas.height/2);
        messageTimer--;
        if (messageTimer <= 0) {
            showMessage = false;
        }
        ctx.restore();
    }
}

function drawBoard() {
    ctx.save();
    ctx.translate(board.x, board.y);
    ctx.rotate(board.rotation);
    
    // Draw circular board
    ctx.beginPath();
    ctx.arc(0, 0, board.radius, 0, Math.PI * 2);
    ctx.strokeStyle = board.color;
    ctx.lineWidth = 20;
    ctx.stroke();
    
    // Draw decorative circles
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, board.radius - (i * 15), 0, Math.PI * 2);
        ctx.strokeStyle = board.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    ctx.restore();
    
    // Draw stuck hearts
    stuckHearts.forEach(heart => {
        const currentAngle = heart.angle + (board.rotation - heart.rotationOffset);
        const x = board.x + Math.cos(currentAngle) * board.radius;
        const y = board.y + Math.sin(currentAngle) * board.radius;
        drawHeart(x, y, heart.size, currentAngle);
    });
}

function drawUI() {
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Level: ${currentLevel}/${totalLevels}`, 20, 30);
    ctx.fillText(`Hearts: ${stuckHearts.length}/${heartsRequiredPerLevel}`, 20, 60);
    ctx.fillText(`Score: ${score}`, 20, 90);
    ctx.fillText(`Hits: ${hits}`, 20, 120);
    ctx.fillText(`Misses: ${misses}/${maxMissesPerLevel}`, 20, 150);
    
    // Draw timer with color change when low
    if (levelTimeRemaining <= 5) {
        ctx.fillStyle = '#FF0000'; // Red for low time
    } else {
        ctx.fillStyle = '#000';
    }
    ctx.fillText(`Time: ${levelTimeRemaining}s`, 20, 180);
    
    const speedPercentage = Math.floor((board.rotationSpeed / board.maxSpeed) * 100);
    ctx.fillText(`Speed: ${speedPercentage}%`, 20, 210);
    
    // Draw hit zone indicator
    ctx.save();
    ctx.strokeStyle = '#FF0066';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(board.x, board.y, board.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function update() {
    gameTime++;
    
    // Update level timer
    levelTimeRemaining = Math.max(0, timeLimitPerLevel - Math.floor((gameTime - levelStartTime) / 60));
    
    // Check if time ran out
    if (levelTimeRemaining <= 0) {
        levelFailed();
    }
    
    // Increase board speed over time
    if (board.rotationSpeed < board.maxSpeed) {
        board.rotationSpeed = board.baseSpeed + (gameTime * board.speedIncrement);
        if (board.rotationSpeed > board.maxSpeed) {
            board.rotationSpeed = board.maxSpeed;
        }
    }
    
    board.rotation += board.rotationSpeed;
    
    if (heart.isThrowing) {
        heart.progress += heart.speed;
        if (heart.progress >= 1) {
            heart.progress = 1;
        }
    }
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    update();
    
    // Draw game objects
    drawBoard();
    
    // Draw current heart
    if (heart.isThrowing) {
        // Animate heart throwing
        const currentX = heart.startX + (heart.targetX - heart.startX) * heart.progress;
        const currentY = heart.startY + (heart.targetY - heart.startY) * heart.progress;
        const angle = Math.atan2(heart.targetY - heart.startY, heart.targetX - heart.startX);
        drawHeart(currentX, currentY, heart.size, angle);
    } else {
        // Draw heart in fixed position
        const angle = Math.atan2(board.y - heart.y, board.x - heart.x);
        drawHeart(heart.x, heart.y, heart.size, angle);
    }
    
    drawUI();
    drawMessage();
    
    // Continue game loop
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Initialize level timer at game start
levelStartTime = gameTime;
// Start the game
gameLoop(); 