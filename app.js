import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAtrTFNAZtj3DiLjm1uwFZyDtGwhWgG44",
  authDomain: "polotno-bar-96a49.firebaseapp.com",
  projectId: "polotno-bar-96a49",
  storageBucket: "polotno-bar-96a49.firebasestorage.app",
  messagingSenderId: "533968584563",
  appId: "1:533968584563:web:2f27cea6816f3f16d14f06"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW зарегистрирован:', reg.scope))
    .catch(err => console.log('Ошибка SW:', err));
}

// Корзина
let cart = JSON.parse(localStorage.getItem('polotno_cart')) || [];

// 1. МГНОВЕННО показываем меню из localStorage (кэш)
function renderMenuFromCache() {
  const cached = localStorage.getItem('polotno_menu_cache');
  if (cached) {
    const products = JSON.parse(cached);
    renderProducts(products);
    console.log('Меню загружено из кэша (мгновенно)');
  }
}

// 2. Рендер товаров на страницу
function renderProducts(products) {
  const menuGrid = document.getElementById('menu-grid');
  menuGrid.innerHTML = '';
  
  if (products.length === 0) {
    menuGrid.innerHTML = '<p style="padding: 20px; text-align: center;">Меню пока пустое. Загляните позже!</p>';
    return;
  }

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      ${product.image_url ? `<img src="${product.image_url}" class="product-img-main" alt="${product.name}" loading="lazy" decoding="async">` : ''}
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <span class="price">${product.price} ₽</span>
      <button class="add-btn" data-name="${product.name}" data-price="${product.price}">В корзину</button>
    `;
    menuGrid.appendChild(card);
  });

  // Обработчики кнопок
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      cart.push({
        name: btn.dataset.name,
        price: parseInt(btn.dataset.price)
      });
      updateCartUI();
      // Визуальная обратная связь
      btn.textContent = '✓ Добавлено';
      btn.style.background = '#28a745';
      setTimeout(() => {
        btn.textContent = 'В корзину';
        btn.style.background = '';
      }, 1000);
    });
  });
}

// 3. Загружаем свежие данные из Firebase (в фоне)
function loadMenuFromFirebase() {
  onSnapshot(collection(db, "products"), (snapshot) => {
    const products = [];
    snapshot.forEach(doc => {
      products.push(doc.data());
    });
    
    // Сохраняем в localStorage как кэш
    localStorage.setItem('polotno_menu_cache', JSON.stringify(products));
    
    // Обновляем меню на странице
    renderProducts(products);
    console.log('Меню обновлено из Firebase');
  }, (error) => {
    console.log('Firebase недоступен, показываем кэш:', error.message);
  });
}

// Корзина
function updateCartUI() {
  document.getElementById('cart-count').textContent = cart.length;
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = '';
  let total = 0;
  
  cart.forEach(item => {
    total += item.price;
    const li = document.createElement('li');
    li.textContent = `${item.name} - ${item.price} ₽`;
    cartItems.appendChild(li);
  });
  
  document.getElementById('cart-total').textContent = total;
  localStorage.setItem('polotno_cart', JSON.stringify(cart));
}

document.getElementById('cart-fab').addEventListener('click', () => {
  document.getElementById('cart-modal').classList.remove('hidden');
});

document.getElementById('close-cart').addEventListener('click', () => {
  document.getElementById('cart-modal').classList.add('hidden');
});

document.getElementById('checkout-btn').addEventListener('click', () => {
  if (cart.length === 0) {
    alert('Корзина пуста!');
    return;
  }
  alert('Заказ оформлен! Сумма: ' + document.getElementById('cart-total').textContent + ' ₽');
  cart = [];
  updateCartUI();
  document.getElementById('cart-modal').classList.add('hidden');
});

// ЗАПУСК: сначала кэш (мгновенно), потом Firebase (в фоне)
renderMenuFromCache();
updateCartUI();
loadMenuFromFirebase();