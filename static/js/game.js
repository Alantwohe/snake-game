/**
 * Snake Game JavaScript
 * Classic snake game with modern graphics and API integration
 */

const API_BASE = '';

// Game configuration
const CELL_SIZE = 20;
const CANVAS_SIZE = 400;
const GRID_SIZE = CANVAS_SIZE / CELL_SIZE;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;
const MIN_SPEED = 50;

// Game state
let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = 0;
let gameLoop = null;
let isPaused = false;
let isGameOver = false;
let gameStartTime = null;
let gameSpeed = INITIAL_SPEED;

// Colors
const COLORS = {
      background: '#0a0a0f',
      grid: 'rgba(255, 255, 255, 0.03)',
      snakeHead: '#6366f1',
      snakeBody: '#818cf8',
      snakeGlow: 'rgba(99, 102, 241, 0.5)',
      food: '#22c55e',
      foodGlow: 'rgba(34, 197, 94, 0.5)'
};

/**
 * Initialize game on page load
 */
document.addEventListener('DOMContentLoaded', () => {
      // Check authentication
      checkAuth();

      // Setup canvas
      canvas = document.getElementById('gameCanvas');
      ctx = canvas.getContext('2d');

      // Setup keyboard controls
      document.addEventListener('keydown', handleKeyPress);

      // Load leaderboard
      loadLeaderboard();

      // Init sound button
      updateSoundButton();

      // Draw initial state
      drawGame();
});

/**
 * Toggle sound
 */
function toggleSound() {
      const isMuted = soundManager.toggleMute();
      updateSoundButton();
}

function updateSoundButton() {
      const btn = document.getElementById('soundBtn');
      if (soundManager.muted) {
            btn.textContent = '🔇 静音';
            btn.classList.add('muted');
      } else {
            btn.textContent = '🔊 声音';
            btn.classList.remove('muted');
      }
}

/**
 * Check if user is authenticated
 */
async function checkAuth() {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');

      if (!token) {
            window.location.href = '/';
            return;
      }

      // Update username display
      if (username) {
            document.getElementById('usernameDisplay').textContent = username;
      }

      // Verify token
      try {
            const response = await fetch(`${API_BASE}/api/users/me`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                  }
            });

            if (!response.ok) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('username');
                  window.location.href = '/';
            }
      } catch (error) {
            console.error('Auth check failed:', error);
      }
}

/**
 * Logout user
 */
function logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/';
}

/**
 * Initialize snake at starting position
 */
function initSnake() {
      snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
      ];
}

/**
 * Generate food at random position
 */
function generateFood() {
      let newFood;
      // Buffer of 5 cells from the border to be safe
      const buffer = 5;
      const safeSize = GRID_SIZE - 2 * buffer;

      do {
            newFood = {
                  x: Math.floor(Math.random() * safeSize) + buffer,
                  y: Math.floor(Math.random() * safeSize) + buffer
            };
      } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
      food = newFood;
}

/**
 * Start the game
 */
function startGame() {
      if (gameLoop) {
            clearInterval(gameLoop);
      }

      // Reset game state
      initSnake();
      generateFood();
      direction = 'right';
      nextDirection = 'right';
      score = 0;
      gameSpeed = INITIAL_SPEED;
      isPaused = false;
      isGameOver = false;
      gameStartTime = Date.now();

      soundManager.startBgm();

      updateScore();

      // Update button
      document.getElementById('startBtn').textContent = '重新开始';

      // Start game loop
      gameLoop = setInterval(gameStep, gameSpeed);
}

/**
 * Pause/Resume game
 */
function pauseGame() {
      if (isGameOver || !gameLoop) return;

      isPaused = !isPaused;

      if (isPaused) {
            clearInterval(gameLoop);
            gameLoop = null;
            soundManager.stopBgm();
      } else {
            gameLoop = setInterval(gameStep, gameSpeed);
            soundManager.startBgm();
      }
}

/**
 * One step of the game
 */
function gameStep() {
      if (isPaused || isGameOver) return;

      // Update direction
      direction = nextDirection;

      // Calculate new head position
      const head = { ...snake[0] };

      switch (direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            endGame();
            return;
      }

      // Check self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            endGame();
            return;
      }

      // Add new head
      snake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
            score += 10;
            soundManager.playEat();
            updateScore();
            generateFood();

            // Increase speed
            if (gameSpeed > MIN_SPEED) {
                  gameSpeed -= SPEED_INCREMENT;
                  clearInterval(gameLoop);
                  gameLoop = setInterval(gameStep, gameSpeed);
            }
      } else {
            // Remove tail if no food eaten
            snake.pop();
      }

      // Draw game
      drawGame();
}

/**
 * Draw the game
 */
