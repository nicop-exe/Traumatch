import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ShieldCheck, ChevronRight, SkipForward } from 'lucide-react';

const Assessment = () => {
    const { user, setUser } = React.useContext(AppContext);
    const navigate = useNavigate();
    const [step, setStep] = React.useState(0);
    const [answers, setAnswers] = React.useState({});

    const questions = [
        {
            id: 'q1',
            text: "How do you usually process a difficult day?",
            options: [
                { label: "I isolate and reflect in silence", trait: "Deep Thinker", type: 'positive' },
                { label: "I seek comfort in music or art", trait: "Creative Soul", type: 'positive' },
                { label: "I feel overwhelmed and anxious", trait: "Anxiety", type: 'trauma' },
                { label: "I talk it out with someone I trust", trait: "Open Book", type: 'positive' }
            ]
        },
        {
            id: 'q2',
            text: "What is your biggest fear in a relationship?",
            options: [
                { label: "Being misunderstood", trait: "Sensitive", type: 'positive' },
                { label: "Being abandoned", trait: "Abandonment Issues", type: 'trauma' },
                { label: "Losing my independence", trait: "Independent", type: 'positive' },
                { label: "Not being 'enough'", trait: "Insecurity", type: 'trauma' }
            ]
        },
        {
            id: 'q3',
            text: "Which of these sounds most like your 'Safe Space'?",
            options: [
                { label: "A rainy window with a book", trait: "Melancholic", type: 'trauma' },
                { label: "A high-energy concert", trait: "Passionate", type: 'positive' },
                { label: "A quiet forest path", trait: "Peaceful", type: 'positive' },
                { label: "My bed, hiding from the world", trait: "Avoidant", type: 'trauma' }
            ]
        }
    ];

    const handleAnswer = (option) => {
        const newAnswers = { ...answers, [step]: option };
        setAnswers(newAnswers);

        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            finishAssessment(newAnswers);
        }
    };

    const finishAssessment = (finalAnswers) => {
        const selectedPositive = Object.values(finalAnswers)
            .filter(a => a.type === 'positive')
            .map(a => a.trait);

        const selectedTraumas = Object.values(finalAnswers)
            .filter(a => a.type === 'trauma')
            .map(a => a.trait);

        setUser({
            ...user,
            positive: [...new Set([...(user?.positive || []), ...selectedPositive])],
            traumas: [...new Set([...(user?.traumas || []), ...selectedTraumas])]
        });

        navigate('/');
    };

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%' }}>
            <div className="animate-fade-in" style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ color: 'var(--color-secondary)', fontSize: '1.2rem' }}>Soul Discovery</h2>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Step {step + 1} of {questions.length}</span>
                </div>

                <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', lineHeight: 1.3 }}>{questions[step].text}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {questions[step].options.map((option, idx) => (
                        <button
                            key={idx}
                            className="btn btn-secondary"
                            onClick={() => handleAnswer(option)}
                            style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '1.2rem', textTransform: 'none', letterSpacing: 'normal' }}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}
                    >
                        <SkipForward size={16} /> Skip for now
                    </button>
                </div>
            </div>

            {/* Legal Disclaimer */}
            <div style={{
                marginTop: '3rem',
                padding: '1.5rem',
                backgroundColor: 'rgba(100, 255, 218, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(100, 255, 218, 0.1)',
                display: 'flex',
                gap: '12px'
            }}>
                <ShieldCheck size={40} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--color-accent)' }}>Privacy Commitment:</strong> All information you provide is protected on our secure servers. This data will <strong style={{ color: 'white' }}>never</strong> be used for any purpose other than finding deep connections with others or personalizing your music and content feed based on your mood.
                </p>
            </div>
        </div>
    );
};

export default Assessment;
