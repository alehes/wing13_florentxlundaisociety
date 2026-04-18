#TRAVEL TIME MODULE NOT USED IN DEMO
import requests

def get_drive_time_osrm(origin: str, destination: str):
    """
    Uses OSRM public API (car routing).
    Returns minutes.
    """

    def geocode(address):
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": address, "format": "json"}
        r = requests.get(url, params=params).json()

        if not r:
            return None

        return float(r[0]["lon"]), float(r[0]["lat"])

    origin_coords = geocode(origin)
    dest_coords = geocode(destination)

    if not origin_coords or not dest_coords:
        return None

    url = f"http://router.project-osrm.org/route/v1/driving/"
    coords = f"{origin_coords[0]},{origin_coords[1]};{dest_coords[0]},{dest_coords[1]}"

    r = requests.get(url + coords, params={"overview": "false"}).json()

    try:
        seconds = r["routes"][0]["duration"]
        return int(seconds // 60)
    except:
        return None