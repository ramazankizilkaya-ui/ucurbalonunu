/ ============================================================
//  UÇUR BALONUNU — MASTER APP ENGINE (FINAL ROBUST VERSION)
//  UÇUR BALONUNU — MASTER APP ENGINE (V12.0 - 1 SAYFA = 1 METRE)
// ============================================================

const firebaseConfig = {
@@ -15,27 +15,24 @@ if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db   = firebase.firestore();

// 1. SAYFA TESPİTİ VE YARDIMCI ARAÇLAR
const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };
const bugunTarihiniAl = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

// 2. AUTH TAKİBİ VE ROL TABANLI CANLI YÖNETİM
// --- 1. AUTH TAKİBİ VE CANLI YÖNLENDİRME ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();

            // ROL 1: SUPERADMIN (Okul Ekleme Yetkisi)
            if (data.rol === 'admin' || data.rol === 'superadmin' || data.email === 'admin@ucurbalonu.com') {
                if (!IS_SUPERADMIN_PAGE) window.location.href = 'superadmin.html';
                else { gosterGizle('superadmin-area', 'block'); window.illeriDoldur(); }
            } 
            // ROL 2: ÖĞRETMEN (Sınıf Yönetimi)
            else if (data.rol === 'ogretmen') {
                if (!IS_ADMIN_PAGE) window.location.href = 'admin.html';
                else { 
@@ -44,12 +41,10 @@ auth.onAuthStateChanged(user => {
                    window.illeriDoldur();
                }
            } 
            // ROL 3: ÖĞRENCİ (Ana Panel)
            else {
                if (!IS_INDEX_PAGE) window.location.href = 'index.html';
                else {
                    gosterGizle('auth-area', 'none'); 
                    gosterGizle('user-panel', 'block');
                    gosterGizle('auth-area', 'none'); gosterGizle('user-panel', 'block');
                    const disp = document.getElementById('display-height');
                    if(disp) disp.innerText = data.balonYuksekligi || 0;
                    const welcome = document.getElementById('welcome-msg');
@@ -64,7 +59,7 @@ auth.onAuthStateChanged(user => {
    }
});

// 3. ÖĞRENCİ PANELİ: YÜKSEKLİK ARTIRMA (Günde 1 kez & Birikimli)
// --- 2. YÜKSEKLİK ARTIRMA (1 Sayfa = 1 Metre & Günde 1 Kez) ---
window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const yeniSayfa = parseInt(input.value);
@@ -76,24 +71,25 @@ window.yukseklikArtir = function() {
    userRef.get().then(doc => {
        const data = doc.data();
        if ((data.sonOkumaTarihi || "") === bugun) {
            alert("Bugün zaten balonunu uçurdun! Yarın yeni kitaplarla tekrar gel. 🎈");
            alert("Bugün zaten giriş yaptın! Yarın yeni kitaplarla tekrar gel. 🎈");
            return (input.value = '');
        }

        // Birikimli yükseklik hesabı: Eski toplam + Yeni sayfa
        const yeniToplam = (data.toplamOkunanSayfa || 0) + yeniSayfa;
        
        // FORMÜL: 1 Sayfa = 1 Metre olacak şekilde güncellendi
        return userRef.update({
            toplamOkunanSayfa: yeniToplam,
            balonYuksekligi: yeniToplam * 2, // 1 sayfa = 2 metre
            balonYuksekligi: yeniToplam * 1, 
            sonOkumaTarihi: bugun
        });
    }).then(() => { 
        if(input) input.value = ''; 
        alert("Harika! Sayfalar eklendi ve balonun yükseldi! 🚀");
        alert("Harika! Balonun okuduğun her sayfa için 1 metre daha yükseldi! 🚀");
    }).catch(e => alert("Hata: " + e.message));
};

// 4. BALON VE LİSTE MOTORLARI (Canlı Güncelleme)
// --- 3. BALON VE LİSTE MOTORLARI ---
window.balonlariGoster = (containerId, okul, sinif, sube, isAdmin) => {
    const container = document.getElementById(containerId);
    if (!container) return;
@@ -121,7 +117,7 @@ window.ogrenciListele = (okul, sinif, sube) => {
    });
};

// 5. İL / İLÇE / OKUL MOTORU (Merkezi Yapı)
// --- 4. VERİ SİSTEMİ (İL/İLÇE/OKUL) ---
window.illeriDoldur = () => {
    const target = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIl" : "sehir";
    const el = document.getElementById(target);
@@ -151,10 +147,14 @@ window.okullariYukle = () => {
    });
};

// 6. GİRİŞ, ÇIKIŞ VE KAYIT
// --- 5. DİĞER TEMEL AKSİYONLAR ---
window.login = () => { auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value).catch(e => alert(e.message)); };
window.logout = () => auth.signOut().then(() => window.location.href = 'index.html');

window.okulEkle = () => {
    const il = document.getElementById("yeniOkulIl").value, ilce = document.getElementById("yeniOkulIlce").value, ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik bilgi!");
    db.collection("sistem").doc("okulListesi").set({ [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad) }, {merge:true}).then(() => alert("Okul Eklendi!"));
};
window.register = () => {
    const email = document.getElementById('email').value, pass = document.getElementById('password').value, rol = document.getElementById('rolSecimi').value;
    auth.createUserWithEmailAndPassword(email, pass).then(res => {
@@ -165,15 +165,6 @@ window.register = () => {
        });
    }).then(() => location.reload()).catch(e => alert(e.message));
};

// 7. OKUL EKLEME (Superadmin Yetkisi)
window.okulEkle = () => {
    const il = document.getElementById("yeniOkulIl").value, ilce = document.getElementById("yeniOkulIlce").value, ad = document.getElementById("yeniOkulAd").value;
    if(!il || !ilce || !ad) return alert("Eksik bilgi!");
    db.collection("sistem").doc("okulListesi").set({ [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad) }, {merge:true}).then(() => alert("Okul Eklendi!"));
};

// 8. PANEL GEÇİŞLERİ
window.showRegisterForm = (rol) => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = rol; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };
