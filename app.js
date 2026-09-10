// 1. Регистрация Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW зарегистрирован:', reg.scope))
      .catch(err => console.log('Ошибка SW:', err));
  });
}

// 2. Логика корзины
let cart = JSON.parse(localStorage.getItem('polotno_cart')) || [];

function updateCartUI() {
  document.getElementById('cart-count').textContent = cart.length;
  const cartItems = document.getElementById('cart-items');
  cartItems.innerHTML = '';
  let total = 0;
  
  cart.forEach((item) => {
    total += item.price;
    const li = document.createElement('li');
    li.textContent = `${item.name} - ${item.price} ₽`;
    cartItems.appendChild(li);
  });
  
  document.getElementById('cart-total').textContent = total;
  localStorage.setItem('polotno_cart', JSON.stringify(cart));
}

document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    cart.push({
      name: btn.dataset.name,
      price: parseInt(btn.dataset.price)
    });
    updateCartUI();
  });
});

document.getElementById('cart-fab').addEventListener('click', () => {
  document.getElementById('cart-modal').classList.remove('hidden');
});

document.getElementById('close-cart').addEventListener('click', () => {
  document.getElementById('cart-modal').classList.add('hidden');
});

document.getElementById('checkout-btn').addEventListener('click', () => {
  if(cart.length === 0) {
    alert('Корзина пуста!');
    return;
  }
  alert('Заказ оформлен! (Сумма: ' + document.getElementById('cart-total').textContent + ' ₽)');
  cart = [];
  updateCartUI();
  document.getElementById('cart-modal').classList.add('hidden');
});

updateCartUI();