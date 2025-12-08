const codeEl = document.getElementById('codeContent');
const btn = document.getElementById('getCodeBtn');

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

function spinDigit(el, stopDelay) {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            el.textContent = randDigit();
        }, 40);

        setTimeout(() => {
            clearInterval(interval);
            const final = randDigit();
            el.textContent = final;
            resolve(final);
        }, stopDelay);
    });
}

btn.addEventListener('click', async () => {
    btn.disabled = true;

    const intervals = digits.map(el => {
        return setInterval(() => {
            el.textContent = randDigit();
        }, 40);
    });

    const finalDigits = [];

    for (let i = 0; i < digits.length; i++) {
        const stopDelay = 200 + i * 150; 

        await new Promise(resolve => setTimeout(resolve, stopDelay));

        clearInterval(intervals[i]);

        const final = randDigit();
        digits[i].textContent = final;
        finalDigits[i] = final;
    }
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

    console.log('Готово:', payload);

    btn.disabled = false;
});
