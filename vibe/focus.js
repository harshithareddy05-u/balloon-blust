// Get canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const startButton = document.getElementById('startButton');

// Game state
let gameRunning = false;
let score = 0;
let level = 1;
let lives = 3;
let gameTime = 0;
let targetCount = 0;
let distractionCount = 0;
let showMessage = false;
let messageText = "";
let messageTimer = 0;

// Game objects
const targets = [];
const distractions = [];
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    color: '#4CAF50'
};

// Game settings
const settings = {
    targetSpawnRate: 60, // Frames between target spawns
    targetLifetime: 180, // How long targets stay on screen
    distractionSpawnRate: 120, // Frames between distraction spawns
    distractionLifetime: 120, // How long distractions stay on screen
    targetSpeed: 2, // How fast targets move
    distractionSpeed: 3, // How fast distractions move
    targetSize: 30, // Size of targets
    distractionSize: 40, // Size of distractions
    levelUpScore: 1000, // Score needed to level up
    maxLevel: 10 // Maximum level
};

// Event listeners
startButton.addEventListener('click', startGame);
canvas.addEventListener('click', handleClick);

// Start the game
function startGame() {
    gameRunning = true;
    score = 0;
    level = 1;
    lives = 3;
    gameTime = 0;
    targetCount = 0;
    distractionCount = 0;
    targets.length = 0;
    distractions.length = 0;
    startScreen.style.display = 'none';
    showMessage = true;
    messageText = "Level 1";
    messageTimer = 120;
    gameLoop();
}

// Handle mouse click
function handleClick(event) {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Check if clicked on a target
    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        const dx = mouseX - target.x;
        const dy = mouseY - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < target.size) {
            // Hit a target
            score += 100;
            targets.splice(i, 1);
            targetCount++;
            
            // Show hit message
            showMessage = true;
            messageText = "+100";
            messageTimer = 30;
            
            // Check for level up
            if (score >= settings.levelUpScore * level && level < settings.maxLevel) {
                levelUp();
            }
            
            return;
        }
    }
    
    // Check if clicked on a distraction
    for (let i = distractions.length - 1; i >= 0; i--) {
        const distraction = distractions[i];
        const dx = mouseX - distraction.x;
        const dy = mouseY - distraction.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < distraction.size) {
            // Hit a distraction
            lives--;
            distractions.splice(i, 1);
            distractionCount++;
            
            // Show hit message
            showMessage = true;
            messageText = "Distraction!";
            messageTimer = 60;
            
            // Check for game over
            if (lives <= 0) {
                gameOver();
            }
            
            return;
        }
    }
    
    // Missed everything
    score = Math.max(0, score - 50);
    
    // Show miss message
    showMessage = true;
    messageText = "-50";
    messageTimer = 30;
}

// Level up
function levelUp() {
    level++;
    
    // Increase difficulty
    settings.targetSpawnRate = Math.max(20, settings.targetSpawnRate - 5);
    settings.distractionSpawnRate = Math.max(60, settings.distractionSpawnRate - 10);
    settings.targetSpeed += 0.5;
    settings.distractionSpeed += 0.5;
    
    // Show level up message
    showMessage = true;
    messageText = `Level ${level}!`;
    messageTimer = 120;
}

// Game over
function gameOver() {
    gameRunning = false;
    
    // Show game over message
    showMessage = true;
    messageText = "Game Over";
    messageTimer = 180;
    
    // Show start screen after delay
    setTimeout(() => {
        startScreen.style.display = 'flex';
    }, 3000);
}

// Spawn a target
function spawnTarget() {
    // Random position on the edge of the screen
    let x, y;
    const side = Math.floor(Math.random() * 4);
    
    switch (side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = 0;
            break;
        case 1: // Right
            x = canvas.width;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height;
            break;
        case 3: // Left
            x = 0;
            y = Math.random() * canvas.height;
            break;
    }
    
    // Calculate direction to center
    const dx = player.x - x;
    const dy = player.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const vx = (dx / distance) * settings.targetSpeed;
    const vy = (dy / distance) * settings.targetSpeed;
    
    // Add target
    targets.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        size: settings.targetSize,
        color: '#4CAF50',
        lifetime: settings.targetLifetime
    });
}

