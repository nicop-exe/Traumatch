import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import * as Tone from 'tone';
import { Mic, Send, Play, ChevronLeft, Lock, Info } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, getDocs, query, orderBy, onSnapshot, addDoc, setDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Chat = () => {
    const { matches, setMatches, user } = useContext(AppContext);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [liveSelectedMatch, setLiveSelectedMatch] = useState(null);
    const [messages, setMessages] = useState([]); // { text, audio, sender }
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [inputText, setInputText] = useState("");
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Sync loading state with global matches
    useEffect(() => {
        if (user) {
            setIsLoadingMatches(false);
        }
    }, [user, matches]);

    const getHighResPhoto = (url) => {
        if (!url) return null;
        if (url.includes('googleusercontent.com')) {
            return url.replace('=s96-c', '=s600-c');
        }
        return url;
    };

    // Real-time Profile Sync for Selected Match
    useEffect(() => {
        if (!selectedMatch?.id) {
            setLiveSelectedMatch(null);
            return;
        }

        // Listen to the actual user document to get the latest photo/name
        const unsubscribe = onSnapshot(doc(db, "users", selectedMatch.id), (docSnap) => {
            if (docSnap.exists()) {
                setLiveSelectedMatch({ id: docSnap.id, ...docSnap.data() });
            } else {
                setLiveSelectedMatch(selectedMatch); // Fallback
            }
        });

        return () => unsubscribe();
    }, [selectedMatch]);

    const handleRecordToggle = async () => {
        // Stop logic
        if (isRecording && recorder) {
            setIsRecording(false);
            setIsUploading(true);
            try {
                const recording = await recorder.stop();
                const chatId = getChatId(user.uid, selectedMatch.id);
                const fileName = `audio_${Date.now()}.webm`;
                const storageRef = ref(storage, `chats/${chatId}/${fileName}`);

                const snapshot = await uploadBytes(storageRef, recording);
                const downloadURL = await getDownloadURL(snapshot.ref);

                await addDoc(collection(db, "chats", chatId, "messages"), {
                    audio: downloadURL,
                    senderId: user.uid,
                    timestamp: serverTimestamp()
                });
            } catch (e) {
                console.error("Audio stop error:", e);
                alert("Could not send audio. Check connection.");
            } finally {
                setIsUploading(false);
            }
            return;
        }

        // Start logic (Init + Start in one flow for permissions)
        try {
            await Tone.start();
            let currentRecorder = recorder;

            if (!currentRecorder) {
                const newRecorder = new Tone.Recorder();
                const mic = new Tone.UserMedia();
                await mic.open();
                mic.connect(newRecorder);
                setRecorder(newRecorder);
                currentRecorder = newRecorder;
            }

            currentRecorder.start();
            setIsRecording(true);
        } catch (e) {
            console.error("Recording start error:", e);
            alert("Microphone denied. Enable it in browser settings and try again.");
        }
    };

    // Generate a consistent Chat ID between two users
    const getChatId = (uid1, uid2) => [uid1, uid2].sort().join('_');

    // Real-time Messages Logic
    useEffect(() => {
        if (!user?.uid || !selectedMatch?.id) return;

        const chatId = getChatId(user.uid, selectedMatch.id);
        const q = query(collection(db, "chats", chatId, "messages"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            const sortedMessages = newMessages.sort((a, b) => {
                const timeA = a.timestamp?.seconds || 0;
                const timeB = b.timestamp?.seconds || 0;
                return timeA - timeB;
            });

            setMessages(sortedMessages);
            setTimeout(scrollToBottom, 50);
        }, (error) => {
            console.error("Chat listener fatal error:", error);
        });

        return () => unsubscribe();
    }, [user?.uid, selectedMatch?.id]);

    // Sub-component for Match List Item to ensure live data (photos/names)
    const MatchItem = ({ match, onClick }) => {
        const [liveMatch, setLiveMatch] = useState(match);

        useEffect(() => {
            if (!match.id) return;
            const unsubscribe = onSnapshot(doc(db, "users", match.id), (docSnap) => {
                if (docSnap.exists()) {
                    setLiveMatch({ id: docSnap.id, ...docSnap.data() });
                }
            });
            return () => unsubscribe();
        }, [match.id]);

        return (
            <div
                onClick={() => onClick(liveMatch)}
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
                    src={getHighResPhoto(liveMatch.avatar || liveMatch.photoURL) || `https://ui-avatars.com/api/?background=0a192f&color=ffd700&name=${encodeURIComponent(liveMatch.name || 'New Soul')}`}
                    alt={liveMatch.name}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,215,0,0.2)' }}
                />
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{liveMatch.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Click to chat</div>
                </div>
            </div>
        );
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !user?.uid || !selectedMatch?.id) return;

        const chatId = getChatId(user.uid, selectedMatch.id);
        const messageData = {
            text: inputText,
            senderId: user.uid,
            timestamp: serverTimestamp()
        };

        const currentInput = inputText;
        setInputText("");

        try {
            await addDoc(collection(db, "chats", chatId, "messages"), messageData);
        } catch (e) {
            console.error("Error sending message:", e);
            setInputText(currentInput);
            alert("Could not send message.");
        }
    };

    const playAudio = (url) => {
        const player = new Tone.Player(url).toDestination();
        player.autostart = true;
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleEditMessage = async (msgId, currentText) => {
        const newText = prompt("Edit your message:", currentText);
        if (newText === null || newText === currentText || !newText.trim()) return;

        const chatId = getChatId(user.uid, selectedMatch.id);
        try {
            const msgRef = doc(db, "chats", chatId, "messages", msgId);
            await updateDoc(msgRef, {
                text: newText,
                edited: true,
                editedAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Error editing message:", e);
        }
    };

    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm("Delete this message?")) return;

        const chatId = getChatId(user.uid, selectedMatch.id);
        try {
            const msgRef = doc(db, "chats", chatId, "messages", msgId);
            await updateDoc(msgRef, {
                deleted: true,
                text: "Message deleted",
                deletedAt: serverTimestamp()
            });
        } catch (e) {
            console.error("Error deleting message:", e);
        }
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
                            <MatchItem key={match.id} match={match} onClick={setSelectedMatch} />
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
                        src={getHighResPhoto(liveSelectedMatch?.avatar || liveSelectedMatch?.photoURL) || "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000"}
                        alt={liveSelectedMatch?.name || 'Soul'}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontWeight: 'bold' }}>{liveSelectedMatch?.name || 'Loading...'}</span>
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
                    <div key={msg.id || idx}
                        style={{
                            alignSelf: msg.senderId === user.uid ? 'flex-end' : 'flex-start',
                            backgroundColor: msg.senderId === user.uid ? 'var(--color-secondary)' : 'rgba(255,255,255,0.1)',
                            color: msg.senderId === user.uid ? 'var(--color-primary)' : 'white',
                            padding: '12px 18px', borderRadius: '18px', maxWidth: '75%',
                            borderBottomRightRadius: msg.senderId === user.uid ? '2px' : '18px',
                            borderBottomLeftRadius: msg.senderId === user.uid ? '18px' : '2px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                            position: 'relative',
                            transition: 'all 0.2s'
                        }}
                        onDoubleClick={() => msg.senderId === user.uid && !msg.deleted && handleEditMessage(msg.id, msg.text)}
                    >
                        {msg.deleted ? (
                            <p style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.9rem' }}>Message deleted</p>
                        ) : (
                            <>
                                {msg.text && <p style={{ margin: 0 }}>{msg.text}</p>}
                                {msg.audio && (
                                    <button onClick={() => playAudio(msg.audio)} style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: 'rgba(0,0,0,0.2)', border: 'none', padding: '8px 12px',
                                        borderRadius: '12px', color: 'inherit', cursor: 'pointer'
                                    }}>
                                        <Play size={16} fill="currentColor" /> Voice Note
                                    </button>
                                )}
                            </>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '4px',
                            fontSize: '0.7rem',
                            opacity: 0.7
                        }}>
                            {msg.edited && !msg.deleted && <span>(edited)</span>}
                            <span>{formatTimestamp(msg.timestamp)}</span>
                            {msg.senderId === user.uid && !msg.deleted && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', opacity: 0.5 }}
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
                {isUploading && (
                    <div style={{ alignSelf: 'flex-end', opacity: 0.6, fontSize: '0.8rem', fontStyle: 'italic' }}>
                        Sending soul note...
                    </div>
                )}
            </div>

            {/* Input area */}
            <div style={{
                padding: '0.3rem 0.6rem',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                background: 'rgba(10, 25, 47, 0.98)',
                backdropFilter: 'blur(15px)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: 'calc(var(--nav-height) + 0.3rem)',
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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
