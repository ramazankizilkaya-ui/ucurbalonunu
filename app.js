// --- 1. FIREBASE YAPILANDIRMASI ---
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
const db = firebase.firestore();

// --- 2. ARAYÜZ KONTROLLERİ ---
window.showLoginForm = function() {
    if(document.getElementById('role-selection-area')) document.getElementById('role-selection-area').style.display = 'none';
    if(document.getElementById('dynamic-register-form')) document.getElementById('dynamic-register-form').style.display = 'none';
    if(document.getElementById('login-form-area')) document.getElementById('login-form-area').style.display = 'block';
};

window.showRegisterForm = function(role) {
    if(document.getElementById('role-selection-area')) document.getElementById('role-selection-area').style.display = 'none';
    if(document.getElementById('login-form-area')) document.getElementById('login-form-area').style.display = 'none';
    if(document.getElementById('dynamic-register-form')) document.getElementById('dynamic-register-form').style.display = 'block';
    if(document.getElementById('rolSecimi')) document.getElementById('rolSecimi').value = role;
    window.illeriDoldur();
};

window.resetRoleSelection = function() {
    if(document.getElementById('role-selection-area')) document.getElementById('role-selection-area').style.display = 'block';
    if(document.getElementById('dynamic-register-form')) document.getElementById('dynamic-register-form').style.display = 'none';
    if(document.getElementById('login-form-area')) document.getElementById('login-form-area').style.display = 'none';
};

// --- 3. VERİ DOLDURMA (İLLER/İLÇELER/OKULLAR) ---
window.illeriDoldur = function() {
    const sehirSelect = document.getElementById("sehir");
    const yeniOkulIlSelect = document.getElementById("yeniOkulIl");
    
    const doldur = (el) => {
        if (!el) return;
        el.innerHTML = '<option value="">İl Seçiniz</option>';
        Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => {
            el.innerHTML += `<option value="${il}">${il}</option>`;
        });
    };
    doldur(sehirSelect);
    doldur(yeniOkulIlSelect);
};

window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    if (!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(ilce => {
            ilceSelect.innerHTML += `<option value="${ilce}">${ilce}</option>`;
        });
    }
};

window.yeniOkulIlceleriYukle = function() {
    const sehir = document.getElementById("yeniOkulIl").value;
    const ilceSelect = document.getElementById("yeniOkulIlce");
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

    db.collection("sistem").doc("okulListesi").get().then((doc) => {
        okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
        if (doc.exists) {
            const data = doc.data();
            const okullar = data[`${il}_${ilce}`] || [];
            okullar.forEach(o => {
                okulSelect.innerHTML += `<option value="${o}">${o}</option>`;
            });
        }
    });
};

// --- 4. ÖĞRETMEN FONKSİYONLARI ---
window.okulEkle = function() {
    const il = document.getElementById("yeniOkulIl").value;
    const ilce = document.getElementById("yeniOkulIlce").value;
    const okulAd = document.getElementById("yeniOkulAd").value.trim();
    if(!il || !ilce || !okulAd) return alert("Lütfen tüm alanları doldurun!");

    const anahtar = `${il}_${ilce}`;
    db.collection("sistem").doc("okulListesi").set({
        [anahtar]: firebase.firestore.FieldValue.arrayUnion(okulAd)
    }, { merge: true }).then(() => {
        alert("Okul başarıyla eklendi!");
        document.getElementById("yeniOkulAd").value = "";
    });
};

window.duyuruYayinla = function() {
    const mesaj = document.getElementById("haftalikHedef").value;
    if(!mesaj) return;
    db.collection("sistem").doc("duyuru").set({ mesaj: mesaj, tarih: new Date() })
    .then(() => alert("Duyuru yayınlandı!"));
};

// --- 5. ÖĞRENCİ FONKSİYONLARI ---
window.yukseklikArtir = function() {
    const sayfa = parseInt(document.getElementById("sayfaSayisi").value);
    if(isNaN(sayfa) || sayfa <= 0) return;
    const user = auth.currentUser;
    if(!user) return;

    db.collection("users").doc(user.uid).update({
        toplamOkunanSayfa: firebase.firestore.FieldValue.increment(sayfa),
        balonYuksekligi: firebase.firestore.FieldValue.increment(sayfa * 2) // Her sayfa 2 metre
    }).then(() => {
        document.getElementById("sayfaSayisi").value = "";
    });
};

// --- 6. AUTH İŞLEMLERİ ---
window.register = function() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const rol = document.getElementById('rolSecimi').value;
    
    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        const userObj = {
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            balonEtiketi: document.getElementById('takmaAd').value,
            okul: document.getElementById('okul').value,
            sinif: document.getElementById('sinif').value,
            sube: document.getElementById('sube').value,
            rol: rol === 'admin' ? 'ogretmen' : 'ogrenci',
            balonYuksekligi: 0,
            toplamOkunanSayfa: 0
        };
        return db.collection("users").doc(res.user.uid).set(userObj);
    }).then(() => alert("Kayıt Başarılı!")).catch(err => alert(err.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, pass).then(res => {
        return db.collection("users").doc(res.user.uid).get();
    }).then(doc => {
        if(doc.data().rol === 'ogretmen') window.location.href = "admin.html";
        else {
            document.getElementById('auth-area').style.display = 'none';
            document.getElementById('user-panel').style.display = 'block';
        }
    }).catch(err => alert(err.message));
};

window.logout = function() { auth.signOut().then(() => window.location.reload()); };

// Otomatik İl Yükleme
window.addEventListener('DOMContentLoaded', () => { if(document.getElementById('sehir') || document.getElementById('yeniOkulIl')) window.illeriDoldur(); });
