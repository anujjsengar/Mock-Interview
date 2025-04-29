import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const Camera = () => {
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [recording, setRecording] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);

    const startRecording = () => {
        if (webcamRef.current && webcamRef.current.stream) {
            mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
                mimeType: "video/webm",
            });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setRecordedChunks((prev) => [...prev, event.data]);
                }
            };

            mediaRecorderRef.current.start();
            setRecording(true);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const sendRecordingToBackend = async () => {
        if (!recordedChunks.length) return;

        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const formData = new FormData();
        formData.append("video", blob, "interview_recording.webm");

        try {
            const response = await axios.post("http://localhost:5000/upload_video", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            console.log("Video uploaded successfully:", response.data);
        } catch (error) {
            console.error("Failed to upload video:", error);
        }

        setRecordedChunks([]); // Reset after upload
    };

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    return (
        <div>
            <h4>Mock Interview Recorder</h4>
            <Webcam
                audio={true}
                ref={webcamRef}
                mirrored={true}
                screenshotFormat="image/jpeg"
                width={400}
                videoConstraints={{ facingMode: "user" }}
            />
            <div style={{ marginTop: "10px" }}>
                {!recording ? (
                    <button onClick={startRecording}>Start Interview</button>
                ) : (
                    <button onClick={stopRecording}>Stop Interview</button>
                )}
                <button onClick={sendRecordingToBackend} disabled={!recordedChunks.length}>
                    Send to Backend
                </button>
            </div>
        </div>
    );
};

export default Camera;
