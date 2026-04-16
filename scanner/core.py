from modules import sqli, xss, csrf, idor, auth
from scanner.progress import update

def run_scan(url):
    results = []

    update(10)
    results.append(sqli.scan(url))

    update(30)
    results.append(xss.scan(url))

    update(50)
    results.append(csrf.scan(url))

    update(70)
    results.append(idor.scan(url))

    update(90)
    results.append(auth.scan(url))

    update(100)

    return results