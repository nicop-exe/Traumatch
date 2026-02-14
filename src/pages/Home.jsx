import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Music, TrendingUp, Radio } from 'lucide-react';

const Home = () => {
    const { user } = useContext(AppContext);

    // Curated Database of Real YouTube Content
    const VIDEO_DATABASE = {
        'Anxiety': [
            { title: "Heal Anxiety & Overthinking", channel: "The School of Life", id: "5zfnl2dJ1yI", type: "video" },
            { title: "10 Minute Mindfulness", channel: "Calm", id: "ZToicYcHIOU", type: "meditation" }
        ],
        'Depression': [
            { title: "The opposite of depression is connection", channel: "Johann Hari", id: "MB5IX-np5fE", type: "ted" },
            { title: "Kindness towards yourself", channel: "HealthyGamerGG", id: "L4N1q4EBfms", type: "video" }
        ],
        'Creative': [
            { title: "Your elusive creative genius", channel: "Elizabeth Gilbert", id: "86x-u-tz0MA", type: "ted" },
            { title: "Flow State Music", channel: "Lofi Girl", id: "jfKfPfyJRdk", type: "music" }
        ],
        'Spiritual': [
            { title: "The Power of Now", channel: "Eckhart Tolle", id: "T4M4uJ8n8e4", type: "video" },
            { title: "Awakening the Mind", channel: "Alan Watts", id: "7YgFl5rT5yw", type: "video" }
        ],
        'General': [
            { title: "Why We Are Lonely", channel: "Kurzgesagt", id: "n3Xv_g3g-mA", type: "video" },
            { title: "The Art of Letting Go", channel: "The Tao of Pooh", id: "5s2j9h9E0Kk", type: "video" },
            { title: "Emotional Intelligence", channel: "Daniel Goleman", id: "Y7m9eNoB3NU", type: "ted" }
        ]
    };

    const getPersonalizedRecs = () => {
        let recommendations = [...VIDEO_DATABASE['General']];
        const traits = [...(user?.positive || []), ...(user?.traumas || []), ...(user?.interests || [])];

        // Map traits to categories
        if (traits.some(t => ['Ansiedad', 'Anxiety', 'Inseguridad', 'Meditation'].includes(t))) {
            recommendations = [...VIDEO_DATABASE['Anxiety'], ...recommendations];
        }
        if (traits.some(t => ['Melancolía', 'Depression', 'Soledad', 'Loneliness'].includes(t))) {
            recommendations = [...VIDEO_DATABASE['Depression'], ...recommendations];
        }
        if (traits.some(t => ['Creativo', 'Creative', 'Art', 'Music'].includes(t))) {
            recommendations = [...VIDEO_DATABASE['Creative'], ...recommendations];
        }
        if (traits.some(t => ['Philosophy', 'Astrology', 'Nature', 'Místico'].includes(t))) {
            recommendations = [...VIDEO_DATABASE['Spiritual'], ...recommendations];
        }

        // Deduplicate by ID
        return Array.from(new Set(recommendations.map(a => a.id)))
            .map(id => recommendations.find(a => a.id === id))
            .slice(0, 6); // Top 6 results
    };

    const recs = getPersonalizedRecs();

    return (
        <div className="page-container p-page animate-fade-in">
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textAlign: 'center', fontWeight: '800' }}>
                Welcome Home, {user?.name?.split(' ')[0] || 'Soul'}
            </h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
                Tu refugio digital adaptado a tu frecuencia.
            </p>

            <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                    <TrendingUp size={20} color="var(--color-accent)" />
                    <h3 style={{ margin: 0, color: 'white', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '2px', fontWeight: '800' }}>Para tu camino</h3>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {recs.map((video, idx) => (
                        <a
                            key={idx}
                            href={`https://www.youtube.com/watch?v=${video.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="card animate-fade-in"
                            style={{
                                padding: 0,
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                textDecoration: 'none',
                                color: 'inherit',
                                margin: 0,
                                border: '1px solid var(--glass-border)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
                            }}
                        >
                            {/* Thumbnail */}
                            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
                                <img
                                    src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                                    alt={video.title}
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                    display: 'flex', alignItems: 'flex-end', padding: '1rem'
                                }}>
                                    <div style={{
                                        background: 'rgba(255,0,0,0.85)', color: 'white',
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold',
                                        display: 'flex', alignItems: 'center', gap: '5px'
                                    }}>
                                        <Music size={12} /> Play
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '1.2rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', lineHeight: 1.4, fontWeight: '700' }}>{video.title}</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', opacity: 0.9 }}>{video.channel}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', border: '1px solid var(--glass-border)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {video.type}
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
