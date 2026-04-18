// app.js - Uçur Balonu Ana Uygulama Kodu
const firebaseConfig = {
    apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
    authDomain: "ucurbalonu.firebaseapp.com",
    projectId: "ucurbalonu",
    storageBucket: "ucurbalonu.firebasestorage.app",
    messagingSenderId: "677201903733",
    appId: "1:677201903733:web:f5708b28f410ae7036b83c",
    measurementId: "G-YYRX592P4Q"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

// --- KAYIT FORMU DİNAMİK KONTROLLERİ ---

window.showRegisterForm = function(role) {
    document.getElementById('role-selection-area').style.display = 'none';
    document.getElementById('dynamic-register-form').style.display = 'block';
    document.getElementById('rolSecimi').value = role;
    
    if(role === 'admin') {
        document.getElementById('form-title').innerText = "👨‍🏫 Öğretmen Kaydı";
        document.getElementById('ogrenciAdSoyad').placeholder = "Öğretmen Ad Soyad";
        document.getElementById('takmaAd').placeholder = "Sınıf Adı (Örn: 2-A Yıldızları)";
        document.getElementById('reg-btn').innerText = "Öğretmen Olarak Kaydol";
    } else {
        document.getElementById('form-title').innerText = "🎈 Öğrenci Kaydı";
        document.getElementById('ogrenciAdSoyad').placeholder = "Öğrenci Ad Soyad";
        document.getElementById('takmaAd').placeholder = "Balonuna Bir İsim Ver";
        document.getElementById('reg-btn').innerText = "Öğrenci Olarak Kaydol";
    }
    illeriDoldur();
    okullariYukle();
};

window.resetRoleSelection = function() {
    document.getElementById('role-selection-area').style.display = 'block';
    document.getElementById('dynamic-register-form').style.display = 'none';
};

// --- ARAYÜZ YÜKLEME (İLLER VE OKULLAR) ---

function illeriDoldur() {
    const sehirSelect = document.getElementById("sehir");
    if(!sehirSelect || typeof ilVerisi === 'undefined') return;
    sehirSelect.innerHTML = '<option value="">İl Seçiniz</option>';
    Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => {
        let opt = document.createElement("option"); opt.value = il; opt.textContent = il;
        sehirSelect.appendChild(opt);
    });
}

window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    if(!ilceSelect) return;
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir && ilVerisi[sehir]) {
        ilceSelect.disabled = false;
        ilVerisi[sehir].forEach(i => {
            let opt = document.createElement("option"); opt.value = i; opt.textContent = i;
            ilceSelect.appendChild(opt);
        });
    } else {
        ilceSelect.disabled = true;
    }
};

function okullariYukle() {
    const os = document.getElementById("okul");
    if(!os) return;
    db.collection("sistem").doc("okulListesi").get().then(doc => {
        if(doc.exists) {
            os.innerHTML = '<option value="">Okul Seçiniz</option>';
            doc.data().liste.forEach(o => {
                let opt = document.createElement("option"); opt.value = o; opt.textContent = o;
                os.appendChild(opt);
            });
        }
    });
}

// --- OTURUM VE KAYIT İŞLEMLERİ ---

window.register = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('rolSecimi').value;

    const userObj = {
        ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
        balonEtiketi: document.getElementById('takmaAd').value,
        konum: { il: document.getElementById('sehir').value, ilce: document.getElementById('ilce').value },
        okulBilgisi: { 
            okul: document.getElementById('okul').value, 
            sinif: document.getElementById('sinif').value, 
            sube: document.getElementById('sube').value 
        },
        balonYuksekligi: 0,
        lastUpdate: "",
        rol: role,
        rozetler: []
    };

    auth.createUserWithEmailAndPassword(email, password)
        .then(res => db.collection("users").doc(res.user.uid).set(userObj))
        .then(() => alert("Kayıt Başarılı!"))
        .catch(e => alert("Hata: " + e.message));
};

window.login = function() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    if(!email || !pass) return;
    auth.signInWithEmailAndPassword(email, pass).catch(e => alert("Hata: " + e.message));
};

auth.onAuthStateChanged(user => {
    if (user) {
        db.collection("users").doc(user.uid).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                // Admin yönlendirme mantığı
                if (data.rol === 'admin' && !window.location.pathname.includes('admin.html')) {
                    window.location.href = 'admin.html';
                } else {
                    panelGuncelle(user.uid);
                    if(window.location.pathname.includes('admin.html')) adminSinifiniYukle();
                }
            }
        });
    } else {
        if(document.getElementById('auth-area')) {
            document.getElementById('auth-area').style.display = 'block';
            document.getElementById('user-panel').style.display = 'none';
            illeriDoldur(); okullariYukle();
        }
    }
});

// --- PANEL VE SIRALAMA ---

function panelGuncelle(uid) {
    db.collection("users").doc(uid).get().then(doc => {
        const data = doc.data();
        const up = document.getElementById('user-panel');
        if(!up) return;
        up.style.display = 'block';
        if(document.getElementById('auth-area')) document.getElementById('auth-area').style.display = 'none';
        document.getElementById('welcome-msg').innerText = "Selam " + data.balonEtiketi;
        document.getElementById('display-height').innerText = data.balonYuksekligi;
        siralamayiGetir(data.okulBilgisi.sinif, data.okulBilgisi.sube, data.okulBilgisi.okul);
    });
}

