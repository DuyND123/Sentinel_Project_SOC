from scanner.progress import set_progress
import time
import socket
import ssl
from urllib.parse import urlparse

class SecurityScanner:

    # =========================
    # 🔥 URL SCAN
    # =========================
    def scan_url(self, url):
        results = []
        score = 100

        try:
            set_progress(10)

            # 1. Parse domain
            parsed = urlparse(url)
            domain = parsed.netloc

            if not domain:
                return {"status": "INVALID", "score": 0, "details": []}

            time.sleep(0.5)

            # 2. DNS Check
            try:
                socket.gethostbyname(domain)
                results.append({"type": "DNS Check", "status": "SAFE"})
            except:
                results.append({"type": "DNS Check", "status": "VULNERABLE"})
                score -= 30

            set_progress(30)
            time.sleep(0.5)

            # 3. SSL Check
            try:
                context = ssl.create_default_context()
                with socket.create_connection((domain, 443), timeout=3) as sock:
                    with context.wrap_socket(sock, server_hostname=domain):
                        results.append({"type": "SSL Certificate", "status": "SAFE"})
            except:
                results.append({"type": "SSL Certificate", "status": "POSSIBLE"})
                score -= 20

            set_progress(60)
            time.sleep(0.5)

            # 4. Basic URL heuristic
            if "@" in url or url.count("-") > 3:
                results.append({"type": "Phishing Pattern", "status": "SUSPICIOUS"})
                score -= 20
            else:
                results.append({"type": "Phishing Pattern", "status": "SAFE"})

            set_progress(80)
            time.sleep(0.5)

            # 5. Final status
            if score >= 80:
                status = "SAFE"
            elif score >= 50:
                status = "SUSPICIOUS"
            else:
                status = "MALICIOUS"

            set_progress(100)

            return {
                "status": status,
                "score": score,
                "details": results
            }

        except Exception as e:
            return {
                "status": "ERROR",
                "score": 0,
                "details": [{"type": "System", "status": str(e)}]
            }

    # =========================
    # 🔥 FILE SCAN
    # =========================
    def scan_file_deep(self, stream, filename):
        results = []
        score = 100

        try:
            set_progress(10)
            time.sleep(0.5)

            # 1. File name check
            if filename.endswith(".exe"):
                results.append({"type": "File Type", "status": "SUSPICIOUS"})
                score -= 30
            else:
                results.append({"type": "File Type", "status": "SAFE"})

            set_progress(40)
            time.sleep(0.5)

            # 2. Size check
            stream.seek(0, 2)
            size = stream.tell()
            stream.seek(0)

            if size > 10 * 1024 * 1024:
                results.append({"type": "File Size", "status": "POSSIBLE"})
                score -= 10
            else:
                results.append({"type": "File Size", "status": "SAFE"})

            set_progress(70)
            time.sleep(0.5)

            # 3. Simple content check
            content = stream.read(1024).decode(errors="ignore").lower()

            if "powershell" in content or "cmd.exe" in content:
                results.append({"type": "Malware Pattern", "status": "MALICIOUS"})
                score -= 50
            else:
                results.append({"type": "Malware Pattern", "status": "SAFE"})

            set_progress(100)

            # Final status
            if score >= 80:
                status = "SAFE"
            elif score >= 50:
                status = "SUSPICIOUS"
            else:
                status = "MALICIOUS"

            return {
                "status": status,
                "score": score,
                "details": results
            }

        except Exception as e:
            return {
                "status": "ERROR",
                "score": 0,
                "details": [{"type": "System", "status": str(e)}]
            }