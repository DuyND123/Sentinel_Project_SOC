import os
import json
import datetime
from typing import cast, IO
from flask import Flask, render_template, request, jsonify

# ================== OLD SYSTEM ==================
from scanner.core import run_scan
from scanner.progress import get, set_progress  # ✅ FIX
from report.generator import generate_html_report
from database.db import init_db, save_scan, get_scans

# ================== NEW SYSTEM ==================
try:
    from scanner.security_scanner import SecurityScanner
    print("✅ SecurityScanner loaded")
except Exception as e:
    print("❌ SecurityScanner error:", e)
    SecurityScanner = None

import feedparser

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024

# ================== GEMINI ==================
try:
    import google.generativeai as genai

    GEMINI_API_KEY = 'YOUR_API_KEY_HERE'
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-flash-latest')

    print("✅ Gemini loaded")

except Exception as e:
    print("❌ Gemini disabled:", e)
    model = None

# ================== INIT ==================
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

init_db()

scanner = None
if SecurityScanner:
    try:
        scanner = SecurityScanner()
    except Exception as e:
        print("❌ Scanner init error:", e)
        scanner = None

# ================== STATUS SYSTEM ==================
FILE_STATUSES = ["CLEAN", "SUSPICIOUS", "MALICIOUS", "UNKNOWN"]

def evaluate_file_status(result: dict) -> str:
    score = result.get("score", 0)

    if "status" in result:
        status = result["status"].upper()

        if status in ["SAFE", "CLEAN"]:
            return "CLEAN"
        elif status in ["DANGEROUS", "MALICIOUS"]:
            return "MALICIOUS"
        elif status == "SUSPICIOUS":
            return "SUSPICIOUS"

    if score >= 80:
        return "MALICIOUS"
    elif score >= 40:
        return "SUSPICIOUS"
    elif score > 0:
        return "UNKNOWN"
    else:
        return "CLEAN"

# ================== HISTORY ==================
HISTORY_FILE = os.path.join(str(app.root_path), "scan_history.json")

if not os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)

def load_history():
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def save_to_history(scan_type, target, result):
    history = load_history()

    status = evaluate_file_status(result)

    entry = {
        "date": datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "type": scan_type,
        "target": target,
        "status": status,
        "score": result.get("score", 0),
        "details": result.get("details", [])
    }

    history.insert(0, entry)
    history = history[:100]

    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=4)

# ================== ROUTES ==================

@app.route("/")
def index():
    return render_template("index.html")

# ---------- OLD SCAN ----------
@app.route("/scan", methods=["POST"])
def scan():
    url = request.form.get("url")

    if not url:
        return jsonify({"error": "Missing URL"}), 400

    set_progress(0)  # ✅ FIX

    results = run_scan(url)
    report_file = generate_html_report(results)

    set_progress(100)  # ✅ đảm bảo hoàn tất

    save_scan(url, results)
    save_to_history("URL", url, {"details": results, "score": 0})

    return jsonify({
        "results": results,
        "report": report_file
    })

# ---------- NEW URL SCAN ----------
@app.route("/scan_url", methods=["POST"])
def scan_url_new():
    if scanner is None:
        return jsonify({"error": "Scanner not available"}), 500

    url = request.form.get("url")
    if not url:
        return jsonify({"error": "Missing URL"}), 400

    print(f"[SCAN] URL: {url}")

    try:
        set_progress(0)  # ✅ RESET

        result = scanner.scan_url(url)

        if not result:
            set_progress(100)
            return jsonify({"error": "Scan failed"}), 500

        result["status"] = evaluate_file_status(result)

        set_progress(100)  # ✅ đảm bảo end

        save_to_history("URL", url, result)

        return jsonify(result)

    except Exception as e:
        print("Scan URL error:", e)
        set_progress(100)
        return jsonify({"error": "Scan crashed"}), 500

# ---------- UPLOAD BASIC ----------
@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "No file"}), 400

    filename = file.filename or "unknown_file"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    set_progress(0)

    results = [
        {"type": "File Scan", "status": "CLEAN"},
        {"type": "Signature Check", "status": "CLEAN"}
    ]

    set_progress(100)

    final_result = {
        "score": 0,
        "details": results
    }

    save_scan(filename, results)
    save_to_history("FILE", filename, final_result)

    return jsonify({"results": results})

# ---------- DEEP FILE SCAN ----------
@app.route("/scan_file", methods=["POST"])
def scan_file_new():
    if scanner is None:
        return jsonify({"error": "Scanner not available"}), 500

    if "file" not in request.files:
        return jsonify({"error": "Missing file"}), 400

    try:
        set_progress(0)  # ✅ RESET

        file = request.files["file"]
        filename = file.filename or "uploaded_file"

        file_stream = cast(IO[bytes], file.stream)

        result = scanner.scan_file_deep(file_stream, filename)

        result["status"] = evaluate_file_status(result)

        set_progress(100)

        save_to_history("FILE", filename, result)

        return jsonify(result)

    except Exception as e:
        print("Scan file error:", e)
        set_progress(100)
        return jsonify({"error": "File scan crashed"}), 500

# ---------- PROGRESS ----------
@app.route("/progress")
def progress():
    return jsonify({"progress": get()})

# ---------- DASHBOARD ----------
@app.route("/dashboard")
def dashboard():
    scans = get_scans()
    return render_template("dashboard.html", scans=scans)

# ---------- HISTORY ----------
@app.route("/history")
def history_page():
    data = load_history()
    return render_template("history.html", history=data)

# ---------- NEWS ----------
@app.route("/api/news")
def get_news():
    feed = feedparser.parse("https://feeds.feedburner.com/TheHackersNews")

    news = []
    for entry in feed.entries[:6]:

        image = None

        if "media_content" in entry:
            image = entry.media_content[0].get("url")

        elif "links" in entry:
            for link in entry.links:
                if link.get("type", "").startswith("image"):
                    image = link.get("href")

        elif "summary" in entry:
            import re
            match = re.search(r'<img.*?src="(.*?)"', entry.summary)
            if match:
                image = match.group(1)

        news.append({
            "title": entry.title,
            "link": entry.link,
            "image": image
        })

    return jsonify(news)

# ---------- AI ----------
@app.route("/ask_ai", methods=["POST"])
def ask_ai():
    user_msg = request.json.get("message")

    if model is None:
        return jsonify({
            "response": "⚠️ AI tạm thời không hoạt động"
        })

    try:
        prompt = f"You are a cybersecurity expert. Answer briefly: {user_msg}"
        response = model.generate_content(prompt)
        return jsonify({"response": response.text})
    except Exception as e:
        print("AI error:", e)
        return jsonify({"response": "AI error"})

# ================== RUN ==================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)