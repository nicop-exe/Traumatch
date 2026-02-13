import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Swipe from './pages/Swipe';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Assessment from './pages/Assessment';
import Layout from './components/Layout';

import { auth, db } from './firebase';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, onSnapshot } from "firebase/firestore";

// Simple Context for App State
export const AppContext = React.createContext(null);

function App() {
    const [user, setUser] = useState(null);
    const [matches, setMatches] = useState([]);
    const [isAppLoading, setIsAppLoading] = useState(true);

    React.useEffect(() => {
        let matchesUnsubscribe = null;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // 1. Fetch or Create User Profile
                const userRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userRef);
                let data = userDoc.exists() ? userDoc.data() : null;

                if (!data) {
                    // Initialize profile if new user (e.g. Google Login)
                    data = {
                        name: firebaseUser.displayName || 'New Soul',
                        email: firebaseUser.email,
                        avatar: firebaseUser.photoURL || "",
                        createdAt: new Date().toISOString(),
                        traumas: [],
                        positive: [],
                        interests: [],
                        intent: ""
                    };
                    await setDoc(userRef, data);
                } else if (!data.createdAt) {
                    // Backfill createdAt if missing
                    await setDoc(userRef, { createdAt: new Date().toISOString() }, { merge: true });
                }

                setUser({
                    uid: firebaseUser.uid,
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    ...data
                });

                // 2. Real-time Matches Sync
                matchesUnsubscribe = onSnapshot(collection(db, "users", firebaseUser.uid, "matches"), (snapshot) => {
                    const fetchedMatches = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setMatches(fetchedMatches);
                });
            } else {
                setUser(null);
                setMatches([]);
                if (matchesUnsubscribe) matchesUnsubscribe();
            }
            setIsAppLoading(false);
        });

        return () => {
            unsubscribe();
            if (matchesUnsubscribe) matchesUnsubscribe();
        };
    }, []);

    if (isAppLoading) {
        return (
            <div className="app-shell" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="animate-pulse" style={{ color: 'var(--color-secondary)', fontSize: '1.2rem' }}>Loading Traumatch...</div>
            </div>
        );
    }

    return (
        <AppContext.Provider value={{ user, setUser, matches, setMatches }}>
            <Router>
                <div className="app-shell">
                    <Routes>
                        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
                        <Route path="/assessment" element={user ? <Assessment /> : <Navigate to="/auth" />} />

                        <Route path="/" element={user ? <Layout /> : <Navigate to="/auth" />}>
                            <Route index element={<Home />} />
                            <Route path="swipe" element={<Swipe />} />
                            <Route path="chat" element={<Chat />} />
                            <Route path="profile" element={<Profile />} />
                        </Route>
                    </Routes>
                </div>
            </Router>
        </AppContext.Provider>
    );
}

export default App;
