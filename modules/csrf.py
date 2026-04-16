import requests
from bs4 import BeautifulSoup

def scan(url):
    try:
        r = requests.get(url)
        soup = BeautifulSoup(r.text, "html.parser")

        forms = soup.find_all("form")

        for form in forms:
            if not form.find("input", {"name": "csrf_token"}):
                return {"type": "CSRF", "status": "POSSIBLE"}

    except:
        pass

    return {"type": "CSRF", "status": "SAFE"}