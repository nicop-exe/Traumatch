import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App';
import { Mic, Send, Play, ChevronLeft, Lock, Info, ShieldAlert, Trash2 } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, getDocs, query, orderBy, onSnapshot, addDoc, setDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Chat = () => {
    const { matches, setMatches, user } = useContext(AppContext);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [liveSelectedMatch, setLiveSelectedMatch] = useState(null);
    const [messages, setMessages] = useState([]); // { text, audio, sender }
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
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
        // 1. SECURE CONTEXT CHECK (CRITICAL)
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            alert("🚨 SEGURIDAD: El micrófono está BLOQUEADO por el navegador.\r\n\r\nMotivo: Tu conexión no es segura (falta HTTPS).\r\nSolución: En iPhone/Android, debes usar HTTPS o entrar vía 'localhost'.");
            return;
        }

        // 2. STOP RECORDING
        if (isRecording && mediaRecorder) {
            try {
                mediaRecorder.stop();
                setIsRecording(false);
            } catch (e) {
                console.error("Stop error:", e);
                setIsRecording(false);
                setMediaRecorder(null);
            }
            return;
        }

        // 3. START RECORDING
        try {
            if (!navigator.mediaDevices || !window.MediaRecorder) {
                throw new Error("Este navegador no soporta grabación nativa.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Platform MIME detection
            const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
            let mimeType = types.find(type => MediaRecorder.isTypeSupported(type)) || '';

            const recorder = new MediaRecorder(stream, { mimeType });
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: mimeType });

                // Cleanup
                stream.getTracks().forEach(track => track.stop());

                if (audioBlob.size < 100) return;

                setIsUploading(true);
                try {
                    const chatId = getChatId(user.uid, selectedMatch.id);
                    const extension = mimeType.includes('mp4') || mimeType.includes('aac') ? 'm4a' : 'webm';
                    const fileName = `audio_${Date.now()}.${extension}`;
                    const storageRef = ref(storage, `chats/${chatId}/${fileName}`);

                    const snapshot = await uploadBytes(storageRef, audioBlob);
                    const downloadURL = await getDownloadURL(snapshot.ref);

                    await addDoc(collection(db, "chats", chatId, "messages"), {
                        audio: downloadURL,
                        senderId: user.uid,
                        timestamp: serverTimestamp(),
                        mimeType: mimeType
                    });
                } catch (e) {
                    console.error("Upload error:", e);
                    alert("Error al enviar soul note.");
                } finally {
                    setIsUploading(false);
                    setMediaRecorder(null);
                }
            };

            // Start recording (timeslice ensures data flow)
            recorder.start(100);
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (e) {
            console.error("Mic Access Failed:", e);
            if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
                alert("🔒 PERMISO DENEGADO: El navegador ha bloqueado el micrófono.\r\n\r\nVe a los ajustes de tu navegador o pulsa el candado en la barra de direcciones para Permitir el Micrófono.");
            } else {
                alert(`Error: ${e.message}`);
            }
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
                className="card animate-fade-in"
                style={{
                    display: 'flex', alignItems: 'center', gap: '15px',
                    padding: '1rem', cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    margin: 0
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
            >
                <img
                    src={getHighResPhoto(liveMatch.avatar || liveMatch.photoURL) || `https://ui-avatars.com/api/?background=0a192f&color=ffd700&name=${encodeURIComponent(liveMatch.name || 'New Soul')}`}
                    alt={liveMatch.name}
                    style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-secondary)' }}
                />
                <div>
                    <div style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{liveMatch.name}</div>

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
        const audio = new Audio(url);
        audio.play().catch(e => {
            console.error("Playback error:", e);
            alert("Incompatible audio format.");
        });
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

    const handleDeleteMatch = async () => {
        if (!selectedMatch || !user) return;
        if (!window.confirm(`¿Estás seguro de que quieres eliminar la conexión con ${selectedMatch.name}? Esta acción no se puede deshacer.`)) return;

        try {
            // Delete match from user's subcollection
            await deleteDoc(doc(db, "users", user.uid, "matches", selectedMatch.id));

            // Update local state
            setMatches(prev => prev.filter(m => m.id !== selectedMatch.id));
            setSelectedMatch(null);
            setLiveSelectedMatch(null);
        } catch (e) {
            console.error("Error deleting match:", e);
            alert("Error al eliminar la conexión.");
        }
    };

    if (!selectedMatch) {
        return (
            <div className="page-container p-page">
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
                padding: '1rem', borderBottom: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(10, 25, 47, 0.8)',
                backdropFilter: 'blur(20px)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => setSelectedMatch(null)} className="icon-btn" style={{ borderRadius: '12px' }}><ChevronLeft color="white" /></button>
                    <img
                        src={getHighResPhoto(liveSelectedMatch?.avatar || liveSelectedMatch?.photoURL) || `https://ui-avatars.com/api/?background=0a192f&color=ffd700&name=${encodeURIComponent(liveSelectedMatch?.name || 'Soul')}`}
                        alt={liveSelectedMatch?.name || 'Soul'}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-secondary)' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.1rem', letterSpacing: '-0.02em' }}>{liveSelectedMatch?.name || 'Conectando...'}</span>
                        <div
                            onClick={() => setShowDiagnostics(!showDiagnostics)}
                            style={{ fontSize: '0.65rem', opacity: 0.6, cursor: 'pointer', color: 'var(--color-accent)' }}
                        >
                            {showDiagnostics ? 'Ocultar Estado' : 'Verificar Frecuencia'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleDeleteMatch}
                    className="icon-btn"
                    style={{
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 68, 68, 0.1)',
                        color: '#ff4444',
                        border: '1px solid rgba(255, 68, 68, 0.2)',
                        width: '36px', height: '36px'
                    }}
                    title="Eliminar Match"
                >
                    <Trash2 size={18} />
                </button>

                {showDiagnostics && (
                    <div className="card" style={{
                        position: 'absolute', top: '75px', left: '1rem', right: '1rem',
                        fontSize: '0.75rem', zIndex: 100, background: 'rgba(0,0,0,0.95)'
                    }}>
                        <div style={{ color: 'var(--color-secondary)', fontWeight: 'bold', marginBottom: '8px', fontSize: '0.8rem' }}>Audio Diagnostics:</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>Secure Context: {window.isSecureContext ? '✅' : '❌'}</div>
                            <div>Media Support: {navigator.mediaDevices ? '✅' : '❌'}</div>
                            <div>MediaRecorder: {window.MediaRecorder ? '✅' : '❌'}</div>
                            <div>WebM: {MediaRecorder?.isTypeSupported('audio/webm') ? '✅' : '❌'}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
                WebkitOverflowScrolling: 'touch',
                background: 'transparent'
            }}>
                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div key={msg.id || idx}
                            style={{
                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                background: isMe ? 'linear-gradient(135deg, var(--color-secondary) 0%, #e6c200 100%)' : 'var(--glass-bg)',
                                color: isMe ? 'var(--color-primary)' : 'white',
                                padding: '12px 18px',
                                borderRadius: '20px',
                                maxWidth: '85%',
                                borderBottomRightRadius: isMe ? '4px' : '20px',
                                borderBottomLeftRadius: isMe ? '20px' : '4px',
                                boxShadow: isMe ? '0 4px 15px rgba(255, 215, 0, 0.2)' : 'var(--glass-shadow)',
                                border: isMe ? 'none' : '1px solid var(--glass-border)',
                                position: 'relative',
                                transition: 'all 0.2s'
                            }}
                            onDoubleClick={() => isMe && !msg.deleted && handleEditMessage(msg.id, msg.text)}
                        >
                            {msg.deleted ? (
                                <p style={{ fontStyle: 'italic', opacity: 0.6, fontSize: '0.9rem', margin: 0 }}>Mensaje desvanecido</p>
                            ) : (
                                <>
                                    {msg.text && <p style={{ margin: 0, lineHeight: 1.4, fontWeight: isMe ? '600' : '400' }}>{msg.text}</p>}
                                    {msg.audio && (
                                        <button onClick={() => playAudio(msg.audio)} style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            background: isMe ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
                                            border: 'none', padding: '10px 16px',
                                            borderRadius: '100px', color: 'inherit', cursor: 'pointer',
                                            marginTop: msg.text ? '8px' : '0'
                                        }}>
                                            <Play size={18} fill="currentColor" />
                                            <span style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Soul Note</span>
                                        </button>
                                    )}
                                </>
                            )}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '6px',
                                fontSize: '0.65rem',
                                opacity: 0.6
                            }}>
                                {msg.edited && !msg.deleted && <span style={{ fontStyle: 'italic' }}>(editado)</span>}
                                <span>{formatTimestamp(msg.timestamp)}</span>
                                {isMe && !msg.deleted && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 4px', fontSize: '1rem', lineHeight: 1 }}
                                    >
                                        &times;
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
                {isUploading && (
                    <div style={{ alignSelf: 'flex-end', opacity: 0.6, fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-accent)' }} className="animate-pulse">
                        Elevando Soul Note...
                    </div>
                )}
            </div>

            {/* Input area */}
            <div style={{
                padding: '0 1rem',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                background: 'rgba(10, 25, 47, 0.95)',
                backdropFilter: 'blur(25px)',
                paddingBottom: 'calc(var(--nav-height) + var(--safe-bottom) + 15px)',
                paddingTop: '15px',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 100
            }}>
                <button
                    onClick={handleRecordToggle}
                    className="icon-btn"
                    style={{
                        width: '52px', height: '52px',
                        backgroundColor: isRecording ? '#ff4444' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        border: 'none',
                        boxShadow: isRecording ? '0 0 20px rgba(255, 68, 68, 0.4)' : 'none'
                    }}
                >
                    {!window.isSecureContext && window.location.hostname !== 'localhost' ?
                        <ShieldAlert size={22} color="#ff4444" /> :
                        <Mic size={22} className={isRecording ? 'animate-pulse' : ''} />
                    }
                </button>
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe un mensaje..."
                    style={{
                        flex: 1,
                        margin: 0,
                        padding: '0.9rem 1.5rem',
                        border: 'none',
                        background: 'rgba(255,255,255,0.05)'
                    }}
                />
                <button
                    onClick={handleSendMessage}
                    className="icon-btn"
                    style={{
                        width: '52px', height: '52px',
                        color: 'var(--color-primary)',
                        background: 'var(--color-secondary)',
                        boxShadow: 'none',
                        border: 'none'
                    }}
                >
                    <Send size={22} />
                </button>
            </div>
        </div>
    );
};

export default Chat;
