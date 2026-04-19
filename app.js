// --- 1. GLOBAL ARAYÜZ FONKSİYONLARI ---
window.showLoginForm = function() {
    ['role-selection-area', 'dynamic-register-form'].forEach(id => { 
        if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; 
    });
    if(document.getElementById('login-form-area')) document.getElementById('login-form-area').style.display = 'block';
};

window.showRegisterForm = function(role) {
    ['role-selection-area', 'login-form-area'].forEach(id => { 
        if(document.getElementById(id)) document.getElementById(id).style.display = 'none'; 
    });
    if(document.getElementById('dynamic-register-form')) document.getElementById('dynamic-register-form').style.display = 'block';
    const rolInput = document.getElementById('rolSecimi');
    if(rolInput) rolInput.value = role;
    
    // BUTONA BASINCA TEKRAR TETİKLE (Garantiye al)
    window.illeriDoldur();
};

window.resetRoleSelection = function() {
    if(document.getElementById('role-selection-area')) document.getElementById('role-selection-area').style.display = 'block';
    if(document.getElementById('dynamic-register-form')) document.getElementById('dynamic-register-form').style.display = 'none';
    if(document.getElementById('login-form-area')) document.getElementById('login-form-area').style.display = 'none';
};

// --- 2. FIREBASE YAPILANDIRMASI ---
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

// --- 3. DATA.JS İLE HİYERARŞİK VERİ YÜKLEME ---
window.illeriDoldur = function() {
    const sehirSelect = document.getElementById("sehir");
    if (!sehirSelect) return;

    if (typeof ilVerisi === 'undefined') {
        console.error("HATA: ilVerisi bulunamadı! data.js dosyasını kontrol et.");
        return;
    }

    sehirSelect.innerHTML = '<option value="">İl Seçiniz</option>';
    Object.keys(ilVerisi).sort((a, b) => a.localeCompare(b, 'tr')).forEach(il => {
        let opt = document.createElement("option");
        opt.value = il; opt.textContent = il;
        sehirSelect.appendChild(opt);
    });
    console.log("İller başarıyla listeye eklendi.");
};

window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    if (!ilceSelect) return;
    
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilVerisi[sehir].forEach(ilce => {
            let opt = document.createElement("option");
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
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
            const anahtar = `${il}_${ilce}`;
            const okullar = data[anahtar] || [];
            okullar.sort((a, b) => a.localeCompare(b, 'tr')).forEach(o => {
                let opt = document.createElement("option");
                opt.value = o; opt.textContent = o;
                okulSelect.appendChild(opt);
            });
        }
    });
};

// --- DİĞER KAYIT/GİRİŞ FONKSİYONLARI (Aynı Kalabilir) ---
window.register = function() {
    // ... (Önceki kodlarınla aynı)
};

window.login = function() {
    // ... (Önceki kodlarınla aynı)
};

// --- SAYFA YÜKLENDİĞİNDE OTOMATİK ÇALIŞTIR ---
window.addEventListener('DOMContentLoaded', () => {
    console.log("Sayfa hazır, iller yükleniyor...");
    window.illeriDoldur();
});
