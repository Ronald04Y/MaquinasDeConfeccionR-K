// Configuración Maquinas-RK
const firebaseConfig = {
    apiKey: "AIzaSyDAZHwf0UEiK14j59s1wxrBz8yTN0L2VWs",
    authDomain: "maquinas-rk.firebaseapp.com",
    projectId: "maquinas-rk",
    storageBucket: "maquinas-rk.firebasestorage.app",
    messagingSenderId: "621957675909",
    appId: "1:621957675909:web:f70237c62dda9c3d4da2ec"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const whatsappNumber = '573226526403';

// --- SERVICIOS TÉCNICOS (ACTUALIZADO: SIN IMAGEN + EXPERIENCIA) ---
function renderTechnicians() {
    const container = document.querySelector('.tecnicos-cards-container');
    if (!container) return;

    const tecnicos = [
        { nombre: "Wilber Valencia", tel: "573226526403", experiencia: "15 años de experiencia" },
        { nombre: "Juan Carlos", tel: "573226526403", experiencia: "15 años de experiencia" }
    ];

    container.innerHTML = tecnicos.map(t => `
        <div class="tecnico-card" style="text-align: center; padding: 20px; border: 1px solid #ce2f2f; border-radius: 10px; margin: 10px;">
            <i class="fas fa-user-cog" style="font-size: 50px; color: #ce2f2f; margin-bottom: 15px;"></i>
            <h3 style="margin: 10px 0;">Técnico ${t.nombre}</h3>
            <p style="color: #ccc; margin-bottom: 15px;">${t.experiencia}</p>
            <a href="https://wa.me/${t.tel}?text=Hola%20Técnico%20${t.nombre},%20necesito%20un%20servicio" target="_blank" class="whatsapp-btn-tecnico" style="background: #eb1717; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
                <i class="fab fa-whatsapp"></i> Contactar
            </a>
        </div>
    `).join('');
}

// --- RENDERIZAR MÁQUINAS ---
async function renderMachines() {
    const grid = document.querySelector('.maquinas-grid');
    if (!grid) return;
    const snapshot = await db.collection('machines').get();
    grid.innerHTML = '';
    
    snapshot.forEach(doc => {
        const m = doc.data();
        const item = document.createElement('div');
        item.classList.add('maquina-item');
        item.innerHTML = `
            <img src="${m.img || 'img/placeholder.jpg'}">
            <div class="maquina-info">
                <h3>${m.title}</h3>
                <p>${m.price}</p>
            </div>`;
        
        item.onclick = () => {
            const modal = document.querySelector('.machine-modal');
            modal.querySelector('.modal-image').src = m.img;
            modal.querySelector('.modal-title').textContent = m.title;
            modal.querySelector('.modal-price').textContent = m.price;
            
            const waBtn = modal.querySelector('.whatsapp-btn');
            if(waBtn) {
                const text = encodeURIComponent(`Hola, solicito información de: ${m.title}`);
                waBtn.onclick = (e) => {
                    e.preventDefault();
                    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
                };
            }
            modal.style.display = 'flex';
        };
        grid.appendChild(item);
    });
}

// --- FUNCIÓN CONTACTO DIRECTO ---
window.enviarContactoWA = function() {
    const nombre = document.getElementById('wa-name').value;
    const telefono = document.getElementById('wa-phone').value;
    const mensaje = document.getElementById('wa-msg').value;

    if(!nombre || !telefono || !mensaje) {
        alert("Por favor, llena todos los campos.");
        return;
    }

    const fullMsg = `--- MENSAJE DE FORMULARIO WEB ---%0A%0A*Nombre:* ${nombre}%0A*Teléfono:* ${telefono}%0A*Mensaje:* ${mensaje}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${fullMsg}`, '_blank');
};

// --- SEGURIDAD ADMIN ---
async function loginAdmin() {
    const pass = prompt('Clave Administrador:');
    if (!pass) return;
    const doc = await db.collection('config').doc('admin').get();
    if (doc.exists && pass === doc.data().password) {
        initAdmin();
    } else {
        alert('Clave incorrecta');
    }
}

// --- PANEL ADMIN ---
async function initAdmin() {
    document.getElementById('admin-section').style.display = 'block';
    const container = document.getElementById('admin-forms');
    const snapshot = await db.collection('machines').get();
    container.innerHTML = '';

    snapshot.forEach(doc => {
        const m = doc.data();
        const id = doc.id;
        const div = document.createElement('div');
        div.className = 'admin-form';
        div.style = "background:#222; padding:15px; border-radius:8px; margin-bottom:10px; border:1px solid #ce2f2f;";
        div.innerHTML = `
            <button onclick="deleteMachine('${id}')" style="float:right; background:red; color:white;">Eliminar</button>
            <input type="text" value="${m.img}" onchange="updateField('${id}','img',this.value)" style="width:70%">
            <label style="cursor:pointer; font-size:20px;"><input type="file" style="display:none;" onchange="uploadImg('${id}', this)"> 📂</label>
            <input type="text" value="${m.title}" onchange="updateField('${id}','title',this.value)" style="width:100%; margin:5px 0;">
            <input type="text" value="${m.price}" onchange="updateField('${id}','price',this.value)" style="width:100%;">
        `;
        container.appendChild(div);
    });
}

window.updateField = (id, f, v) => db.collection('machines').doc(id).update({[f]:v}).then(renderMachines);
window.deleteMachine = (id) => confirm('¿Borrar?') && db.collection('machines').doc(id).delete().then(() => {renderMachines(); initAdmin();});
window.uploadImg = (id, input) => {
    const reader = new FileReader();
    reader.onload = (e) => db.collection('machines').doc(id).update({img: e.target.result}).then(() => {renderMachines(); initAdmin();});
    reader.readAsDataURL(input.files[0]);
};

// --- INICIO ---
document.addEventListener('DOMContentLoaded', () => {
    renderMachines();
    renderTechnicians();
    
    const logo = document.querySelector('.logo img');
    if(logo) logo.ondblclick = loginAdmin;

    const close = document.querySelector('.close-button');
    if(close) close.onclick = () => document.querySelector('.machine-modal').style.display = 'none';

    const addBtn = document.getElementById('add-machine');
    if(addBtn) {
        addBtn.onclick = async () => {
            await db.collection('machines').add({title:"Nueva Máquina", price:"Sujeto a precio", img:"img/placeholder.jpg"});
            initAdmin(); renderMachines();
        };
    }
});