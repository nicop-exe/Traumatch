import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Auth = () => {
    const { setUser } = React.useContext(AppContext);
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(false);

    // Form fields
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [name, setName] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [error, setError] = React.useState("");

    // Handle Redirect Result
    React.useEffect(() => {
        const handleRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    // New Google User needs to go to assessment
                    navigate('/assessment');
                }
            } catch (err) {
                console.error("Redirect Error:", err);
                setError(err.message);
            }
        };
        handleRedirect();
    }, [navigate]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                navigate('/');
            } else {
                const res = await createUserWithEmailAndPassword(auth, email, password);
                const userRef = doc(db, "users", res.user.uid);
                await setDoc(userRef, {
                    name,
                    phone,
                    email,
                    createdAt: new Date().toISOString(),
                    traumas: [],
                    positive: [],
                    interests: [],
                    intent: ""
                });
                navigate('/assessment');
            }
        } catch (err) {
            setError(err.message.replace("Firebase: ", ""));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        setIsLoading(true);
        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container p-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <div className="animate-fade-in card" style={{ padding: '2.5rem 2rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌌</div>
                    <h1 style={{ color: 'var(--color-secondary)', fontSize: '2.2rem', fontWeight: '800' }}>Traumatch</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {isLogin ? "Welcome back to the sanctuary." : "Join the sanctuary of deep bonds."}
                    </p>
                </div>

                {error && (
                    <div style={{ backgroundColor: 'rgba(255,68,68,0.1)', color: '#ff4444', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid rgba(255,68,68,0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {!isLogin && (
                        <>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </>
                    )}
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={isLoading} className="btn">
                        {isLoading ? "Connecting..." : (isLogin ? "Enter Sanctuary" : "Create Soul Profile")}
                    </button>
                </form>

                <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <button onClick={handleGoogleSignIn} className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
                    Continue with Google
                </button>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                    {isLogin ? "New here? Create an account" : "Already have an account? Login"}
                </button>
            </div>
        </div>
    );
};

export default Auth;
