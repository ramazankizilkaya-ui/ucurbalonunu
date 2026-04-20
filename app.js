// ============================================================
//  UÇUR BALONUNU — %100 ÇALIŞAN TAMİR EDİLMİŞ VERSİYON
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
const SAYFA = (() => {
    if (document.getElementById('yeniOkulIl')) return 'admin';
    if (document.getElementById('balloon-container')) return 'ogrenci';
    return 'giris';
})();

// ============================================================
// --- 2. ARAYÜZ KONTROLLERİ (Butonların Çalışması İçin) ---
// ============================================================

window.showRegisterForm = function(rol) {
    document.getElementById('role-selection-area').style.display = 'none';
    document.getElementById('login-area').style.display = 'none';
    document.getElementById('dynamic-register-form').style.display = 'block';
    
    const rolInput = document.getElementById('rolSecimi');
    if(rolInput) rolInput.value = rol;
    
    const title = document.getElementById('form-title');
    if(title) title.innerText = (rol === 'admin' ? 'Öğretmen Kaydı' : 'Öğrenci Kaydı');
    
    window.illeriDoldur();
};

window.showLoginForm = function() {
    document.getElementById('role-selection-area').style.display = 'none';
    document.getElementById('dynamic-register-form').style.display = 'none';
    document.getElementById('login-area').style.display = 'block';
};

window.resetRoleSelection = function() {
    document.getElementById('dynamic-register-form').style.display = 'none';
    document.getElementById('login-area').style.display = 'none';
    document.getElementById('role-selection-area').style.display = 'block';
};

// ============================================================
// --- 3. İL / İLÇE / OKUL MOTORU (Data.js ile Bağlantılı) ---
// ============================================================

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
    const sehirEl = document.getElementById(ilId);
    if (!sehirEl) return;
    
    const sehir = sehirEl.value;
    const ilceSelect = document.getElementById(ilceId);
    if (!ilceSelect) return;

    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && typeof ilVerisi !== 'undefined' && ilVerisi[sehir]) {
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
            okullar.sort().forEach(o => {
                okulSelect.innerHTML += `<option value="${o}">${o}</option>`;
            });
        }
    });
};

// ============================================================
// --- 4. GÖKYÜZÜ VE BALON MOTORU (Sosyal Görünüm) ---
// ============================================================

window.gokyuzunuYukle = function(uid, userData) {
    const containerId = (SAYFA === 'admin') ? 'admin-balloon-container' : 'balloon-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    // Sadece kendi sınıfındaki öğrencileri canlı takip et (onSnapshot)
    db.collection('users')
        .where('okul', '==', userData.okul)
        .where('sinif', '==', userData.sinif)
        .where('sube', '==', userData.sube)
        .onSnapshot(qs => {
            container.innerHTML = '';
            qs.forEach(doc => {
                const s = doc.data();
                if (s.rol === 'ogretmen' && SAYFA !== 'admin') return; // Öğrenci gökyüzünde öğretmeni gösterme

                const isMe = doc.id === uid;
                const h = s.balonYuksekligi || 0;
                const bottomPos = Math.min(h, 330); // 400px gökyüzü sınırına göre
                
                // Balonları yatayda dağıt: Öğrenci sayfasında kendi balonu %50'de, diğerleri rastgele
                const leftPos = (isMe && SAYFA !== 'admin') ? 50 : (Math.random() * 80 + 10);
                
                // Etiket: Öğretmende gerçek isim, öğrencide rumuz ("Sen" veya "Rumuz")
                const etiket = (SAYFA === 'admin') ? s.ogrenciAdSoyad : (isMe ? 'Sen' : s.balonEtiketi);

                container.innerHTML += `
                    <div class="balloon" style="bottom:${bottomPos}px; left:${leftPos}%; background-color:${isMe ? '#ff5e57' : '#3498db'}; transform:translateX(-50%) scale(${SAYFA==='admin' ? 0.6 : (isMe ? 1 : 0.8)}); opacity:${isMe ? 1 : 0.7};">
                        <div class="balloon-label">${etiket}</div>
                    </div>`;
            });
            
            // Admin sayfasındaysak listeyi de güncelle
            if (SAYFA === 'admin') {
                const listDiv = document.getElementById('admin-student-list');
                if (listDiv) {
                    listDiv.innerHTML = '';
                    qs.forEach(doc => {
                        const s = doc.data();
                        if (s.rol === 'ogrenci') {
                            listDiv.innerHTML += `<p>🎈 <b>${s.ogrenciAdSoyad}</b>: ${s.balonYuksekligi || 0}m (${s.toplamOkunanSayfa || 0} sayfa)</p>`;
                        }
                    });
                }
            }
        });
};

