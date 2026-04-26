// ============================================================
//  UÇUR BALONUNU — SAFE APP ENGINE (V23.0 - DEBUG MODE)
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
    authDomain: "ucurbalonu.firebaseapp.com",
    projectId: "ucurbalonu",
    storageBucket: "ucurbalonu.firebasestorage.app",
    messagingSenderId: "677201903733",
    appId: "1:677201903733:web:f5708b28f410ae7036b83c"
};

// Güvenli Firebase Başlatma
try {
    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
} catch (e) { console.error("Firebase başlatılamadı:", e); }

const auth = firebase.auth();
const db   = firebase.firestore();

// Sayfa Kontrolleri
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };

// ROZETLER
function rozetleriOlustur(streak = 0, toplam = 0) {
    let r = [];
    if (streak >= 3)  r.push({e: "🌱", t: "3 Günlük Seri!"});
    if (streak >= 10) r.push({e: "🔥", t: "10 Günlük Seri!"});
    if (toplam >= 100)  r.push({e: "🎖️", t: "100 Sayfa!"});
    return r.length === 0 ? `🐣` : r.map(i => `<span class="medal-icon" title="${i.t}">${i.e}</span>`).join("");
}

// ANA TAKİP
auth.onAuthStateChanged(user => {
    console.log("Kullanıcı Durumu:", user ? "Giriş Yapmış" : "Giriş Yapılmamış");
    
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) { console.warn("Kullanıcı verisi bulunamadı!"); return; }
            const data = doc.data();
            const h = data.balonYuksekligi || 0;

            if (data.rol === 'admin' || data.rol === 'superadmin' || data.email === 'admin@ucurbalonu.com') {
                if (!IS_SUPERADMIN_PAGE) { window.location.href = 'superadmin.html'; }
                else { gosterGizle('superadmin-area', 'block'); window.illeriDoldur(); }
            } else if (data.rol === 'ogretmen') {
                if (!IS_ADMIN_PAGE) { window.location.href = 'admin.html'; }
                else { 
                    gosterGizle('admin-student-list', 'block'); // Varsa admin listesini göster
                    window.ogrenciListele(data.okul, data.sinif, data.sube); 
                    window.illeriDoldur(); 
                }
            } else {
                if (!IS_INDEX_PAGE) { window.location.href = 'index.html'; }
                else {
                    gosterGizle('auth-area', 'none'); 
                    gosterGizle('user-panel', 'block');
                    if(document.getElementById('display-height')) document.getElementById('display-height').innerText = h;
                    if(document.getElementById('welcome-msg')) document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                    
                    const sky = document.getElementById('main-sky');
                    if (sky) {
                        let pos = 100 - (h / 5); if (pos < 0) pos = 0;
                        sky.style.backgroundPosition = `center ${pos}%`;
                    }
                    window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
                }
            }
        });
    } else {
        if (!IS_INDEX_PAGE) { window.location.href = 'index.html'; }
        else {
            gosterGizle('auth-area', 'block');
            gosterGizle('user-panel', 'none');
            window.illeriDoldur();
        }
    }
});

// GÜVENLİ OKUL/İL LİSTELEME
window.illeriDoldur = () => {
    try {
        const target = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIl" : "sehir";
        const el = document.getElementById(target);
        if (el && typeof ilVerisi !== 'undefined') {
            el.innerHTML = '<option value="">İl Seçiniz</option>';
            Object.keys(ilVerisi).sort().forEach(il => { el.innerHTML += `<option value="${il}">${il}</option>`; });
        }
    } catch (e) { console.error("Şehirler yüklenirken hata:", e); }
};

window.ilceleriYukle = () => {
    try {
        const isSpecial = IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE;
        const sehir = document.getElementById(isSpecial ? "yeniOkulIl" : "sehir").value;
        const el = document.getElementById(isSpecial ? "yeniOkulIlce" : "ilce");
        if (el && sehir && ilVerisi[sehir]) {
            el.innerHTML = '<option value="">İlçe Seçiniz</option>';
            ilVerisi[sehir].forEach(i => { el.innerHTML += `<option value="${i}">${i}</option>`; });
        }
    } catch (e) { console.warn("İlçeler yüklenemedi:", e); }
};

window.okullariYukle = () => {
    const il = document.getElementById("sehir").value;
    const ilce = document.getElementById("ilce").value;
    const el = document.getElementById("okul");
    if(!el) return;
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        el.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists && doc.data()[`${il}_${ilce}`]) {
            doc.data()[`${il}_${ilce}`].sort().forEach(o => { el.innerHTML += `<option value="${o}">${o}</option>`; });
        }
    });
};

// DİĞER FONKSİYONLAR (Giriş, Kayıt, Çıkış)
window.login = () => { 
    const e = document.getElementById('loginEmail').value;
    const p = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(e, p).catch(err => alert("Giriş Hatası: " + err.message));
};
window.logout = () => auth.signOut().then(() => window.location.href = 'index.html');
window.register = () => {
    const e = document.getElementById('email').value, p = document.getElementById('password').value;
    const r = document.getElementById('rolSecimi').value;
    auth.createUserWithEmailAndPassword(e, p).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            okul: document.getElementById('okul').value, sinif: document.getElementById('sinif').value, sube: document.getElementById('sube').value,
            rol: (r === 'admin' ? 'ogretmen' : 'ogrenci'), balonYuksekligi: 0, toplamOkunanSayfa: 0, streak: 0
        });
    }).then(() => location.reload()).catch(err => alert(err.message));
};

window.showRegisterForm = (r) => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = r; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };

window.balonlariGoster = (c, o, si, su, isAdmin) => {
    const container = document.getElementById(c); if (!container) return;
    db.collection('users').where('okul', '==', o).where('sinif', '==', si).where('sube', '==', su).onSnapshot(qs => {
        container.innerHTML = '';
        qs.forEach(doc => {
            const d = doc.data(); if (d.rol === 'ogretmen') return;
            const h = Math.min(d.balonYuksekligi || 0, 350);
            container.innerHTML += `<div class="balloon" style="bottom:${h}px; left:${Math.random()*80+10}%; background-color:${d.balloonColor || '#3498db'};">
                <div class="balloon-label">${d.ogrenciAdSoyad}</div></div>`;
        });
    });
};
