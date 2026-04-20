// ============================================================
//  UÇUR BALONUNU — MASTER APP ENGINE (V4 - FIXED)
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
    gosterGizle('auth-area', 'none');
    gosterGizle('admin-area', 'block');
    
    window.illeriDoldur();
    balonlariGoster(userData.okul, userData.sinif, userData.sube);
    ogrenciListele(userData.okul, userData.sinif, userData.sube);
}

// --- 6. İL / İLÇE / OKUL MOTORU (Data.js ile Tam Uyumlu) ---
window.illeriDoldur = function() {
    const ids = ["sehir", "yeniOkulIl"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && typeof ilVerisi !== 'undefined') {
            el.innerHTML = '<option value="">İl Seçiniz</option>';
            Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => {
                el.innerHTML += `<option value="${il}">${il}</option>`;
            });
        }
    });
};

window.ilceleriYukle = function(isChild = false) {
    const ilId = isChild ? "yeniOkulIl" : "sehir";
    const ilceId = isChild ? "yeniOkulIlce" : "ilce";
    const sehir = document.getElementById(ilId).value;
    const ilceSelect = document.getElementById(ilceId);
    if (!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(ilce => {
            ilceSelect.innerHTML += `<option value="${ilce}">${ilce}</option>`;
        });
    }
};

window.okullariYukle = function() {
    const il = document.getElementById("sehir").value;
    const ilce = document.getElementById("ilce").value;
    const okulSelect = document.getElementById("okul");
    if (!okulSelect || !il || !ilce) return;
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists) {
            const okullar = doc.data()[`${il}_${ilce}`] || [];
            okullar.sort().forEach(o => okulSelect.innerHTML += `<option value="${o}">${o}</option>`);
        }
    });
};

window.yeniOkulIlceleriYukle = function() {
    window.ilceleriYukle(true);
};

// --- 7. BALONLARI ÇİZME MOTORU (Tüm sınıftakileri gösterir) ---
function balonlariGoster(okul, sinif, sube) {
    const container = IS_ADMIN_PAGE ? 
        document.getElementById('admin-balloon-container') : 
        document.getElementById('balloon-container');
    
    if (!container) return;

    const uid = auth.currentUser ? auth.currentUser.uid : null;

    db.collection('users')
        .where('okul', '==', okul)
        .where('sinif', '==', sinif)
        .where('sube', '==', sube)
        .onSnapshot(querySnapshot => {
            container.innerHTML = ''; // Temizle
            querySnapshot.forEach(doc => {
                const s = doc.data();
                
                // Admin panelinde öğretmenleri gösterme
                if (IS_ADMIN_PAGE && s.rol === 'ogretmen') return;
                
                const b = document.createElement('div');
                b.className = 'balloon';
                
                // Balon yüksekliğini hesapla (1 sayfa = 2 metre)
                const yOffset = Math.min((s.balonYuksekligi || 0) * 1, 330);
                b.style.bottom = (20 + yOffset) + 'px';
                
                // Öğrenci panelinde kendi balonu ortaya, admin panelinde random
                const isMe = doc.id === uid;
                b.style.left = (isMe && !IS_ADMIN_PAGE) ? '50%' : (Math.random() * 80 + 10) + '%';
                
                // Renk: Kendi balonu kırmızı, diğerleri mavi
                b.style.backgroundColor = (isMe && !IS_ADMIN_PAGE) ? '#ff5e57' : '#3498db';
                b.style.transform = IS_ADMIN_PAGE ? 'scale(0.6)' : 'scale(1)';
                
                const label = IS_ADMIN_PAGE ? s.ogrenciAdSoyad : (isMe ? 'Sen' : s.balonEtiketi);
                b.innerHTML = `<div class="balloon-label">${label || 'Anonim'}</div>`;
                
                container.appendChild(b);
            });
        });
}