// ============================================================
// --- 5. KAYIT / GİRİŞ / ÇIKIŞ ---
// ============================================================

window.register = function() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const rolSecimi = document.getElementById('rolSecimi').value;

    auth.createUserWithEmailAndPassword(email, pass).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
            balonEtiketi: document.getElementById('takmaAd').value || "Gezgin",
            okul: document.getElementById('okul').value,
            sinif: document.getElementById('sinif').value,
            sube: document.getElementById('sube').value,
            rol: (rolSecimi === 'admin' ? 'ogretmen' : 'ogrenci'),
            balonYuksekligi: 0,
            toplamOkunanSayfa: 0
        });
    }).then(() => {
        alert("Kayıt Başarılı!");
        location.reload();
    }).catch(e => alert("Kayıt Hatası: " + e.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    if(!email || !pass) return alert("Bilgileri giriniz!");
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Giriş Hatası: " + e.message));
};

window.logout = function() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
};

// ============================================================
// --- 6. AUTH DURUMU VE BAŞLANGIÇ ---
// ============================================================

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            
            if (SAYFA === 'admin') {
                if (data.rol !== 'ogretmen') { window.location.href = 'index.html'; return; }
                window.illeriDoldur();
                window.gokyuzunuYukle(user.uid, data);
            } else if (SAYFA === 'ogrenci' || SAYFA === 'giris') {
                const authArea = document.getElementById('auth-area');
                if (authArea) authArea.style.display = 'none';
                const userPanel = document.getElementById('user-panel');
                if (userPanel) userPanel.style.display = 'block';
                
                const welcomeMsg = document.getElementById('welcome-msg');
                if(welcomeMsg) welcomeMsg.innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                
                const dispH = document.getElementById('display-height');
                if(dispH) dispH.innerText = data.balonYuksekligi || 0;
                
                window.gokyuzunuYukle(user.uid, data);
            }
        });
    } else {
        // Kullanıcı yoksa ve giriş sayfasındaysak illeri hazır tut
        if (SAYFA === 'giris') {
            window.illeriDoldur();
        }
    }
});

// ============================================================
// --- 7. AKSİYONLAR (Yükseklik Artır & Okul Ekle) ---
// ============================================================

window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const sayfa = parseInt(input.value);
    if (!sayfa || sayfa <= 0) return alert("Lütfen geçerli bir sayfa sayısı gir!");

    const user = auth.currentUser;
    const userRef = db.collection('users').doc(user.uid);

    userRef.get().then(doc => {
        const data = doc.data();
        const yeniToplam = (data.toplamOkunanSayfa || 0) + sayfa;
        const yeniYukseklik = yeniToplam * 2; // Her sayfa 2 metre

        return userRef.update({
            toplamOkunanSayfa: yeniToplam,
            balonYuksekligi: yeniYukseklik
        });
    }).then(() => {
        input.value = '';
    }).catch(e => alert("Hata: " + e.message));
};

window.okulEkle = function() {
    const il = document.getElementById("yeniOkulIl").value;
    const ilce = document.getElementById("yeniOkulIlce").value;
    const ad = document.getElementById("yeniOkulAd").value;

    if (!il || !ilce || !ad) return alert("Lütfen tüm alanları doldurun!");

    db.collection("sistem").doc("okulListesi").set({
        [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad)
    }, { merge: true }).then(() => {
        alert("Okul başarıyla eklendi!");
        document.getElementById("yeniOkulAd").value = "";
    }).catch(e => alert("Hata: " + e.message));
};
