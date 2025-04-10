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
let balloonCount = 0;
let poppedBalloons = 0;
let showMessage = false;
let messageText = "";
let messageTimer = 0;

// Animated hearts for background
const hearts = [];
const heartColors = ['#FF4081', '#FF80AB', '#FF1744', '#D50000', '#C51162', '#FF4081', '#FF80AB', '#FF1744'];
const heartCount = 50; // Increased from 30 to 50

// Create hearts
for (let i = 0; i < heartCount; i++) {
    hearts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 10, // Increased size
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        color: heartColors[Math.floor(Math.random() * heartColors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() * 0.02 - 0.01) * 0.5,
        opacity: Math.random() * 0.5 + 0.3
    });
}

// Sound effects
const sounds = {
    background: new Audio('https://assets.mixkit.co/active_storage/sfx/123/123-preview.mp3'),
    pop: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3')
};

// Set background music to loop
sounds.background.loop = true;
sounds.background.volume = 0.3;

// Set pop sound volume
sounds.pop.volume = 0.5;

// Preload all sounds with error handling
Object.values(sounds).forEach(sound => {
    sound.load();
    sound.onerror = function() {
        console.error('Error loading sound:', sound.src);
    };
});

// Create a new audio element for "don't touch me" sound with a different source
const dontTouchMeSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
dontTouchMeSound.load();
dontTouchMeSound.onerror = function() {
    console.error('Error loading dontTouchMe sound');
};

// Sound enabled flag
let soundsEnabled = false;

// Add sound enable button to start screen
const soundButton = document.createElement('button');
soundButton.textContent = 'Enable Sounds';
soundButton.style.position = 'absolute';
soundButton.style.bottom = '20px';
soundButton.style.left = '50%';
soundButton.style.transform = 'translateX(-50%)';
soundButton.style.padding = '10px 20px';
soundButton.style.backgroundColor = '#4CAF50';
soundButton.style.color = 'white';
soundButton.style.border = 'none';
soundButton.style.borderRadius = '5px';
soundButton.style.cursor = 'pointer';
soundButton.style.fontSize = '16px';
soundButton.style.zIndex = '1000';

soundButton.addEventListener('click', () => {
    soundsEnabled = true;
    soundButton.textContent = 'Sounds Enabled';
    soundButton.style.backgroundColor = '#2196F3';
    
    // Play a test sound
    sounds.background.currentTime = 0;
    sounds.background.play().catch(error => {
        console.error('Error playing background sound:', error);
    });
});

startScreen.appendChild(soundButton);

// Particle system for visual effects
const particles = [];
const particleColors = ['#FF4081', '#7C4DFF', '#2196F3', '#4CAF50', '#FFC107', '#FF5722', '#9C27B0', '#00BCD4'];

function createParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        const size = Math.random() * 5 + 2;
        const life = Math.random() * 30 + 20; // Frames the particle will live
        
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size,
            color: color || particleColors[Math.floor(Math.random() * particleColors.length)],
            life,
            maxLife: life,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() * 0.2 - 0.1) * 0.1
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        
        // Apply gravity
        p.vy += 0.1;
        
        // Update rotation
        p.rotation += p.rotationSpeed;
        
        // Decrease life
        p.life--;
        
        // Remove if dead
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        const opacity = p.life / p.maxLife;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        // Draw particle (heart shape)
        ctx.beginPath();
        ctx.fillStyle = p.color;
        
        // Draw a simple heart shape
        const size = p.size * (1 - opacity * 0.5); // Shrink as it fades
        
        ctx.moveTo(0, size);
        ctx.bezierCurveTo(size, -size, size * 3, size, 0, size * 3);
        ctx.bezierCurveTo(-size * 3, size, -size, -size, 0, size);
        
        ctx.fill();
        ctx.restore();
    });
}

// Game objects
const balloons = [];
const person = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 30,
    color: '#333333',
    image: null,
    imageLoaded: false,
    width: 0,
    height: 0
};

