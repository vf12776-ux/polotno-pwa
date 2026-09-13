// install-prompt.js - Правильная установка для iOS

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
  // Chrome/Edge: ловим событие установки
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
  });

  // iOS Safari: показываем кнопку сразу, так как события beforeinstallprompt нет
  if (isIOS && isSafari) {
    setTimeout(showInstallButton, 1000);
  }
  
  // Если через 2 секунды nothing happened (другие браузеры)
  setTimeout(() => {
    if (!deferredPrompt && !isStandalone && !(isIOS && isSafari)) {
      showInstallButton();
    }
  }, 2000);
}

window.addEventListener('appinstalled', () => {
  removeInstallUI();
  deferredPrompt = null;
});

function showInstallButton() {
  removeInstallUI();

  const btn = document.createElement('button');
  btn.id = 'install-button';
  
  // Текст кнопки зависит от браузера
  if (isIOS && isSafari) {
    btn.innerHTML = '📲 Установить приложение';
  } else {
    btn.innerHTML = '📲 Установить';
  }

  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #007AFF; /* Apple Blue */
    color: white;
    border: none;
    padding: 14px 28px;
    border-radius: 30px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 122, 255, 0.4);
    z-index: 9999;
    animation: pulse 2s infinite;
  `;
  
  btn.addEventListener('click', handleInstallClick);
  document.body.appendChild(btn);
}

function handleInstallClick() {
  // 1. Chrome/Edge: стандартная установка
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((result) => {
      if (result.outcome === 'accepted') {
        removeInstallUI();
      }
      deferredPrompt = null;
    });
    return;
  }

  // 2. iOS Safari: показываем тултип с инструкцией
  if (isIOS && isSafari) {
    showIOSTooltip();
    return;
  }

  // 3. Яндекс: открываем Chrome
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
}

function showIOSTooltip() {
  removeInstallUI(); // Убираем кнопку, чтобы не мешала

  const tooltip = document.createElement('div');
  tooltip.id = 'ios-tooltip';
  tooltip.innerHTML = `
    <div class="tooltip-content">
      <p>Нажмите кнопку <strong>"Поделиться"</strong> <span class="share-icon">⬆️</span> внизу экрана</p>
      <p>Затем выберите <strong>"На экран «Домой»"</strong></p>
    </div>
    <div class="tooltip-arrow"></div>
  `;
  
  tooltip.style.cssText = `
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.9);
    color: white;
    padding: 15px 20px;
    border-radius: 12px;
    text-align: center;
    z-index: 10000;
    max-width: 300px;
    font-size: 0.9em;
    line-height: 1.4;
    animation: fadeIn 0.3s;
  `;

  // Стили для стрелки и иконки внутри тултипа
  const style = document.createElement('style');
  style.textContent = `
    .share-icon { font-size: 1.2em; vertical-align: middle; }
    .tooltip-arrow {
      width: 0; height: 0;
      border-left: 10px solid transparent;
      border-right: 10px solid transparent;
      border-top: 10px solid rgba(0,0,0,0.9);
      margin: 10px auto 0;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(tooltip);

  // Закрываем по клику вне тултипа или через 10 секунд
  setTimeout(() => {
    if (document.getElementById('ios-tooltip')) {
      document.getElementById('ios-tooltip').remove();
      showInstallButton(); // Возвращаем кнопку, если не установили
    }
  }, 10000);

  tooltip.addEventListener('click', () => {
    tooltip.remove();
    showInstallButton();
  });
}

function removeInstallUI() {
  const btn = document.getElementById('install-button');
  if (btn) btn.remove();
  
  const tooltip = document.getElementById('ios-tooltip');
  if (tooltip) tooltip.remove();
}