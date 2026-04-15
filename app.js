// 1. Firebase Yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
  authDomain: "ucurbalonu.firebaseapp.com",
  projectId: "ucurbalonu",
  storageBucket: "ucurbalonu.firebasestorage.app",
  messagingSenderId: "677201903733",
  appId: "1:677201903733:web:f5708b28f410ae7036b83c",
  measurementId: "G-YYRX592P4Q"
};

// 2. Firebase'i Başlat (Hata Kontrollü)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

console.log("Firebase ve app.js başarıyla yüklendi! 🚀");

// 3. Kayıt Ol Fonksiyonu (Dışarıdan erişilebilir olması için window. ekliyoruz)
window.register = function() {
    console.log("Kayıt butonuna basıldı...");

    // HTML'deki inputların ID'lerini kontrol et!
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (!emailInput || !passwordInput) {
        alert("Hata: HTML dosyasında 'email' veya 'password' id'li kutular bulunamadı!");
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    if (email === "" || password === "") {
        alert("Lütfen tüm alanları doldur kanka! 🎈");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("Harika! Kayıt Başarılı. 🚀");
            console.log("Yeni Kullanıcı:", userCredential.user);
        })
        .catch((error) => {
            alert("Firebase Hatası: " + error.message);
            console.error(error);
        });
};
