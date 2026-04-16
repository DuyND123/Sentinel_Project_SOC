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
// 🔥 SHOW RESULT (GIỮ NGUYÊN)
// =======================
function showResult(data) {
    let html = "";

    // hỗ trợ cả OLD + NEW
    let results = data.results || data.details || [];

    results.forEach(r => {
        let color = "green";

        if (r.status === "VULNERABLE" || r.status === "MALICIOUS") color = "red";
        else if (r.status === "POSSIBLE" || r.status === "SUSPICIOUS") color = "orange";

        html += `<p style="color:${color}">
                    ${r.type || "Scan"} : ${r.status}
                 </p>`;
    });

    // thêm summary cho NEW system
    if (data.status) {
        html += `<hr>
                 <p><b>Final Status:</b> ${data.status}</p>
                 <p><b>Score:</b> ${data.score || 0}</p>`;
    }

    document.getElementById("result").innerHTML = html;

    document.getElementById("progress-bar").style.width = "100%";
    document.getElementById("progress-text").innerText = "100% - Hoàn thành";
}

// =======================
// 🔥 PROGRESS (UPGRADE)
// =======================
function trackProgress() {
    let interval = setInterval(() => {
        fetch("/progress")
        .then(res => res.json())
        .then(data => {
            let percent = data.progress;

            document.getElementById("progress-bar").style.width = percent + "%";
            document.getElementById("progress-text").innerText = percent + "%";

            if (percent >= 100) {
                clearInterval(interval);
            }
        });
    }, 300);
}

// =======================
// 🔥 NEWS (GIỮ NGUYÊN)
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
                <img src="${item.image || 'https://via.placeholder.com/300x150'}" alt="${item.title}">
                <p>${item.title}</p>
            `;

            card.onclick = () => {
                window.open(item.link, "_blank");
            };

            container.appendChild(card);
        });

    } catch (err) {
        console.error("Load news error:", err);
    }
}

window.onload = () => {
    loadNews();
};

// =======================
// 🔥 CHAT (GIỮ NGUYÊN)
// =======================
function toggleChat() {
    const box = document.getElementById("chat-box");
    box.style.display = box.style.display === "flex" ? "none" : "flex";
}

function showResult(data) {
    let html = "";

    let results = data.results || data.details || [];

    html += `<h3 style="margin-bottom:10px;">🔍 KẾT QUẢ PHÂN TÍCH</h3>`;

    // =========================
    // 🔧 PHẦN KỸ THUẬT (GIỮ NGUYÊN)
    // =========================
    results.forEach(r => {
        let color = "green";

        if (r.status === "VULNERABLE" || r.status === "MALICIOUS") color = "red";
        else if (r.status === "POSSIBLE" || r.status === "SUSPICIOUS") color = "orange";

        html += `<p style="color:${color}">
                    ${r.type} : ${r.status}
                 </p>`;
    });

    // =========================
    // 🧠 PHẦN GIẢI THÍCH DỄ HIỂU
    // =========================
    html += `<hr><h4>🧠 ĐÁNH GIÁ DỄ HIỂU</h4>`;

    let explanation = "";
    let advice = "";

    let finalStatus = data.status || "UNKNOWN";

    if (finalStatus === "CLEAN" || finalStatus === "SAFE") {
        explanation = "Hệ thống không phát hiện dấu hiệu nguy hiểm. File/Website này có vẻ an toàn để sử dụng.";
        advice = "Bạn có thể tiếp tục sử dụng, nhưng vẫn nên cẩn thận khi nhập thông tin cá nhân.";
    }
    else if (finalStatus === "SUSPICIOUS") {
        explanation = "Có một số dấu hiệu bất thường. Chưa chắc là nguy hiểm nhưng có rủi ro.";
        advice = "Không nên nhập mật khẩu hoặc thông tin quan trọng. Hãy kiểm tra thêm trước khi sử dụng.";
    }
    else if (finalStatus === "MALICIOUS") {
        explanation = "Phát hiện dấu hiệu nguy hiểm. File/Website này có thể chứa mã độc hoặc lừa đảo.";
        advice = "KHÔNG nên mở hoặc truy cập. Nên xóa file hoặc tránh truy cập ngay lập tức.";
    }
    else {
        explanation = "Không đủ dữ liệu để đánh giá chính xác.";
        advice = "Hãy cẩn trọng khi sử dụng.";
    }

    html += `
        <p><b> Kết luận:</b> ${finalStatus}</p>
        <p><b> Mô tả:</b> ${explanation}</p>
        <p><b>️ Khuyến nghị:</b> ${advice}</p>
    `;

    // =========================
    // 📊 SCORE (GIỮ)
    // =========================
    if (data.score !== undefined) {
        html += `<p><b> Điểm an toàn:</b> ${data.score}/100</p>`;
    }

    document.getElementById("result").innerHTML = html;

    document.getElementById("progress-bar").style.width = "100%";
    document.getElementById("progress-text").innerText = "100% - Hoàn thành";

}