// Hero images array
const heroImages = [
    'https://www.filmibeat.com/img/1200x80x675/popcorn/movie_lists/highest-paid-telugu-actors-of-2023-20230412102014-258.jpg', // Telugu Actors Collage
    'https://i.pinimg.com/originals/48/2b/cc/482bcc5b3f5065b2e1dfc1adfde92f8b.jpg', // Telugu Actor Ram
    'https://wallpapercave.com/wp/wp7365088.jpg', // Allu Arjun Wallpaper
    'https://stylesatlife.com/wp-content/uploads/2021/06/Telugu-Hero-Raviteja.jpg', // Ravi Teja
    'https://telugustop.com/img/telugu-tollywood-actor-heros-stars-profiles-biography-biodata-wiki-news-videos-pics-photo-images-names.jpg', // Telugu Actors Collage
    'https://e.telugurajyam.com/wp-content/uploads/2023/01/wedding-bells-ringing-for-tollywood-hero-1024x640.jpg', // Telugu Hero Wedding
    'https://nettv4u.com/fileman/Uploads2/Top-10-Tollywood-Actors-Of-All-Time/Daggubati_Venkatesh.jpg', // Venkatesh Daggubati
    'https://www.topcount.co/wp-content/uploads/2016/03/pic-4-1-300x284.jpg', // Stylish Telugu Actor
    'https://allindiaroundup.com/wp-content/uploads/2017/01/tollywood-heroes-remuneration-details-2016-6.jpg', // Telugu Heroes Remuneration
    'https://1847884116.rsc.cdn77.org/telugu/gallery/actor/bellamkondasrinivas/srinivas2202_poster.jpg', // Bellamkonda Sreenivas
    'https://wallpaperaccess.com/full/16473311.jpg' // Tollywood Heroes Wallpaper
];

// Preload hero images
const preloadedHeroImages = [];
function preloadHeroImages() {
    heroImages.forEach((src, index) => {
        const img = new Image();
        img.onload = function() {
            preloadedHeroImages[index] = img;
        };
        img.src = src;
    });
}

// Call this function when the page loads
preloadHeroImages();

// Game settings
const settings = {
    balloonSpawnRate: 60, // Frames between balloon spawns
    balloonSpeed: 0.8, // Reduced from 1.5 to 0.8 for slower balloon movement
    balloonSize: 25, // Size of balloons
    balloonCount: 10, // Number of balloons to pop per level
    levelUpScore: 1000, // Score needed to level up
    maxLevel: 10, // Maximum level
    personRadius: 30 // Size of the person
};

// Balloon colors
const balloonColors = [
    '#FF4081', // Pink
    '#7C4DFF', // Purple
    '#448AFF', // Blue
    '#00BCD4', // Cyan
    '#009688', // Teal
    '#4CAF50', // Green
    '#FFC107', // Amber
    '#FF5722', // Deep Orange
    '#795548', // Brown
    '#9E9E9E'  // Grey
];

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
    balloonCount = 0;
    poppedBalloons = 0;
    balloons.length = 0;
    startScreen.style.display = 'none';
    showMessage = true;
    messageText = "Level 1";
    messageTimer = 120;
    
    // Play background music if enabled
    if (soundsEnabled) {
        sounds.background.play();
    }
    
    gameLoop();
}

// Handle mouse click
function handleClick(event) {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Check if clicked on a balloon
    for (let i = balloons.length - 1; i >= 0; i--) {
        const balloon = balloons[i];
        const dx = mouseX - balloon.x;
        const dy = mouseY - balloon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < balloon.size) {
            // Pop the balloon
            popBalloon(balloon);
            
            return;
        }
    }
    
    // Missed a balloon
    score = Math.max(0, score - 1);
    
    // Show miss message
    showMessage = true;
    messageText = "-1";
    messageTimer = 30;
}

