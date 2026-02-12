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

    return (
        <div className="app-shell">
            <div className="page-container">
                <Outlet />
            </div>
            <nav className="main-nav">
                <div className="nav-content">
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
                </div>
            </nav>
        </div>
    );
};

export default Layout;
