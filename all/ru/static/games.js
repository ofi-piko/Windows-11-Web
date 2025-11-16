class Game {
  constructor(title, icon, size) {
    this.title = title;
    this.icon = icon;
    this.size = size;
  }

  createContent() {
    throw new Error('Method createContent must be implemented');
  }
}

class SnakeGame extends Game {
  constructor() {
    super('Змейка', 'all/eng/static/icons/game/snake.png', { width: 500, height: 500 });
  }

  createContent() {
    const root = document.createElement('div');
    root.style.display = 'grid';
    root.style.gridTemplateRows = 'auto 1fr';
    root.style.gap = '8px';
    root.style.height = '100%';
    
    const info = document.createElement('div');
    info.style.display = 'flex';
    info.style.justifyContent = 'space-between';
    info.style.alignItems = 'center';
    const score = document.createElement('div');
    score.textContent = 'Счёт: 0';
    score.style.fontWeight = 'bold';
    const restartBtn = document.createElement('button');
    restartBtn.className = 'btn';
    restartBtn.textContent = 'Новая игра';
    info.append(score, restartBtn);
    
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.background = '#0a0a0a';
    canvas.style.borderRadius = '8px';
    canvas.style.border = '1px solid rgba(255,255,255,0.1)';
    
    let ctx, gridSize = 20, tileCount = 20;
    let snake = [{x: 10, y: 10}];
    let dx = 0, dy = 0;
    let food = {x: 15, y: 15};
    let gameRunning = false;
    let gameLoop;
    
    function resize() {
      const rect = canvas.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      canvas.width = size;
      canvas.height = size;
      ctx = canvas.getContext('2d');
      gridSize = size / tileCount;
      draw();
    }
    new ResizeObserver(resize).observe(canvas);
    
    function draw() {
      if (!ctx) return;
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00ff00';
      snake.forEach((segment, i) => {
        if (i === 0) ctx.fillStyle = '#00ff00';
        else ctx.fillStyle = '#00cc00';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
      });
      
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
    }
    
    function move() {
      if (!gameRunning) return;
      const head = {x: snake[0].x + dx, y: snake[0].y + dy};
      
      if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
      }
      
      if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        gameOver();
        return;
      }
      
      snake.unshift(head);
      
      if (head.x === food.x && head.y === food.y) {
        score.textContent = 'Счёт: ' + (snake.length - 1);
        food = {x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount)};
      } else {
        snake.pop();
      }
      
      draw();
    }
    
    function gameOver() {
      gameRunning = false;
      clearInterval(gameLoop);
      alert('Игра окончена! Счёт: ' + (snake.length - 1));
    }
    
    function start() {
      snake = [{x: 10, y: 10}];
      dx = 0;
      dy = 0;
      food = {x: 15, y: 15};
      score.textContent = 'Счёт: 0';
      gameRunning = true;
      clearInterval(gameLoop);
      gameLoop = setInterval(move, 150);
      draw();
    }
    
    document.addEventListener('keydown', (e) => {
      if (!gameRunning && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        start();
        return;
      }
      if (e.key === 'ArrowUp' && dy !== 1) { dx = 0; dy = -1; }
      else if (e.key === 'ArrowDown' && dy !== -1) { dx = 0; dy = 1; }
      else if (e.key === 'ArrowLeft' && dx !== 1) { dx = -1; dy = 0; }
      else if (e.key === 'ArrowRight' && dx !== -1) { dx = 1; dy = 0; }
    });
    
    restartBtn.addEventListener('click', start);
    
    root.append(info, canvas);
    setTimeout(resize, 100);
    return root;
  }
}

class GameRegistry {
  constructor() {
    this.games = [
      new SnakeGame(),
    ];
  }

  getGameById(id) {
    const gameMap = {
      'Змейка': 0,
      'chess': 1,
      'checkers': 2,
      'flappy': 3,
      'angry': 4,
      'tetris': 5,
      'game2048': 6,
      'tictactoe': 7,
      'minesweeper': 8,
      'pong': 9
    };
    return this.games[gameMap[id]];
  }

  getAllGames() {
    return this.games;
  }
}


