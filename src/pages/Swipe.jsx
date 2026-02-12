import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { X, Heart, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { db } from '../firebase';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { MapPin } from 'lucide-react'; // Added MapPin

const Swipe = () => {
    const { matches, setMatches, user } = React.useContext(AppContext);
    const [potentialMatches, setPotentialMatches] = React.useState([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const navigate = useNavigate();

    // Fetch real users from Firestore
    React.useEffect(() => {
        const fetchUsers = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // In a real app, we'd filter out already swiped users here
                const q = query(collection(db, "users"), limit(20));
                const querySnapshot = await getDocs(q);
                const users = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const isCurrentUser =
                        doc.id === user.uid ||
                        (data.email && data.email === user.email) ||
                        (data.name && data.name === user.name);

                    if (!isCurrentUser) {
                        users.push({ id: doc.id, uid: doc.id, ...data });
                    }
                });
                setPotentialMatches(users);
            } catch (e) {
                console.error("Error fetching matches:", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [user]);

    const currentUser = currentIndex < potentialMatches.length ? potentialMatches[currentIndex] : null;

    // Advanced Algorithm: Soul Bond Strength
    const calculateMatchScore = (me, target) => {
        if (!me || !target) return { score: 0, reasons: [] };

        let score = 20; // Base score (chemistry)
        let reasons = [];

        // 1. Shared Traumas (The "Traumatch" core)
        const myTraumas = me.traumas || [];
        const theirTraumas = target.traumas || [];
        const sharedTraumas = myTraumas.filter(t => theirTraumas.includes(t));

        if (me.intent === 'match') {
            // Looking for someone similar
            score += sharedTraumas.length * 20;
            if (sharedTraumas.length > 0) reasons.push(`Shared: ${sharedTraumas[0]}`);
        } else if (me.intent === 'complement') {
            // Looking for balance
            const sharedPositive = (me.positive || []).filter(p => (target.positive || []).includes(p));
            score += sharedPositive.length * 15;
            if (sharedTraumas.length === 0) score += 10; // Bonus for not sharing same heavy baggage
            if (sharedPositive.length > 0) reasons.push(`Synchronized: ${sharedPositive[0]}`);
        }

        // 2. Shared Interests
        const sharedInterests = (me.interests || []).filter(i => (target.interests || []).includes(i));
        score += sharedInterests.length * 10;
        if (sharedInterests.length > 0) reasons.push(`In Tune: ${sharedInterests[0]}`);

        // 3. Normalized result (max approx 100)
        return {
            score: Math.min(Math.round(score), 99),
            reasons
        };
    };

    const handleSwipe = (direction) => {
        if (!user) return;

        if (direction === 'right') {
            const { score, reasons } = calculateMatchScore(user, currentUser);
            const threshold = 30;

            if (score > threshold) {
                const reason = reasons.length > 0 ? reasons[0] : "Mysterious Spark";
                if (!matches.find(m => m.id === currentUser.id)) {
                    setMatches([...matches, { ...currentUser, matchReason: reason, matchScore: score }]);
                    alert(`Soul Bond Found! Strength: ${score}% - ${reason}`);
                }
            } else {
                alert(`Faded connection (${score}%). Moving on...`);
            }
        }
        setCurrentIndex(prev => prev + 1);
    };

    if (!user) {
        return (
            <div className="page-container" style={{ textAlign: 'center', justifyContent: 'center' }}>
                <p>Log in to discover waiting souls.</p>
                <button className="btn" onClick={() => navigate('/auth')}>Go to Sanctuary</button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', justifyContent: 'center' }}>
                <div className="animate-pulse" style={{ color: 'var(--color-secondary)' }}>Searching the void for matches...</div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="page-container" style={{ textAlign: 'center', justifyContent: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <AlertCircle size={40} color="var(--color-text-muted)" />
                </div>
                <h2>The void is quiet.</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Check back as more souls enter the sanctuary.</p>
                <button className="btn btn-secondary" onClick={() => setCurrentIndex(0)}>Search Again</button>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ textAlign: 'center', color: 'var(--color-text)', marginBottom: '1rem', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Discover Souls</h2>

            <div style={{
                flex: 1,
                width: '100%',
                backgroundColor: 'var(--color-primary)',
                borderRadius: '20px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', flexDirection: 'column' // Ensure content stretches
            }}>
                <img
                    src={currentUser.avatar || currentUser.photoURL || "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1000"}
                    alt={currentUser.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                />

                {/* Gradient Overlay */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
                    background: 'linear-gradient(to top, rgba(2,12,27,1) 0%, rgba(2,12,27,0.6) 30%, transparent 100%)',
                }}></div>

                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '2rem 1.5rem',
                    color: 'white'
                }}>
                    <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                        {currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ''}
                    </h3>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.4, marginBottom: '1rem' }}>
                        {currentUser.bio ? `"${currentUser.bio}"` : "Seeking a meaningful connection..."}
                    </p>

                    {currentUser.location && (
                        <div style={{ fontSize: '0.85rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
                            <MapPin size={14} color="var(--color-accent)" />
                            {currentUser.location}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ height: '100px', display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', padding: '1rem 0' }}>
                <button
                    onClick={() => handleSwipe('left')}
                    className="icon-btn"
                    style={{
                        width: '70px', height: '70px',
                        backgroundColor: 'rgba(255, 68, 68, 0.1)',
                        border: '2px solid #ff4444',
                        color: '#ff4444',
                        boxShadow: '0 5px 20px rgba(255, 68, 68, 0.2)'
                    }}
                >
                    <X size={32} />
                </button>

                <button
                    onClick={() => handleSwipe('right')}
                    className="icon-btn"
                    style={{
                        width: '70px', height: '70px',
                        backgroundColor: 'rgba(100, 255, 218, 0.1)',
                        border: '2px solid var(--color-accent)',
                        color: 'var(--color-accent)',
                        boxShadow: '0 5px 20px rgba(100, 255, 218, 0.2)'
                    }}
                >
                    <Heart size={32} />
                </button>
            </div>
        </div>
    );
};

export default Swipe;
