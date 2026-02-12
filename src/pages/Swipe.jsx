import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { X, Heart, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_USERS = [
    {
        id: 2,
        name: "Elena",
        age: 23,
        bio: "Trying to find peace in chaos.",
        avatar: "https://via.placeholder.com/500/0a192f/ffd700?text=Elena",
        traumas: ["Anxiety", "Trust Issues"],
        positive: ["Empathetic", "Creative"]
    },
    {
        id: 3,
        name: "Marcus",
        age: 27,
        bio: "Music is my escape.",
        avatar: "https://via.placeholder.com/500/0a192f/ffd700?text=Marcus",
        traumas: ["Loneliness", "Burnout"],
        positive: ["Resilient", "Passionate"]
    },
    {
        id: 4,
        name: "Sophia",
        age: 25,
        bio: "Art heals everything.",
        avatar: "https://via.placeholder.com/500/0a192f/ffd700?text=Sophia",
        traumas: ["Perfectionism", "Sensitive"],
        positive: ["Kind", "Artistic"]
    }
];

const Swipe = () => {
    const { matches, setMatches, user } = useContext(AppContext);
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();

    // Reset if we run out of users
    const currentUser = currentIndex < MOCK_USERS.length ? MOCK_USERS[currentIndex] : null;

    // Algorithm to calculate bond strength
    const calculateMatchScore = (me, candidate) => {
        let score = 0;
        let reasons = [];

        // Safety check
        if (!me || !candidate) return { score: 0, reasons: [] };

        // Check for shared traumas (High Value)
        if (me?.traumas && candidate?.traumas) {
            const sharedTraumas = me.traumas.filter(t => candidate.traumas.includes(t));
            if (sharedTraumas.length > 0) {
                score += sharedTraumas.length * 25; // Increased weight
                reasons.push(...sharedTraumas);
            }
        }

        // Check for shared positive traits (Medium Value)
        if (me?.positive && candidate?.positive) {
            const sharedPositive = me.positive.filter(p => candidate.positive.includes(p));
            if (sharedPositive.length > 0) {
                score += sharedPositive.length * 15;
                reasons.push(...sharedPositive);
            }
        }

        // Random factor for "Spark" - ensure at least some possibility even without traits
        score += Math.random() * 30;

        return { score, reasons };
    };

    const handleSwipe = (direction) => {
        if (!user) {
            alert("Please log in to match.");
            return;
        }

        if (direction === 'right') {
            const { score, reasons } = calculateMatchScore(user, currentUser);

            // Lowered threshold to ensure better UX for testing
            const threshold = 20;

            if (score > threshold) {
                const reason = reasons.length > 0 ? reasons[0] : "Mysterious Connection";

                if (!matches.find(m => m.id === currentUser.id)) {
                    setMatches([...matches, { ...currentUser, matchReason: reason, matchScore: score }]);
                    alert(`It's a Match! Bond Strength: ${Math.round(score)}%`);
                }
            } else {
                // Optional: Feedback for non-match?
                console.log("Score too low:", score);
            }
        }

        // Move to next
        setCurrentIndex(prev => prev + 1);
    };

    if (!user) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
                <p>Please log in to start matching.</p>
                <button className="btn" onClick={() => navigate('/auth')}>Go to Login</button>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <AlertCircle size={40} color="var(--color-text-muted)" />
                </div>
                <h2 style={{ color: 'var(--color-secondary)' }}>You've seen everyone!</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Check back later for more souls.</p>
                <button className="btn btn-secondary" onClick={() => setCurrentIndex(0)}>Review Again</button>
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
                    src={currentUser.avatar}
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
                        {currentUser.name}, {currentUser.age}
                    </h3>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.4, marginBottom: '1rem' }}>"{currentUser.bio}"</p>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                            fontSize: '0.75rem', padding: '6px 12px',
                            backgroundColor: 'rgba(255, 215, 0, 0.15)',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            borderRadius: '20px',
                            color: 'var(--color-secondary)',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                        }}>
                            HIDDEN DEPTHS
                        </span>
                        <span style={{
                            fontSize: '0.75rem', padding: '6px 12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '20px',
                            color: 'white',
                            backdropFilter: 'blur(5px)'
                        }}>
                            {currentUser.positive[0]}
                        </span>
                    </div>
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
