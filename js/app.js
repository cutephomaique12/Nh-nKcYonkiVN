// js/app.js
const API_KEY_LINK4M = '688d0212c6e84d0e055ba168';
let currentUserData = null;
let currentRotation = 0;

// Render Wheel
const wheelEl = document.getElementById('wheel');
const labels = ["TRÚNG", "Xịt", "Xịt", "Xịt", "TRÚNG", "Xịt", "Xịt", "Xịt", "TRÚNG", "Xịt", "Xịt", "Xịt"];
labels.forEach((text, i) => {
    let div = document.createElement('div');
    div.className = 'slice';
    let span = document.createElement('span');
    span.innerText = text;
    if(text === "TRÚNG") span.classList.add('win-text');
    div.appendChild(span);
    wheelEl.appendChild(div);
});

// Init User Data
const sessionId = localStorage.getItem('yonkiSessionUser');
if (sessionId && sessionId !== 'ADMIN') {
    db.ref('users/' + sessionId).on('value', (snap) => {
        if(snap.exists()) {
            currentUserData = snap.val();
            updateUserUI();
        }
    });

    db.ref('global').on('value', (snap) => {
        checkAutoReset(snap.val() || {});
        updateGlobalUI(snap.val() || {});
    });

    db.ref('topHistory').on('value', (snap) => {
        let arr = Object.values(snap.val() || {});
        renderLeaderboard(arr);
    });

    setInterval(checkPendingBypass, 2000); // Quét nền chống đóng tab
}

function checkAutoReset(globalState) {
    let today = new Date().toLocaleDateString();
    if (globalState.lastDate !== today) {
        let prizesLeft = globalState.totalPrizes || 0;
        if (globalState.todayWinner && prizesLeft > 0) prizesLeft--;
        db.ref('global').update({ totalPrizes: prizesLeft, todayWinner: null, lastDate: today, globalBypasses: 0 });
    }
}

function updateGlobalUI(gState) {
    let closedMsg = document.getElementById('eventClosedMsg');
    let mainDash = document.getElementById('mainDashboard');
    let textEl = document.getElementById('closedText');
    
    if (gState.todayWinner) {
        mainDash.classList.add('hidden');
        closedMsg.classList.remove('hidden');
        let ht = gState.todayWinner.idTiktok.substring(0, 3) + '*****';
        textEl.innerHTML = (gState.totalPrizes > 0) ? `Người trúng hôm nay: <br><span class="neon-green">${ht}</span>` : `HẾT SỰ KIỆN RÙI!`;
    } else if (gState.totalPrizes <= 0) {
        mainDash.classList.add('hidden');
        closedMsg.classList.remove('hidden');
        textEl.innerHTML = `HẾT SỰ KIỆN RÙI!`;
    } else {
        mainDash.classList.remove('hidden');
        closedMsg.classList.add('hidden');
    }

    let energy = Math.min(Math.floor(((gState.globalBypasses || 0) % 20) / 20 * 100), 99);
    document.getElementById('globalEnergy').innerText = energy + '%';
}

function updateUserUI() {
    if(!currentUserData) return;
    document.getElementById('spinsLeft').innerText = currentUserData.spinsLeft || 0;
    document.getElementById('totalBypasses').innerText = currentUserData.totalBypasses || 0;
    
    let today = new Date().toLocaleDateString();
    if(!currentUserData.dailyBypasses || currentUserData.dailyBypasses.date !== today) {
        currentUserData.dailyBypasses = { date: today, count: 0 };
    }
    document.getElementById('dailyLimitText').innerText = currentUserData.dailyBypasses.count;
    renderHistory();
}

// Bypass Logic API
function startBypass() {
    let today = new Date().toLocaleDateString();
    if(currentUserData.dailyBypasses.date !== today) currentUserData.dailyBypasses = { date: today, count: 0 };
    if(currentUserData.dailyBypasses.count >= 4) return alert("🚫 Đã đạt giới hạn 4 lần/ngày!");
    if(localStorage.getItem('yonkiPendingBypass_' + currentUserData.idGame)) return alert("Đang có link chờ duyệt ngầm!");

    let btn = document.getElementById('bypassBtn');
    btn.innerHTML = `<span class="spinner"></span> KHỞI TẠO PORTAL...`;
    btn.disabled = true;

    let destUrl = "https://youtube.com/@yonkivnofficial"; 
    let proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://link4m.co/api-shorten/v2?api=${API_KEY_LINK4M}&url=${encodeURIComponent(destUrl)}`)}`;

    fetch(proxyUrl).then(r => r.json()).then(d => {
        let json = JSON.parse(d.contents);
        processLink(json.shortenedUrl || "https://link4m.com/fallback_yonki");
    }).catch(e => processLink("https://link4m.com/fallback_yonki"));
}

