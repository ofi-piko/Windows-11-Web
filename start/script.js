const codeEl = document.getElementById('codeContent');
const btn = document.getElementById('getCodeBtn');
const copyBtn = document.getElementById('copyCode');

function prepare() {
    const parts = 4;
    const digits = 4;

    const spans = [];

    codeEl.innerHTML = '';

    for (let p = 0; p < parts; p++) {
        for (let d = 0; d < digits; d++) {
            const digitEl = document.createElement('span');
            digitEl.className = 'digit';
            digitEl.textContent = '0';
            codeEl.appendChild(digitEl);
            spans.push(digitEl);
        }
        if (p < parts - 1) {
            const dash = document.createElement('span');
            dash.textContent = '-';
            codeEl.appendChild(dash);
        }
    }

    return spans;
}

const digits = prepare();

const randDigit = () => Math.floor(Math.random() * 10);

// Функция копирования текста
async function copyCodeToClipboard() {
    const savedData = localStorage.getItem('Key');
    
    if (!savedData) {
        alert('Сначала сгенерируйте код!');
        return;
    }
    
    try {
        const { code } = JSON.parse(savedData);
        await navigator.clipboard.writeText(code);
        
        copyBtn.textContent = 'скопировано ✓';
        copyBtn.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            copyBtn.textContent = 'скопировать';
            copyBtn.style.backgroundColor = '';
        }, 2000);
        
    } catch (err) {
        console.error('Ошибка копирования:', err);
        alert('Не удалось скопировать код');
    }
}

btn.addEventListener('click', async () => {
    btn.disabled = true;
    copyBtn.disabled = true;

    // Запускаем быструю прокрутку для всех цифр
    const intervals = digits.map(el => {
        return setInterval(() => {
            el.textContent = randDigit();
        }, 30);
    });

    const finalDigits = [];

    // Анимация длительностью 2.5 секунды
    const animationDuration = 2500; // 2.5 секунды
    
    // Останавливаем все цифры с задержкой, чтобы создать эффект каскада
    for (let i = 0; i < digits.length; i++) {
        // Создаем неравномерные задержки для более интересного эффекта
        // Первые цифры останавливаются быстрее, последние - медленнее
        const progress = i / digits.length; // от 0 до 1
        const stopDelay = 300 + (animationDuration - 300) * progress;
        
        setTimeout(() => {
            clearInterval(intervals[i]);
            const final = randDigit();
            digits[i].textContent = final;
            finalDigits[i] = final;
            
            // Если это последняя цифра - сохраняем результат
            if (i === digits.length - 1) {
                const code =
                    finalDigits.slice(0, 4).join('') + '-' +
                    finalDigits.slice(4, 8).join('') + '-' +
                    finalDigits.slice(8, 12).join('') + '-' +
                    finalDigits.slice(12, 16).join('');

                const payload = {
                    code,
                    createdAt: Date.now()
                };

                localStorage.setItem('Key', JSON.stringify(payload));
                
                console.log('Готово за 2.5 секунды:', payload);
                
                btn.disabled = false;
                copyBtn.disabled = false;
            }
        }, stopDelay);
    }
});

copyBtn.addEventListener('click', copyCodeToClipboard);