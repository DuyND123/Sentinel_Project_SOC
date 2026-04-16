import requests

def scan(url):
    passwords = ["admin", "123456", "password"]

    for pwd in passwords:
        try:
            data = {"username": "admin", "password": pwd}
            r = requests.post(url, data=data)

            if "welcome" in r.text.lower():
                return {"type": "Weak Auth", "status": "VULNERABLE"}
        except:
            pass

    return {"type": "Weak Auth", "status": "SAFE"}