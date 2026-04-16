import datetime

def get_severity(status):
    if status == "VULNERABLE":
        return "HIGH"
    elif status == "POSSIBLE":
        return "MEDIUM"
    return "LOW"


def generate_html_report(results):
    filename = f"reports/report_{datetime.datetime.now().timestamp()}.html"

    html = """
    <html>
    <head>
    <style>
    body { font-family: Arial; background:#111; color:#fff; }
    .card { padding:15px; margin:10px; border-radius:10px; }
    .HIGH { background:red; }
    .MEDIUM { background:orange; }
    .LOW { background:green; }
    </style>
    </head>
    <body>
    <h1>Sentinel Report</h1>
    """

    for r in results:
        sev = get_severity(r["status"])
        html += f"<div class='card {sev}'>"
        html += f"<h3>{r['type']}</h3>"
        html += f"<p>Status: {r['status']}</p>"
        html += f"<p>Severity: {sev}</p>"
        html += "</div>"

    html += "</body></html>"

    with open(filename, "w", encoding="utf-8") as f:
        f.write(html)

    return filename