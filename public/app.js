// Configuración de Firebase (TUYA)
const firebaseConfig = {
  apiKey: "AIzaSyDFOcDXD64IQZ2RiRhpx0IfX4E9UCJhDjU",
  authDomain: "gimnasio-63bdd.firebaseapp.com",
  projectId: "gimnasio-63bdd",
  storageBucket: "gimnasio-63bdd.firebasestorage.app",
  messagingSenderId: "184489602937",
  appId: "1:184489602937:web:03e0e0198da9f3392589a8",
  measurementId: "G-YVLJSB3VFN"
};
// Importar Firebase (usando CDN)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Referencias a elementos del DOM
const authSection = document.getElementById('auth-section');
const tasksSection = document.getElementById('tasks-section');
const tasksList = document.getElementById('tasks-list');
const userEmailSpan = document.getElementById('user-email');

// ========== FUNCIONES GLOBALES (window) ==========
// Se asignan explícitamente a window para que funcionen desde onclick

window.signUp = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('❌ Por favor, completa todos los campos');
    return;
  }

  if (password.length < 6) {
    alert('❌ La contraseña debe tener al menos 6 caracteres');
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert('✅ ¡Registro exitoso! Bienvenido/a');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
  } catch (error) {
    let mensaje = '❌ Error: ';
    if (error.code === 'auth/email-already-in-use') {
      mensaje += 'Este correo ya está registrado. Prueba iniciar sesión.';
    } else if (error.code === 'auth/invalid-email') {
      mensaje += 'El correo electrónico no es válido.';
    } else {
      mensaje += error.message;
    }
    alert(mensaje);
  }
};

window.signIn = async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('❌ Por favor, completa todos los campos');
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert('✅ ¡Bienvenido/a de vuelta!');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
  } catch (error) {
    let mensaje = '❌ Error: ';
    if (error.code === 'auth/user-not-found') {
      mensaje += 'Usuario no encontrado. ¿Necesitas registrarte?';
    } else if (error.code === 'auth/wrong-password') {
      mensaje += 'Contraseña incorrecta.';
    } else {
      mensaje += error.message;
    }
    alert(mensaje);
  }
};

window.signOut = async () => {
  try {
    await signOut(auth);
    alert('✅ Sesión cerrada correctamente');
  } catch (error) {
    alert('❌ Error al cerrar sesión: ' + error.message);
  }
};

window.addTask = async () => {
  const taskInput = document.getElementById('task-input');
  const taskText = taskInput.value.trim();

  if (taskText === '') {
    alert('❌ Por favor, escribe una rutina de ejercicio');
    return;
  }

  try {
    const user = auth.currentUser;
    await addDoc(collection(db, 'rutinas'), {
      text: taskText,
      userId: user.uid,
      timestamp: new Date(),
      fecha: new Date().toLocaleString()
    });
    taskInput.value = '';
    alert('✅ ¡Rutina agregada exitosamente!');
  } catch (error) {
    alert('❌ Error al agregar: ' + error.message);
  }
};

window.deleteTask = async (taskId) => {
  if (confirm('¿Seguro que quieres eliminar esta rutina?')) {
    try {
      await deleteDoc(doc(db, 'rutinas', taskId));
      alert('✅ Rutina eliminada');
    } catch (error) {
      alert('❌ Error al eliminar: ' + error.message);
    }
  }
};

// ========== ESTADO DE AUTENTICACIÓN ==========
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.style.display = 'none';
    tasksSection.style.display = 'block';
    if (userEmailSpan) {
      userEmailSpan.innerHTML = `✅ Bienvenido, <strong>${user.email}</strong>`;
    }
    loadTasks(); // Cargar rutinas en tiempo real
    console.log('Usuario logueado:', user.email);
  } else {
    authSection.style.display = 'block';
    tasksSection.style.display = 'none';
    console.log('Usuario no logueado');
  }
});

// ========== FUNCIÓN PARA CARGAR RUTINAS EN TIEMPO REAL ==========
function loadTasks() {
  const user = auth.currentUser;
  if (!user) return;

  tasksList.innerHTML = '<div class="loading">Cargando tus rutinas...</div>';

  const q = collection(db, 'rutinas');
  onSnapshot(q, (snapshot) => {
    tasksList.innerHTML = '';
    let tieneRutinas = false;

    snapshot.forEach((docu) => {
      const rutina = docu.data();
      if (rutina.userId === user.uid) {
        tieneRutinas = true;
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        taskDiv.innerHTML = `
          <span class="task-text">💪 ${rutina.text}</span>
          <button class="delete-btn" onclick="deleteTask('${docu.id}')">🗑️ Eliminar</button>
        `;
        tasksList.appendChild(taskDiv);
      }
    });

    if (!tieneRutinas) {
      tasksList.innerHTML = '<div class="loading">📋 No tienes rutinas aún. ¡Agrega tu primera rutina!</div>';
    }
  });
}