// Level complete
function levelComplete() {
    if (level < settings.maxLevel) {
        level++;
        
        // Reset for next level
        poppedBalloons = 0;
        balloons.length = 0;
        
        // Show level up message
        showMessage = true;
        messageText = `Level ${level}!`;
        messageTimer = 120;
    } else {
        // Game completed
        gameRunning = false;
        
        // Stop background music if enabled
        if (soundsEnabled) {
            sounds.background.pause();
        }
        
        // Show game complete message
        showMessage = true;
        messageText = "Game Complete!";
        messageTimer = 180;
        
        // Show start screen after delay
        setTimeout(() => {
            startScreen.style.display = 'flex';
        }, 3000);
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    
    // Stop background music if enabled
    if (soundsEnabled) {
        sounds.background.pause();
    }
    
    // Show game over message
    showMessage = true;
    messageText = "Game Over";
    messageTimer = 180;
    
    // Show start screen after delay
    setTimeout(() => {
        startScreen.style.display = 'flex';
    }, 3000);
}

// Spawn a balloon (now a hero)
function spawnBalloon() {
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
    const dx = person.x - x;
    const dy = person.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const vx = (dx / distance) * settings.balloonSpeed;
    const vy = (dy / distance) * settings.balloonSpeed;
    
    // Random hero image
    const heroIndex = Math.floor(Math.random() * heroImages.length);
    
    // Create a new balloon object
    const balloon = {
        x: x,
        y: y,
        vx: vx,
        vy: vy,
        size: settings.balloonSize,
        color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
        image: heroImages[heroIndex],
        imageLoaded: false,
        imageObj: null,
        width: settings.balloonSize * 2,
        height: settings.balloonSize * 2
    };
    
    // Load the hero image
    balloon.imageObj = new Image();
    balloon.imageObj.onload = function() {
        balloon.imageLoaded = true;
        // Adjust size based on aspect ratio
        const aspectRatio = this.height / this.width;
        balloon.width = settings.balloonSize * 2;
        balloon.height = balloon.width * aspectRatio;
    };
    balloon.imageObj.onerror = function() {
        // If image fails to load, remove the balloon
        const index = balloons.indexOf(balloon);
        if (index !== -1) {
            balloons.splice(index, 1);
        }
    };
    balloon.imageObj.src = balloon.image;
    
    // Add balloon to the array
    balloons.push(balloon);
    balloonCount++;
}

// Update game state
function update() {
    gameTime++;
    
    // Spawn balloons (heroes)
    if (gameTime % settings.balloonSpawnRate === 0 && balloons.length < settings.balloonCount) {
        spawnBalloon();
    }
    
    // Update balloons (heroes)
    for (let i = balloons.length - 1; i >= 0; i--) {
        const balloon = balloons[i];
        
        // Skip balloons that don't have loaded images
        if (!balloon.imageLoaded) {
            continue;
        }
        
        // Move balloon
        balloon.x += balloon.vx;
        balloon.y += balloon.vy;
        
        // Check if balloon touches person (using rectangular collision)
        const touchesX = balloon.x >= person.x - person.width / 2 && 
                        balloon.x <= person.x + person.width / 2;
        const touchesY = balloon.y >= person.y - person.height / 2 && 
                        balloon.y <= person.y + person.height / 2;
        
        if (touchesX && touchesY) {
            // Balloon touched person
            lives--;
            balloons.splice(i, 1);
            
            // Play "don't touch me" sound if enabled
            if (soundsEnabled) {
                dontTouchMeSound.currentTime = 0;
                dontTouchMeSound.play();
            }
            
            // Show hit message
            showMessage = true;
            messageText = "Ouch!";
            messageTimer = 60;
            
            // Check for game over
            if (lives <= 0) {
                gameOver();
            }
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

// Load person image
function loadPersonImage() {
    person.image = new Image();
    person.image.onload = function() {
        person.imageLoaded = true;
        // Adjust radius based on image dimensions to maintain aspect ratio
        const aspectRatio = this.height / this.width;
        person.radius = 70; // Reduced from 100 to 70 for a smaller image
        person.width = person.radius * 2;
        person.height = person.width * aspectRatio;
    };
    person.image.src = 'https://3.bp.blogspot.com/-6xqSFtXo_S4/WWy5W47mVgI/AAAAAAAADB0/cKKymYVI8hIcU3-kH2kR2n68Lpx6xPjEgCLcBGAs/s1600/646343f92505a5d9160d412a687fc8cc.jpg';
}

// Call this function when the page loads
loadPersonImage();

// Draw person
function drawPerson() {
    if (person.imageLoaded) {
        // Create a circular clipping path to remove background
        ctx.save();
        
        // Create a path for the person's body shape (oval)
        ctx.beginPath();
        ctx.ellipse(
            person.x, 
            person.y, 
            person.width / 2, 
            person.height / 2, 
            0, 0, Math.PI * 2
        );
        ctx.clip();
        
        // Draw the image
        ctx.drawImage(
            person.image,
            person.x - person.width / 2,
            person.y - person.height / 2,
            person.width,
            person.height
        );
        
        ctx.restore();
    } else {
        // Fallback to drawing a simple person if image isn't loaded
        ctx.beginPath();
        ctx.arc(person.x, person.y, person.radius, 0, Math.PI * 2);
        ctx.fillStyle = person.color;
        ctx.fill();
        
        // Draw head
        ctx.beginPath();
        ctx.arc(person.x, person.y - person.radius * 0.7, person.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        
        // Draw eyes
        ctx.beginPath();
        ctx.arc(person.x - person.radius * 0.2, person.y - person.radius * 0.8, person.radius * 0.1, 0, Math.PI * 2);
        ctx.arc(person.x + person.radius * 0.2, person.y - person.radius * 0.8, person.radius * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // Draw pupils
        ctx.beginPath();
        ctx.arc(person.x - person.radius * 0.2, person.y - person.radius * 0.8, person.radius * 0.05, 0, Math.PI * 2);
        ctx.arc(person.x + person.radius * 0.2, person.y - person.radius * 0.8, person.radius * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        
        // Draw smile
        ctx.beginPath();
        ctx.arc(person.x, person.y - person.radius * 0.7, person.radius * 0.3, 0, Math.PI);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw arms
        ctx.beginPath();
        ctx.moveTo(person.x - person.radius * 0.8, person.y);
        ctx.lineTo(person.x - person.radius * 1.5, person.y - person.radius * 0.5);
        ctx.moveTo(person.x + person.radius * 0.8, person.y);
        ctx.lineTo(person.x + person.radius * 1.5, person.y - person.radius * 0.5);
        ctx.strokeStyle = person.color;
        ctx.lineWidth = 5;
        ctx.stroke();
        
        // Draw legs
        ctx.beginPath();
        ctx.moveTo(person.x - person.radius * 0.3, person.y + person.radius * 0.8);
        ctx.lineTo(person.x - person.radius * 0.5, person.y + person.radius * 1.5);
        ctx.moveTo(person.x + person.radius * 0.3, person.y + person.radius * 0.8);
        ctx.lineTo(person.x + person.radius * 0.5, person.y + person.radius * 1.5);
        ctx.strokeStyle = person.color;
        ctx.lineWidth = 5;
        ctx.stroke();
    }
}

// Draw balloon (now a hero)
function drawBalloon(balloon) {
    // Only draw balloons that have loaded images
    if (balloon.imageLoaded && balloon.imageObj) {
        // Draw the hero image
        ctx.save();
        
        // Create a circular clipping path
        ctx.beginPath();
        ctx.arc(balloon.x, balloon.y, balloon.size, 0, Math.PI * 2);
        ctx.clip();
        
        // Draw the image
        ctx.drawImage(
            balloon.imageObj,
            balloon.x - balloon.width / 2,
            balloon.y - balloon.height / 2,
            balloon.width,
            balloon.height
        );
        
        ctx.restore();
    } else {
        // If image is not loaded yet, draw a loading indicator
        ctx.beginPath();
        ctx.arc(balloon.x, balloon.y, balloon.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
        ctx.fill();
        
        // Draw loading text
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Loading...', balloon.x, balloon.y);
    }
}

// Draw game objects
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw gradient background with dark pink colors
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#880E4F'); // Dark pink at top
    gradient.addColorStop(1, '#4A148C'); // Deep purple at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some decorative elements
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 192, 203, 0.5)'; // Light pink stars
        ctx.fill();
    }
    
    // Draw name "Chandan Kumar" in the background with adjusted size
    ctx.save();
    ctx.globalAlpha = 0.2; // Slightly increased opacity
    ctx.fillStyle = 'white';
    ctx.font = 'bold 100px Arial'; // Increased from 80px to 100px
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Chandan Kumar', canvas.width / 2, canvas.height / 2);
    ctx.restore();
    
    // Draw animated hearts
    drawHearts();
    
    // Draw person
    drawPerson();
    
    // Draw balloons
    balloons.forEach(balloon => {
        drawBalloon(balloon);
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

// Draw animated hearts
function drawHearts() {
    hearts.forEach(heart => {
        // Update heart position
        heart.x += heart.speedX;
        heart.y += heart.speedY;
        heart.rotation += heart.rotationSpeed;
        
        // Wrap hearts around the screen
        if (heart.x < -heart.size) heart.x = canvas.width + heart.size;
        if (heart.x > canvas.width + heart.size) heart.x = -heart.size;
        if (heart.y < -heart.size) heart.y = canvas.height + heart.size;
        if (heart.y > canvas.height + heart.size) heart.y = -heart.size;
        
        // Draw heart
        ctx.save();
        ctx.translate(heart.x, heart.y);
        ctx.rotate(heart.rotation);
        ctx.globalAlpha = heart.opacity;
        
        // Draw heart shape
        ctx.beginPath();
        ctx.moveTo(0, heart.size / 2);
        
        // Left side of heart
        ctx.bezierCurveTo(
            -heart.size / 2, heart.size / 2,
            -heart.size / 2, -heart.size / 2,
            0, -heart.size / 2
        );
        
        // Right side of heart
        ctx.bezierCurveTo(
            heart.size / 2, -heart.size / 2,
            heart.size / 2, heart.size / 2,
            0, heart.size / 2
        );
        
        ctx.fillStyle = heart.color;
        ctx.fill();
        
        // Add a subtle glow effect
        ctx.shadowColor = heart.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        
        ctx.restore();
    });
}

// Draw UI
function drawUI() {
    // Draw score with improved visibility
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Points: ${score}`, 20, 20);
    
    // Draw level
    ctx.fillText(`Level: ${level}`, 20, 50);
    
    // Draw lives
    ctx.fillText(`Lives: ${lives}`, 20, 80);
    
    // Draw balloons
    ctx.fillText(`Balloons: ${poppedBalloons}/${settings.balloonCount}`, 20, 110);
    
    // Add a semi-transparent panel behind the UI for better readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 200, 120);
    
    // Redraw UI text on top of the panel
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Points: ${score}`, 20, 20);
    ctx.fillText(`Level: ${level}`, 20, 50);
    ctx.fillText(`Lives: ${lives}`, 20, 80);
    ctx.fillText(`Balloons: ${poppedBalloons}/${settings.balloonCount}`, 20, 110);
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Update and draw hearts
    updateHearts();
    drawHearts();
    
    // Update and draw particles
    updateParticles();
    drawParticles();
    
    // Update and draw balloons
    updateBalloons();
    drawBalloons();
    
    // Draw person
    drawPerson();
    
    // Draw UI
    drawUI();
    
    // Update game time
    gameTime++;
    
    // Continue game loop if game is running
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Function to draw background
function drawBackground() {
    // Draw gradient background with dark pink colors
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#880E4F'); // Dark pink at top
    gradient.addColorStop(1, '#4A148C'); // Deep purple at bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some decorative elements
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 192, 203, 0.5)'; // Light pink stars
        ctx.fill();
    }
    
    // Draw name "Chandan Kumar" in the background with adjusted size
    ctx.save();
    ctx.globalAlpha = 0.2; // Slightly increased opacity
    ctx.fillStyle = 'white';
    ctx.font = 'bold 100px Arial'; // Increased from 80px to 100px
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Chandan Kumar', canvas.width / 2, canvas.height / 2);
    ctx.restore();
}

// Function to update hearts
function updateHearts() {
    hearts.forEach(heart => {
        // Update heart position
        heart.x += heart.speedX;
        heart.y += heart.speedY;
        heart.rotation += heart.rotationSpeed;
        
        // Wrap hearts around the screen
        if (heart.x < -heart.size) heart.x = canvas.width + heart.size;
        if (heart.x > canvas.width + heart.size) heart.x = -heart.size;
        if (heart.y < -heart.size) heart.y = canvas.height + heart.size;
        if (heart.y > canvas.height + heart.size) heart.y = -heart.size;
    });
}

// Function to update balloons
function updateBalloons() {
    // Spawn balloons (heroes)
    if (gameTime % settings.balloonSpawnRate === 0 && balloons.length < settings.balloonCount) {
        spawnBalloon();
    }
    
    // Update balloons (heroes)
    for (let i = balloons.length - 1; i >= 0; i--) {
        const balloon = balloons[i];
        
        // Skip balloons that don't have loaded images
        if (!balloon.imageLoaded) {
            continue;
        }
        
        // Move balloon
        balloon.x += balloon.vx;
        balloon.y += balloon.vy;
        
        // Check if balloon touches person (using rectangular collision)
        const touchesX = balloon.x >= person.x - person.width / 2 && 
                        balloon.x <= person.x + person.width / 2;
        const touchesY = balloon.y >= person.y - person.height / 2 && 
                        balloon.y <= person.y + person.height / 2;
        
        if (touchesX && touchesY) {
            // Balloon touched person
            lives--;
            balloons.splice(i, 1);
            
            // Play "don't touch me" sound if enabled
            if (soundsEnabled) {
                dontTouchMeSound.currentTime = 0;
                dontTouchMeSound.play();
            }
            
            // Show hit message
            showMessage = true;
            messageText = "Ouch!";
            messageTimer = 60;
            
            // Check for game over
            if (lives <= 0) {
                gameOver();
            }
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

// Function to draw balloons
function drawBalloons() {
    balloons.forEach(balloon => {
        drawBalloon(balloon);
    });
}

// Function to handle balloon popping
function popBalloon(balloon) {
    // Create particles at balloon position with balloon color
    createParticles(balloon.x, balloon.y, balloon.color, 20);
    
    // Remove balloon from array
    const index = balloons.indexOf(balloon);
    if (index > -1) {
        balloons.splice(index, 1);
    }
    
    // Increment score
    score += 10;
    
    // Increment popped balloons count
    poppedBalloons++;
    
    // Play pop sound if enabled
    if (soundsEnabled) {
        sounds.pop.currentTime = 0;
        sounds.pop.play();
    }
    
    // Check if level is complete
    if (poppedBalloons >= settings.balloonCount) {
        levelComplete();
    }
} 