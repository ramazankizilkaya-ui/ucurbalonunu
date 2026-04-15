// 1. Firebase Yapılandırması (Senin Proje Bilgilerin)
const firebaseConfig = {
  apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
  authDomain: "ucurbalonu.firebaseapp.com",
  projectId: "ucurbalonu",
  storageBucket: "ucurbalonu.firebasestorage.app",
  messagingSenderId: "677201903733",
  appId: "1:677201903733:web:f5708b28f410ae7036b83c",
  measurementId: "G-YYRX592P4Q"
};

// 2. Firebase'i Başlat (Hataları önlemek için önce kontrol ediyoruz)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global Değişkenleri Tanımla (Fonksiyonların dışında olmalı ki her yer tanısın)
const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase ve app.js başarıyla yüklendi! 🚀");

// 3. Kayıt Ol Fonksiyonu (Veli Kaydı + Detaylı Öğrenci Profili)
window.register = function() {
    console.log("Kayıt butonuna basıldı...");

    // HTML'deki input id'lerini yakalıyoruz
    // index.html dosyanla bu id'lerin tam eşleşmesi gerekir
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const adSoyadInput = document.getElementById('ogrenciAdSoyad');
    const takmaAdInput = document.getElementById('takmaAd');
    const sehirInput = document.getElementById('sehir');
    const ilceInput = document.getElementById('ilce');
    const okulInput = document.getElementById('okul');
    const sinifInput = document.getElementById('sinif');

    // Boş değer kontrolü için temel alanları alıyoruz
    const email = emailInput.value;
    const password = passwordInput.value;
    const adSoyad = adSoyadInput.value;
    const takmaAd = takmaAdInput.value;

    if (email === "" || password === "" || adSoyad === "" || takmaAd === "") {
        alert("Lütfen temel bilgileri (Ad, Takma Ad, E-posta, Şifre) boş bırakma kanka! 🎈");
        return;
    }

    // A. Önce Kullanıcı Hesabını (Auth) Oluşturuyoruz
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("Kullanıcı oluşturuldu, UID:", user.uid);
            
            // B. Şimdi Firestore Veritabanına Detayları Yazıyoruz
            // Kullanıcı UID'sini döküman ismi yaparak her öğrenciyi benzersiz kılıyoruz
            return db.collection("users").doc(user.uid).set({
                veliEmail: email,
                ogrenciAdSoyad: adSoyad,
                balonEtiketi: takmaAd, 
                konum: { 
                    sehir: sehirInput ? sehirInput.value : "", 
                    ilce: ilceInput ? ilceInput.value : "" 
                },
                okulBilgisi: { 
                    okul: okulInput ? okulInput.value : "", 
                    sinif: sinifInput ? sinifInput.value : "" 
                },
                balonYuksekligi: 0, // Başlangıçta balon yerde (0 sayfa)
                toplamOkunanSayfa: 0,
                kayitTarihi: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            // C. İşlem Başarılı
            alert("Vee işte bu! Kayıt başarılı ve veritabanına eklendi. Balon uçuşa hazır! 🎈🚀");
            console.log("Firestore kaydı başarıyla tamamlandı!");
        })
        .catch((error) => {
            // Hata durumunda (Örn: Zaten kayıtlı mail, zayıf şifre vb.)
            console.error("Hata Detayı:", error.code, error.message);
            alert("Bir sorun çıktı kanka: " + error.message);
        });
};
