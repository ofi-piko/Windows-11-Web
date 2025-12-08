
let welcomeStep = 1;
let userName = '';
let userLanguage = 'ru';

function getUserData() {
  try {
    const userData = localStorage.getItem('user');
    const jsonData = localStorage.getItem('user_json');
    if (userData) {
      return JSON.parse(userData);
    }
    if (jsonData) {
      return JSON.parse(jsonData);
    }
  } catch (e) {
    console.error('Error loading user data:', e);
  }
  return null;
}

function saveUserData(name, language) {
  const userData = {
    name: name,
    language: language,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('user_json', JSON.stringify(userData));
  return userData;
}

function showWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcome-screen');
  if (welcomeScreen) {
    welcomeScreen.classList.remove('hidden');
  }
}

function hideWelcomeScreen() {
  const welcomeScreen = document.getElementById('welcome-screen');
  if (welcomeScreen) {
    welcomeScreen.classList.add('hidden');
  }
}

function showStep(stepNum) {
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById(`welcome-step-${i}`);
    if (step) {
      if (i === stepNum) {
        step.classList.remove('hidden');
      } else {
        step.classList.add('hidden');
      }
    }
  }
}

window.welcomeNext = function () {
  if (welcomeStep === 1) {
    const nameInput = document.getElementById('welcome-name-input');
    if (nameInput && nameInput.value.trim()) {
      userName = nameInput.value.trim();
      welcomeStep = 2;
      showStep(2);
      const greeting = document.getElementById('welcome-greeting');
      if (greeting) {
        greeting.textContent = `hello, ${userName}`;
      }
    } else {
      alert('Please enter your name');
    }
  }
};

window.selectLanguage = function (lang) {
  userLanguage = 'ru';
  setTimeout(() => {
    welcomeStep = 3;
    showStep(3);
  }, 300);
};

window.welcomeFinish = function () {
  saveUserData(userName, userLanguage);
  window.location.href = '../ru/index.html';
};

// Responsive screen detection
function updateScreenClass() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  document.body.classList.remove('screen-mobile', 'screen-tablet', 'screen-desktop');
  
  if (screenWidth < 768) {
    document.body.classList.add('screen-mobile');
  } else if (screenWidth >= 768 && screenWidth < 1024) {
    document.body.classList.add('screen-tablet');
  } else {
    document.body.classList.add('screen-desktop');
  }
}

// Initialize screen detection on page load
updateScreenClass();

// Listen for window resize events
window.addEventListener('resize', updateScreenClass);

const existingUserData = getUserData();
if (existingUserData && existingUserData.name) {
  window.location.href = '../ru/index.html';
} else {
  showWelcomeScreen();
  showStep(1);
}

