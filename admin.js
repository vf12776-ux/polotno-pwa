import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const IMGBB_API_KEY = "29646bda8d604823399d05e7fe7025ee";

// ===== ЗАКАЗЫ =====

// Звук уведомления (генерируем прямо в коде, чтобы не таскать файл)
function playNotificationSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Слушаем заказы в реальном времени
onSnapshot(collection(db, "orders"), (snapshot) => {
  const container = document.getElementById('orders-container');
  container.innerHTML = '';
  
  // Сортируем: новые сверху
  const orders = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
  
  if (orders.length === 0) {
    container.innerHTML = '<p style="color:#888;">Заказов пока нет</p>';
    return;
  }

  let newOrdersCount = 0;
  
  orders.forEach(order => {
    if (order.status === 'new') newOrdersCount++;
    
    const item = document.createElement('div');
    item.className = 'order-item';
    item.style.cssText = `
      background: ${order.status === 'new' ? '#fff3cd' : 'white'};
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 4px solid ${order.status === 'new' ? '#ffc107' : '#28a745'};
    `;
    
    const itemsList = order.items.map(i => `${i.name} × ${i.price}₽`).join(', ');
    const time = order.created_at?.toDate ? order.created_at.toDate().toLocaleTimeString('ru-RU') : '—';
    
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:10px;">
        <div>
          <strong>Заказ #${order.id.slice(-4)}</strong>
          <span style="color:#888; font-size:0.85em; margin-left:10px;">${time}</span>
        </div>
        <strong style="color:#8B4513;">${order.total} ₽</strong>
      </div>
      <p style="margin:5px 0; color:#555;">${itemsList}</p>
      <div style="display:flex; gap:8px; margin-top:10px;">
        ${order.status === 'new' ? `
          <button class="btn" style="background:#28a745; padding:8px 16px; font-size:0.9em;" onclick="completeOrder('${order.id}')">✓ Готов</button>
          <button class="btn delete-btn" style="padding:8px 16px; font-size:0.9em;" onclick="cancelOrder('${order.id}')">✗ Отмена</button>
        ` : `
          <span style="color:#28a745; font-weight:600;">✓ Выполнен</span>
        `}
      </div>
    `;
    container.appendChild(item);
  });

  // Звук и уведомление, если есть новые заказы
  if (newOrdersCount > 0) {
    const lastCount = parseInt(localStorage.getItem('last_orders_count') || '0');
    if (newOrdersCount > lastCount) {
      playNotificationSound();
      if (Notification.permission === 'granted') {
        new Notification('🔔 Новый заказ!', {
          body: `Поступило ${newOrdersCount} новых заказов`,
          icon: '/icon31-192.png'
        });
      }
    }
    localStorage.setItem('last_orders_count', newOrdersCount.toString());
    document.title = `(${newOrdersCount}) Админка Полотно`;
  } else {
    localStorage.setItem('last_orders_count', '0');
    document.title = 'Админка | Полотно';
  }
});

// Глобальные функции для кнопок заказов
window.completeOrder = async (orderId) => {
  await updateDoc(doc(db, "orders", orderId), { status: 'done' });
};

window.cancelOrder = async (orderId) => {
  if (confirm('Отменить заказ?')) {
    await deleteDoc(doc(db, "orders", orderId));
  }
};

// Запрашиваем разрешение на уведомления при загрузке
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// ===== ТОВАРЫ =====

let editingProductId = null;

// Список товаров
onSnapshot(collection(db, "products"), (snapshot) => {
  const container = document.getElementById('products-container');
  container.innerHTML = '';
  
  if (snapshot.empty) {
    container.innerHTML = '<p>Товаров пока нет. Добавьте первый!</p>';
    return;
  }
  
  snapshot.forEach((docSnap) => {
    const product = docSnap.data();
    const item = document.createElement('div');
    item.className = 'product-item';
    item.innerHTML = `
      ${product.image_url ? `<img src="${product.image_url}" class="product-img" alt="${product.name}">` : '<div class="product-img" style="background:#eee;"></div>'}
      <div class="product-info">
        <strong>${product.name}</strong> - ${product.price} ₽<br>
        <small>${product.description}</small><br>
        <small style="color:#888;">${product.category}</small>
      </div>
      <div style="display:flex; flex-direction:column; gap:5px;">
        <button class="btn edit-btn" style="padding:8px 16px; font-size:0.9em;" onclick="editProduct('${docSnap.id}')">✎ Изменить</button>
        <button class="btn delete-btn" style="padding:8px 16px; font-size:0.9em;" onclick="deleteProduct('${docSnap.id}')">🗑 Удалить</button>
      </div>
    `;
    container.appendChild(item);
  });
});

// Добавление / редактирование товара
document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Сохранение...';

  try {
    const fileInput = document.getElementById('product-image');
    let imageUrl = null;

    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        imageUrl = data.data.url;
      } else {
        throw new Error('Ошибка загрузки фото');
      }
    }

    const productData = {
      name: document.getElementById('product-name').value,
      description: document.getElementById('product-description').value,
      price: parseInt(document.getElementById('product-price').value),
      category: document.getElementById('product-category').value,
      updated_at: new Date()
    };

    if (imageUrl) productData.image_url = imageUrl;

    if (editingProductId) {
      // Режим редактирования
      await updateDoc(doc(db, "products", editingProductId), productData);
      editingProductId = null;
      submitBtn.textContent = 'Добавить в меню';
      alert('Товар обновлён!');
    } else {
      // Режим добавления
      productData.created_at = new Date();
      await addDoc(collection(db, "products"), productData);
      alert('Товар добавлен!');
    }

    e.target.reset();
  } catch (error) {
    console.error(error);
    alert('Ошибка: ' + error.message);
  } finally {
    submitBtn.disabled = false;
  }
});

// Редактирование товара
window.editProduct = async (productId) => {
  const docSnap = await getDocs(collection(db, "products"));
  const product = docSnap.docs.find(d => d.id === productId)?.data();
  
  if (!product) return;
  
  document.getElementById('product-name').value = product.name;
  document.getElementById('product-description').value = product.description;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-category').value = product.category;
  
  editingProductId = productId;
  document.getElementById('submit-btn').textContent = '💾 Сохранить изменения';
  
  // Прокручиваем к форме
  document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
};

// Удаление товара
window.deleteProduct = async (productId) => {
  if (confirm('Удалить этот товар из меню?')) {
    await deleteDoc(doc(db, "products", productId));
  }
};