# Drone Visual Odometry 3D Tracker

A web-based application for visualizing and analyzing drone trajectories using visual odometry. This tool processes drone camera footage to create 3D flight path reconstructions with real-time feature tracking and confidence metrics.

## Features

- **3D Trajectory Visualization**
  - Interactive 3D plot of drone flight path
  - Color-coded confidence metrics
  - Feature point tracking visualization
  - Real-time trajectory updates

- **Camera Calibration**
  - Adjustable focal length
  - Configurable camera center coordinates
  - Real-time parameter updates

- **Data Analysis**
  - Feature matching statistics
  - Confidence metrics visualization
  - CSV export functionality
  - Interactive data exploration

## Technology Stack

- **Frontend**
  - React
  - TypeScript
  - Plotly.js
  - File-Saver

- **Backend**
  - Python
  - FastAPI
  - OpenCV
  - NumPy

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- pip

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/drone-visual-odometry-tracker.git
cd drone-visual-odometry-tracker

Install frontend dependencies
npm install

Install backend dependencies
pip install -r requirements.txt

Run the backend server
uvicorn main:app --reload

Run the frontend development server
npm start

## Usage
1. Configure camera parameters (focal length, center coordinates)
2. Upload a ZIP file containing drone camera footage
3. View the 3D trajectory reconstruction
4. Toggle feature matching statistics
5. Export trajectory data to CSV
## Contributing
1. Fork the repository
2. Create your feature branch ( git checkout -b feature/     AmazingFeature )
3. Commit your changes ( git commit -m 'Add some AmazingFeature' )
4. Push to the branch ( git push origin feature/AmazingFeature )
5. Open a Pull Request
.

## Acknowledgments
- OpenCV community for computer vision algorithms
- React and Plotly.js teams for visualization tools
- Contributors and testers who helped improve this project
## Contact
Your Name - Aristotle Repudi

Project Link: https://github.com/yourusername/Drone-Visual-Odometry-3D-Tracker-Web App