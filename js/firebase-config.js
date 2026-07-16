// js/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDY_gOyPEttBhB87W1-xnraPc9l54Xl8vg",
    authDomain: "yonkivn-database.firebaseapp.com",
    databaseURL: "https://yonkivn-database-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "yonkivn-database",
    storageBucket: "yonkivn-database.firebasestorage.app",
    messagingSenderId: "558470041644",
    appId: "1:558470041644:web:88c66165e90edd41874189"
};

// Khởi tạo Firebase V8 An toàn
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// Lọc ký tự cấm của Firebase
function sanitizeId(str) {
    return str.replace(/[.#$\[\]]/g, "");
}
