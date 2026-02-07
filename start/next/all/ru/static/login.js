(function () {
  'use strict';

  function initLoginScreen() {
    var screen = document.getElementById('login-screen');
    var btn = document.getElementById('login-btn');
    var nameEl = document.getElementById('login-name');
    var avatarEl = document.getElementById('login-avatar');
    if (!screen || !btn) return;

    var userRaw = localStorage.getItem('user') || localStorage.getItem('user_json');
    if (userRaw) {
      try {
        var user = JSON.parse(userRaw);
        if (nameEl) nameEl.textContent = (user && user.name) ? user.name : 'logo1';
        if (avatarEl && user && user.icon && user.icon.logo) {
          avatarEl.style.backgroundImage = 'url(' + user.icon.logo + ')';
          avatarEl.style.backgroundSize = 'cover';
          avatarEl.style.backgroundPosition = 'center';
        }
      } catch (e) {}
    } else if (nameEl) {
      nameEl.textContent = 'logo1';
    }

    btn.addEventListener('click', function () {
      screen.setAttribute('aria-hidden', 'true');
      screen.classList.add('exiting');
      setTimeout(function () {
        screen.classList.add('hidden');
      }, 650);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginScreen);
  } else {
    initLoginScreen();
  }
})();
