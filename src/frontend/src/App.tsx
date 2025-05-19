import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import './App.css';
import { saveAs } from 'file-saver';

interface Trajectory {
  x: number[];
  y: number[];
  z: number[];
  confidence: number[];
  matchedFeatures: number[];
}

function App() {
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [cameraParams, setCameraParams] = useState({
    focalLength: 1000,
    centerX: 640,
    centerY: 360
  });

  const exportToCSV = () => {
    if (!trajectory) return;
    const csvContent = trajectory.x.map((_, i) => 
      `${i},${trajectory.x[i]},${trajectory.y[i]},${trajectory.z[i]},${trajectory.confidence[i]},${trajectory.matchedFeatures[i]}`
    ).join('\n');
    const header = 'Frame,X,Y,Z,Confidence,MatchedFeatures\n';
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'drone_trajectory.csv');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const trajectoryData: Trajectory = {
        x: data.trajectory.map((point: number[]) => point[0]),
        y: data.trajectory.map((point: number[]) => point[1]),
        z: data.trajectory.map((point: number[]) => point[2]),
        confidence: data.confidence || Array(data.trajectory.length).fill(0.8),
        matchedFeatures: data.matchedFeatures || Array(data.trajectory.length).fill(100)
      };

      setTrajectory(trajectoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Drone Visual Odometry Tracker</h1>
      
      <div className="upload-section">
        <h2>Upload Drone Images</h2>
        <div className="camera-settings">
          <h3>Camera Calibration</h3>
          <div className="input-group">
            <label>Focal Length:</label>
            <input 
              type="number" 
              value={cameraParams.focalLength}
              onChange={(e) => setCameraParams({
                ...cameraParams,
                focalLength: Number(e.target.value)
              })}
            />
          </div>
          <div className="input-group">
            <label>Center X:</label>
            <input 
              type="number"
              value={cameraParams.centerX}
              onChange={(e) => setCameraParams({
                ...cameraParams,
                centerX: Number(e.target.value)
              })}
            />
          </div>
          <div className="input-group">
            <label>Center Y:</label>
            <input 
              type="number"
              value={cameraParams.centerY}
              onChange={(e) => setCameraParams({
                ...cameraParams,
                centerY: Number(e.target.value)
              })}
            />
          </div>
        </div>
        <div className="file-input-container">
          <label className="file-input-button">
            Choose ZIP File
            <input
              className="file-input"
              type="file"
              accept=".zip"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>
        {loading && <p className="loading">Processing images... Please wait</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {trajectory && (
        <>
          <div className="controls">
            <button onClick={exportToCSV} className="control-button">
              Export to CSV
            </button>
            <button 
              onClick={() => setShowFeatures(!showFeatures)}
              className="control-button"
            >
              {showFeatures ? 'Hide' : 'Show'} Features
            </button>
          </div>

          <div className="visualization-container">
            <div className="plot-container">
              <Plot
                data={[
                  {
                    type: 'scatter3d',
                    mode: 'lines+markers',
                    x: trajectory.x,
                    y: trajectory.y,
                    z: trajectory.z,
                    marker: {
                      size: trajectory.confidence.map(c => c * 10),
                      color: trajectory.matchedFeatures,
                      colorscale: 'Viridis',
                      showscale: true,
                      colorbar: {
                        title: { text: 'Matched Features' }
                      }
                    },
                    line: {
                      color: 'rgb(33, 150, 243)',
                      width: 3,
                    },
                    hoverinfo: 'text',
                    text: trajectory.x.map((_, i) => 
                      `Position ${i+1}<br>` +
                      `X: ${trajectory.x[i].toFixed(2)}<br>` +
                      `Y: ${trajectory.y[i].toFixed(2)}<br>` +
                      `Z: ${trajectory.z[i].toFixed(2)}<br>` +
                      `Confidence: ${(trajectory.confidence[i] * 100).toFixed(1)}%<br>` +
                      `Features: ${trajectory.matchedFeatures[i]}`
                    ),
                  }
                ]}
                layout={{
                  width: 850,
                  height: 650,
                  title: {
                    text: 'Drone Trajectory',
                    font: { size: 24 }
                  },
                  paper_bgcolor: 'white',
                  plot_bgcolor: 'white',
                  scene: {
                    xaxis: { title: { text: 'X' }, showgrid: true, gridcolor: '#e0e0e0' },
                    yaxis: { title: { text: 'Y' }, showgrid: true, gridcolor: '#e0e0e0' },
                    zaxis: { title: { text: 'Z' }, showgrid: true, gridcolor: '#e0e0e0' },
                    camera: {
                      eye: { x: 1.5, y: 1.5, z: 1.5 }
                    }
                  },
                }}
                config={{
                  responsive: true,
                  displayModeBar: true,
                  displaylogo: false,
                }}
              />
            </div>
            
            {showFeatures && (
              <div className="metrics-container">
                <h3>Feature Matching Statistics</h3>
                <Plot
                  data={[
                    {
                      type: 'scatter',
                      mode: 'lines+markers',
                      x: trajectory.x.map((_, i) => i),
                      y: trajectory.matchedFeatures,
                      name: 'Matched Features',
                    },
                    {
                      type: 'scatter',
                      mode: 'lines+markers',
                      x: trajectory.x.map((_, i) => i),
                      y: trajectory.confidence.map(c => c * 100),
                      name: 'Confidence (%)',
                      yaxis: 'y2',
                    }
                  ]}
                  layout={{
                    width: 850,
                    height: 300,
                    title: {
                      text: 'Feature Matching Quality'
                    },
                    xaxis: { 
                      title: {
                        text: 'Frame'
                      }
                    },
                    yaxis: { 
                      title: {
                        text: 'Matched Features'
                      }
                    },
                    yaxis2: {
                      title: {
                        text: 'Confidence (%)'
                      },
                      overlaying: 'y',
                      side: 'right'
                    },
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
