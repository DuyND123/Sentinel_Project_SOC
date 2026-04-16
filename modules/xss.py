import requests

payload = "<script>alert(1)</script>"

def scan(url):
    try:
        r = requests.get(url + payload, timeout=5)

        if payload in r.text:
            return {"type": "XSS", "status": "VULNERABLE"}
    except:
        pass

    return {"type": "XSS", "status": "SAFE"}