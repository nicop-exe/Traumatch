import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Music, TrendingUp, Radio } from 'lucide-react';

const Home = () => {
    const { user } = useContext(AppContext);

    // Curated Database of Real YouTube Content
    const VIDEO_DATABASE = {
        'Anxiety': [
            { title: "Why We're All So Anxious", channel: "The School of Life", id: "mW0gj3n4D1Q", type: "video" },
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
            { title: "The Power of Now (Summary)", channel: "Eckhart Tolle", id: "6j0zD65Y5S8", type: "video" },
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

    const PROFESSIONAL_DATABASE = [
        { name: "Dra. Elena Vital", type: "Psicóloga Clínica", specialty: "Trauma & Apego", price: "$50/h", img: "https://i.pravatar.cc/150?u=elena" },
        { name: "Marco Zen", type: "Coach Ontológico", specialty: "Propósito de Vida", price: "$35/h", img: "https://i.pravatar.cc/150?u=marco" },
        { name: "Sofia Luz", type: "Terapeuta Holística", specialty: "Sanación Energética", price: "$45/h", img: "https://i.pravatar.cc/150?u=sofia" }
    ];

    const COURSE_DATABASE = [
        { title: "Sanando al Niño Interior", author: "Lic. Ana K.", modules: "8 Módulos", price: "$29.99", color: "from-purple-500 to-pink-500" },
        { title: "Mindfulness para la Ansiedad", author: "Institute of Calm", modules: "12 Lecciones", price: "$19.99", color: "from-teal-400 to-blue-500" },
        { title: "Reescribe tu Historia", author: "Traumatch Academy", modules: "Workshop", price: "Gratis", color: "from-orange-400 to-red-500" }
    ];

    return (
        <div className="page-container p-page animate-fade-in" style={{ paddingBottom: 'calc(var(--nav-height) + 20px)' }}>
            <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', textAlign: 'center', fontWeight: '800' }}>
                Welcome Home, {user?.name?.split(' ')[0] || 'Soul'}
            </h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2.5rem' }}>
                Tu refugio digital adaptado a tu frecuencia.
            </p>

            {/* Video Recommendations */}
            <section style={{ marginBottom: '3rem' }}>
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
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
                                    }}
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

            {/* Professionals Section */}
            <section style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <h3 style={{ margin: 0, color: 'white', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '2px', fontWeight: '800' }}>Guías Profesionales</h3>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', cursor: 'pointer', opacity: 0.8 }}>Ver todo →</span>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '1rem'
                }}>
                    {PROFESSIONAL_DATABASE.map((pro, idx) => (
                        <div key={idx} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', margin: 0 }}>
                            <img src={pro.img} alt={pro.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-secondary)' }} />
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '700' }}>{pro.name}</h4>
                                <div style={{ color: 'var(--color-accent)', fontSize: '0.85rem', marginBottom: '4px' }}>{pro.type}</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{pro.specialty}</div>
                            </div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white', marginTop: 'auto' }}>{pro.price}</div>
                            <button style={{
                                width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                                background: 'rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: '600',
                                transition: 'background 0.2s'
                            }}
                                onMouseOver={(e) => e.target.style.background = 'var(--color-secondary)'}
                                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                            >
                                Contactar
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Courses Section */}
            <section>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                        </div>
                        <h3 style={{ margin: 0, color: 'white', textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '2px', fontWeight: '800' }}>Marketplace de Cursos</h3>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {COURSE_DATABASE.map((course, idx) => (
                        <div key={idx} className="card" style={{
                            padding: '0', display: 'flex', overflow: 'hidden', margin: 0,
                            minHeight: '100px'
                        }}>
                            <div style={{
                                width: '100px',
                                background: `linear-gradient(135deg, ${course.color.split(' ')[0] === 'from-purple-500' ? '#8b5cf6, #ec4899' : course.color.split(' ')[0] === 'from-teal-400' ? '#2dd4bf, #3b82f6' : '#fb923c, #ef4444'})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
                            <div style={{ padding: '1.2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', fontWeight: '700' }}>{course.title}</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    <span>{course.author}</span>
                                    <span>•</span>
                                    <span>{course.modules}</span>
                                </div>
                            </div>
                            <div style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--glass-border)' }}>
                                <span style={{ fontWeight: '800', color: 'var(--color-accent)' }}>{course.price}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;
