const firebaseConfig = {
  apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
  authDomain: "ucurbalonu.firebaseapp.com",
  projectId: "ucurbalonu",
  storageBucket: "ucurbalonu.firebasestorage.app",
  messagingSenderId: "677201903733",
  appId: "1:677201903733:web:f5708b28f410ae7036b83c",
  measurementId: "G-YYRX592P4Q" // Bu satırı mutlaka ekle
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.data().rol !== 'admin') { window.location.href = "index.html"; }
            else { okulListele(); }
        });
    } else { window.location.href = "index.html"; }
});

window.okulEkle = function() {
    const ad = document.getElementById("yeniOkulInput").value;
    db.collection("sistem").doc("okulListesi").update({
        liste: firebase.firestore.FieldValue.arrayUnion(ad)
    }).then(() => location.reload());
};

function okulListele() {
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        const ul = document.getElementById("mevcutOkullar");
        doc.data().liste.forEach(o => {
            ul.innerHTML += `<li>${o}</li>`;
        });
    });
}
