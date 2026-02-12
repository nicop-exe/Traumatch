import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

const Auth = () => {
    const { setUser } = useContext(AppContext);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (method) => {
        setIsLoading(true);
        // Simulate network request
        setTimeout(() => {
            setUser({
                name: "User",
                id: 1,
                avatar: "https://via.placeholder.com/150",
                bio: "New to this world...",
                positive: ["Hopeful", "Curious"],
                traumas: ["Anxiety"]
            });
            setIsLoading(false);
            navigate('/');
        }, 1500);
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            textAlign: 'center',
            height: '100%'
        }}>
            <h1 style={{ color: 'var(--color-secondary)', fontSize: '3rem', marginBottom: '1rem' }}>Traumatch</h1>
            <p style={{ marginBottom: '3rem', color: 'var(--color-text-muted)' }}>Connect through what matters deeply.</p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                    className="btn"
                    onClick={() => handleLogin('google')}
                    disabled={isLoading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: isLoading ? 0.7 : 1 }}
                >
                    <Mail size={20} />
                    {isLoading ? "Signing in..." : "Sign in with Google"}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={() => handleLogin('phone')}
                    disabled={isLoading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: isLoading ? 0.7 : 1 }}
                >
                    <Phone size={20} />
                    {isLoading ? "Signing in..." : "Sign in with Phone"}
                </button>
            </div>
        </div>
    );
};

export default Auth;
