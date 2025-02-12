from flask import Flask, jsonify, send_from_directory
import requests
import json
import math

app = Flask(__name__, static_folder='static')

def process_coordinate(value):
    """
    Convert a value to a float.
    If the conversion fails or if the value is NaN, return None.
    """
    try:
        f = float(value)
        if math.isnan(f):
            return None
        return f
    except (ValueError, TypeError):
        return None

def process_altitude(value):
    """Convert a value to a float, and return None if it is NaN or invalid."""
    try:
        alt_val = float(value)
        if math.isnan(alt_val):
            return None
        return alt_val
    except (ValueError, TypeError):
        return None

def is_valid_balloon_record(record):
    """
    - For a dict, it must have 'lat' and 'lon' keys.
    - For a list, it must have at least two values.
    """
    if isinstance(record, dict):
        if 'lat' not in record or 'lon' not in record:
            return False

        return True
    elif isinstance(record, list):
        return len(record) >= 2
    return False

def are_same_balloon(rec1, rec2, threshold=1.0):
    """
    Figure out if two balloon records are from the same balloon based on prox.
    """
    try:
        lat1 = rec1['lat']
        lon1 = rec1['lon']
        lat2 = rec2['lat']
        lon2 = rec2['lon']
        dist = math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2)
        return dist <= threshold
    except Exception:
        return False

@app.route('/api/balloon-history')
def balloon_history():
    """
    Aggregates the flight history from the last 24 hours.
    Each JSON file (00.json through 23.json) is snapshot taken N hours ago.
    We fetch each file, validate data,
    and then group records from different snapshots together if they appear to be the same balloon.
    """
    base_url = "https://a.windbornesystems.com/treasure/"
    aggregated_data = {}
    balloon_counter = 0


    for i in range(5):
        file_name = f"{i:02d}.json"
        url = base_url + file_name
        print(f"\n=== Processing snapshot {i} from URL: {url} ===")
        try:
            response = requests.get(url, timeout=5)
            print(f"Received response for snapshot {i} with status code: {response.status_code}")
            response.raise_for_status()

            try:
                data = response.json()
                print(f"Successfully parsed JSON for snapshot {i}.")
            except ValueError as e:
                print(f"Error parsing JSON from {url}: {e}")

                text = response.text.strip()
                last_bracket = text.rfind(']')
                if last_bracket != -1:
                    trimmed_text = text[:last_bracket+1]
                    try:
                        data = json.loads(trimmed_text)
                        print(f"Successfully trimmed and parsed JSON for snapshot {i} (records: {len(data)}).")
                    except Exception as e2:
                        print(f"Failed to parse trimmed JSON from {url}: {e2}")
                        continue
                else:
                    print(f"No closing bracket found in response from {url}. Skipping snapshot {i}.")
                    continue

            if not isinstance(data, list):
                print(f"Warning: Data from {file_name} is not a list. Skipping this snapshot.")
                continue

            print(f"Snapshot {i} contains {len(data)} records.")
            for idx, record in enumerate(data):
                if not is_valid_balloon_record(record):
                    print(f"Warning: Invalid record in {file_name}, index {idx}: {record}")
                    continue


                if isinstance(record, list):
                    temp_id = f"temp_{i}_{idx}"
                    lat = process_coordinate(record[0])
                    lon = process_coordinate(record[1])

                    if lat is None or lon is None:
                        print(f"Skipping record in {file_name}, index {idx} due to invalid coordinates.")
                        continue
                    new_record = {
                        'id': temp_id,
                        'lat': lat,
                        'lon': lon,
                        'hours_ago': i
                    }
                    if len(record) > 2:
                        new_record['alt'] = process_altitude(record[2])
                    record = new_record

                else:

                    lat = process_coordinate(record['lat'])
                    lon = process_coordinate(record['lon'])
                    if lat is None or lon is None:
                        print(f"Skipping dict record in {file_name}, index {idx} due to invalid coordinates: {record}")
                        continue
                    record['lat'] = lat
                    record['lon'] = lon
                    record['hours_ago'] = i
                    if 'alt' in record:
                        record['alt'] = process_altitude(record['alt'])


                merged = False
                for balloon_id, history in aggregated_data.items():
                    if are_same_balloon(history[-1], record, threshold=1.0):
                        history.append(record)

                        merged = True
                        break

                if not merged:

                    new_balloon_id = f"balloon_{balloon_counter}"
                    balloon_counter += 1
                    aggregated_data[new_balloon_id] = [record]


        except Exception as e:
            print(f"Error fetching or processing {url}: {e}")
            continue


    balloons_list = []
    for balloon_id, history in aggregated_data.items():
        history.sort(key=lambda r: r['hours_ago'])
        balloons_list.append({
            "id": balloon_id,
            "history": history
        })

    print("\n=== Aggregation complete ===")
    print(f"Total balloons aggregated: {len(balloons_list)}")
    return jsonify({"balloons": balloons_list})

@app.route('/')
def index():
    """Serve the main HTML page."""
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)