function siralamayiGetir(sinif, sube, okul) {
    db.collection("users")
      .where("okulBilgisi.okul", "==", okul)
      .where("okulBilgisi.sinif", "==", sinif)
      .where("okulBilgisi.sube", "==", sube)
      .where("rol", "==", "ogrenci")
      .get().then(qs => {
        const list = document.getElementById('leaderboard-list');
        const sky = document.getElementById('balloon-container');
        if(!list || !sky) return;
        list.innerHTML = ""; sky.innerHTML = "";
        let users = [];
        qs.forEach(doc => users.push(doc.data()));
        users.sort((a,b) => b.balonYuksekligi - a.balonYuksekligi);
        users.forEach((d, index) => {
            list.innerHTML += `<p>${index+1}. ${d.balonEtiketi}: ${d.balonYuksekligi}m</p>`;
            const bDiv = document.createElement('div');
            bDiv.className = "remote-balloon";
            bDiv.style.left = (index * 55 + 15) + "px";
            bDiv.style.bottom = Math.min(d.balonYuksekligi * 1.5, 240) + "px";
            bDiv.innerHTML = `<span class="balloon-label">${d.balonEtiketi}</span><img src="https://cdn-icons-png.flaticon.com/512/1350/1350100.png">`;
            sky.appendChild(bDiv);
        });
    });
}

window.yukseklikArtir = function() {
    const s = parseInt(document.getElementById('sayfaSayisi').value);
    if(!s || s <= 0) return;
    const user = auth.currentUser;
    const today = new Date().toLocaleDateString('tr-TR');
    db.collection("users").doc(user.uid).get().then(doc => {
        if (doc.data().lastUpdate === today) {
            alert("Bugünlük hakkın doldu!");
        } else {
            db.collection("users").doc(user.uid).update({
                balonYuksekligi: firebase.firestore.FieldValue.increment(s),
                lastUpdate: today
            }).then(() => location.reload());
        }
    });
};

// --- ÖĞRETMEN (ADMIN) İŞLEMLERİ ---

window.adminSinifiniYukle = function() {
    const user = auth.currentUser;
    db.collection("users").doc(user.uid).get().then(teacherDoc => {
        const t = teacherDoc.data();
        const sky = document.getElementById('admin-balloon-container');
        const list = document.getElementById('admin-student-list');
        if(!sky || !list) return;
        db.collection("users")
            .where("okulBilgisi.okul", "==", t.okulBilgisi.okul)
            .where("okulBilgisi.sinif", "==", t.okulBilgisi.sinif)
            .where("okulBilgisi.sube", "==", t.okulBilgisi.sube)
            .where("rol", "==", "ogrenci")
            .get().then(qs => {
                sky.innerHTML = ""; list.innerHTML = "";
                let st = []; qs.forEach(doc => st.push({id: doc.id, ...doc.data()}));
                st.sort((a,b) => b.balonYuksekligi - a.balonYuksekligi);
                st.forEach((d, index) => {
                    const bDiv = document.createElement('div');
                    bDiv.className = "remote-balloon";
                    bDiv.style.left = (index * 60 + 20) + "px";
                    bDiv.style.bottom = Math.min(d.balonYuksekligi * 1.2, 220) + "px";
                    bDiv.innerHTML = `<span class="balloon-label">${d.balonEtiketi}</span><img src="https://cdn-icons-png.flaticon.com/512/1350/1350100.png">`;
                    sky.appendChild(bDiv);

                    list.innerHTML += `
                        <div class="student-admin-card">
                            <span><strong>${d.ogrenciAdSoyad}</strong> (${d.balonYuksekligi}m)</span>
                            <div class="admin-actions">
                                <button onclick="rozetVer('${d.id}', '📚 Kitap Kurdu')" style="background:#2ecc71;">📚 Rozet</button>
                                <button onclick="rozetVer('${d.id}', '🚀 Hızlı Okur')" style="background:#3498db;">🚀 Rozet</button>
                            </div>
                        </div>`;
                });
            });
    });
};

window.rozetVer = function(uid, rozetAd) {
    db.collection("users").doc(uid).update({
        rozetler: firebase.firestore.FieldValue.arrayUnion({ ad: rozetAd, tarih: new Date().toLocaleDateString('tr-TR') })
    }).then(() => alert(rozetAd + " rozeti verildi!"));
};

window.hedefKaydet = function() {
    const user = auth.currentUser;
    const ad = document.getElementById('hedefAd').value;
    const sayfa = document.getElementById('hedefSayfa').value;
    if(!ad || !sayfa) return;
    db.collection("users").doc(user.uid).get().then(doc => {
        const t = doc.data();
        db.collection("hedefler").add({
            baslik: ad, miktar: parseInt(sayfa), 
            okul: t.okulBilgisi.okul, sinif: t.okulBilgisi.sinif, sube: t.okulBilgisi.sube,
            tarih: new Date().toLocaleDateString('tr-TR')
        }).then(() => alert("Hedef sınıfına duyuruldu!"));
    });
};

window.logout = function() { auth.signOut().then(() => { window.location.href = 'index.html'; }); };
