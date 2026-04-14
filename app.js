// Firebase Ayarların
const firebaseConfig = {
  apiKey: "AIzaSyCp7CzcplNftzMVKJu1s4DX9c5RhPR_57o",
  authDomain: "ucanbalon-94ca6.firebaseapp.com",
  projectId: "ucanbalon-94ca6",
  storageBucket: "ucanbalon-94ca6.firebasestorage.app",
  messagingSenderId: "756184578401",
  appId: "1:756184578401:web:9a4427f9aa9403493bed20"
};

// Firebase Başlat
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Giriş yapan kullanıcıyı takip et
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Giriş yapıldı:", user.email);
    loadLeaderboard();
  } else {
    document.getElementById("leaderboard").innerHTML = "<li>Lütfen giriş yapın.</li>";
  }
});

// 📝 Yeni Kayıt Fonksiyonu
function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Hesabınız başarıyla oluşturuldu! Artık giriş yapabilirsiniz."))
    .catch(err => alert("Hata: " + err.message));
}

// 🔐 Giriş Fonksiyonu
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Giriş başarılı!"))
    .catch(err => alert("Hata: " + err.message));
}

// 📖 Sayfa Ekleme
function addReading() {
  const user = auth.currentUser;
  if (!user) {
    alert("Lütfen önce giriş yapın!");
    return;
  }

  const pages = Number(document.getElementById("pages").value);
  if (pages <= 0) {
    alert("Lütfen geçerli bir sayfa sayısı girin.");
    return;
  }

  db.collection("readingLogs").add({
    userId: user.uid,
    userEmail: user.email, // Sıralamada email göstermek için ekledik
    pages: pages,
    date: firebase.firestore.FieldValue.serverTimestamp() // Gerçek zamanlı sunucu saati
  }).then(() => {
    alert("Okuma verisi kaydedildi!");
    document.getElementById("pages").value = ""; // Inputu temizle
    loadLeaderboard();
  });
}

// 🏆 Sıralama Yükleme
async function loadLeaderboard() {
  const snapshot = await db.collection("readingLogs").get();
  let totals = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    if (!totals[data.userEmail]) {
      totals[data.userEmail] = 0;
    }
    totals[data.userEmail] += data.pages;
  });

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const list = document.getElementById("leaderboard");
  list.innerHTML = "";

  sorted.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${index + 1}.</strong> ${item[0]} - <b>${item[1]} sayfa</b>`;
    list.appendChild(li);
  });
}