import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Music, TrendingUp, Radio } from 'lucide-react';

const Home = () => {
    const { user } = useContext(AppContext);

    const getPersonalizedRecs = () => {
        const hasTrauma = user?.traumas?.length > 0;
        const traits = [...(user?.positive || []), ...(user?.traumas || [])];

        const baseRecs = [
            {
                type: 'music',
                title: 'Melancholy Lo-Fi',
                subtitle: 'To soothe your anxiety',
                icon: <Music />,
                url: 'https://open.spotify.com/playlist/37i9dQZF1DX8Ueb9CidzhR'
            },
            {
                type: 'news',
                title: 'Understanding Attachment',
                subtitle: 'Psychology Today',
                icon: <TrendingUp />,
                url: 'https://www.psychologytoday.com'
            },
            {
                type: 'podcast',
                title: 'The Trauma Cleanup',
                subtitle: 'Episode 4: Healing',
                icon: <Radio />,
                url: 'https://open.spotify.com/show/2v8IqRTMhM5vL6z8v6m5kO'
            },
        ];

        if (traits.includes('Anxiety') || traits.includes('Melancholic')) {
            baseRecs.unshift({
                type: 'music',
                title: 'Deep Focus Ambient',
                subtitle: 'Calm for the mind',
                icon: <Music />,
                url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWspn04Zq1'
            });
        }

        if (traits.includes('Creative Soul') || traits.includes('Passionate')) {
            baseRecs.unshift({
                type: 'podcast',
                title: 'Creative Pep Talk',
                subtitle: 'Fuel your fire',
                icon: <Radio />,
                url: 'https://open.spotify.com/show/6pC9C7vN7Y5XqYpY9n5J2Y'
            });
        }

        return baseRecs;
    };

    const recommendations = getPersonalizedRecs();

    return (
        <div className="page-container">
            <h1 style={{ color: 'var(--color-secondary)', fontSize: '2.2rem', marginBottom: '2rem', textAlign: 'center', fontWeight: '800' }}>Welcome Home</h1>

            <section style={{ marginBottom: '3rem' }}>
                <h3 style={{ marginBottom: '1.2rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold' }}>Daily Mood Mix</h3>
                <div style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '1.2rem',
                    paddingBottom: '1rem',
                    scrollSnapType: 'x mandatory'
                }}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{
                            minWidth: '160px',
                            height: '160px',
                            flex: '0 0 auto',
                            scrollSnapAlign: 'start',
                            backgroundColor: 'rgba(100, 255, 218, 0.05)',
                            borderRadius: '16px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                            padding: '15px',
                            border: '1px solid rgba(100, 255, 218, 0.1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: '15px', left: '15px', color: 'var(--color-accent)' }}><Music size={20} /></div>
                            <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>Vibe {i}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h3 style={{ marginBottom: '1.2rem', color: 'var(--color-accent)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px', fontWeight: 'bold' }}>Curated For Your Soul</h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.2rem'
                }}>
                    {recommendations.map((item, idx) => (
                        <a
                            key={idx}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                padding: '1.2rem',
                                borderRadius: '16px',
                                display: 'flex', alignItems: 'center', gap: '15px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                transition: 'transform 0.2s, background 0.2s',
                                cursor: 'pointer',
                                textDecoration: 'none',
                                color: 'inherit'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                        >
                            <div style={{
                                width: '48px', height: '48px', minWidth: '48px',
                                borderRadius: '12px', backgroundColor: 'rgba(100,255,218,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--color-accent)'
                            }}>
                                {item.icon}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>{item.title}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subtitle}</div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
