import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import * as Tone from 'tone';
import { Mic, Send, Play, ChevronLeft, Lock } from 'lucide-react';

const Chat = () => {
    const { matches } = useContext(AppContext);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [messages, setMessages] = useState([]); // { text, audio, sender }
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [inputText, setInputText] = useState("");

    // Initialize Tone.js Recorder
    useEffect(() => {
        const initAudio = async () => {
            // Only init if we are in a chat
            if (selectedMatch && !recorder) {
                const newRecorder = new Tone.Recorder();
                const mic = new Tone.UserMedia();

                try {
                    await mic.open();
                    mic.connect(newRecorder);
                    setRecorder(newRecorder);
                    console.log("Audio initialized");
                } catch (e) {
                    console.error("Mic access denied or error:", e);
                }
            }
        };

        if (selectedMatch) initAudio();

        return () => {
            // Cleanup if needed
        };
    }, [selectedMatch]);

    const handleRecordToggle = async () => {
        if (!recorder) return;

        if (!isRecording) {
            // Start
            await Tone.start();
            recorder.start();
            setIsRecording(true);
        } else {
            // Stop
            const recording = await recorder.stop();
            const url = URL.createObjectURL(recording);
            setMessages(prev => [...prev, { audio: url, sender: 'me' }]);
            setIsRecording(false);
        }
    };

    const handleSendMessage = () => {
        if (!inputText.trim()) return;
        setMessages(prev => [...prev, { text: inputText, sender: 'me' }]);
        setInputText("");

        // Mock reply
        setTimeout(() => {
            setMessages(prev => [...prev, { text: "That's interesting...", sender: 'them' }]);
        }, 1500);
    };

    const playAudio = (url) => {
        const player = new Tone.Player(url).toDestination();
        player.autostart = true;
    };

    if (!selectedMatch) {
        return (
            <div style={{ padding: '1rem' }}>
                <h2 style={{ color: 'var(--color-secondary)', marginBottom: '1rem' }}>Matches</h2>
                {matches.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>No matches yet. Go swipe!</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {matches.map(match => (
                            <div
                                key={match.id}
                                onClick={() => setSelectedMatch(match)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '15px',
                                    padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)',
                                    borderRadius: '10px', cursor: 'pointer'
                                }}
                            >
                                <img src={match.avatar} alt={match.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{match.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Click to chat</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{
                padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--color-primary)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => setSelectedMatch(null)}><ChevronLeft color="white" /></button>
                    <img src={selectedMatch.avatar} alt={selectedMatch.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontWeight: 'bold' }}>{selectedMatch.name}</span>
                </div>
                {/* Hidden Bond Indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                    <Lock size={14} />
                    <span>Bond Hidden</span>
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.sender === 'me' ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.sender === 'me' ? 'var(--color-secondary)' : 'rgba(255,255,255,0.1)',
                        color: msg.sender === 'me' ? 'var(--color-primary)' : 'white',
                        padding: '10px 15px', borderRadius: '15px', maxWidth: '70%',
                        borderBottomRightRadius: msg.sender === 'me' ? '2px' : '15px',
                        borderBottomLeftRadius: msg.sender === 'me' ? '15px' : '2px'
                    }}>
                        {msg.text && <p>{msg.text}</p>}
                        {msg.audio && (
                            <button onClick={() => playAudio(msg.audio)} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Play size={16} fill="currentColor" /> Audio Note
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Input */}
            <div style={{ padding: '10px', display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--color-primary)' }}>
                <button
                    onClick={handleRecordToggle}
                    style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        backgroundColor: isRecording ? '#ff4444' : 'rgba(255,255,255,0.1)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
                </button>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, margin: 0, borderRadius: '20px' }}
                />
                <button
                    onClick={handleSendMessage}
                    style={{ color: 'var(--color-secondary)' }}
                >
                    <Send size={24} />
                </button>
            </div>
        </div>
    );
};

export default Chat;
