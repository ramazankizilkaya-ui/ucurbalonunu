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

const IS_ADMIN_PAGE = window.location.pathname.includes('admin.html');
const IS_SUPERADMIN_PAGE = window.location.pathname.includes('superadmin.html');
const IS_INDEX_PAGE = !IS_ADMIN_PAGE && !IS_SUPERADMIN_PAGE;

const gosterGizle = (id, durum) => { const el = document.getElementById(id); if (el) el.style.display = durum; };
const bugunTarihiniAl = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const dunTarihiniAl = () => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const getRandomColor = () => {
    const colors = ['#ff5e57', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff4757'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// --- ROZET SİSTEMİ ---
function rozetleriOlustur(streak, toplam) {
    let rozetler = [];
    if (streak >= 3)  rozetler.push({emoji: "🌱", text: "3 Günlük Seri: Harika başlangıç!"});
    if (streak >= 10) rozetler.push({emoji: "🔥", text: "10 Günlük Seri: Kitaplar seni seviyor!"});
    if (streak >= 30) rozetler.push({emoji: "☄️", text: "30 Günlük Seri: Kitap Efsanesi!"});
    if (toplam >= 100)  rozetler.push({emoji: "🎖️", text: "100 Sayfa: İlk büyük başarı!"});
    if (toplam >= 500)  rozetler.push({emoji: "📚", text: "500 Sayfa: Kitap Dostu!"});
    if (toplam >= 1000) rozetler.push({emoji: "👑", text: "1000 Sayfa: Okuma Kralı/Kraliçesi!"});
    if (rozetler.length === 0) return `<span class="medal-icon" title="Okudukça madalyalar gelecek!">🐣</span>`;
    return rozetler.map(r => `<span class="medal-icon" title="${r.text}">${r.emoji}</span>`).join("");
}

// --- ANA TAKİP VE GÖRSEL MOTOR ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            const h = data.balonYuksekligi || 0;

            if (data.rol === 'admin' || data.rol === 'superadmin' || data.email === 'admin@ucurbalonu.com') {
                if (!IS_SUPERADMIN_PAGE) window.location.href = 'superadmin.html';
                else { gosterGizle('superadmin-area', 'block'); window.illeriDoldur(); }
            } else if (data.rol === 'ogretmen') {
                if (!IS_ADMIN_PAGE) window.location.href = 'admin.html';
                else { window.ogrenciListele(data.okul, data.sinif, data.sube); window.balonlariGoster('admin-balloon-container', data.okul, data.sinif, data.sube, true); window.illeriDoldur(); }
            } else {
                if (!IS_INDEX_PAGE) window.location.href = 'index.html';
                else {
                    gosterGizle('auth-area', 'none'); gosterGizle('user-panel', 'block');
                    document.getElementById('display-height').innerText = h;
                    document.getElementById('welcome-msg').innerText = `Selam, ${data.ogrenciAdSoyad}!`;
                    
                    // --- KAMERA TAKİBİ ---
                    const sky = document.querySelector('.sky');
                    const mountain = document.getElementById('mountain-layer');
                    const stars = document.getElementById('stars-layer');
                    if (sky) {
                        let pos = 100 - (h / 4); if (pos < 0) pos = 0;
                        sky.style.backgroundPosition = `center ${pos}%`;
                        if (mountain) mountain.style.transform = `translateY(${h * 0.8}px)`;
                        if (stars) stars.style.opacity = h > 150 ? (h > 300 ? 1 : 0.5) : 0;
                    }

                    const m = document.getElementById('medalyalar');
                    if(m) m.innerHTML = `<div class="medal-shelf"><span style="font-size:12px; font-weight:bold;">🔥 ${data.streak || 0} GÜN |</span> ${rozetleriOlustur(data.streak || 0, data.toplamOkunanSayfa || 0)}</div>`;
                    window.balonlariGoster('balloon-container', data.okul, data.sinif, data.sube, false);
                }
            }
        });
    } else { if (!IS_INDEX_PAGE) window.location.href = 'index.html'; window.illeriDoldur(); }
});

window.yukseklikArtir = function() {
    const input = document.getElementById('sayfaSayisi');
    const yeniSayfa = parseInt(input.value);
    if (!yeniSayfa || yeniSayfa <= 0) return alert("Kaç sayfa okudun?");
    const userRef = db.collection('users').doc(auth.currentUser.uid);
    const bugun = bugunTarihiniAl();
    userRef.get().then(doc => {
        const data = doc.data();
        if ((data.sonOkumaTarihi || "") === bugun) return alert("Bugün zaten uçurdun! Yarın gel. 🎈");
        let yeniStreak = (data.sonOkumaTarihi === dunTarihiniAl()) ? (data.streak || 0) + 1 : 1;
        const yeniToplam = (data.toplamOkunanSayfa || 0) + yeniSayfa;
        return userRef.update({ toplamOkunanSayfa: yeniToplam, balonYuksekligi: yeniToplam, sonOkumaTarihi: bugun, streak: yeniStreak });
    }).then(() => { input.value = ''; alert("Balon havalandı! 🚀"); }).catch(e => alert(e.message));
};

