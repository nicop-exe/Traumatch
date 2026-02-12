import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Heart, MessageCircle, User } from 'lucide-react';

const Layout = () => {
    const location = useLocation();

    const linkStyle = (path) => ({
        color: location.pathname === path ? 'var(--color-secondary)' : 'var(--color-text-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: '0.8rem',
        textDecoration: 'none',
        flex: 1
    });

    const navStyle = {
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 'inherit', // Follow app-shell's maxWidth automatically
        backgroundColor: 'var(--color-primary)',
        borderTop: '1px solid rgba(255, 215, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '1rem 0 calc(1rem + env(safe-area-inset-bottom)) 0',
        zIndex: 1000
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
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{
                flex: 1,
                overflowY: 'auto',
                paddingBottom: 'calc(80px + env(safe-area-inset-bottom))', // Space for fixed nav
                WebkitOverflowScrolling: 'touch'
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
