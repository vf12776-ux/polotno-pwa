// install-prompt.js - Максимально простая установка

let deferredPrompt = null;
const ua = navigator.userAgent.toLowerCase();

const isYandex = /yabrowser/.test(ua);
const isChrome = /chrome/.test(ua) && !/edge|edg|yabrowser/.test(ua);
const isEdge = /edge|edg/.test(ua);
const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
const isIOS = /iphone|ipad|ipod/.test(ua);
const isAndroid = /android/.test(ua);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

if (isStandalone) {
  // Уже установлено
} else {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showButton();
  });

  setTimeout(() => {
    if (!deferredPrompt && !isStandalone) {
      showButton();
    }
  }, 2000);
}

window.addEventListener('appinstalled', () => {
  removeButton();
  deferredPrompt = null;
});

function showButton() {
  removeButton();

  const btn = document.createElement('button');
  btn.id = 'install-button';
  btn.innerHTML = '📲 Установить';
  btn.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 20px;
    background: #28a745;
    color: white;
    border: none;
    padding: 16px 28px;
    border-radius: 30px;
    font-size: 1.1em;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.5);
    z-index: 9999;
    animation: pulse 1.5s infinite;
  `;
  
  btn.addEventListener('click', handleClick);
  document.body.appendChild(btn);
}

function handleClick() {
  // Chrome/Edge: стандартная установка
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((result) => {
      if (result.outcome === 'accepted') {
        removeButton();
      }
      deferredPrompt = null;
    });
    return;
  }

  // Яндекс: сразу открываем Chrome
  if (isYandex) {
    const url = window.location.href;
    const host = new URL(url).host + new URL(url).pathname + new URL(url).search;
    
    if (isAndroid) {
      window.location.href = `intent://${host}#Intent;scheme=https;package=com.android.chrome;end`;
    } else if (isIOS) {
      window.location.href = `googlechromes://${host}`;
    } else {
      window.open(url, '_blank');
    }
    return;
  }

  // Safari iOS: показываем стрелку вниз
  if (isSafari && isIOS) {
    showArrow();
    return;
  }
}

function showArrow() {
  const arrow = document.createElement('div');
  arrow.id = 'install-arrow';
  arrow.innerHTML = '⬇️';
  arrow.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 3em;
    z-index: 10000;
    animation: bounce 0.6s infinite;
  `;
  document.body.appendChild(arrow);

  setTimeout(() => {
    const a = document.getElementById('install-arrow');
    if (a) a.remove();
  }, 5000);
}

function removeButton() {
  const btn = document.getElementById('install-button');
  if (btn) btn.remove();
}