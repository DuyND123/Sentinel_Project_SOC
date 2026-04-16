let currentMode = "url";

// 🔥 SWITCH TAB
function switchTab(mode) {
    currentMode = mode;

    document.getElementById("tab-url").classList.remove("active");
    document.getElementById("tab-file").classList.remove("active");

    if (mode === "url") {
        document.getElementById("url-box").style.display = "flex";
        document.getElementById("file-box").style.display = "none";
        document.getElementById("tab-url").classList.add("active");
    } else {
        document.getElementById("url-box").style.display = "none";
        document.getElementById("file-box").style.display = "flex";
        document.getElementById("tab-file").classList.add("active");
    }
}

// 🔥 SCAN URL
function startScan() {
    let url = document.getElementById("url").value;
    let btn = document.getElementById("scan-btn");

    if (!url) {
        alert("Nhập URL trước!");
        return;
    }

    btn.innerText = "Scanning...";
    btn.disabled = true;

    document.getElementById("result").innerHTML = "⏳ Scanning...";

    fetch("/scan", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "url=" + url
    })
    .then(res => res.json())
    .then(data => {
        showResult(data);
        btn.innerText = "SCAN";
        btn.disabled = false;
    });

    trackProgress();
}

// 🔥 UPLOAD FILE
function uploadFile() {
    let file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Chọn file trước!");
        return;
    }

    document.getElementById("result").innerHTML = "⏳ Uploading & scanning...";

    let formData = new FormData();
    formData.append("file", file);

    fetch("/upload", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => showResult(data));
}

// 🔥 SHOW RESULT
function showResult(data) {
    let html = "";

    data.results.forEach(r => {
        let color = "green";

        if (r.status === "VULNERABLE") color = "red";
        else if (r.status === "POSSIBLE") color = "orange";

        html += `<p style="color:${color}">
                    ${r.type} : ${r.status}
                 </p>`;
    });

    document.getElementById("result").innerHTML = html;
}

// 🔥 PROGRESS
function trackProgress() {
    let interval = setInterval(() => {
        fetch("/progress")
        .then(res => res.json())
        .then(data => {
            document.getElementById("progress-bar").style.width =
                data.progress + "%";

            if (data.progress >= 100) clearInterval(interval);
        });
    }, 300);
}

// =======================
// 🔥 SECURITY NEWS SYSTEM
// =======================

// load news từ backend
async function loadNews() {
    try {
        const res = await fetch("/api/news");
        const data = await res.json();

        const container = document.getElementById("news-container");
        if (!container) return;

        container.innerHTML = "";

        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <img src="${item.image || 'https://via.placeholder.com/300x150'}" alt="${item.title}">
                <p>${item.title}</p>
            `;

            // 👉 click mở bài báo thật
            card.onclick = () => {
                window.open(item.link, "_blank");
            };

            container.appendChild(card);
        });

    } catch (err) {
        console.error("Load news error:", err);
    }
}

// auto load khi vào trang
window.onload = () => {
    loadNews();
};

function toggleChat() {
    const box = document.getElementById("chat-box");
    box.style.display = box.style.display === "flex" ? "none" : "flex";
}

function sendMessage() {
    const input = document.getElementById("chat-input");
    const content = document.getElementById("chat-content");

    let text = input.value.trim();
    if (!text) return;

    // user message
    content.innerHTML += `<div class="msg-user">${text}</div>`;

    // fake AI response (demo)
    setTimeout(() => {
        content.innerHTML += `<div class="msg-bot">🤖 Đang phân tích: "${text}"...</div>`;
        content.scrollTop = content.scrollHeight;
    }, 500);

    input.value = "";
    content.scrollTop = content.scrollHeight;
}