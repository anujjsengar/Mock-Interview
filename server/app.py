from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import numpy as np
import cv2
from ultralytics import YOLO
from datetime import datetime
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient("mongodb+srv://anujjsengar:Anuj%40082004@anujjsengar.2ordy.mongodb.net/?retryWrites=true&w=majority&appName=anujjsengar")
db = client["interview_db"]
users_collection = db["user_details"]
os.makedirs("screenshots", exist_ok=True)

# Load YOLO model only once
model = YOLO('yolov8n.pt')

# Google Gemini API Key
API_KEY = 'AIzaSyBBeTYogNSjMg-J51IglUaXijpbeDACfEw'
GEN_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"

# ----------------------------------
@app.route('/generate-question', methods=['POST'])
def generate_question():
    data = request.get_json()
    subject = data.get('subject', '')
    prompt = f"Generate one question for the subject: {subject}"

    try:
        res = requests.post(GEN_URL, json={
            "contents": [{"parts": [{"text": prompt}]}]
        }, headers={"Content-Type": "application/json"})

        result = res.json()
        question = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'No question generated.')
        return jsonify({'question': question})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------
@app.route('/evaluate-answer', methods=['POST'])
def evaluate_answer():
    data = request.get_json()
    question = data.get('question', '')
    answer = data.get('answer', '')

    prompt = (
        f"Evaluate the following answer for the given question on a scale of 0 to 10.\n\n"
        f"Question: {question}\n"
        f"Answer: {answer}\n\n"
        f"Only respond with a number from 0 to 10, no explanation. "
        f"Give a score based on the relevance and correctness of the answer, and be lenient in evaluation."
    )

    try:
        res = requests.post(GEN_URL, json={
            "contents": [{"parts": [{"text": prompt}]}]
        }, headers={"Content-Type": "application/json"})

        result = res.json()
        evaluation = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'invalid').lower()
        return jsonify({'evaluation': evaluation})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------
@app.route('/detect_faces', methods=['POST'])
def detect_faces():
    try:
        file = request.files['image']
        npimg = np.frombuffer(file.read(), np.uint8)
        frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        frame = cv2.resize(frame, (640, 640))  # resize to reduce memory usage

        results = model.predict(source=frame, conf=0.3, verbose=False)
        faces = [d for d in results[0].boxes if int(d.cls[0]) == 0]

        return jsonify({'count': len(faces)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------
@app.route('/detect_phone', methods=['POST'])
def detect_phone():
    try:
        file = request.files['image']
        npimg = np.frombuffer(file.read(), np.uint8)
        frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)
        frame = cv2.resize(frame, (640, 640))  # resize to reduce memory usage

        results = model.predict(source=frame, conf=0.3, verbose=False)
        phone_detected = any(int(d.cls[0]) == 67 for d in results[0].boxes)

        return jsonify({'phone_detected': phone_detected})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------------------------
@app.route("/modify_details", methods=["POST"])
def modify_details():
    try:
        print("Received request to modify user details")
        name = request.form.get("name")
        age = request.form.get("age")
        gender = request.form.get("gender")

        screenshot = request.files.get("screenshot")
        screenshot_filename = None
        if screenshot:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            screenshot_filename = f"screenshots/{name}_{timestamp}.jpg"
            screenshot.save(screenshot_filename)

        user_data = {
            "name": name,
            "age": age,
            "gender": gender,
            "timestamp": datetime.now(),
            "screenshot_path": screenshot_filename
        }

        users_collection.insert_one(user_data)
        return jsonify({"message": "User data saved successfully!"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------------------------
if __name__ == '__main__':
    app.run(debug=True)
