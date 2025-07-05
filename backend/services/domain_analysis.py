import whois
import ssl
import socket
import datetime
import requests

def get_domain_age(domain):
    try:
        w = whois.whois(domain)
        if w.creation_date:
            if isinstance(w.creation_date, list):
                creation_date = w.creation_date[0]
            else:
                creation_date = w.creation_date
            age = (datetime.datetime.now() - creation_date).days // 365
            return age
        return "N/A"
    except Exception:
        return "N/A"

def check_ssl_status(url):
    try:
        parsed_url = url.split("://")[-1].split("/")[0]
        context = ssl.create_default_context()
        with socket.create_connection((parsed_url, 443)) as sock:
            with context.wrap_socket(sock, server_hostname=parsed_url) as ssock:
                cert = ssock.getpeercert()
                # You can parse more details from cert if needed
                return "Valid HTTPS"
    except Exception:
        return "No HTTPS or Invalid"

def check_blacklist_status(domain):
    # This is a complex feature. For a simple implementation,
    # you might use a public blacklist checker API (often rate-limited or paid).
    # Mocking for now.
    # A real implementation would involve checking multiple DNSBLs or using a service.
    is_blacklisted = False # Simulate API call
    return "Clean" if not is_blacklisted else "Potentially Blacklisted"

def check_dns_health(domain):
    # dnspython can be used for more detailed checks (NS records, MX records, etc.)
    # For simplicity, just checking if domain resolves.
    try:
        socket.gethostbyname(domain)
        return "Healthy"
    except socket.gaierror:
        return "Unhealthy (Cannot Resolve)"

def get_domain_authority_estimate(domain):
    # Free domain authority estimation is very limited.
    # Moz, Ahrefs, SEMrush offer this via their *paid* APIs.
    # For a free method, you might look at social media mentions,
    # or link counts from a free API if available (often not very accurate).
    # Here, we'll provide a placeholder or a very basic heuristic.
    # A common "free" approach is to check if it's a popular site, but that's not scalable.
    # You might need to use a public "free DA checker" website and scrape,
    # but this is against their ToS and unreliable.
    # For a *professional* tool, you'd integrate with Moz/Ahrefs (paid).
    return "Estimated: Medium (Placeholder)" # Placeholder

def get_domain_analysis(url):
    domain = url.split("://")[-1].split("/")[0]
    return {
        "domain": domain,
        "domain_authority_estimate": get_domain_authority_estimate(domain),
        "domain_age_years": get_domain_age(domain),
        "ssl_status": check_ssl_status(url),
        "blacklist_status": check_blacklist_status(domain),
        "dns_health": check_dns_health(domain)
    }
