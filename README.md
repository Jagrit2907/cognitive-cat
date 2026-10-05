# KittyCue

A full-stack solution designed as an ADHD focus helper to monitor user behavior such as keystroke patterns, mouse movement, window activity, and inactivity, and predict focus states using machine learning.

The project consists of two main components:

1. **Backend**: A Flask REST API that provides machine learning inference and model-related endpoints.
2. **Frontend**: A Chrome Extension that collects behavioral signals, extracts features, and displays the predicted focus state.

---

## 🧠 How It Works

1. The Chrome Extension runs in the background and collects behavioral signals from user interaction.
2. The system processes signals such as typing behavior, inter-key delay (IKD), key hold times, mouse movement, window activity, and inactivity.
3. The collected signals are transformed into statistical features such as means, standard deviations, medians, counts, and other derived measurements.
4. These features are combined into a feature vector and sent to the Flask backend.
5. The backend uses a trained machine learning model to predict the user's focus state.
6. The predicted state and associated information are returned to the Chrome Extension and displayed through the extension interface.

The focus states used by the system are:

- `FOCUSED`
- `DISTRACTED`
- `INACTIVE`

---

## 🔍 Behavioral Features

KittyCue uses behavioral patterns rather than the actual content of the user's activity.

The feature extraction pipeline works with signals including:

- Keystroke timing
- Inter-key delay (IKD)
- Key hold time
- Typing speed
- Mouse movement
- Window activity
- Inactivity

The raw signals are transformed into numerical features that can be used by the machine learning model.

Examples of extracted features include:

- Mean values
- Standard deviation
- Median
- Counts
- Total inactivity duration
- Average inactivity duration
- Mouse movement statistics
- Typing speed
- Inter-key delay statistics
- Window activity statistics

---

## 🤖 Machine Learning

KittyCue uses a **Random Forest classifier** for focus-state prediction.

### Input

The model receives a numerical feature vector representing the user's recent behavioral activity.

### Output

The model predicts one of the following focus states:

```text
FOCUSED
DISTRACTED
INACTIVE
