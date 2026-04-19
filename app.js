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
    if(window.illeriDoldur) window.illeriDoldur();
};

// --- 2. FIREBASE KONFİGÜRASYONU ---
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

// Genel İl Doldurma (Hem Kayıt Hem Admin için)
window.illeriDoldur = function() {
    const sehirSelect = document.getElementById("sehir"); // Kayıt ekranı
    const yeniOkulIl = document.getElementById("yeniOkulIl"); // Admin ekranı
    
    const diller = (target) => {
        if (!target || typeof ilVerisi === 'undefined') return;
        target.innerHTML = '<option value="">İl Seçiniz</option>';
        Object.keys(ilVerisi).sort((a, b) => a.localeCompare(b, 'tr')).forEach(il => {
            let opt = document.createElement("option");
            opt.value = il; opt.textContent = il;
            target.appendChild(opt);
        });
    };
    diller(sehirSelect);
    diller(yeniOkulIl);
};

// Kayıt Ekranı İlçe Yükleme
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

// Admin Ekranı İlçe Yükleme
window.yeniOkulIlceleriYukle = function() {
    const sehir = document.getElementById("yeniOkulIl").value;
    const ilceSelect = document.getElementById("yeniOkulIlce");
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

// Süzülmüş Okulları Getirme (İl + İlçe bazlı)
window.okullariYukle = function() {
    const il = document.getElementById("sehir").value;
    const ilce = document.getElementById("ilce").value;
    const okulSelect = document.getElementById("okul");
    if (!okulSelect || !il || !ilce) return;

    // Koleksiyon yapısı: schools -> [İL] -> [İLÇE] -> [OKULLAR]
    db.collection("sistem").doc("okulListesi").get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const anahtar = `${il}_${ilce}`; // Veritabanında "İstanbul_Beşiktaş" gibi tutacağız
            const okullar = data[anahtar] || [];
            
            okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
            okullar.sort((a, b) => a.localeCompare(b, 'tr')).forEach(o => {
                let opt = document.createElement("option");
                opt.value = o; opt.textContent = o;
                okulSelect.appendChild(opt);
            });
        }
    });
};

// --- 4. KAYIT VE GİRİŞ ---
window.register = function() {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    const roleInput = document.getElementById('rolSecimi').value;
    const finalRole = (roleInput === 'admin') ? 'ogretmen' : 'ogrenci';

    const userObj = {
        ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
        balonEtiketi: document.getElementById('takmaAd').value || "Gizli Balon",
        okulBilgisi: { 
            il: document.getElementById('sehir').value,
            ilce: document.getElementById('ilce').value,
            okul: document.getElementById('okul').value, 
            sinif: document.getElementById('sinif').value, 
            sube: document.getElementById('sube').value 
        },
        balonYuksekligi: 0,
        toplamOkunanSayfa: 0,
        gunlukSeri: 0,
        madalyalar: [],
        rol: finalRole,
        sonKayitTarihi: ""
    };

    auth.createUserWithEmailAndPassword(email, pass)
        .then(res => db.collection("users").doc(res.user.uid).set(userObj))
        .then(() => alert("Kayıt Başarılı! 🎈"))
        .catch(e => alert("Kayıt Hatası: " + e.message));
};

// --- 5. OKUL EKLEME (SUPERADMIN) ---
window.okulEkle = function() {
    const il = document.getElementById('yeniOkulIl').value;
    const ilce = document.getElementById('yeniOkulIlce').value;
    const okulAd = document.getElementById('yeniOkulAd').value.trim();

    if(!il || !ilce || !okulAd) return alert("Lütfen İl, İlçe seçin ve Okul adı yazın!");

    const anahtar = `${il}_${ilce}`;

    db.collection("sistem").doc("okulListesi").set({
        [anahtar]: firebase.firestore.FieldValue.arrayUnion(okulAd)
    }, { merge: true }).then(() => {
        alert(`${il} - ${ilce} bölgesine ${okulAd} başarıyla eklendi!`);
        document.getElementById('yeniOkulAd').value = "";
    }).catch(e => alert("Hata: " + e.message));
};

// --- OTURUM TAKİBİ VE DİĞER FONKSİYONLAR (ÖNCEKİLERLE AYNI) ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.rol === 'superadmin' || data.rol === 'ogretmen') {
                    if (!window.location.pathname.includes('admin.html')) window.location.href = 'admin.html';
                    else {
                        const adminEkran = document.getElementById('okul-ekleme-alani');
                        if (adminEkran) {
                            adminEkran.style.display = (data.rol === 'superadmin') ? 'block' : 'none';
                            if(data.rol === 'superadmin') window.illeriDoldur(); // Admin ise illeri yükle
                        }
                        window.adminSinifiniYukle();
                    }
                } else {
                    if (window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
                    window.panelGuncelle(user.uid);
                }
            }
        });
    }
});

// login, logout, panelGuncelle, yukseklikArtir ve adminSinifiniYukle fonksiyonlarını bir önceki tam paylaştığım koddan buraya aynen ekleyebilirsin kanka.