window.ogrenciListele = (okul, sinif, sube) => {
    const list = document.getElementById('admin-student-list');
    if (!list) return;
    db.collection('users').where('okul', '==', okul).where('sinif', '==', sinif).where('sube', '==', sube).where('rol', '==', 'ogrenci').onSnapshot(qs => {
        list.innerHTML = '';
        qs.forEach(doc => {
            const s = doc.data();
            list.innerHTML += `<div class="student-admin-card" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee; background:white; margin-bottom:5px; border-radius:10px;">
                <div><b>${s.ogrenciAdSoyad}</b><br><small>🔥 Seri: ${s.streak || 0} gün</small></div>
                <div style="text-align:right;"><div>${rozetleriOlustur(s.streak || 0, s.toplamOkunanSayfa || 0)}</div><span style="color:#3498db; font-weight:bold;">${s.balonYuksekligi}m</span></div>
            </div>`;
        });
    });
};

window.balonlariGoster = (c, o, s, b, isAdmin) => {
    const container = document.getElementById(c); if (!container) return;
    db.collection('users').where('okul', '==', o).where('sinif', '==', s).where('sube', '==', b).onSnapshot(qs => {
        container.innerHTML = '';
        qs.forEach(doc => {
            const d = doc.data(); if (d.rol === 'ogretmen') return;
            const isMe = (auth.currentUser && doc.id === auth.currentUser.uid);
            container.innerHTML += `<div class="balloon" style="bottom:${Math.min(d.balonYuksekligi || 0, 330)}px; left:${(isMe && !isAdmin) ? 50 : (Math.random() * 80 + 10)}%; background-color:${d.balloonColor || '#3498db'}; transform:translateX(-50%) scale(${isAdmin?0.6:1});">
                <div class="balloon-label">${isAdmin ? d.ogrenciAdSoyad : (isMe ? 'Sen' : d.balonEtiketi)}</div></div>`;
        });
    });
};

window.login = () => { auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value).catch(e => alert(e.message)); };
window.logout = () => auth.signOut().then(() => window.location.href = 'index.html');
window.register = () => {
    const e = document.getElementById('email').value, p = document.getElementById('password').value, r = document.getElementById('rolSecimi').value;
    auth.createUserWithEmailAndPassword(e, p).then(res => {
        return db.collection("users").doc(res.user.uid).set({
            ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value, balonEtiketi: document.getElementById('takmaAd').value || "Gezgin",
            okul: document.getElementById('okul').value, sinif: document.getElementById('sinif').value, sube: document.getElementById('sube').value,
            rol: (r === 'admin' ? 'ogretmen' : 'ogrenci'), balonYuksekligi: 0, toplamOkunanSayfa: 0, balloonColor: getRandomColor(), streak: 0
        });
    }).then(() => location.reload()).catch(err => alert(err.message));
};
window.illeriDoldur = () => { const target = (IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE) ? "yeniOkulIl" : "sehir"; const el = document.getElementById(target); if (el && typeof ilVerisi !== 'undefined') { el.innerHTML = '<option value="">İl Seçiniz</option>'; Object.keys(ilVerisi).sort((a,b) => a.localeCompare(b,'tr')).forEach(il => { el.innerHTML += `<option value="${il}">${il}</option>`; }); } };
window.ilceleriYukle = (f = false) => { const s = IS_ADMIN_PAGE || IS_SUPERADMIN_PAGE || f; const sehir = document.getElementById(s ? "yeniOkulIl" : "sehir").value; const el = document.getElementById(s ? "yeniOkulIlce" : "ilce"); if (!el || !sehir) return; el.innerHTML = '<option value="">İlçe Seçiniz</option>'; ilVerisi[sehir].forEach(i => { el.innerHTML += `<option value="${i}">${i}</option>`; }); };
window.yeniOkulIlceleriYukle = () => window.ilceleriYukle(true);
window.okullariYukle = () => { const il = document.getElementById("sehir").value, ilce = document.getElementById("ilce").value, el = document.getElementById("okul"); if(!el) return; db.collection("sistem").doc("okulListesi").get().then(doc => { el.innerHTML = '<option value="">Okul Seçiniz</option>'; if (doc.exists && doc.data()[`${il}_${ilce}`]) doc.data()[`${il}_${ilce}`].sort().forEach(o => { el.innerHTML += `<option value="${o}">${o}</option>`; }); }); };
window.okulEkle = () => { const il = document.getElementById("yeniOkulIl").value, ilce = document.getElementById("yeniOkulIlce").value, ad = document.getElementById("yeniOkulAd").value; if(!il || !ilce || !ad) return alert("Eksik bilgi!"); db.collection("sistem").doc("okulListesi").set({ [`${il}_${ilce}`]: firebase.firestore.FieldValue.arrayUnion(ad) }, {merge:true}).then(() => alert("Okul Eklendi!")); };
window.showRegisterForm = (r) => { gosterGizle('role-selection-area', 'none'); gosterGizle('login-area', 'none'); gosterGizle('dynamic-register-form', 'block'); document.getElementById('rolSecimi').value = r; window.illeriDoldur(); };
window.showLoginForm = () => { gosterGizle('role-selection-area', 'none'); gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'block'); };
window.resetRoleSelection = () => { gosterGizle('dynamic-register-form', 'none'); gosterGizle('login-area', 'none'); gosterGizle('role-selection-area', 'block'); };
