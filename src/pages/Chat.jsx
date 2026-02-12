import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import * as Tone from 'tone';
import { Mic, Send, Play, ChevronLeft, Lock, Info } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const Chat = () => {
    const { matches } = useContext(AppContext);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [messages, setMessages] = useState([]); // { text, audio, sender }
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [inputText, setInputText] = useState("");
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const { setMatches, user } = useContext(AppContext);

    // Fetch persistent matches from Firestore
    useEffect(() => {
        const fetchMatches = async () => {
            if (!user) return;
            try {
                // Remove orderBy for now to ensure all matches show up even without timestamp
                const q = query(collection(db, "users", user.uid, "matches"));
                const querySnapshot = await getDocs(q);
                const fetchedMatches = [];
                querySnapshot.forEach((doc) => {
                    fetchedMatches.push({ id: doc.id, ...doc.data() });
                });
                setMatches(fetchedMatches);
            } catch (e) {
                console.error("Error fetching matches:", e);
            } finally {
                setIsLoadingMatches(false);
            }
        };

        fetchMatches();
    }, [user, setMatches]);

    const getHighResPhoto = (url) => {
        if (!url) return null;
        if (url.includes('googleusercontent.com')) {
            return url.replace('=s96-c', '=s600-c');
        }
        return url;
    };

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

    // Real-time Messages Logic
    useEffect(() => {
        if (!user || !selectedMatch) return;

        // Consistent chatId: smallerUID_largerUID
        const chatId = [user.uid, selectedMatch.id].sort().join('_');

        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = [];
            snapshot.forEach((doc) => {
                newMessages.push(doc.data());
            });
            setMessages(newMessages);
        });

        return () => unsubscribe();
    }, [user, selectedMatch]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user || !selectedMatch) return;

        const chatId = [user.uid, selectedMatch.id].sort().join('_');
        const messageData = {
            text: inputText,
            senderId: user.uid,
            timestamp: serverTimestamp()
        };

        setInputText("");

        try {
            await addDoc(collection(db, "chats", chatId, "messages"), messageData);
        } catch (e) {
            console.error("Error sending message:", e);
            alert("Connection lost. Try again.");
        }
    };

    const playAudio = (url) => {
        const player = new Tone.Player(url).toDestination();
        player.autostart = true;
    };

    if (!selectedMatch) {
        return (
            <div className="page-container">
                <h2 style={{ color: 'var(--color-secondary)', marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: '800' }}>Matches</h2>
                {isLoadingMatches ? (
                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <div className="animate-pulse" style={{ color: 'var(--color-secondary)' }}>Gathering souls...</div>
                    </div>
                ) : matches.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '3rem' }}>No matches yet. Go swipe!</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {matches.map(match => (
                            <div
                                key={match.id}
                                onClick={() => setSelectedMatch(match)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '15px',
                                    padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)',
                                    borderRadius: '16px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                            >
                                <img
                                    src={getHighResPhoto(match.avatar || match.photoURL) || `https://ui-avatars.com/api/?background=0a192f&color=ffd700&name=${encodeURIComponent(match.name || 'Soul')}`}
                                    alt={match.name}
                                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,215,0,0.2)' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{match.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Click to chat</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
                padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--color-primary)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => setSelectedMatch(null)} className="icon-btn"><ChevronLeft color="white" /></button>
                    <img
                        src={getHighResPhoto(selectedMatch.avatar || selectedMatch.photoURL) || "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000"}
                        alt={selectedMatch.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 'bold' }}>{selectedMatch.name}</span>
                </div>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                WebkitOverflowScrolling: 'touch'
            }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        alignSelf: msg.senderId === user.uid ? 'flex-end' : 'flex-start',
                        backgroundColor: msg.senderId === user.uid ? 'var(--color-secondary)' : 'rgba(255,255,255,0.1)',
                        color: msg.senderId === user.uid ? 'var(--color-primary)' : 'white',
                        padding: '12px 18px', borderRadius: '18px', maxWidth: '75%',
                        borderBottomRightRadius: msg.senderId === user.uid ? '2px' : '18px',
                        borderBottomLeftRadius: msg.senderId === user.uid ? '18px' : '2px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
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

            {/* Input area style adjustment for fixed nav in Layout */}
            <div style={{
                padding: '1.2rem 1.5rem',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                background: 'rgba(10, 25, 47, 0.98)',
                backdropFilter: 'blur(15px)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: 'calc(var(--nav-height) + 1.5rem)', // Safe clearance for Navigation
                boxShadow: '0 -10px 30px rgba(0,0,0,0.3)'
            }}>
                <button
                    onClick={handleRecordToggle}
                    className="icon-btn"
                    style={{
                        width: '45px', height: '45px',
                        backgroundColor: isRecording ? '#ff4444' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: isRecording ? 'none' : '1px solid rgba(255,255,255,0.1)'
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
                    className="icon-btn"
                    style={{ color: 'var(--color-secondary)' }}
                >
                    <Send size={24} />
                </button>
            </div>
        </div>
    );
};

export default Chat;
