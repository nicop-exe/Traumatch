import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { ThumbsUp, ThumbsDown, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { MapPin } from 'lucide-react'; // Added MapPin

const Swipe = () => {
    const { matches, setMatches, user } = React.useContext(AppContext);
    const [potentialMatches, setPotentialMatches] = React.useState([]);
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(true);
    const navigate = useNavigate();

    // Helper to get high quality Google photos
    const getHighResPhoto = (url) => {
        if (!url) return null;
        if (url.includes('googleusercontent.com')) {
            return url.replace('=s96-c', '=s600-c');
        }
        return url;
    };

    // Fetch real users from Firestore in Real-time
    React.useEffect(() => {
        if (!user) return;
        setIsLoading(true);

        // Remove orderBy for maximum discovery (some users might lack createdAt field)
        const q = query(collection(db, "users"), limit(100));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log(`FEtching from void: Found ${querySnapshot.size} total souls.`);
            const matchedIds = matches.map(m => m.id || m.uid);
            const users = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const isCurrentUser = doc.id === user.uid;
                const alreadyMatched = matchedIds.includes(doc.id);

                if (!isCurrentUser && !alreadyMatched) {
                    users.push({ id: doc.id, uid: doc.id, ...data });
                }
            });

            console.log(`Filtered: ${users.length} souls remaining for discovery.`);

            // Shuffling only on first load to prevent jumping
            setPotentialMatches(prev => {
                if (prev.length > 0) return users;
                return users.sort(() => 0.5 - Math.random());
            });
            setIsLoading(false);
        }, (error) => {
            console.error("Critical Void Error:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]); // Removed matches.length to prevent jumping during swipe

    const currentUser = currentIndex < potentialMatches.length ? potentialMatches[currentIndex] : null;

    // Advanced Algorithm: Soul Bond Strength (Refined with Behavioral Engine)
    const calculateMatchScore = (me, target) => {
        if (!me || !target) return { score: 0, reasons: [] };

        let score = 25; // Base chemistry
        let reasons = [];

        // 1. Behavioral Compatibility (The Brain)
        const myProfile = me.behavioralProfile;
        const theirProfile = target.behavioralProfile;

        if (myProfile && theirProfile) {
            // Attachment Style Compatibility
            const myAttach = myProfile.calculated_indexes?.security_vincular_index || 50;
            const theirAttach = theirProfile.calculated_indexes?.security_vincular_index || 50;

            // Higher security index on both sides = healthier match
            const securityAvg = (myAttach + theirAttach) / 2;
            score += (securityAvg / 10) * 5; // Up to 50 points boost for dual security

            if (myProfile.archetype_name === theirProfile.archetype_name) {
                score += 15;
                reasons.push(`Same Archetype: ${myProfile.archetype_name}`);
            }

            // Regulation matching (Reactive + Regulator = Complementary)
            const myReact = myProfile.calculated_indexes?.reactivity_index || 50;
            const theirReg = theirProfile.calculated_indexes?.emotional_regulation_index || 50;
            if (myReact > 70 && theirReg > 70) {
                score += 15;
                reasons.push("Complementary Regulation");
            }
        }

        // 2. Intent-Based Psychological Engine
        const myIntent = me.intent || 'Mirror'; // Default to Mirror resonance
        const theirIntent = target.intent || 'Mirror';

        // MIRROR: Resonance via shared weight (Shared Traumas)
        const myTraumas = me.traumas || me.negativeTraits || [];
        const theirTraumas = target.traumas || target.negativeTraits || [];
        const sharedTraumas = myTraumas.filter(t => theirTraumas.includes(t));

        if (myIntent === 'Mirror' && theirIntent === 'Mirror') {
            if (sharedTraumas.length > 0) {
                score += sharedTraumas.length * 20;
                reasons.push(`${sharedTraumas[0]} Resonance`);
            }
        } else if (myIntent === 'Eclipse' && theirIntent === 'Eclipse') {
            // ECLIPSE: Seeking the opposite (Complementary Strengths)
            const myLight = me.positiveTraits || [];
            const theirShadow = target.negativeTraits || [];
            const complementary = myLight.filter(l => theirShadow.includes(l));
            if (complementary.length > 0) {
                score += complementary.length * 15;
                reasons.push("Karmic Balance");
            }
        } else {
            // Mixed or default resonance
            if (sharedTraumas.length > 0) {
                score += sharedTraumas.length * 10;
                reasons.push("Echo of the Past");
            }
        }

        // 3. Shared Interests (The "Frequency")
        const sharedInterests = (me.interests || []).filter(i => (target.interests || []).includes(i));
        score += sharedInterests.length * 5;
        if (sharedInterests.length > 2) reasons.push("Frequency Sync");

        // 4. Normalized result
        return {
            score: Math.min(Math.round(score), 99),
            reasons: [...new Set(reasons)]
        };
    };

    const handleSwipe = async (direction) => {
        if (!user) return;

        if (direction === 'right') {
            const { score, reasons } = calculateMatchScore(user, currentUser);
            const threshold = 1; // Lowered to 1% for maximum discovery during testing

            if (score > threshold) {
                const reason = reasons.length > 0 ? reasons[0] : "Mysterious Spark";
                if (!matches.find(m => m.id === currentUser.id)) {
                    const matchData = { ...currentUser, matchReason: reason, matchScore: score, timestamp: new Date() };

                    // Persist to Firestore for BOTH users (Mutual Match)
                    try {
                        const myMatchData = { ...currentUser, matchReason: reason, matchScore: score, timestamp: new Date() };
                        const theirMatchData = {
                            id: user.uid,
                            uid: user.uid,
                            name: user.name,
                            avatar: user.avatar,
                            matchReason: reason,
                            matchScore: score,
                            timestamp: new Date()
                        };

                        // Save for me
                        await setDoc(doc(db, "users", user.uid, "matches", currentUser.id), myMatchData);
                        // Save for them
                        await setDoc(doc(db, "users", currentUser.id, "matches", user.uid), theirMatchData);

                        setMatches([...matches, myMatchData]);
                    } catch (e) {
                        console.error("Error saving match:", e);
                        setMatches([...matches, { ...currentUser, matchReason: reason, matchScore: score }]);
                    }
                }
            } else {
                console.log(`Faded connection (${score}%). Moving on...`);
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
                <div className="animate-pulse" style={{ color: 'var(--color-secondary)' }}>Buscando almas en el vacío...</div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="page-container" style={{ textAlign: 'center', justifyContent: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <AlertCircle size={40} color="var(--color-text-muted)" />
                </div>
                <h2>El vacío está en silencio.</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Has resonado con todas las almas disponibles o estás solo en el santuario.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                    <button className="btn" style={{ maxWidth: '240px', width: '100%' }} onClick={() => setCurrentIndex(0)}>
                        Volver a Buscar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container animate-fade-in">
            <div className="p-page" style={{ textAlign: 'center' }}>
                <h2 className="text-gradient" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '4px' }}>Discover Souls</h2>
            </div>

            <div className="card animate-fade-in" style={{
                flex: 1,
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '400px'
            }}>
                <img
                    src={getHighResPhoto(currentUser.avatar || currentUser.photoURL) || `https://ui-avatars.com/api/?background=0a192f&color=ffd700&name=${encodeURIComponent(currentUser.name || 'New Soul')}`}
                    alt={currentUser.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 1 }}
                />

                {/* Gradient Overlay */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
                    background: 'linear-gradient(to top, var(--color-background) 0%, rgba(2,12,27,0.4) 40%, transparent 100%)',
                }}></div>

                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '2rem 1.5rem',
                    color: 'white'
                }}>
                    <h3 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800' }}>
                        {currentUser.name}{currentUser.age ? `, ${currentUser.age}` : ''}
                    </h3>
                    <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.4, marginBottom: '1rem', fontWeight: '400' }}>
                        {currentUser.bio ? `"${currentUser.bio}"` : "Seeking a meaningful connection..."}
                    </p>

                    {currentUser.location && (
                        <div style={{ fontSize: '0.9rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem', color: 'var(--color-accent)' }}>
                            <MapPin size={16} />
                            {currentUser.location}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', padding: '2rem 0' }}>
                <button
                    onClick={() => handleSwipe('left')}
                    className="icon-btn"
                    style={{
                        width: '72px', height: '72px',
                        backgroundColor: 'rgba(255, 68, 68, 0.15)',
                        border: '2px solid #ff4444',
                        color: '#ff4444',
                        boxShadow: 'none'
                    }}
                >
                    <ThumbsDown size={32} />
                </button>

                <button
                    onClick={() => handleSwipe('right')}
                    className="icon-btn"
                    style={{
                        width: '72px', height: '72px',
                        backgroundColor: 'rgba(0, 255, 200, 0.15)',
                        border: '2px solid var(--color-secondary)',
                        color: 'var(--color-secondary)',
                        boxShadow: 'none'
                    }}
                >
                    <ThumbsUp size={32} />
                </button>
            </div>
        </div>
    );
};

export default Swipe;
