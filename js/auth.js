
// js/auth.js
document.addEventListener("DOMContentLoaded", () => {
    const sessionUser = localStorage.getItem('yonkiSessionUser');
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');

    // Chặn người chưa đăng nhập
    if (!sessionUser && !isAuthPage) {
        window.location.href = 'login.html';
    } 
    // Nếu đã đăng nhập thì tự chuyển hướng
    else if (sessionUser && isAuthPage) {
        if(sessionUser === 'ADMIN') window.location.href = 'admin.html';
        else window.location.href = 'index.html';
    }
});

function registerUser(event) {
    event.preventDefault();
    const btn = document.getElementById('regBtn');
    btn.innerHTML = "ĐANG TẠO HỒ SƠ...";
    
    let rawGame = document.getElementById('regIdGame').value.trim();
    let rawTiktok = document.getElementById('regIdTiktok').value.trim();
    let pass = document.getElementById('regPass').value.trim();
    
    if(!rawGame || !rawTiktok || !pass) {
        alert("⚠️ Vui lòng điền đầy đủ dữ liệu Sinh Trắc Học!");
        btn.innerHTML = "XÁC NHẬN ĐĂNG KÝ";
        return;
    }

    let idGame = sanitizeId(rawGame);
    let idTiktok = sanitizeId(rawTiktok);

    db.ref('users/' + idGame).once('value').then((snapshot) => {
        if (snapshot.exists()) {
            alert("❌ ID Game này đã được đăng ký trong mạng lưới!");
        } else {
            let newUser = { 
                idGame, idTiktok, pass, 
                spinsLeft: 0, totalBypasses: 0, 
                role: 'user', 
                dailyBypasses: { date: '', count: 0 }, 
                personalLogs: [] 
            };
            db.ref('users/' + idGame).set(newUser).then(() => {
                alert("✅ Hồ sơ đã được nạp vào máy chủ. Hãy đăng nhập!");
                window.location.href = 'login.html';
            });
        }
        btn.innerHTML = "XÁC NHẬN ĐĂNG KÝ";
    }).catch(err => {
        alert("Lỗi kết nối máy chủ! Vui lòng thử lại.");
        btn.innerHTML = "XÁC NHẬN ĐĂNG KÝ";
    });
}

function loginUser(event) {
    event.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.innerHTML = "ĐANG MÃ HÓA...";
    
    let rawId = document.getElementById('loginId').value.trim();
    let pass = document.getElementById('loginPass').value.trim();
    if(!rawId || !pass) return alert("⚠️ Thiếu ID hoặc Mật khẩu!");

    let loginId = sanitizeId(rawId);

    // Chế độ God Mode (Admin)
    if (loginId === 'yonkivnofficial' && pass === 'honghiep') {
        db.ref('users/ADMIN').once('value').then((snap) => {
            if(!snap.exists()) {
                let adminUser = { idGame: 'ADMIN', idTiktok: 'YONKIVN', pass: 'honghiep', spinsLeft: 100000, totalBypasses: 0, role: 'admin', dailyBypasses: { date: '', count: 0 }, personalLogs: [] };
                db.ref('users/ADMIN').set(adminUser);
            } else {
                db.ref('users/ADMIN').update({ spinsLeft: 100000 });
            }
            localStorage.setItem('yonkiSessionUser', 'ADMIN');
            window.location.href = 'admin.html';
        });
        return;
    }

    // Chế độ User
    db.ref('users/' + loginId).once('value').then((snap) => {
        if (snap.exists() && snap.val().pass === pass) {
            localStorage.setItem('yonkiSessionUser', snap.val().idGame);
            window.location.href = 'index.html';
        } else {
            alert("❌ Dữ liệu không khớp hoặc tài khoản không tồn tại!");
            btn.innerHTML = "TRUY CẬP HỆ THỐNG";
        }
    });
}

function logoutUser() {
    localStorage.removeItem('yonkiSessionUser');
    window.location.href = 'login.html';
}
