import requests

def scan(url):
    try:
        test_url = url + "?id=1"
        r1 = requests.get(test_url)

        test_url2 = url + "?id=2"
        r2 = requests.get(test_url2)

        if r1.text != r2.text:
            return {"type": "IDOR", "status": "POSSIBLE"}

    except:
        pass

    return {"type": "IDOR", "status": "SAFE"}