// --- 8. ÖĞRENCİ LİSTELEME (Öğretmen için) ---
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
                        <span>${s.balonYuksekligi || 0} Metre</span>
                    </div>`;
            });
        });
}

// --- 9. YÜKSEKLİK ARTIRMA (Öğrenci Butonu İçin) ---
window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById('sayfaSayisi').value);
    if (!sayfa || sayfa <= 0) return alert("Lütfen geçerli sayfa gir.");
    
    const user = auth.currentUser;
    const ref = db.collection('users').doc(user.uid);
    
    db.runTransaction(transaction => {
        return transaction.get(ref).then(doc => {
            const toplamSayfa = (doc.data().toplamOkunanSayfa || 0) + sayfa;
            const yeniYukseklik = toplamSayfa * 2; // 1 sayfa = 2 metre
            transaction.update(ref, { 
                toplamOkunanSayfa: toplamSayfa,
                balonYuksekligi: yeniYukseklik 
            });
        });
    }).then(() => {
        document.getElementById('sayfaSayisi').value = '';
    }).catch(e => alert("Hata: " + e.message));
};

// --- 10. KAYIT / GİRİŞ / ÇIKIŞ ---
window.register = function() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const rol = document.getElementById('rolSecimi').value;
    
    if (!email || !pass) return alert("E-posta ve şifre gerekli!");
    
    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            balonEtiketi: document.getElementById('takmaAd').value || "Anonim",
            okul: document.getElementById('okul').value,
            sinif: document.getElementById('sinif').value,
            sube: document.getElementById('sube').value,
            rol: (rol === 'admin' ? 'ogretmen' : 'ogrenci'),
            balonYuksekligi: 0, 
            toplamOkunanSayfa: 0
        });
    }).then(() => { 
        alert("Kayıt Başarılı!"); 
        location.reload(); 
    }).catch(e => alert("Hata: " + e.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Hata: " + e.message));
};

window.logout = function() { 
    auth.signOut().then(() => { 
        window.location.href = 'index.html'; 
    }); 
};

// --- 11. FORM NAVİGASYONU ---
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
    
    // Admin paneline göre başlık değiştir
    const formTitle = document.getElementById('form-title');
    if (formTitle) {
        formTitle.innerText = (rol === 'admin' ? 'Öğretmen Kaydı' : 'Öğrenci Kaydı');
    }
    
    window.illeriDoldur();
};

window.resetRoleSelection = function() {
    gosterGizle('dynamic-register-form', 'none');
    gosterGizle('login-area', 'none');
    gosterGizle('role-selection-area', 'block');
};

// --- 12. ÖĞRETMENİN DUYURU YAPMA FONKSİYONU ---
window.duyuruYayinla = function() {
    const hedef = document.getElementById('haftalikHedef').value;
    if (!hedef) return alert("Lütfen bir hedef yazınız!");
    
    const user = auth.currentUser;
    db.collection('users').doc(user.uid).get().then(doc => {
        const userData = doc.data();
        db.collection('duyurular').add({
            ogretmenId: user.uid,
            ogretmenAdı: userData.ogrenciAdSoyad,
            okul: userData.okul,
            sinif: userData.sinif,
            sube: userData.sube,
            mesaj: hedef,
            tarih: new Date()
        }).then(() => {
            alert("Duyuru yayınlandı!");
            document.getElementById('haftalikHedef').value = '';
        }).catch(e => alert("Hata: " + e.message));
    });
};

// --- 13. YENİ OKUL EKLEME FONKSİYONU ---
window.okulEkle = function() {
    const il = document.getElementById("yeniOkulIl").value;
    const ilce = document.getElementById("yeniOkulIlce").value;
    const ad = document.getElementById("yeniOkulAd").value;
    
    if(!il || !ilce || !ad) return alert("Lütfen tüm alanları doldurunuz!");
    
    db.collection("sistem").doc("okulListesi").set({
        [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad)
    }, {merge:true}).then(() => {
        alert("Okul Eklendi!");
        document.getElementById("yeniOkulAd").value = '';
    }).catch(e => alert("Hata: " + e.message));
};
