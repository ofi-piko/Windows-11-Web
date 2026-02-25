const state = {
  step: 1,
  name: '',
  lang: 'ru',
  isAdmin: false,
  activationPassed: false,
  activationKey: '',
  password: '',
  pcKey: '',
  createdAt: ''
};

const $ = id => document.getElementById(id);

const errorMessages = {
  required: 'Поле обязательно для заполнения',
  nameRequired: 'Поле имени не заполнено',
  keyRequired: 'Поле ключа не заполнено',
  passwordRequired: 'Поле пароля не заполнено',
  keyInvalid: 'Код неверный! Проверь формат или наличие кода в localStorage.',
  passwordRules: {
    length: '• минимум 8 символов',
    ascii: '• только английские буквы и ASCII-символы',
    uppercase: '• хотя бы одна заглавная буква (A-Z)',
    digit: '• хотя бы одна цифра (0-9)',
    special: '• хотя бы один спецсимвол (!@#$% и т.д.)'
  }
};

function createErrorMessageElement(inputEl, id) {
  if (!inputEl) return null;

  const existing = $(id);
  if (existing) return existing;

  const errorEl = document.createElement('div');
  errorEl.id = id;
  errorEl.className = 'input-error';
  errorEl.style.cssText = `
    color: #dc2626;
    font-size: 14px;
    margin-top: 4px;
    display: none;
  `;

  inputEl.parentNode.insertBefore(errorEl, inputEl.nextSibling);
  return errorEl;
}

function showFieldError(inputEl, message, isHtml = false) {
  if (!inputEl) return;

  const errorId = inputEl.id + '-err';
  const errorEl = createErrorMessageElement(inputEl, errorId);

  if (errorEl) {
    if (isHtml) {
      errorEl.innerHTML = message;
    } else {
      errorEl.textContent = message;
    }
    errorEl.style.display = 'block';
  }

  inputEl.style.cssText = `
    border-color: #dc2626;
    background-color: #fef2f20e;
  `;
}

function clearFieldError(inputEl) {
  if (!inputEl) return;

  const errorId = inputEl.id + '-err';
  const errorEl = $(errorId);

  if (errorEl) {
    errorEl.style.display = 'none';
  }

  inputEl.style.cssText = `
    border-color: rgba(255, 255, 255, 0);
    background-color: rgba(72, 72, 72, 0.22);
  `;
}

function validatePassword(password) {
  const errors = [];

  if (!password) {
    return {
      isValid: false,
      errors: ['passwordRequired'],
      htmlMessage: errorMessages.passwordRequired
    };
  }

  const invalidChars = [];

  for (let i = 0; i < password.length; i++) {
    const char = password[i];
    const charCode = char.charCodeAt(0);

    if (charCode < 32 || charCode > 126) {
      invalidChars.push(char);
    }
  }

  if (invalidChars.length > 0) {
    const uniqueInvalidChars = [...new Set(invalidChars)];
    let invalidMessage = '• Недопустимые символы в пароле:<br>';

    uniqueInvalidChars.forEach(char => {
      let charType = '';
      if (/[а-яА-ЯЁё]/.test(char)) {
        charType = ' (русская буква)';
      } else if (/[^\x00-\x7F]/.test(char)) {
        charType = ' (не-ASCII символ)';
      } else {
        charType = ` (код: ${char.charCodeAt(0)})`;
      }

      invalidMessage += `&nbsp;&nbsp;• "${char}"${charType}<br>`;
    });

    invalidMessage += '• Используйте только:<br>' +
      '&nbsp;&nbsp;• английские буквы (A-Z, a-z)<br>' +
      '&nbsp;&nbsp;• цифры (0-9)<br>' +
      '&nbsp;&nbsp;• специальные символы: !@#$%^&*()_+-=[]{}|;:,.<>?';

    return {
      isValid: false,
      errors: ['invalidCharacters'],
      htmlMessage: invalidMessage
    };
  }

  if (password.length < 8) {
    errors.push('length');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('uppercase');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('digit');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('special');
  }

  let htmlMessage = '';
  if (errors.length > 0) {
    htmlMessage = errors
      .map(errorKey => errorMessages.passwordRules[errorKey] || errorKey)
      .join('<br>');
  }

  return {
    isValid: errors.length === 0,
    errors,
    htmlMessage
  };
}

function saveOriginalPassword(password) {
  try {
    localStorage.setItem('original_user_password', btoa(encodeURIComponent(password)));
  } catch (error) {
    console.error('Ошибка сохранения оригинального пароля:', error);
  }
}

function loadOriginalPassword() {
  try {
    const encrypted = localStorage.getItem('original_user_password');
    if (!encrypted) return '';

    return decodeURIComponent(atob(encrypted));
  } catch (error) {
    console.error('Ошибка загрузки оригинального пароля:', error);
    return '';
  }
}

function loadUserData() {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Ошибка загрузки пользователя:', error);
    return null;
  }
}

function saveUserData(data) {
  try {
    localStorage.setItem('user', JSON.stringify(data));
  } catch (error) {
    console.error('Ошибка сохранения пользователя:', error);
  }
}

