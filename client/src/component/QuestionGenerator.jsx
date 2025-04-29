import React, { useState, useRef } from 'react';

const QuestionGenerator = () => {
    const [subject, setSubject] = useState('');
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(false);
    const recognitionRef = useRef(null);

    const apiKey = 'AIzaSyBBeTYogNSjMg-J51IglUaXijpbeDACfEw';

    const fetchQuestion = async () => {
        setLoading(true);
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Generate one question for the subject: ${subject}` }]
                    }]
                })
            }
        );

        const data = await response.json();
        const question = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No question generated.';
        setCurrentQuestion(question);
        setLoading(false);
    };

    const evaluateAnswer = async (answer) => {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Evaluate this answer: "${answer}" for the question: "${currentQuestion}". Respond only with "correct" or "incorrect".`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        const evaluation = data.candidates?.[0]?.content?.parts?.[0]?.text.toLowerCase();

        if (evaluation.includes('correct')) {
            setScore(prev => prev + 1);
        }
        fetchQuestion(); 
    };

    const startRecording = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setUserAnswer(transcript);
            evaluateAnswer(transcript);
        };

        recognition.onerror = (event) => {
            alert('Speech recognition error: ' + event.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleStart = () => {
        if (!subject.trim()) {
            alert('Please enter a subject.');
            return;
        }
        fetchQuestion();
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>AI Question Generator</h1>

            <div>
                <label>Subject:</label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject"
                    disabled={loading}
                />
                <button onClick={handleStart} disabled={loading}>
                    {loading ? 'Generating...' : 'Start'}
                </button>
            </div>

            {currentQuestion && (
                <div>
                    <h2>Question:</h2>
                    <p>{currentQuestion}</p>
                    <button onClick={startRecording}>Answer (Record)</button>
                    {userAnswer && (
                        <p><strong>Your Answer:</strong> {userAnswer}</p>
                    )}
                </div>
            )}

            <div>
                <h3>Score: {score}</h3>
            </div>
        </div>
    );
};

export default QuestionGenerator;
