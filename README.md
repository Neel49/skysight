# Balloon Flight Visualizer

A real-time web app that tracks and visualizes global weather balloons using **Leaflet.js**. This project fetches live balloon data, clusters markers, and overlays flight paths and heatmaps to enhance visualization.

## 🚀 Features
- **Marker Clustering**: Groups nearby balloons for better map readability.
- **Flight Paths**: Displays balloon movement history with red polylines and directional arrows.
- **Heatmap**: Highlights dense balloon regions using color gradients.
- **Weather Overlay**: Cloud coverage layer from OpenWeatherMap.
- **Automatic Map Adjustment**: Ensures optimal zoom and centering based on balloon distribution.

## 🔧 Setup
### 1. Clone the Repository
```bash
git clone https://github.com/your-username/balloon-flight-visualizer.git
cd balloon-flight-visualizer
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Application
```bash
python app.py
```
By default, the Flask app runs on `http://127.0.0.1:5000/`.

## 📂 File Structure
```
📦 balloon-flight-visualizer
├── 📜 app.py            # Flask backend
├── 📜 Procfile          # Deployment config
├── 📜 requirements.txt  # Python dependencies
├── 📜 index.html        # Frontend UI
├── 📜 script.js         # Map visualization logic
├── 📜 style.css         # UI Styling
└── 📂 static            # Static assets (CSS, JS, etc.)
```

## 🌍 Live Data Source
Balloon data is fetched from `https://a.windbornesystems.com/treasure/`. The API retrieves snapshots from the last 24 hours, identifying and grouping balloons based on proximity.

## 🛠️ Technologies Used
- **Flask** (Backend)
- **Leaflet.js** (Map Visualization)
- **OpenWeatherMap API** (Weather Overlay)
- **Leaflet.heat & MarkerCluster** (Heatmaps & Clustering)

## 📸 Screenshots
### Marker Clusters & Flight Paths
![Screenshot 1](screenshot1.png)

### Global View
![Screenshot 2](screenshot2.png)

## 🌐 Deployment
For deployment on **Heroku**, add the `Procfile` and run:
```bash
git push heroku main
```

## 🤝 Contributing
Got ideas? Found a bug? Feel free to fork this repo and submit a pull request!

## 📜 License
MIT License


