// --- 1. FIREBASE CONFIG ---
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

// --- 2. VERİ YÜKLEME ---
window.illeriDoldur = function() {
    const sehirSelect = document.getElementById("sehir");
    if (!sehirSelect || typeof ilVerisi === 'undefined') return;
    sehirSelect.innerHTML = '<option value="">İl Seçiniz</option>';
    Object.keys(ilVerisi).sort((a, b) => a.localeCompare(b, 'tr')).forEach(il => {
        let opt = document.createElement("option");
        opt.value = il; opt.textContent = il;
        sehirSelect.appendChild(opt);
    });
};

window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    if (!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilceSelect.disabled = false;
        ilVerisi[sehir].forEach(ilce => {
            let opt = document.createElement("option");
            opt.value = ilce; opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    } else { ilceSelect.disabled = true; }
};

window.okullariYukle = function() {
    const okulSelect = document.getElementById("okul");
    if (!okulSelect) return;
    db.collection("sistem").doc("okulListesi").get().then((doc) => {
        if (doc.exists && doc.data().liste) {
            okulSelect.innerHTML = '<option value="">Okul Seçiniz</option>';
            const temizListe = doc.data().liste.filter(o => o !== "");
            temizListe.sort((a, b) => a.localeCompare(b, 'tr'));
            temizListe.forEach(o => {
                let opt = document.createElement("option");
                opt.value = o; opt.textContent = o;
                okulSelect.appendChild(opt);
            });
        }
    });
};

// --- 3. YETKİ VE YÖNLENDİRME ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                if (data.rol === 'superadmin' || data.rol === 'ogretmen') {
                    if (!window.location.pathname.includes('admin.html')) {
                        window.location.href = 'admin.html';
                    } else {
                        const adminEkran = document.getElementById('okul-ekleme-alani');
                        if (adminEkran) adminEkran.style.display = (data.rol === 'superadmin') ? 'block' : 'none';
                        adminSinifiniYukle();
                    }
                } else {
                    if (window.location.pathname.includes('admin.html')) window.location.href = 'index.html';
                    panelGuncelle(user.uid);
                }
            }
        });
    }
});

// --- 4. ÖĞRETMEN FONKSİYONLARI ---
window.adminSinifiniYukle = function() {
    const user = auth.currentUser;
    if(!user) return;
    db.collection("users").doc(user.uid).get().then(tDoc => {
        const t = tDoc.data();
        db.collection("users")
            .where("okulBilgisi.okul", "==", t.okulBilgisi.okul)
            .where("okulBilgisi.sinif", "==", t.okulBilgisi.sinif)
            .where("okulBilgisi.sube", "==", t.okulBilgisi.sube)
            .where("rol", "==", "ogrenci")
            .get().then(qs => {
                const list = document.getElementById('admin-student-list');
                const sky = document.getElementById('admin-balloon-container');
                if(!list) return;
                list.innerHTML = ""; if(sky) sky.innerHTML = "";

                qs.forEach(doc => {
                    const s = doc.data();
                    // Liste Görünümü
                    list.innerHTML += `<div class="student-admin-card">
                        <span><strong>${s.ogrenciAdSoyad}</strong> (${s.balonYuksekligi}m)</span>
                    </div>`;
                    // Balon Görünümü
                    if(sky) {
                        const color = `hsl(${Math.random() * 360}, 70%, 60%)`;
                        sky.innerHTML += `
                            <div class="balloon" style="bottom: ${Math.min(s.balonYuksekligi, 350)}px; background-color: ${color}; left: ${Math.random() * 80 + 10}%">
                                <div class="balloon-label">${s.balonEtiketi}</div>
                            </div>`;
                    }
                });
            });
    });
};

window.duyuruYayinla = function() {
    const hedef = document.getElementById('haftalikHedef').value;
    if(!hedef) return alert("Duyuru boş olamaz!");
    const user = auth.currentUser;
    db.collection("users").doc(user.uid).get().then(tDoc => {
        const t = tDoc.data();
        db.collection("users")
            .where("okulBilgisi.okul", "==", t.okulBilgisi.okul)
            .where("okulBilgisi.sinif", "==", t.okulBilgisi.sinif)
            .where("okulBilgisi.sube", "==", t.okulBilgisi.sube)
            .where("rol", "==", "ogrenci").get().then(qs => {
                let batch = db.batch();
                qs.forEach(d => batch.update(db.collection("users").doc(d.id), { haftalikHedef: hedef }));
                batch.commit().then(() => alert("Hedef Duyuruldu!"));
            });
    });
};

// --- 5. KAYIT, GİRİŞ VE DİĞER ---
window.showRegisterForm = function(role) {
    document.getElementById('role-selection-area').style.display = 'none';
    document.getElementById('dynamic-register-form').style.display = 'block';
    document.getElementById('rolSecimi').value = role;
    window.illeriDoldur(); window.okullariYukle();
};

window.login = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert(e.message));
};

window.logout = function() { auth.signOut().then(() => window.location.href = 'index.html'); };

window.okulEkle = function() {
    const okulAd = document.getElementById('yeniOkulAd').value;
    db.collection("sistem").doc("okulListesi").update({
        liste: firebase.firestore.FieldValue.arrayUnion(okulAd)
    }).then(() => alert("Okul Eklendi!"));
};
