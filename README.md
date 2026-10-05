# KittyCue

A full-stack solution designed as an ADHD focus helper to monitor user behavior (keystrokes, mouse movements, window activity) and predict real-time focus levels using machine learning.

This project consists of two main components:

1. **Backend**: A lightweight Flask REST API that serves a predictive machine learning model.
2. **Frontend**: A sleek, modern Chrome Extension that captures behavioral signals and displays the predicted focus state.

## 🧠 How it Works

1. The Chrome Extension runs in the background and injects a content script into web pages.
2. It passively monitors typing speed, inter-key delay (IKD), hold times, mouse speed, and inactivity.
3. Every 60 seconds, it computes summary statistics (mean, std, median, etc.) and sends a feature vector to the backend.
4. The backend evaluates these features against a trained model (Random Forest by default) and returns a real-time cognitive state, mapping to `FOCUSED`, `DISTRACTED`, or `INACTIVE`.
5. The Chrome Extension popup displays this status using a dark-themed glassmorphism UI featuring an adaptive Cat Mascot that reacts to the current focus level.

---

## 🔧 Backend Setup (Flask API)

The backend exposes real-time inference and training endpoints.

### Requirements

- Python 3.8+
- Dependencies: `flask`, `pandas`, `numpy`, `scikit-learn` (install via `pip install -r Backend/requirements.txt` if available)

### Running the API Server

Navigate to the backend directory and start the server:

```bash
cd Backend
python api_server.py
