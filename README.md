# 🐱 KittyCue

A full-stack ADHD focus helper that monitors behavioral signals such as typing patterns, mouse movement, and inactivity, and uses machine learning to predict the user's real-time focus state.

KittyCue combines a Chrome Extension with a Flask-based machine learning backend to collect behavioral features, perform real-time inference, and display the predicted focus state through an adaptive Cat Mascot interface.

---

## 🧠 How It Works

KittyCue follows a simple pipeline:

```text
User Interaction
       ↓
Chrome Extension
       ↓
Behavioral Signal Collection
       ↓
Feature Extraction & Aggregation
       ↓
Feature Vector
       ↓
Flask REST API
       ↓
Random Forest Model
       ↓
Focus State Prediction
       ↓
Chrome Extension
       ↓
Adaptive Cat Mascot + Confidence
