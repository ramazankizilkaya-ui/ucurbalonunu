const firebaseConfig = {
  apiKey: "AIzaSyAYCVekQN3oOh4_2K0KmovLMW9O6xWaH-8",
  authDomain: "ucurbalonu.firebaseapp.com",
  projectId: "ucurbalonu",
  storageBucket: "ucurbalonu.firebasestorage.app",
  messagingSenderId: "677201903733",
  appId: "1:677201903733:web:f5708b28f410ae7036b83c",
  measurementId: "G-YYRX592P4Q" // Bu satırı mutlaka ekle
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

const ilVerisi = {
    "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
    "Adıyaman": ["Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut"],
    "Afyonkarahisar": ["Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"],
    "Ağrı": ["Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak"],
    "Amasya": ["Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova"],
    "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Bala", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
    "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
    "Artvin": ["Ardanuç", "Arhavi", "Borçka", "Hopa", "Kemalpaşa", "Merkez", "Murgul", "Şavşat", "Yusufeli"],
    "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
    "Balıkesir": ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
    "Bilecik": ["Bozüyük", "Gölpazarı", "İnhisar", "Merkez", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
    "Bingöl": ["Adaklı", "Genç", "Karlıova", "Kiğı", "Merkez", "Solhan", "Yayladere", "Yedisu"],
    "Bitlis": ["Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Merkez", "Mutki", "Tatvan"],
    "Bolu": ["Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Merkez", "Mudurnu", "Seben", "Yeniçağa"],
    "Burdur": ["Ağlasun", "Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Merkez", "Tefenni", "Yeşilova"],
    "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
    "Çanakkale": ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"],
    "Çankırı": ["Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Merkez", "Orta", "Şabanözü", "Yapraklı"],
    "Çorum": ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
    "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "

function illeriDoldur() {
    const sehirSelect = document.getElementById("sehir");
    if(!sehirSelect) return;
    sehirSelect.innerHTML = '<option value="">İl Seçiniz</option>';
    Object.keys(ilVerisi).forEach(il => {
        let opt = document.createElement("option"); opt.value = il; opt.textContent = il;
        sehirSelect.appendChild(opt);
    });
}

window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if (sehir) {
        ilceSelect.disabled = false;
        ilVerisi[sehir].forEach(i => {
            let opt = document.createElement("option"); opt.value = i; opt.textContent = i;
            ilceSelect.appendChild(opt);
        });
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

auth.onAuthStateChanged(user => {
    if (user) { panelGuncelle(user.uid); } 
    else { 
        document.getElementById('auth-area').style.display = 'block'; 
        document.getElementById('user-panel').style.display = 'none';
        illeriDoldur(); okullariYukle();
    }
});

window.register = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const userObj = {
        ogrenciAdSoyad: document.getElementById('ogrenciAdSoyad').value,
        balonEtiketi: document.getElementById('takmaAd').value,
        okulBilgisi: { 
            okul: document.getElementById('okul').value, 
            sinif: document.getElementById('sinif').value, 
            sube: document.getElementById('sube').value 
        },
        balonYuksekligi: 0,
        rol: "ogrenci"
    };
    auth.createUserWithEmailAndPassword(email, password)
        .then(res => db.collection("users").doc(res.user.uid).set(userObj))
        .catch(e => alert(e.message));
};

window.login = function() {
    auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value)
        .catch(e => alert(e.message));
};

function panelGuncelle(uid) {
    db.collection("users").doc(uid).get().then(doc => {
        const data = doc.data();
        document.getElementById('auth-area').style.display = 'none';
        document.getElementById('user-panel').style.display = 'block';
        document.getElementById('welcome-msg').innerText = "Selam " + data.balonEtiketi;
        document.getElementById('display-height').innerText = data.balonYuksekligi;

        if(data.rol === 'admin') {
            document.getElementById('admin-link-area').innerHTML = `<button onclick="window.location.href='admin.html'" style="background:black; color:white; margin-bottom:10px;">⚙️ Admin Paneli</button>`;
        }
        siralamayiGetir(data.okulBilgisi.sinif, data.okulBilgisi.sube);
    });
}

function siralamayiGetir(sinif, sube) {
    db.collection("users").where("okulBilgisi.sinif", "==", sinif).where("okulBilgisi.sube", "==", sube).get().then(qs => {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = "";
        qs.forEach(doc => {
            const d = doc.data();
            list.innerHTML += `<p>${d.balonEtiketi}: ${d.balonYuksekligi}m</p>`;
        });
    });
}

window.yukseklikArtir = function() {
    const s = parseInt(document.getElementById('sayfaSayisi').value);
    if(!s) return;
    db.collection("users").doc(auth.currentUser.uid).update({
        balonYuksekligi: firebase.firestore.FieldValue.increment(s)
    }).then(() => location.reload());
};

window.logout = function() { auth.signOut().then(() => location.reload()); };
