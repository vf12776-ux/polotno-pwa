import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Загрузка списка товаров в реальном времени
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
      <button class="btn delete-btn" data-id="${docSnap.id}">Удалить</button>
    `;
    container.appendChild(item);
  });

  // Навешиваем обработчики на кнопки удаления
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (confirm('Удалить этот товар из меню?')) {
        await deleteDoc(doc(db, "products", btn.dataset.id));
      }
    });
  });
});

// Добавление товара
document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Загрузка...';

  try {
    const fileInput = document.getElementById('product-image');
    let imageUrl = null;

    // 1. Загрузка фото на ImgBB (если выбрано)
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

    // 2. Сохранение в Firestore
    await addDoc(collection(db, "products"), {
      name: document.getElementById('product-name').value,
      description: document.getElementById('product-description').value,
      price: parseInt(document.getElementById('product-price').value),
      category: document.getElementById('product-category').value,
      image_url: imageUrl,
      created_at: new Date()
    });

    // Очистка формы
    e.target.reset();
    alert('Товар успешно добавлен!');
  } catch (error) {
    console.error(error);
    alert('Ошибка: ' + error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Добавить товар';
  }
});