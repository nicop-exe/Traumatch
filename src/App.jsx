import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Swipe from './pages/Swipe';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Layout from './components/Layout';

// Simple Context for App State
export const AppContext = React.createContext(null);

function App() {
    const [user, setUser] = useState(null); // Mock auth state
    const [matches, setMatches] = useState([]); // Store matched users

    return (
        <AppContext.Provider value={{ user, setUser, matches, setMatches }}>
            <Router>
                <div className="container">
                    <Routes>
                        <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />

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