// Spawn a distraction
function spawnDistraction() {
    // Random position on the edge of the screen
    let x, y;
    const side = Math.floor(Math.random() * 4);
    
    switch (side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = 0;
            break;
        case 1: // Right
            x = canvas.width;
            y = Math.random() * canvas.height;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height;
            break;
        case 3: // Left
            x = 0;
            y = Math.random() * canvas.height;
            break;
    }
    
    // Random direction
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * settings.distractionSpeed;
    const vy = Math.sin(angle) * settings.distractionSpeed;
    
    // Add distraction
    distractions.push({
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        size: settings.distractionSize,
        color: '#FF0066',
        lifetime: settings.distractionLifetime
    });
}

// Update game state
function update() {
    gameTime++;
    
    // Spawn targets
    if (gameTime % settings.targetSpawnRate === 0) {
        spawnTarget();
    }
    
    // Spawn distractions
    if (gameTime % settings.distractionSpawnRate === 0) {
        spawnDistraction();
    }
    
    // Update targets
    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        
        // Move target
        target.x += target.vx;
        target.y += target.vy;
        
        // Decrease lifetime
        target.lifetime--;
        
        // Remove if off screen or lifetime expired
        if (target.lifetime <= 0 || 
            target.x < -target.size || 
            target.x > canvas.width + target.size || 
            target.y < -target.size || 
            target.y > canvas.height + target.size) {
            targets.splice(i, 1);
        }
    }
    
    // Update distractions
    for (let i = distractions.length - 1; i >= 0; i--) {
        const distraction = distractions[i];
        
        // Move distraction
        distraction.x += distraction.vx;
        distraction.y += distraction.vy;
        
        // Bounce off walls
        if (distraction.x < distraction.size || distraction.x > canvas.width - distraction.size) {
            distraction.vx *= -1;
        }
        if (distraction.y < distraction.size || distraction.y > canvas.height - distraction.size) {
            distraction.vy *= -1;
        }
        
        // Decrease lifetime
        distraction.lifetime--;
        
        // Remove if lifetime expired
        if (distraction.lifetime <= 0) {
            distractions.splice(i, 1);
        }
    }
    
    // Update message timer
    if (showMessage && messageTimer > 0) {
        messageTimer--;
        if (messageTimer <= 0) {
            showMessage = false;
        }
    }
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    
    // Draw targets
    targets.forEach(target => {
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.size, 0, Math.PI * 2);
        ctx.fillStyle = target.color;
        ctx.fill();
        
        // Draw crosshair
        ctx.beginPath();
        ctx.moveTo(target.x - target.size / 2, target.y);
        ctx.lineTo(target.x + target.size / 2, target.y);
        ctx.moveTo(target.x, target.y - target.size / 2);
        ctx.lineTo(target.x, target.y + target.size / 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    // Draw distractions
    distractions.forEach(distraction => {
        ctx.beginPath();
        ctx.arc(distraction.x, distraction.y, distraction.size, 0, Math.PI * 2);
        ctx.fillStyle = distraction.color;
        ctx.fill();
        
        // Draw X
        ctx.beginPath();
        ctx.moveTo(distraction.x - distraction.size / 2, distraction.y - distraction.size / 2);
        ctx.lineTo(distraction.x + distraction.size / 2, distraction.y + distraction.size / 2);
        ctx.moveTo(distraction.x + distraction.size / 2, distraction.y - distraction.size / 2);
        ctx.lineTo(distraction.x - distraction.size / 2, distraction.y + distraction.size / 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
    });
    
    // Draw UI
    drawUI();
    
    // Draw message
    if (showMessage) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(messageText, canvas.width / 2, canvas.height / 2);
    }
}

// Draw UI
function drawUI() {
    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Score: ${score}`, 20, 20);
    
    // Draw level
    ctx.fillText(`Level: ${level}`, 20, 50);
    
    // Draw lives
    ctx.fillText(`Lives: ${lives}`, 20, 80);
    
    // Draw targets and distractions
    ctx.fillText(`Targets: ${targetCount}`, 20, 110);
    ctx.fillText(`Distractions: ${distractionCount}`, 20, 140);
    
    // Draw next level
    if (level < settings.maxLevel) {
        ctx.fillText(`Next Level: ${settings.levelUpScore * level}`, 20, 170);
    }
}

// Game loop
function gameLoop() {
    if (gameRunning) {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
} 