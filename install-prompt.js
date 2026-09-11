// install-prompt.js - Универсальная установка PWA для всех браузеров

let deferredPrompt;
const userAgent = navigator.userAgent.toLowerCase();

// Определение браузера
const isChrome = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);
const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
const isFirefox = /firefox/.test(userAgent);
const isYandex = /yabrowser/.test(userAgent);
const isEdge = /edge|edg/.test(userAgent);
const isIOS = /iphone|ipad|ipod/.test(userAgent);
const isAndroid = /android/.test(userAgent);
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

// Если уже установлено - не показываем кнопку
if (isStandalone) {
  console.log('Приложение уже установлено');
} else {
  window.addEventListener('load', () => {
    setTimeout(showInstallButton, 1000);
  });
}

// Слушаем beforeinstallprompt (работает только в Chrome/Edge на Android)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function showInstallButton() {
  const installBtn = document.createElement('button');
  installBtn.id = 'install-button';
  installBtn.innerHTML = '📲 Установить приложение';
  installBtn.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px 24px;
    border-radius: 30px;
    font-size: 1em;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s;
    animation: pulse 2s infinite;
  `;
  
  installBtn.addEventListener('click', handleInstallClick);
  document.body.appendChild(installBtn);
}

function handleInstallClick() {
  // Если есть beforeinstallprompt (Chrome/Edge Android)
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        removeInstallButton();
      }
      deferredPrompt = null;
    });
    return;
  }

  // Для остальных браузеров показываем инструкции
  showBrowserInstructions();
}

function showBrowserInstructions() {
  const modal = document.createElement('div');
  modal.id = 'install-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.85);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.3s;
  `;
  
  let instructions = '';
  let browserName = '';
  
  if (isYandex) {
    browserName = 'Яндекс Браузер';
    const currentUrl = window.location.href;
    instructions = `
      <div style="text-align: left; margin: 20px 0;">
        <p style="margin: 10px 0; color: #dc3545; font-weight: 600;">⚠️ Вы не в Chrome!</p>
        <p style="margin: 10px 0;"><strong>1.</strong> Скопируйте ссылку:</p>
        <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; margin: 10px 0; word-break: break-all; font-size: 0.9em;">${currentUrl}</div>
        <button onclick="copyToClipboard('${currentUrl}')" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9em; width: 100%; margin-bottom: 15px;">📋 Скопировать ссылку</button>
        
        <p style="margin: 10px 0;"><strong>2.</strong> Откройте в Chrome:</p>
        <button onclick="openInChrome()" style="background: #4285f4; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9em; width: 100%; margin-bottom: 15px;">🌐 Открыть в Chrome</button>
        
        <p style="margin: 10px 0; color: #666; font-size: 0.85em;"><strong>3.</strong> В Chrome нажмите меню (три точки) → "Установить приложение" или "Добавить на главный экран"</p>
      </div>
    `;
  } else if (isSafari && isIOS) {
    browserName = 'Safari';
    instructions = `
      <div style="text-align: left; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>1.</strong> Нажмите на кнопку <strong>"Поделиться"</strong> <span style="font-size: 1.5em;">⬆️</span> в нижней панели</p>
        <p style="margin: 10px 0;"><strong>2.</strong> Прокрутите вниз и выберите <strong>"На экран «Домой»"</strong></p>
        <p style="margin: 10px 0;"><strong>3.</strong> Нажмите <strong>"Добавить"</strong></p>
      </div>
    `;
  } else if (isChrome && isIOS) {
    browserName = 'Chrome на iPhone';
    instructions = `
      <div style="text-align: left; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>1.</strong> Нажмите на <strong>три точки</strong> в правом верхнем углу</p>
        <p style="margin: 10px 0;"><strong>2.</strong> Выберите <strong>"Добавить на экран Домой"</strong></p>
        <p style="margin: 10px 0;"><strong>3.</strong> Подтвердите установку</p>
      </div>
    `;
  } else if (isFirefox) {
    browserName = 'Firefox';
    instructions = `
      <div style="text-align: left; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>1.</strong> Нажмите на <strong>три точки</strong> в правом верхнем углу</p>
        <p style="margin: 10px 0;"><strong>2.</strong> Выберите <strong>"Установить"</strong> или <strong>"Добавить на главный экран"</strong></p>
        <p style="margin: 10px 0;"><strong>3.</strong> Подтвердите установку</p>
      </div>
    `;
  } else if (isEdge) {
    browserName = 'Microsoft Edge';
    instructions = `
      <div style="text-align: left; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>1.</strong> Нажмите на <strong>три точки</strong> в правом верхнем углу</p>
        <p style="margin: 10px 0;"><strong>2.</strong> Выберите <strong>"Приложения"</strong> → <strong>"Установить это приложение"</strong></p>
        <p style="margin: 10px 0;"><strong>3.</strong> Подтвердите установку</p>
      </div>
    `;
  } else {
    browserName = 'ваш браузер';
    instructions = `
      <div style="text-align: left; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>1.</strong> Откройте меню браузера (обычно три точки или линии)</p>
        <p style="margin: 10px 0;"><strong>2.</strong> Найдите опцию <strong>"Установить приложение"</strong> или <strong>"Добавить на главный экран"</strong></p>
        <p style="margin: 10px 0;"><strong>3.</strong> Подтвердите установку</p>
      </div>
    `;
  }
  
  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 20px; max-width: 450px; width: 100%; text-align: center; animation: slideUp 0.3s; max-height: 90vh; overflow-y: auto;">
      <h3 style="margin-top: 0; color: #333; font-size: 1.5em;">Установить приложение</h3>
      <p style="color: #666; margin: 10px 0;">Откройте меню ${browserName} и выполните следующие шаги:</p>
      ${instructions}
      <button onclick="document.getElementById('install-modal').remove()" style="background: #6c757d; color: white; border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer; font-size: 0.95em; margin-top: 10px;">Закрыть</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Функция копирования ссылки
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Ссылка скопирована!');
  }).catch(err => {
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Ссылка скопирована!');
  });
}

// Функция открытия в Chrome
function openInChrome() {
  const url = window.location.href;
  
  if (isAndroid) {
    // Android: используем intent scheme
    const intentUrl = `intent://${new URL(url).host}${new URL(url).pathname}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
  } else if (isIOS) {
    // iOS: используем googlechromes scheme
    window.location.href = `googlechromes://${new URL(url).host}${new URL(url).pathname}`;
  } else {
    // Desktop: просто открываем новую вкладку (Chrome должен быть по умолчанию)
    window.open(url, '_blank');
  }
}

function removeInstallButton() {
  const installBtn = document.getElementById('install-button');
  if (installBtn) {
    installBtn.remove();
  }
}

// Автоматически убираем кнопку после установки
window.addEventListener('appinstalled', () => {
  removeInstallButton();
  console.log('Приложение успешно установлено');
});