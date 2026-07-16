// js/admin.js
if(localStorage.getItem('yonkiSessionUser') === 'ADMIN') {
    db.ref('global').on('value', s => {
        let d = s.val() || {};
        document.getElementById('adminInventory').value = d.totalPrizes || 0;
        document.getElementById('adminEnergy').innerText = (d.globalBypasses || 0) + ' Lượt server';
        document.getElementById('adminTodayWinner').innerText = d.todayWinner ? d.todayWinner.idTiktok : "Chưa có";
    });

    db.ref('topHistory').on('value', s => {
        let arr = Object.values(s.val() || {});
        let l = document.getElementById('adminTopList');
        l.innerHTML = arr.sort((a,b)=>b.wins-a.wins).map(h => 
            `<div class="list-item"><span>${h.idTiktok}</span> <span class="neon-green">${h.wins} Lần</span></div>`
        ).join('');
    });
} else window.location.href = 'login.html';

function saveInventory() {
    let v = parseInt(document.getElementById('adminInventory').value) || 0;
    db.ref('global').update({ totalPrizes: v }).then(() => alert(`✅ Cập nhật Kho: ${v} giải.`));
}

function forceReset() {
    if(confirm("CẢNH BÁO: Reset server sẽ ép hệ thống sang ngày mới, xóa người trúng hôm nay!")) {
        db.ref('global').update({ todayWinner: null, globalBypasses: 0 }).then(() => alert("✅ Reset Server Hoàn Tất!"));
    }
}

function loadDashboard() { alert("Bạn đang ở trang Tổng quan!"); }

