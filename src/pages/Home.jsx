import React from 'react';
import { Music, TrendingUp, Radio } from 'lucide-react';

const Home = () => {
    const recommendations = [
        { type: 'music', title: 'Melancholy Lo-Fi', subtitle: 'To soothe your anxiety', icon: <Music /> },
        { type: 'news', title: 'Understanding Attachment Styles', subtitle: 'Psychology Today', icon: <TrendingUp /> },
        { type: 'podcast', title: 'The Trauma Cleanup', subtitle: 'Episode 4: Healing', icon: <Radio /> },
    ];

    return (
        <div style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ color: 'var(--color-secondary)', fontSize: '2rem', marginBottom: '2rem', textAlign: 'center' }}>Welcome Home</h1>

            <section style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Daily Mix</h3>
                <div style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '1rem',
                    paddingBottom: '1rem',
                    scrollSnapType: 'x mandatory' // Better scrolling experience
                }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{
                            minWidth: '140px',
                            height: '140px',
                            flex: '0 0 auto', // Prevent shrinking
                            scrollSnapAlign: 'start',
                            backgroundColor: 'rgba(255,215,0,0.1)',
                            borderRadius: '12px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                            padding: '10px',
                            border: '1px solid rgba(255,215,0,0.2)'
                        }}>
                            <span style={{ fontWeight: 'bold' }}>Mood Mix {i}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>For You</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // Responsive grid
                    gap: '1rem'
                }}>
                    {recommendations.map((item, idx) => (
                        <div key={idx} style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            padding: '1rem',
                            borderRadius: '12px',
                            display: 'flex', alignItems: 'center', gap: '15px'
                        }}>
                            <div style={{
                                width: '40px', height: '40px', minWidth: '40px', // Prevent shrinking
                                borderRadius: '50%', backgroundColor: 'rgba(255,215,0,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--color-secondary)'
                            }}>
                                {item.icon}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subtitle}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
