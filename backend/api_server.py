import logging
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestClassifier

log = logging.getLogger(__name__)
app = Flask(__name__)
CORS(app)

MODEL_PATH = "model.pkl"

model = None
feature_columns = None


# ---------------------------------------------------------------------------
# LOAD MODEL
# ---------------------------------------------------------------------------

def load_model():
    global model, feature_columns
    try:
        data = joblib.load(MODEL_PATH)
        model = data["model"]
        feature_columns = data["columns"]
        print("✅ Model loaded")
    except:
        print("⚠️ No model found. Train first.")


# ---------------------------------------------------------------------------
# TRAIN MODEL FROM SINGLE CSV
# ---------------------------------------------------------------------------

@app.route("/train", methods=["POST"])
def train():
    global model, feature_columns

    try:
        df = pd.read_csv("data/final_dataset_realistic (1).csv")

        # Target
        y = df["Fatigue_Val"]

        # Drop non-features
        X = df.drop(columns=["Fatigue_Val", "Window_Time"])

        # Encode categorical
        X = pd.get_dummies(X)

        feature_columns = X.columns

        model = RandomForestClassifier()
        model.fit(X, y)

        # Save model
        joblib.dump({
            "model": model,
            "columns": feature_columns
        }, MODEL_PATH)

        print("✅ Model trained & saved")

        return jsonify({"status": "trained"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# PREDICT
# ---------------------------------------------------------------------------

@app.route("/predict", methods=["POST"])
def predict():
    global model, feature_columns

    if model is None:
        return jsonify({"error": "Model not loaded. Train first"}), 503

    body = request.get_json()
    features = body.get("features", {})

    try:
        # Convert to DataFrame
        X = pd.DataFrame([features])

        # Match training columns
        X = pd.get_dummies(X)

        for col in feature_columns:
            if col not in X:
                X[col] = 0

        X = X[feature_columns]

        pred = model.predict(X)[0]

        return jsonify({
            "label": pred
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# STATE (FOR EXTENSION)
# ---------------------------------------------------------------------------

@app.route("/state", methods=["GET"])
def state():
    if model is None:
        return jsonify({"state": "idle"})

    try:
        # Dummy values for now (you can replace later)
        features = {
            "Hold_Time_mean": 10000,
            "IKD_mean": 50000,
            "IKD_std": 20000
        }

        X = pd.DataFrame([features])
        X = pd.get_dummies(X)

        for col in feature_columns:
            if col not in X:
                X[col] = 0

        X = X[feature_columns]

        pred = model.predict(X)[0]

        # Map to UI
        if pred == "HIGH":
            state = "crying"
        elif pred == "AVERAGE":
            state = "idle"
        else:
            state = "happy"

        return jsonify({"state": state})

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"state": "idle"})


# ---------------------------------------------------------------------------
# HEALTH
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------------------
# START
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    load_model()
    app.run(host="0.0.0.0", port=8000, debug=True)
    
    