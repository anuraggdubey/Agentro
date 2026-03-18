import sys
import json
import time
import requests
import xml.etree.ElementTree as ET


def get_google_trends(retries=3, delay=5):

    url = "https://trends.google.com/trending/rss?geo=US"

    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()

            root = ET.fromstring(response.content)

            trends: list[dict] = []

            for item in root.findall(".//item"):
                title = item.find("title").text if item.find("title") is not None else "Trend"
                link = item.find("link").text if item.find("link") is not None else "https://trends.google.com"
                
                # Google Trends RSS uses some custom namespaces, but generally <description> exists
                desc = item.find("description").text if item.find("description") is not None else "Google Search Trend"

                trends.append({
                    "title": title,
                    "description": desc,
                    "url": link
                })

            print(json.dumps(trends[:20]))
            return

        except Exception as e:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                print(json.dumps({
                    "error": f"Failed after {retries} attempts: {str(e)}"
                }))
                sys.exit(1)


if __name__ == "__main__":
    get_google_trends()