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

// =======================
// 🔥 HELPER UI
// =======================
function setLoading(isLoading) {
    const urlBtn = document.querySelector("#url-box button");
    const fileBtn = document.querySelector("#file-box button");

    if (isLoading) {
        urlBtn.innerText = "Scanning...";
        fileBtn.innerText = "Uploading...";
        urlBtn.disabled = true;
        fileBtn.disabled = true;
    } else {
        urlBtn.innerText = "SCAN";
        fileBtn.innerText = "UPLOAD & SCAN";
        urlBtn.disabled = false;
        fileBtn.disabled = false;
    }
}

function resetProgress() {
    document.getElementById("progress-bar").style.width = "0%";
    document.getElementById("progress-text").innerText = "0%";
}

// =======================
// 🔥 SCAN URL
// =======================
function startScan() {
    let url = document.getElementById("url").value;

    if (!url) {
        alert("Nhập URL trước!");
        return;
    }

    setLoading(true);
    resetProgress();

    document.getElementById("result").innerHTML = "⏳ Scanning...";

    fetch("/scan_url", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "url=" + url
    })
    .then(res => res.json())
    .then(data => {
        showResult(data);
        setLoading(false);
    });

    trackProgress();
}

// =======================
// 🔥 UPLOAD FILE
// =======================
function uploadFile() {
    let file = document.getElementById("fileInput").files[0];

    if (!file) {
        alert("Chọn file trước!");
        return;
    }

    setLoading(true);
    resetProgress();

    document.getElementById("result").innerHTML = "⏳ Uploading & scanning...";

    let formData = new FormData();
    formData.append("file", file);

    fetch("/upload", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        showResult(data);
        setLoading(false);
    });

    trackProgress();
}

// =======================
// 🔥 SHOW RESULT
// =======================
function showResult(data) {
    let html = "";
    let results = data.results || data.details || [];

    html += `<h3>🔍 KẾT QUẢ PHÂN TÍCH</h3>`;

    results.forEach(r => {
        let color = "green";

        if (r.status === "VULNERABLE" || r.status === "MALICIOUS") color = "red";
        else if (r.status === "POSSIBLE" || r.status === "SUSPICIOUS") color = "orange";

        html += `<p style="color:${color}">${r.type} : ${r.status}</p>`;
    });

    html += `<hr><h4>🧠 ĐÁNH GIÁ DỄ HIỂU</h4>`;

    let explanation = "";
    let advice = "";
    let finalStatus = data.status || "UNKNOWN";

    if (finalStatus === "CLEAN" || finalStatus === "SAFE") {
        explanation = "Hệ thống không phát hiện dấu hiệu nguy hiểm.";
        advice = "Có thể sử dụng nhưng vẫn nên cẩn thận.";
    }
    else if (finalStatus === "SUSPICIOUS") {
        explanation = "Có dấu hiệu bất thường.";
        advice = "Không nên nhập thông tin quan trọng.";
    }
    else if (finalStatus === "MALICIOUS") {
        explanation = "Phát hiện nguy hiểm.";
        advice = "KHÔNG nên sử dụng.";
    }
    else {
        explanation = "Không đủ dữ liệu.";
        advice = "Hãy cẩn trọng.";
    }

    html += `
        <p><b>Kết luận:</b> ${finalStatus}</p>
        <p><b>Mô tả:</b> ${explanation}</p>
        <p><b>Khuyến nghị:</b> ${advice}</p>
    `;

    if (data.score !== undefined) {
        html += `<p><b> Điểm:</b> ${data.score}/100</p>`;
    }

    document.getElementById("result").innerHTML = html;

    document.getElementById("progress-bar").style.width = "100%";
    document.getElementById("progress-text").innerText = "100%";
}

// =======================
// 🔥 PROGRESS
// =======================
function trackProgress() {
    let interval = setInterval(() => {
        fetch("/progress")
        .then(res => res.json())
        .then(data => {
            let percent = data.progress;

            document.getElementById("progress-bar").style.width = percent + "%";
            document.getElementById("progress-text").innerText = percent + "%";

            if (percent >= 100) clearInterval(interval);
        });
    }, 300);
}

// =======================
// 🔥 NEWS
// =======================
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
                <img src="${item.image || 'https://via.placeholder.com/300x150'}">
                <p>${item.title}</p>
            `;

            card.onclick = () => window.open(item.link, "_blank");
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Load news error:", err);
    }
}

// =======================
// 🔥 CHAT
// =======================
function toggleChat() {
    const box = document.getElementById("chat-box");
    box.style.display = box.style.display === "flex" ? "none" : "flex";
}

async function sendMessage() {
    const input = document.getElementById("chat-input");
    const content = document.getElementById("chat-content");

    let text = input.value.trim();
    if (!text) return;

    content.innerHTML += `<div class="msg-user">${text}</div>`;
    input.value = "";

    const loadingId = "loading-" + Date.now();
    content.innerHTML += `<div id="${loadingId}" class="msg-bot">🤖 Đang suy nghĩ...</div>`;

    content.scrollTop = content.scrollHeight;

    try {
        const res = await fetch("/ask_ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });

        const data = await res.json();

        let formatted = (data.response || "Không có phản hồi")
            .replace(/\n/g, "<br>");

        document.getElementById(loadingId).innerHTML = `🤖 ${formatted}`;

    } catch (err) {
        document.getElementById(loadingId).innerHTML = "❌ Lỗi AI";
    }

    content.scrollTop = content.scrollHeight;
}

// =======================
// 🔥 INIT (QUAN TRỌNG)
// =======================
window.onload = () => {
    loadNews();

    const input = document.getElementById("chat-input");

    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
};