function drawGame() {
      // Clear canvas
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw grid
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE, 0);
            ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * CELL_SIZE);
            ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
            ctx.stroke();
      }

      // Draw food with glow
      ctx.shadowColor = COLORS.foodGlow;
      ctx.shadowBlur = 15;
      ctx.fillStyle = COLORS.food;
      ctx.beginPath();
      ctx.arc(
            food.x * CELL_SIZE + CELL_SIZE / 2,
            food.y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2 - 2,
            0,
            Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw snake
      snake.forEach((segment, index) => {
            const isHead = index === 0;

            // Glow effect for head
            if (isHead) {
                  ctx.shadowColor = COLORS.snakeGlow;
                  ctx.shadowBlur = 15;
            }

            // Gradient color from head to tail
            const colorIntensity = 1 - (index / snake.length) * 0.4;
            ctx.fillStyle = isHead ? COLORS.snakeHead : COLORS.snakeBody;
            ctx.globalAlpha = colorIntensity;

            // Draw rounded rectangle
            const x = segment.x * CELL_SIZE + 1;
            const y = segment.y * CELL_SIZE + 1;
            const size = CELL_SIZE - 2;
            const radius = isHead ? 6 : 4;

            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + size - radius, y);
            ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
            ctx.lineTo(x + size, y + size - radius);
            ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
            ctx.lineTo(x + radius, y + size);
            ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;

            // Draw eyes on head
            if (isHead) {
                  ctx.fillStyle = 'white';
                  const eyeSize = 3;
                  const eyeOffset = 5;

                  if (direction === 'right') {
                        ctx.beginPath();
                        ctx.arc(x + size - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.arc(x + size - eyeOffset, y + size - eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                  } else if (direction === 'left') {
                        ctx.beginPath();
                        ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.arc(x + eyeOffset, y + size - eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                  } else if (direction === 'up') {
                        ctx.beginPath();
                        ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.arc(x + size - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                  } else {
                        ctx.beginPath();
                        ctx.arc(x + eyeOffset, y + size - eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.arc(x + size - eyeOffset, y + size - eyeOffset, eyeSize, 0, Math.PI * 2);
                        ctx.fill();
                  }
            }
      });

      // Update game time
      if (gameStartTime && !isGameOver) {
            const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('gameTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }
}

/**
 * Handle keyboard input
 */
function handleKeyPress(event) {
      const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            's': 'down',
            'a': 'left',
            'd': 'right',
            'W': 'up',
            'S': 'down',
            'A': 'left',
            'D': 'right'
      };

      const newDirection = keyMap[event.key];

      if (newDirection) {
            event.preventDefault();
            changeDirection(newDirection);
      }

      // Space to pause
      if (event.key === ' ') {
            event.preventDefault();
            pauseGame();
      }
}

/**
 * Change snake direction
 */
function changeDirection(newDirection) {
      const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
      };

      // Prevent 180-degree turns
      if (opposites[newDirection] !== direction) {
            nextDirection = newDirection;
      }
}

/**
 * Update score display
 */
function updateScore() {
      document.getElementById('currentScore').textContent = score;

      if (score > highScore) {
            highScore = score;
            document.getElementById('highScore').textContent = highScore;
      }
}

/**
 * End the game
 */
function endGame() {
      isGameOver = true;
      clearInterval(gameLoop);
      gameLoop = null;

      soundManager.stopBgm();
      soundManager.playGameOver();

      const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);

      // Show game over modal
      document.getElementById('finalScore').textContent = score;
      document.getElementById('finalScoreText').textContent = score;
      document.getElementById('gameOverModal').classList.add('active');

      // Save game session to server
      saveGameSession(score, gameDuration);
}

/**
 * Save game session to server
 */
async function saveGameSession(score, duration) {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
            await fetch(`${API_BASE}/api/games/session`, {
                  method: 'POST',
                  headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                        score: score,
                        duration_seconds: duration
                  })
            });

            // Refresh leaderboard
            loadLeaderboard();
      } catch (error) {
            console.error('Failed to save game session:', error);
      }
}

/**
 * Load leaderboard from server
 */
async function loadLeaderboard() {
      try {
            const response = await fetch(`${API_BASE}/api/games/leaderboard?limit=5`);

            if (response.ok) {
                  const data = await response.json();
                  displayLeaderboard(data);
            }
      } catch (error) {
            console.error('Failed to load leaderboard:', error);
      }
}

/**
 * Display leaderboard
 */
function displayLeaderboard(entries) {
      const list = document.getElementById('leaderboardList');

      if (!entries || entries.length === 0) {
            list.innerHTML = `
            <li class="leaderboard-item">
                <span class="rank">-</span>
                <span class="player-name">暂无数据</span>
                <span class="player-score">-</span>
            </li>
        `;
            return;
      }

      list.innerHTML = entries.map((entry, index) => `
        <li class="leaderboard-item ${index === 0 ? 'first' : ''}">
            <span class="rank">${entry.rank}</span>
            <span class="player-name">${entry.username}</span>
            <span class="player-score">${entry.score}</span>
        </li>
    `).join('');
}

/**
 * Restart game
 */
function restartGame() {
      closeModal();
      startGame();
}

/**
 * Close game over modal
 */
function closeModal() {
      document.getElementById('gameOverModal').classList.remove('active');
}

// Initial draw
setTimeout(() => {
      if (canvas && ctx) {
            initSnake();
            generateFood();
            drawGame();
      }
}, 100);
