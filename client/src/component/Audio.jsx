import React, { useState } from "react";

const AudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [transcription, setTranscription] = useState("");

    let mediaRecorder;
    let audioChunks = [];

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            setAudioBlob(audioBlob);
            audioChunks = [];
            convertAudioToText(audioBlob).then((text) => {
                console.log("Transcription:", text);
            });
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Automatically stop recording after 5 seconds
            setTimeout(() => {
            if (mediaRecorder.state === "recording") {
                mediaRecorder.stop();
                setIsRecording(false);
            }
            }, 5000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const convertAudioToText = async (audioBlob) => {
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
            const response = await fetch("http://localhost:5000/api/transcribe", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setTranscription(data.transcription);
            } else {
                console.error("Failed to transcribe audio");
            }
        } catch (error) {
            console.error("Error sending audio to backend:", error);
        }
    };

    return (
        <div>
            <h1>Audio Recorder</h1>
            <button onClick={isRecording ? stopRecording : startRecording}>
                {isRecording ? "Stop Recording" : "Start Recording"}
            </button>
            {transcription && (
                <div>
                    <h2>Transcription:</h2>
                    <p>{transcription}</p>
                </div>
            )}
        </div>
    );
};

export default AudioRecorder;