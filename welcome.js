let welcomeStep = 1;
let userName = '';
let userLanguage = 'ru';

const FIXED_KEY = "1234-5678-9101"; // единственный рабочий ключ

function getUserData() {
  try {
    const data = localStorage.getItem('user');
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("load error:", e);
  }
  return null;
}

function showStep(stepNum) {
  for (let i = 1; i <= 3; i++) {
    const step = document.getElementById(`welcome-step-${i}`);
    if (step) step.classList.add("hidden");
  }
  const current = document.getElementById(`welcome-step-${stepNum}`);
  if (current) current.classList.remove("hidden");
}

window.welcomeNext = function () {
  const input = document.getElementById("welcome-name-input");
  if (!input || !input.value.trim()) {
    alert("Введите имя");
    return;
  }

  userName = input.value.trim();
  welcomeStep = 2;
  showStep(2);
};

window.activationSubmit = function () {
  const keyInput = document.getElementById("activation-key-input");
  if (!keyInput) return;

  const entered = keyInput.value.trim();

  let errorMsg = document.getElementById("activation-error-msg");
  if (!errorMsg) {
    errorMsg = document.createElement("div");
    errorMsg.id = "activation-error-msg";
    errorMsg.style.color = "red";
    errorMsg.style.marginTop = "10px";
    keyInput.parentNode.appendChild(errorMsg);
  }

  if (!entered) {
    errorMsg.textContent = "Введите ключ!";
    return;
  }

  if (entered !== FIXED_KEY) {
    errorMsg.textContent = "Неверный ключ!";
    return;
  }

  errorMsg.textContent = "";

  localStorage.setItem(
    "user",
    JSON.stringify({
      name: userName,
      language: userLanguage,
      activationKey: FIXED_KEY,
      isAdmin: true,
      createdAt: new Date().toISOString()
    })
  );

  welcomeStep = 3;
  showStep(3);

  const greeting = document.getElementById("welcome-greeting");
  if (greeting) greeting.textContent = `Welcome, ${userName}`;
};

window.welcomeFinish = function () {
  window.location.href = "./all/ru/index.html";
};

// автозагрузка, если юзер уже активирован
const saved = getUserData();
if (saved && saved.name) {
  window.location.href = "./all/ru/index.html";
} else {
  showStep(1);
}
