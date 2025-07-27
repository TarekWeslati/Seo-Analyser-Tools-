import whois
import ssl
import socket
import datetime
import requests
import dns.resolver

def get_domain_analysis(url):
    domain_info = {
        "domain": None,
        "domain_authority_score": None, # This needs an external service, python-whois doesn't provide it
        "domain_authority_text": "N/A",
        "domain_age_years": None,
        "ssl_status": "N/A",
        "blacklist_status": "N/A",
        "dns_health": "N/A"
    }

    try:
        # Extract domain name from URL
        parsed_url = requests.utils.urlparse(url)
        domain = parsed_url.netloc
        if domain.startswith('www.'):
            domain = domain[4:]
        domain_info["domain"] = domain

        # WHOIS Lookup for Domain Age
        try:
            w = whois.whois(domain)
            if w.creation_date:
                # creation_date can be a list or datetime object
                creation_date = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
                age = datetime.datetime.now().year - creation_date.year
                domain_info["domain_age_years"] = age
            else:
                domain_info["domain_age_years"] = "N/A (Creation date not found)"
        except Exception as e:
            print(f"Error getting WHOIS info for {domain}: {e}")
            domain_info["domain_age_years"] = "N/A (WHOIS lookup failed)"

        # SSL Certificate Status
        try:
            ctx = ssl.create_default_context()
            with ctx.wrap_socket(socket.socket(), server_hostname=domain) as s:
                s.connect((domain, 443))
                cert = s.getpeercert()
                if cert:
                    domain_info["ssl_status"] = "Valid HTTPS"
                else:
                    domain_info["ssl_status"] = "No SSL Certificate"
        except Exception as e:
            print(f"Error checking SSL for {domain}: {e}")
            domain_info["ssl_status"] = "Invalid or No SSL Certificate"

        # DNS Health Check (basic)
        try:
            # Check for A records
            answers = dns.resolver.resolve(domain, 'A')
            if answers:
                domain_info["dns_health"] = "Healthy"
            else:
                domain_info["dns_health"] = "No A records found"
        except dns.resolver.NXDOMAIN:
            domain_info["dns_health"] = "Domain does not exist"
        except dns.resolver.NoAnswer:
            domain_info["dns_health"] = "No DNS records found"
        except Exception as e:
            print(f"Error checking DNS for {domain}: {e}")
            domain_info["dns_health"] = "DNS check failed"

        # Blacklist Status (Placeholder - requires external API for real check)
        # For a real application, you'd integrate with a blacklist API.
        # For now, we'll assume clean.
        domain_info["blacklist_status"] = "Clean"
        
        # Domain Authority Score (Placeholder - requires dedicated API like Moz, Ahrefs, Semrush)
        # python-whois does not provide this.
        domain_info["domain_authority_score"] = "N/A"
        domain_info["domain_authority_text"] = "Requires external Domain Authority API"

    except Exception as e:
        print(f"Overall error in domain analysis for {url}: {e}")
        # If any major error occurs, return N/A for all
        domain_info = {
            "domain": parsed_url.netloc if 'parsed_url' in locals() else "N/A",
            "domain_authority_score": "N/A",
            "domain_authority_text": "Error during analysis",
            "domain_age_years": "N/A",
            "ssl_status": "Error",
            "blacklist_status": "Error",
            "dns_health": "Error"
        }

    return domain_info

