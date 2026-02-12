import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Heart, MessageCircle, User } from 'lucide-react';

const Layout = () => {
    const location = useLocation();

    const navStyle = {
        position: 'absolute', // Changed from fixed to absolute to stay within container
        bottom: 0,
        left: 0,
        width: '100%',
        backgroundColor: 'var(--color-primary)',
        borderTop: '1px solid rgba(255, 215, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '1rem 0 calc(1rem + env(safe-area-inset-bottom)) 0', // Safe area for iOS
        zIndex: 100
    };

    const linkStyle = (path) => ({
        color: location.pathname === path ? 'var(--color-secondary)' : 'var(--color-text-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '0.8rem',
        textDecoration: 'none',
        flex: 1
    });

    return (
        <div className="container" style={{ position: 'relative' }}>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingBottom: '100px', // Space for nav
                WebkitOverflowScrolling: 'touch' // Smooth scroll on iOS
            }}>
                <Outlet />
            </div>
            <nav style={navStyle}>
                <Link to="/" style={linkStyle('/')}>
                    <Home size={24} />
                    <span>Home</span>
                </Link>
                <Link to="/swipe" style={linkStyle('/swipe')}>
                    <Heart size={24} />
                    <span>Match</span>
                </Link>
                <Link to="/chat" style={linkStyle('/chat')}>
                    <MessageCircle size={24} />
                    <span>Chat</span>
                </Link>
                <Link to="/profile" style={linkStyle('/profile')}>
                    <User size={24} />
                    <span>Profile</span>
                </Link>
            </nav>
        </div>
    );
};

export default Layout;
