// ============================================================
//  UÇUR BALONUNU — MASTER APP ENGINE (V10.0 - BİRİKMELİ & GÜNLÜK SINIR)
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

// 1. SAYFA VE YARDIMCI KONTROLLER
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };

function bugunTarihiniAl() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

// 2. AUTH TAKİBİ VE YÖNLENDİRME
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists) return;
            const data = doc.data();

            if (data.rol === 'admin' || data.rol === 'superadmin' || data.email === 'admin@ucurbalonu.com') {
                if (!IS_SUPERADMIN_PAGE) window.location.href = 'superadmin.html';
                else { gosterGizle('superadmin-area', 'block'); window.illeriDoldur(); }
            } 
            else if (data.rol === 'ogretmen') {
                if (!IS_ADMIN_PAGE) window.location.href = 'admin.html';
                else { window.ogrenciListele(data.okul, data.sinif, data.sube); window.balonlariGoster('admin-balloon-container', data.okul, data.sinif, data.sube, true); }
            } 
            else {
                if (!IS_INDEX_PAGE) window.location.href = 'index.html';
                else {
                    gosterGizle('auth-area', 'none');
                    gosterGizle('user-panel', 'block');
                    document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                    document.getElementById('display-height').innerText = data.balonYuksekligi || 0;
                    window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
                }
            }
        });
    } else {
        if (!IS_INDEX_PAGE) window.location.href = 'index.html';
        window.illeriDoldur();
    }
});

// 3. ÖĞRENCİ AKSİYONU: YÜKSEKLİK ARTIRMA (Günde 1 kez & Birikimli)
window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const yeniSayfa = parseInt(input.value);
    if (!yeniSayfa || yeniSayfa <= 0) return alert("Geçerli bir sayı gir!");

    const user = auth.currentUser;
    const userRef = db.collection('users').doc(user.uid);
    const bugun = bugunTarihiniAl();

    userRef.get().then(doc => {
        const data = doc.data();
        const sonGiris = data.sonOkumaTarihi || "";

        // KURAL 1: GÜNDE 1 KEZ SINIRI
        if (sonGiris === bugun) {
            alert("Bugün zaten balonunu uçurdun! Yarın yeni kitaplarla tekrar gel. 🎈");
            input.value = '';
            return;
        }

        // KURAL 2: BİRİKİMLİ TOPLAM (Eskinin üzerine ekle)
        const eskiToplam = data.toplamOkunanSayfa || 0;
        const yeniToplam = eskiToplam + yeniSayfa;
        const yeniYukseklik = yeniToplam * 2; // Her sayfa 2 metre

        return userRef.update({
            toplamOkunanSayfa: yeniToplam,
            balonYuksekligi: yeniYukseklik,
            sonOkumaTarihi: bugun
        });
    }).then(() => {
        if(input) input.value = '';
    }).catch(e => alert("Hata: " + e.message));
};

// 4. BALON MOTORU
window.balonlariGoster = function(containerId, okul, sinif, sube, isAdmin) {
    const container = document.getElementById(containerId);
    if (!container) return;
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube)
        .onSnapshot(qs => {
            container.innerHTML = '';
            qs.forEach(doc => {
                const s = doc.data(); if (s.rol === 'ogretmen') return;
                const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
                const bottomPos = Math.min(s.balonYuksekligi || 0, 330);
                const leftPos = (isMe && !isAdmin) ? 50 : (Math.random() * 80 + 10);
                container.innerHTML += `
                    <div class="balloon" style="bottom:${bottomPos}px; left:${leftPos}%; background-color:${isMe ? '#ff5e57' : '#3498db'}; transform:translateX(-50%) scale(${isAdmin?0.6:1});">
                        <div class="balloon-label">${isAdmin ? s.ogrenciAdSoyad : (isMe ? 'Sen' : s.balonEtiketi)}</div>
                    </div>`;
            });
        });
};

// 5. İL / İLÇE / OKUL MOTORU
window.illeriDoldur = function() {
    const target = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIl" : "sehir";
    const el = document.getElementById(target);
    if (el && typeof ilVerisi !== 'undefined') {
        el.innerHTML = '<option value="">İl Seçiniz</option>';
        Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => {
            el.innerHTML += `<option value="${il}">${il}</option>`;
        });
    }
};

window.ilceleriYukle = function(forceAdmin = false) {
    const isSpecial = IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE || forceAdmin;
    const ilId = isSpecial ? "yeniOkulIl" : "sehir";
    const ilceId = isSpecial ? "yeniOkulIlce" : "ilce";
    const sehir = document.getElementById(ilId).value;
    const ilceSelect = document.getElementById(ilceId);
    if (!ilceSelect || !sehir) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    ilVerisi[sehir].forEach(ilce => { ilceSelect.innerHTML += `<option value="${ilce}">${ilce}</option>`; });
};

window.yeniOkulIlceleriYukle = () => window.ilceleriYukle(true);

window.okullariYukle = function() {
    const il = document.getElementById("sehir").value;
    const ilce = document.getElementById("ilce").value;
    const okulSelect = document.getElementById("okul");
    if(!okulSelect) return;
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists && doc.data()[`${il}_${ilce}`]) {
            doc.data()[`${il}_${ilce}`].sort().forEach(o => { okulSelect.innerHTML += `<option value="${o}">${o}</option>`; });
        }
    });
};

// 6. DİĞER TEMEL FONKSİYONLAR
window.login = () => {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Giriş Hatası: " + e.message));
};

window.logout = () => auth.signOut().then(() => window.location.href = 'index.html');

window.showRegisterForm = (rol) => {
    gosterGizle('role-selection-area', 'none');
    gosterGizle('login-area', 'none');
    gosterGizle('dynamic-register-form', 'block');
    document.getElementById('rolSecimi').value = rol;
    window.illeriDoldur();
};

window.showLoginForm = () => {
    gosterGizle('role-selection-area', 'none');
    gosterGizle('dynamic-register-form', 'none');
    gosterGizle('login-area', 'block');
};

window.resetRoleSelection = () => {
    gosterGizle('dynamic-register-form', 'none');
    gosterGizle('login-area', 'none');
    gosterGizle('role-selection-area', 'block');
};

window.okulEkle = () => {
    const il = document.getElementById("yeniOkulIl").value;
    const ilce = document.getElementById("yeniOkulIlce").value;
    const ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik bilgi!");
    db.collection("sistem").doc("okulListesi").set({ [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad) }, {merge:true}).then(() => { alert("Okul Eklendi!"); });
};
