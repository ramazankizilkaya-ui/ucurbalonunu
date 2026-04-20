// ============================================================
//  UÇUR BALONUNU — MASTER APP ENGINE (V3)
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
    authDomain: "ucurbalonu.firebaseapp.com",
    projectId: "ucurbalonu",
    storageBucket: "ucurbalonu.firebasestorage.app",
    messagingSenderId: "677201903733",
    appId: "1:677201903733:web:f5708b28f410ae7036b83c"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db   = firebase.firestore();

// 1. SAYFA TESPİTİ
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');

// 2. YARDIMCI GÖRSEL KONTROLLER
function gosterGizle(id, durum) {
    const el = document.getElementById(id);
    if (el) el.style.display = durum;
}

// 3. AUTH TAKİBİ VE YÖNLENDİRME (Kritik Kısım)
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists) return;
            const userData = doc.data();

            if (userData.rol === 'ogretmen' || userData.rol === 'admin') {
                // EĞER ÖĞRETMENSE:
                if (!IS_ADMIN_PAGE) {
                    window.location.href = 'admin.html'; // Admin sayfasına fırlat
                } else {
                    adminPaneliYukle(userData);
                }
            } else {
                // EĞER ÖĞRENCİYSE:
                if (IS_ADMIN_PAGE) {
                    window.location.href = 'index.html'; // Admin sayfasındaysa ana sayfaya at
                } else {
                    ogrenciPaneliYukle(user.uid, userData);
                }
            }
        });
    } else {
        // Giriş yapmamışsa ve admin sayfasındaysa geri gönder
        if (IS_ADMIN_PAGE) window.location.href = 'index.html';
        else if (typeof window.illeriDoldur === 'function') window.illeriDoldur();
    }
});

// --- 4. ÖĞRENCİ PANELİ MANTIĞI ---
function ogrenciPaneliYukle(uid, data) {
    gosterGizle('auth-area', 'none');
    gosterGizle('user-panel', 'block');
    
    const welcome = document.getElementById('welcome-msg');
    if (welcome) welcome.innerText = `Selam, ${data.ogrenciAdSoyad}!`;
    
    const heightDisp = document.getElementById('display-height');
    if (heightDisp) heightDisp.innerText = data.balonYuksekligi || 0;

    balonlariGoster(data.okul, data.sinif, data.sube);
}

// --- 5. ADMIN PANELİ MANTIĞI ---
function adminPaneliYukle(userData) {
    console.log("Admin paneli yükleniyor...");
    if (typeof window.illeriDoldur === 'function') window.illeriDoldur();
    ogrenciListele(userData.okul, userData.sinif, userData.sube);
}

// --- 6. BALONLARI ÇİZME MOTORU (Tüm sınıftakileri gösterir) ---
function balonlariGoster(okul, sinif, sube) {
    const container = document.getElementById('balloon-container');
    if (!container) return;

    db.collection('users')
        .where('okul', '==', okul)
        .where('sinif', '==', sinif)
        .where('sube', '==', sube)
        .onSnapshot(querySnapshot => {
            container.innerHTML = ''; // Temizle
            querySnapshot.forEach(doc => {
                const s = doc.data();
                const b = document.createElement('div');
                b.className = 'balloon';
                // Balon yüksekliğini CSS'e bağla (0m = 0px, 100m = 300px gibi)
                const yOffset = (s.balonYuksekligi || 0) * 2; 
                b.style.bottom = (20 + yOffset) + 'px';
                b.style.left = Math.random() * 80 + '%';
                b.innerHTML = `<span>${s.balonEtiketi || 'Anonim'}</span>`;
                container.appendChild(b);
            });
        });
}

// --- 7. ÖĞRENCİ LİSTELEME (Öğretmen için) ---
function ogrenciListele(okul, sinif, sube) {
    const listArea = document.getElementById('admin-student-list');
    if (!listArea) return;

    db.collection('users')
        .where('okul', '==', okul)
        .where('sinif', '==', sinif)
        .where('sube', '==', sube)
        .where('rol', '==', 'ogrenci')
        .onSnapshot(snapshot => {
            listArea.innerHTML = '';
            snapshot.forEach(doc => {
                const s = doc.data();
                listArea.innerHTML += `
                    <div style="background:white; padding:10px; margin:5px; border-radius:10px; display:flex; justify-content:space-between;">
                        <b>${s.ogrenciAdSoyad}</b>
                        <span>${s.balonYuksekligi} Metre</span>
                    </div>`;
            });
        });
}

// --- 8. YÜKSEKLİK ARTIRMA (Öğrenci Butonu İçin) ---
window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById('sayfaSayisi').value);
    if (!sayfa || sayfa <= 0) return alert("Lütfen geçerli sayfa gir.");
    
    const user = auth.currentUser;
    const ref = db.collection('users').doc(user.uid);
    
    db.runTransaction(transaction => {
        return transaction.get(ref).then(doc => {
            const yeniYukseklik = (doc.data().balonYuksekligi || 0) + (sayfa * 1); // 1 sayfa = 1 metre
            transaction.update(ref, { balonYuksekligi: yeniYukseklik });
        });
    }).then(() => {
        document.getElementById('sayfaSayisi').value = '';
    });
};

// Giriş ve Kayıt fonksiyonlarını (login, register, logout) önceki temiz sürümlerden aynen kullanabilirsin.
window.showLoginForm = function() {
    gosterGizle('role-selection-area', 'none');
    gosterGizle('dynamic-register-form', 'none');
    gosterGizle('login-area', 'block');
};
window.showRegisterForm = function(rol) {
    gosterGizle('role-selection-area', 'none');
    gosterGizle('login-area', 'none');
    gosterGizle('dynamic-register-form', 'block');
    document.getElementById('rolSecimi').value = rol;
};
window.resetRoleSelection = function() {
    gosterGizle('dynamic-register-form', 'none');
    gosterGizle('login-area', 'none');
    gosterGizle('role-selection-area', 'block');
};
window.logout = function() { auth.signOut().then(() => { window.location.href = 'index.html'; }); };
