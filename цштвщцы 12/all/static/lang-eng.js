window.loadEnglishTranslations = function() {
  const translations = {
    'Проводник': 'Explorer',
    'Блокнот': 'Notepad',
    'Калькулятор': 'Calculator',
    'Paint': 'Paint',
    'Браузер': 'Browser',
    'VS Code': 'VS Code',
    'Музыка': 'Music',
    'стили': 'Settings',
    'Игры': 'Games',
    'Поиск приложений, настроек и файлов': 'Search apps, settings and files',
    'Панель задач': 'Taskbar',
    'По центру': 'Center',
    'Слева': 'Left',
    'Справа': 'Right',
    'Обои из папки (6)': 'Wallpapers from folder (6)',
    'Обои (URL из интернета, 1)': 'Wallpapers (URL from internet, 1)',
    'Обои 1': 'Wallpaper 1',
    'Обои 2': 'Wallpaper 2',
    'Обои 3': 'Wallpaper 3',
    'Обои 4': 'Wallpaper 4',
    'Обои 5': 'Wallpaper 5',
    'Обои 6': 'Wallpaper 6',
    'Ссылка на изображение': 'Image link',
    'Сохранить': 'Save',
    'Применить': 'Apply',
    'Сбросить обои': 'Reset wallpaper',
    'Змейка': 'Snake',
    'Шахматы': 'Chess',
    'Шашки': 'Checkers',
    'Арканоид': 'Arkanoid',
    'Тетрис': 'Tetris',
    '2048': '2048',
    'Крестики-Нолики': 'Tic Tac Toe',
    'Сапёр': 'Minesweeper',
    'Пинг-Понг': 'Pong',
    'Лабиринт': 'Labyrinth',
    'Ход:': 'Turn:',
    'Белые': 'White',
    'Чёрные': 'Black',
    'Синие': 'Blue',
    'Красные': 'Red',
    'Вкл/Выкл бот': 'Toggle Bot',
    'Вкл бот': 'Bot On',
    'Выкл бот': 'Bot Off',
    'Новая игра': 'New Game',
    'Старт': 'Start',
    'Счёт:': 'Score:',
    'Жизни:': 'Lives:',
    'Победил:': 'Winner:',
    'Победили:': 'Winners:',
    'ШАХ!': 'CHECK!',
    'Игра окончена!': 'Game Over!',
    'Победа!': 'Victory!',
    'Используйте стрелки или WASD для движения': 'Use arrows or WASD to move',
    'Время:': 'Time:',
    'Свернуть': 'Minimize',
    'Развернуть': 'Maximize',
    'Обои 6': 'Wallpaper 6',
    'Очистить': 'Clear',
    '//напиши код тут в vs Code': '//write code here in VS Code',
    'Вывод запущен. Нажмите Run для выполнения.': 'Output started. Press Run to execute.',
    'Запуск для языка': 'Running for language',
    'пока не поддерживается в браузере.': 'is not yet supported in the browser.',
    'Введите URL': 'Enter URL',
    'Перейти': 'Go',
    'Быстрый доступ': 'Quick Access',
    'Загрузки': 'Downloads',
    'Документы': 'Documents',
    'Это винда в браузере что ты тут ожидал увидеть': 'This is Windows in a browser, what did you expect to see',
    'Привет! Это в необычном Windows .': 'Hello! This is an unusual Windows.',
    'перекинь свой мухон в mp3/mp4 формате': 'Drag your audio file in mp3/mp4 format',
    'Ошибка загрузки приложения': 'Error loading application',
    'Счёт: 0 | Нажмите стрелки для начала': 'Score: 0 | Press arrows to start',
    'Игра окончена! Счёт:': 'Game Over! Score:',
    ' | Нажмите стрелки для новой игры': ' | Press arrows for new game',
    'Нажмите стрелки для начала': 'Press arrows to start',
    'Нажмите стрелки для новой игры': 'Press arrows for new game',
    'Ход: Белые': 'Turn: White',
    'Ход: Чёрные': 'Turn: Black',
    'Ход: Синие': 'Turn: Blue',
    'Ход: Красные': 'Turn: Red',
    'Ход: Белые (ШАХ!)': 'Turn: White (CHECK!)',
    'Ход: Чёрные (ШАХ!)': 'Turn: Black (CHECK!)',
    'Ничья!': 'Draw!',
    'Ход: X': 'Turn: X',
    'Сапёр': 'Minesweeper',
    'Игрок:': 'Player:',
    'Компьютер:': 'Computer:',
    'Стрелки вверх/вниз или мышь': 'Up/down arrows or mouse',
    'Игра окончена! Нажмите "Новая игра"': 'Game Over! Press "New Game"',
    'Победа! Вы прошли лабиринт!': 'Victory! You completed the maze!',
    'В': 'E'
  };
  
  function translateText(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (translations[text]) {
        node.textContent = translations[text];
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.placeholder && translations[node.placeholder]) {
        node.placeholder = translations[node.placeholder];
      }
      if (node.title && translations[node.title]) {
        node.title = translations[node.title];
      }
      node.childNodes.forEach(translateText);
    }
  }
  
  document.querySelectorAll('*').forEach(translateText);
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach(translateText);
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  const updateDynamicText = () => {
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.getAttribute('data-translate');
      if (translations[key]) {
        el.textContent = translations[key];
      }
    });
  };
  
  updateDynamicText();
  
  window.translations = translations;
  window.translate = function(key) {
    return translations[key] || key;
  };
  
  // Переводим уже созданные динамические элементы
  setTimeout(() => {
    document.querySelectorAll('button, div, span, input[type="button"], input[type="submit"]').forEach(el => {
      if (el.textContent && translations[el.textContent.trim()]) {
        el.textContent = translations[el.textContent.trim()];
      }
    });
  }, 100);
};

