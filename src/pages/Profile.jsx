import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../App';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Camera, MapPin, Lock, Globe } from 'lucide-react';

const Profile = () => {
    const { user, setUser } = useContext(AppContext);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    // Trait State
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
            setBio(prev => prev || user.bio || "");
            setLocation(prev => prev || user.location || "");
            setPositiveTraits(prev => prev.length === 0 ? (user.positive || []) : prev);
            setNegativeTraits(prev => prev.length === 0 ? (user.traumas || []) : prev);
        }
    }, [user]);

    const handleAddTrait = () => {
        if (!newTrait.trim()) return;
        if (activeTab === 'positive') {
            setPositiveTraits([...positiveTraits, newTrait.trim()]);
        } else {
            setNegativeTraits([...negativeTraits, newTrait.trim()]);
        }
        setNewTrait("");
    };

    const removeTrait = (trait, type) => {
        if (type === 'positive') {
            setPositiveTraits(positiveTraits.filter(t => t !== trait));
        } else {
            setNegativeTraits(negativeTraits.filter(t => t !== trait));
        }
    };

    const handleSave = async () => {
        if (user) {
            setIsSaving(true);
            const profileUpdate = {
                name: user?.name || "New Soul",
                email: user?.email || "",
                avatar: user?.avatar || "",
                bio: bio || "",
                positive: positiveTraits || [],
                traumas: negativeTraits || [],
                location: location || ""
            };
            try {
                if (user?.uid) {
                    await setDoc(doc(db, "users", user.uid), profileUpdate, { merge: true });
                }
                setUser({ ...user, ...profileUpdate });
                alert("✨ Profile & Emotional Data synced with the sanctuary!");
            } catch (e) {
                console.error("Error saving profile:", e);
                alert(`The void rejected your changes: ${e.message}. Please check your connection.`);
            } finally {
                setIsSaving(false);
            }
        } else {
            alert("Error: No soul detected. Please log in.");
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

    return (
        <div className="page-container">
            <h2 style={{ color: 'var(--color-secondary)', textAlign: 'center', marginBottom: '2rem' }}>Edit Profile</h2>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '1rem' }}>
                    <img
                        src={user?.avatar || `https://ui-avatars.com/api/?background=0a192f&color=ffd700&name=${encodeURIComponent(user?.name || 'Soul')}`}
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
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-secondary)' }}>{user?.name || 'Soul'}</h3>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Bio</label>
                <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    style={{ resize: 'none' }}
                />
            </div>

            {/* Emotional Aspects Section */}
            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Emotional Aspects</label>

                <div style={{
                    display: 'flex',
                    padding: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '14px',
                    marginBottom: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'relative'
                }}>
                    <button
                        onClick={() => setActiveTab('positive')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            border: 'none',
                            color: activeTab === 'positive' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            background: activeTab === 'positive' ? 'var(--color-secondary)' : 'transparent',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            zIndex: 1
                        }}
                    >Positive</button>
                    <button
                        onClick={() => setActiveTab('negative')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '10px',
                            border: 'none',
                            color: activeTab === 'negative' ? 'white' : 'var(--color-text-muted)',
                            background: activeTab === 'negative' ? '#ff4444' : 'transparent',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            zIndex: 1
                        }}
                    >Traumas / Deep</button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        value={newTrait}
                        onChange={(e) => setNewTrait(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTrait()}
                        placeholder={`Add ${activeTab} trait...`}
                        style={{ margin: 0 }}
                    />
                    <button onClick={handleAddTrait} className="btn" style={{ padding: '0 20px', minWidth: '50px' }}>+</button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {(activeTab === 'positive' ? positiveTraits : negativeTraits).map((trait, idx) => (
                        <span key={idx} style={{
                            backgroundColor: activeTab === 'positive' ? 'rgba(255,215,0,0.15)' : 'rgba(255,68,68,0.15)',
                            color: activeTab === 'positive' ? 'var(--color-secondary)' : '#ff4444',
                            padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid currentColor'
                        }}>
                            {trait}
                            <button onClick={() => removeTrait(trait, activeTab)} className="icon-btn" style={{ padding: 0, color: 'inherit' }}>×</button>
                        </span>
                    ))}
                    {(activeTab === 'positive' ? positiveTraits : negativeTraits).length === 0 && (
                        <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.8rem', width: '100%', textAlign: 'center' }}>
                            No traits added yet. Add some to improve matching!
                        </span>
                    )}
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
