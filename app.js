// app.js

// 1. İlleri Doldurma Fonksiyonu
function illeriDoldur() {
    const sehirSelect = document.getElementById("sehir");
    if (!sehirSelect) return;

    // data.js içindeki ilVerisi'ne ulaşmaya çalış
    if (typeof ilVerisi === 'undefined') {
        console.error("HATA: data.js yüklenemedi!");
        return;
    }

    sehirSelect.innerHTML = '<option value="">İl Seçiniz</option>';
    Object.keys(ilVerisi).sort((a, b) => a.localeCompare(b, 'tr')).forEach(il => {
        let opt = document.createElement("option");
        opt.value = il;
        opt.textContent = il;
        sehirSelect.appendChild(opt);
    });
}

// 2. İlçeleri Yükleme Fonksiyonu
window.ilceleriYukle = function() {
    const sehir = document.getElementById("sehir").value;
    const ilceSelect = document.getElementById("ilce");
    if (!ilceSelect) return;

    ilceSelect.innerHTML = '<option value="">İlçe Seçiniz</option>';

    if (sehir && ilVerisi[sehir]) {
        ilceSelect.disabled = false;
        ilVerisi[sehir].forEach(ilce => {
            let opt = document.createElement("option");
            opt.value = ilce;
            opt.textContent = ilce;
            ilceSelect.appendChild(opt);
        });
    } else {
        ilceSelect.disabled = true;
    }
};

// 3. Formu Gösterme
window.showRegisterForm = function(role) {
    document.getElementById('role-selection-area').style.display = 'none';
    document.getElementById('dynamic-register-form').style.display = 'block';
    document.getElementById('rolSecimi').value = role;
    
    // Form açıldığı an illeri doldurmaya zorla
    illeriDoldur();
};

window.resetRoleSelection = function() {
    document.getElementById('role-selection-area').style.display = 'block';
    document.getElementById('dynamic-register-form').style.display = 'none';
};
