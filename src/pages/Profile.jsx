import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Camera, MapPin, Lock, Globe } from 'lucide-react';

const Profile = () => {
    const { user, setUser } = useContext(AppContext);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // State
    const [name, setName] = useState(user?.name || "");
    const [bio, setBio] = useState(user?.bio || "");
    const [location, setLocation] = useState(user?.location || "");
    const [isLocationPrivate, setIsLocationPrivate] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [positiveTraits, setPositiveTraits] = useState(user?.positive || []);
    const [negativeTraits, setNegativeTraits] = useState(user?.traumas || []);
    const [newTrait, setNewTrait] = useState("");
    const [activeTab, setActiveTab] = useState('positive');

    // Sync local state if user context updates (e.g. initial fetch delay)
    React.useEffect(() => {
        if (user) {
            setName(prev => prev || user.name || "");
            setBio(prev => prev || user.bio || "");
            setLocation(prev => prev || user.location || "");
            setPositiveTraits(prev => prev.length === 0 ? (user.positive || []) : prev);
            setNegativeTraits(prev => prev.length === 0 ? (user.traumas || []) : prev);
        }
    }, [user]);

    const PREDEFINED_POSITIVE = ["Empático", "Resiliente", "Tranquilo", "Optimista", "Creativo", "Disciplinado", "Curioso", "Aventurero", "Sincero", "Leal", "Compasivo", "Valiente"];
    const PREDEFINED_TRAUMAS = ["Abandono", "Ansiedad", "Inseguridad", "Perfeccionismo", "Evitación", "Melancolía", "Soledad", "Trauma Familiar", "Miedo al rechazo", "Duelo", "Inestabilidad"];

    const toggleTrait = (trait, type) => {
        if (type === 'positive') {
            if (positiveTraits.includes(trait)) {
                setPositiveTraits(positiveTraits.filter(t => t !== trait));
            } else {
                setPositiveTraits([...positiveTraits, trait]);
            }
        } else {
            if (negativeTraits.includes(trait)) {
                setNegativeTraits(negativeTraits.filter(t => t !== trait));
            } else {
                setNegativeTraits([...negativeTraits, trait]);
            }
        }
    };

    const handleSave = async () => {
        if (user) {
            setIsSaving(true);
            const profileUpdate = {
                name: name || user?.name || "New Soul",
                email: user?.email || "",
                avatar: user?.avatar || "",
                bio: bio || "",
                positive: positiveTraits || [],
                traumas: negativeTraits || [],
                location: location || ""
            };
            try {
                const { db } = await import('../firebase');
                const { doc, setDoc } = await import('firebase/firestore');
                if (user?.uid) {
                    await setDoc(doc(db, "users", user.uid), profileUpdate, { merge: true });
                }
                setUser({ ...user, ...profileUpdate });
                alert("✨ Perfil sincronizado con el santuario!");
            } catch (e) {
                console.error("Error saving profile:", e);
                alert(`Error: ${e.message}`);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const resizeImage = (base64Str, maxWidth = 400, maxHeight = 400) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality
            };
        });
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const resized = await resizeImage(reader.result);
                setUser({ ...user, avatar: resized });
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchCitySuggestions = async (query) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&featuretype=city`);
            const data = await response.json();
            setSuggestions(data.map(item => ({
                display_name: item.display_name,
                city: item.address.city || item.address.town || item.address.village || item.display_name.split(',')[0]
            })));
        } catch (e) {
            console.error("Error fetching cities:", e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLocationChange = (val) => {
        setLocation(val);
        // Debounce simple
        const timeoutId = setTimeout(() => fetchCitySuggestions(val), 500);
        return () => clearTimeout(timeoutId);
    };

    if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Please log in.</div>;

    const needsAssessment = !user?.behavioralProfile?.archetype_name;

    return (
        <div className="page-container">
            <h2 style={{ color: 'var(--color-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Edit Profile</h2>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '1rem' }}>
                    <img
                        src={user?.avatar || `https://ui-avatars.com/api/?background=0a192f&color=ffd700&name=${encodeURIComponent(user?.name || 'New Soul')}`}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-secondary)' }}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        accept="image/*"
                    />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        style={{
                            position: 'absolute', bottom: '0', right: '0',
                            backgroundColor: 'var(--color-primary)', border: '1px solid var(--color-secondary)',
                            borderRadius: '50%', width: '36px', height: '36px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)'
                        }}
                    >
                        <Camera size={18} />
                    </button>
                </div>
            </div>
            {/* Arquetipo e Identidad */}
            <div className="card animate-fade-in" style={{ textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 'bold' }}>Identidad del Alma</label>
                <div style={{
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    color: needsAssessment ? 'var(--color-text-muted)' : 'var(--color-secondary)',
                    marginBottom: '1rem',
                    textShadow: needsAssessment ? 'none' : '0 0 15px rgba(255,215,0,0.3)',
                    opacity: needsAssessment ? 0.6 : 1
                }}>
                    {user?.behavioralProfile?.archetype_name || "Espíritu sin Clasificar"}
                </div>

                {needsAssessment ? (
                    <button
                        onClick={() => navigate('/assessment')}
                        className="btn btn-primary"
                        style={{ marginBottom: '1.5rem' }}
                    >
                        Completar Soul Assessment ⚛️
                    </button>
                ) : (
                    <button
                        onClick={() => navigate('/assessment')}
                        style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-accent)',
                            textDecoration: 'underline',
                            background: 'none',
                            border: 'none',
                            padding: '0 0 1.5rem 0',
                            cursor: 'pointer',
                            opacity: 0.8
                        }}
                    >
                        Repetir Assessment →
                    </button>
                )}

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre..."
                    style={{
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        fontWeight: '800',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--glass-border)',
                        color: 'white'
                    }}
                />
            </div>

            {/* Estadísticas Psicológicas */}
            {user?.behavioralProfile && (
                <div className="card" style={{ padding: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '1px' }}>Frecuencias del Ser</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {Object.entries(user.behavioralProfile.calculated_indexes).map(([key, val]) => (
                            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', fontWeight: '600' }}>
                                        {key.replace(/_index/g, '').replace(/_/g, ' ')}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-accent)' }}>{val}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${val}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, var(--color-accent), #4fd1c5)',
                                        borderRadius: '10px',
                                        boxShadow: '0 0 10px rgba(100, 255, 218, 0.3)'
                                    }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Biografía</label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    style={{ resize: 'none' }}
                />
            </div>

            {/* Aspectos Emocionales */}
            <div className="card">
                <label style={{ display: 'block', marginBottom: '1.2rem', color: 'var(--color-text-muted)', textAlign: 'center', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Aspectos Emocionales</label>

                <div style={{
                    display: 'flex',
                    padding: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '16px',
                    marginBottom: '1.5rem',
                    border: '1px solid var(--glass-border)',
                }}>
                    <button
                        onClick={() => setActiveTab('positive')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            color: activeTab === 'positive' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            background: activeTab === 'positive' ? 'var(--color-secondary)' : 'transparent',
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'var(--transition-smooth)'
                        }}
                    >Luz</button>
                    <button
                        onClick={() => setActiveTab('negative')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '12px',
                            border: 'none',
                            color: activeTab === 'negative' ? 'white' : 'var(--color-text-muted)',
                            background: activeTab === 'negative' ? 'hsl(0, 80%, 60%)' : 'transparent',
                            fontWeight: '800',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'var(--transition-smooth)'
                        }}
                    >Sombras</button>
                </div>

                <div className="chip-container">
                    {(activeTab === 'positive' ? PREDEFINED_POSITIVE : PREDEFINED_TRAUMAS).map((trait, idx) => {
                        const isSelected = (activeTab === 'positive' ? positiveTraits : negativeTraits).includes(trait);
                        return (
                            <button
                                key={idx}
                                onClick={() => toggleTrait(trait, activeTab)}
                                className={`chip ${isSelected ? 'active' : ''}`}
                                style={isSelected && activeTab === 'negative' ? { background: 'hsl(0, 80%, 60%)', color: 'white', borderColor: 'hsl(0, 80%, 60%)' } : {}}
                            >
                                {trait}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MapPin size={20} color="var(--color-secondary)" />
                        <div style={{ fontWeight: 'bold' }}>Location</div>
                    </div>
                    <button
                        onClick={() => setIsLocationPrivate(!isLocationPrivate)}
                        className="icon-btn"
                        style={{ color: isLocationPrivate ? 'var(--color-accent)' : 'var(--color-text-muted)', gap: '5px', borderRadius: '8px' }}
                    >
                        {isLocationPrivate ? <Lock size={16} /> : <Globe size={16} />}
                        <span style={{ fontSize: '0.8rem' }}>{isLocationPrivate ? 'Private' : 'Public'}</span>
                    </button>
                </div>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        placeholder="Search your city..."
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem', width: '100%' }}
                    />
                    {suggestions.length > 0 && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0,
                            backgroundColor: '#0a192f', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', zIndex: 100, marginTop: '5px',
                            maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}>
                            {suggestions.map((s, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => {
                                        setLocation(s.display_name);
                                        setSuggestions([]);
                                    }}
                                    style={{
                                        padding: '10px 15px', color: 'white', cursor: 'pointer',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        fontSize: '0.85rem'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {s.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                    {isSearching && <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-20%)', fontSize: '0.7rem', color: 'var(--color-accent)' }}>Searching...</div>}
                </div>
            </div>

            <button
                className={`btn ${isSaving ? 'animate-pulse' : ''}`}
                style={{ width: '100%', opacity: isSaving ? 0.7 : 1 }}
                onClick={handleSave}
                disabled={isSaving}
            >
                {isSaving ? 'Syncing with Sanctuary...' : 'Save Changes'}
            </button>
        </div>
    );
};

export default Profile;