function findKeyInStorage(enteredKey) {
  if (!enteredKey) return null;
  const normalizedEnteredKey = enteredKey.replace(/\s+/g, '');

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key === 'user') continue;

      const item = localStorage.getItem(key);
      if (!item) continue;

      try {
        const data = JSON.parse(item);
        if (data && data.code) {
          const normalizedStoredCode = String(data.code).replace(/\s+/g, '');
          if (normalizedStoredCode === normalizedEnteredKey) {
            return data;
          }
        }
      } catch (parseError) {
        continue;
      }
    }
  } catch (error) {
    console.error('Ошибка поиска ключа:', error);
  }

  return null;
}

async function hashPassword(password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Ошибка хеширования пароля:', error);
    return '';
  }
}

function showStep(stepNumber) {
  document.querySelectorAll('[id^="welcome-step-"]').forEach(element => {
    element.classList.add('hidden');
  });

  const stepElement = $(`welcome-step-${stepNumber}`);
  if (stepElement) {
    stepElement.classList.remove('hidden');
    state.step = stepNumber;
  }
}

function showWelcomeScreen() {
  const welcomeScreen = $('welcome-screen');
  if (welcomeScreen) {
    welcomeScreen.classList.remove('hidden');
  }
}

window.welcomeNext = function () {
  const nameInput = $('welcome-name-input');
  clearFieldError(nameInput);

  const name = (nameInput?.value || '').trim();

  if (!name) {
    showFieldError(nameInput, errorMessages.nameRequired);
    return;
  }

  state.name = name;
  const lowerName = name.toLowerCase();

  const greetingElement = $('welcome-greeting');
  if (greetingElement) {
    greetingElement.textContent = `Привет, ${state.name}`;
  }

  if (lowerName === 'admin') {
    state.isAdmin = true;
    showStep(2);
  } else if (lowerName.includes('admin')) {
    showStep(99);
  } else {
    showStep(2);
  }
};

window.activationSubmit = async function (stepNumber = 2) {
  const isSpecialStep = stepNumber === 99;
  const keyInputId = isSpecialStep ? 'admin-key-input' : 'activation-key-input';
  const passwordInputId = isSpecialStep ? 'admin-password-input' : 'password-input';

  const keyInput = $(keyInputId);
  const passwordInput = $(passwordInputId);

  if (keyInput) clearFieldError(keyInput);
  if (passwordInput) clearFieldError(passwordInput);

  const enteredKey = (keyInput?.value || '').trim();
  const password = passwordInput?.value || '';

  let hasErrors = false;

  if (!enteredKey) {
    showFieldError(keyInput, errorMessages.keyRequired);
    hasErrors = true;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    showFieldError(passwordInput, passwordValidation.htmlMessage, true);
    return;
  }

  state.password = password;
  state.activationKey = enteredKey;

  const foundData = findKeyInStorage(enteredKey);
  if (!foundData) {
    showFieldError(keyInput, errorMessages.keyInvalid);
    return;
  }

  state.isAdmin = stepNumber === 99 || state.name.toLowerCase() === 'admin';
  state.activationPassed = true;
  state.pcKey = foundData.code || enteredKey;
  state.createdAt = new Date().toISOString();

  saveUserData(state);

  showStep(3);


  const greetingElement = $('welcome-greeting');
  if (greetingElement) {
    const adminText = state.isAdmin ? ' (админ права выданы)' : '';
    greetingElement.textContent = `Привет, ${state.name}${adminText}`;
  }
};

function validateUserData() {
  const userData = loadUserData() || {};
  const missingFields = [];

  const requiredFields = ['name', 'password', 'activationKey'];
  requiredFields.forEach(field => {
    if (!userData[field]) {
      missingFields.push(field);
    }
  });

  if (userData.activationKey) {
    const found = findKeyInStorage(userData.activationKey);
    if (!found) {
      missingFields.push('activationKey');
    }
  }

  return missingFields;
}

window.welcomeFinish = function () {
  const missingFields = validateUserData();

  if (missingFields.length > 0) {
    const errorMessage = `Нельзя завершить: незаполненные или некорректные поля: ${missingFields.join(', ')}`;
    alert(errorMessage);
    return;
  }

  window.location.href = './all/ru/index.html';
};

function applyPasswordMask() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach(input => {
    input.style.fontFamily = "'Courier New', monospace";
    input.style.letterSpacing = '3px';
    input.style.fontSize = '18px';
    input.style.fontWeight = 'bold';
    input.style.color = '#ffffffff';
  });
}

const originalActivationSubmit = window.activationSubmit;
window.activationSubmit = async function (stepNum) {
  applyPasswordMask();
  return await originalActivationSubmit(stepNum);
};

document.addEventListener('DOMContentLoaded', function () {
  const existingUser = loadUserData();

  if (existingUser?.name && (existingUser.activationKey || existingUser.pcKey) && existingUser.passwordHash) {
    const keyToCheck = existingUser.activationKey || existingUser.pcKey;
    const foundKeyData = findKeyInStorage(keyToCheck);

    if (foundKeyData) {
      window.location.href = './all/ru/index.html';
      return;
    }
  }

  showWelcomeScreen();
  showStep(1);

  if (existingUser?.name) {
    state.name = existingUser.name;
    const nameInput = $('welcome-name-input');
    if (nameInput) {
      nameInput.value = existingUser.name;
    }
    const greetingElement = $('welcome-greeting');
    if (greetingElement) {
      greetingElement.textContent = `Привет, ${state.name}`;
    }
  }

  applyPasswordMask();
});