function processLink(url) {
    window.open(url, '_blank');
    currentUserData.dailyBypasses.count++;
    db.ref('users/' + currentUserData.idGame).update({ dailyBypasses: currentUserData.dailyBypasses });
    
    let pData = { link: url, time: Date.now() };
    localStorage.setItem('yonkiPendingBypass_' + currentUserData.idGame, JSON.stringify(pData));
    startSilentCountdown(pData);
}

function startSilentCountdown(pData) {
    let btn = document.getElementById('bypassBtn');
    btn.innerHTML = `<span class="spinner"></span> ĐANG HACK THỜI GIAN...`;
    btn.disabled = true;
    
    document.getElementById('linkHistory').classList.remove('hidden');
    document.getElementById('currentLink').innerText = pData.link;
    document.getElementById('currentLink').href = pData.link;
}

function checkPendingBypass() {
    let pData = JSON.parse(localStorage.getItem('yonkiPendingBypass_' + currentUserData.idGame));
    if(pData) {
        if(Date.now() - pData.time >= 47000) completeBypass();
        else startSilentCountdown(pData);
    }
}

function completeBypass() {
    db.ref('global/globalBypasses').once('value').then(s => {
        let newG = (s.val() || 0) + 1;
        currentUserData.spinsLeft++;
        currentUserData.totalBypasses++;
        
        db.ref().update({
            'global/globalBypasses': newG,
            [`users/${currentUserData.idGame}/spinsLeft`]: currentUserData.spinsLeft,
            [`users/${currentUserData.idGame}/totalBypasses`]: currentUserData.totalBypasses
        }).then(() => {
            logAction("Vượt firewall thành công (+1 Lượt)");
            localStorage.removeItem('yonkiPendingBypass_' + currentUserData.idGame);
            document.getElementById('linkHistory').classList.add('hidden');
            let btn = document.getElementById('bypassBtn');
            btn.innerHTML = `⚡ VƯỢT LINK (LINK4M)`;
            btn.disabled = false;
        });
    });
}

// Wheel System (Global Pity)
function spinWheel() {
    if(currentUserData.spinsLeft <= 0) return alert("Hết năng lượng! Bấm VƯỢT LINK nạp thêm.");
    let btn = document.getElementById('spinBtn');
    btn.disabled = true;
    currentUserData.spinsLeft--;
    
    db.ref('users/' + currentUserData.idGame).update({ spinsLeft: currentUserData.spinsLeft }).then(() => {
        logAction("Khởi chạy vòng quay nhân phẩm");
        
        db.ref('global/globalBypasses').once('value').then(s => {
            let g = s.val() || 0;
            let winRate = 0.000000000000000001 + (Math.floor(g / 20) * 5); 
            let isWin = (Math.random() * 100) <= winRate;
            
            let wSlots = [0,4,8], lSlots = [1,2,3,5,6,7,9,10,11];
            let tSlot = isWin ? wSlots[Math.floor(Math.random()*wSlots.length)] : lSlots[Math.floor(Math.random()*lSlots.length)];
            currentRotation += 1800 + (360 - ((tSlot * 30) + 15)) - (currentRotation % 360);
            wheelEl.style.transform = `rotate(${currentRotation}deg)`;

            setTimeout(() => {
                btn.disabled = false;
                if(isWin) {
                    db.ref('topHistory/' + currentUserData.idTiktok).once('value').then(ts => {
                        let wins = ts.exists() ? (ts.val().wins || 0) + 1 : 1;
                        db.ref().update({
                            [`topHistory/${currentUserData.idTiktok}`]: { idTiktok: currentUserData.idTiktok, wins },
                            'global/todayWinner': { idGame: currentUserData.idGame, idTiktok: currentUserData.idTiktok },
                            'global/globalBypasses': 0,
                            [`users/${currentUserData.idGame}/totalBypasses`]: 0
                        });
                    });
                } else alert("Rất tiếc, chúc bạn may mắn lần sau!");
            }, 6000);
        });
    });
}

// Logs & Render
function logAction(act) {
    let t = new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'});
    let logs = currentUserData.personalLogs || [];
    logs.unshift(`[${t}] ${act}`);
    if(logs.length > 5) logs.pop();
    db.ref('users/' + currentUserData.idGame).update({ personalLogs: logs });
}

function renderHistory() {
    let l = document.getElementById('personalHistoryList');
    let logs = currentUserData.personalLogs || [];
    if(logs.length === 0) return l.innerHTML = '<div class="list-item">Chưa có tín hiệu...</div>';
    l.innerHTML = logs.map(x => `<div class="list-item">${x}</div>`).join('');
}

function renderLeaderboard(arr) {
    let l = document.getElementById('topWinnerList');
    if(arr.length === 0) return l.innerHTML = '<div class="list-item">Chưa có ai sống sót...</div>';
    l.innerHTML = arr.sort((a,b) => b.wins - a.wins).slice(0,5).map(h => 
        `<div class="list-item"><span>🌟 ${h.idTiktok.substring(0,3)}***</span><span class="neon-green">${h.wins} Lần</span></div>`
    ).join('');
}

