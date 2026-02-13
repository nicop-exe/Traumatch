import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { ShieldCheck, ChevronRight, SkipForward } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { generateBehavioralProfile } from '../utils/behavioralEngine';

const Assessment = () => {
    const { user, setUser } = React.useContext(AppContext);
    const navigate = useNavigate();
    const [step, setStep] = React.useState(0);
    const [answers, setAnswers] = React.useState({});

    const INTERESTS = ["Music", "Poetry", "Gaming", "Meditation", "Fitness", "Coding", "Art", "Philosophy", "Psychology", "Travel", "Astrology", "Nature", "Cooking", "Photography"];

    const QUESTION_POOL = [
        {
            id: 'q1',
            text: "How do you usually process a difficult day?",
            options: [
                {
                    label: "I isolate and reflect in silence",
                    trait: "Reflection",
                    dimensions: { energy_style: 'introvert_regulated', emotional_regulation_style: 'conscious_regulator' },
                    weights: { self_awareness_index: 15, emotional_regulation_index: 10 }
                },
                {
                    label: "I seek comfort in music or art",
                    trait: "Creative",
                    dimensions: { energy_style: 'introvert_regulated', life_orientation: 'creative_disruptor' },
                    weights: { self_awareness_index: 10 }
                },
                {
                    label: "I feel overwhelmed and anxious",
                    trait: "Sensitive",
                    dimensions: { emotional_regulation_style: 'reactive_intense', attachment_style: 'anxious' },
                    weights: { reactivity_index: 20, security_vincular_index: -10 }
                },
                {
                    label: "I talk it out with someone I trust",
                    trait: "Communicative",
                    dimensions: { energy_style: 'extrovert_expansive', attachment_style: 'secure' },
                    weights: { security_vincular_index: 15, self_awareness_index: 5 }
                }
            ]
        },
        {
            id: 'q2',
            text: "What is your biggest fear in a relationship?",
            options: [
                {
                    label: "Being misunderstood",
                    trait: "Depth",
                    dimensions: { attachment_style: 'anxious', conflict_style: 'people_pleaser' },
                    weights: { self_awareness_index: 10, security_vincular_index: -5 }
                },
                {
                    label: "Being abandoned",
                    trait: "Loyal",
                    dimensions: { attachment_style: 'anxious', emotional_regulation_style: 'affective_dependent' },
                    weights: { security_vincular_index: -15, reactivity_index: 15 }
                },
                {
                    label: "Losing my independence",
                    trait: "Free",
                    dimensions: { attachment_style: 'avoidant', energy_style: 'extrovert_impulsive' },
                    weights: { security_vincular_index: -10, self_awareness_index: 5 }
                },
                {
                    label: "Not being 'enough'",
                    trait: "Humble",
                    dimensions: { attachment_style: 'anxious', conflict_style: 'people_pleaser' },
                    weights: { self_awareness_index: 15, security_vincular_index: -10 }
                }
            ]
        },
        {
            id: 'q3',
            text: "How do you handle conflict with others?",
            options: [
                {
                    label: "I shut down and avoid it",
                    trait: "Quiet",
                    dimensions: { conflict_style: 'withdrawer', attachment_style: 'avoidant' },
                    weights: { emotional_regulation_index: -10, security_vincular_index: -10 }
                },
                {
                    label: "I face it head-on with honesty",
                    trait: "Direct",
                    dimensions: { conflict_style: 'direct_resolver', emotional_regulation_style: 'conscious_regulator' },
                    weights: { self_awareness_index: 20, emotional_regulation_index: 20 }
                },
                {
                    label: "I try to keep the peace at any cost",
                    trait: "Harmonizer",
                    dimensions: { conflict_style: 'people_pleaser', emotional_regulation_style: 'affective_dependent' },
                    weights: { security_vincular_index: 5, reactivity_index: -5 }
                },
                {
                    label: "I feel an intense urge to win",
                    trait: "Intense",
                    dimensions: { conflict_style: 'escalator', energy_style: 'extrovert_impulsive' },
                    weights: { reactivity_index: 25, emotional_regulation_index: -15 }
                }
            ]
        },
        {
            id: 'q4',
            text: "When facing a new project or adventure...",
            options: [
                {
                    label: "I need a clear plan and stability",
                    trait: "Planner",
                    dimensions: { life_orientation: 'stable_builder', energy_style: 'introvert_regulated' },
                    weights: { emotional_regulation_index: 10 }
                },
                {
                    label: "I dive in and figure it out as I go",
                    trait: "Adventurous",
                    dimensions: { life_orientation: 'explorer', energy_style: 'extrovert_impulsive' },
                    weights: { reactivity_index: 10 }
                },
                {
                    label: "I look for a creative or unique angle",
                    trait: "Visionary",
                    dimensions: { life_orientation: 'creative_disruptor', self_awareness_index: 15 },
                    weights: { self_awareness_index: 15 }
                },
                {
                    label: "I prioritize safety and practicality",
                    trait: "Pragmatic",
                    dimensions: { life_orientation: 'protector_pragmatic', conflict_style: 'direct_resolver' },
                    weights: { emotional_regulation_index: 5, security_vincular_index: 5 }
                }
            ]
        }
    ];

    // Core Onboarding + Randomized Subset
    const questions = React.useMemo(() => {
        const mandatory = [
            { id: 'intent', type: 'intent', text: "What kind of soul-connection are you seeking today?" },
            { id: 'interests', type: 'multiselect', text: "Which frequencies do you tune into? (Pick your interests)", options: INTERESTS }
        ];
        const shuffledPool = [...QUESTION_POOL].sort(() => 0.5 - Math.random());
        return [...mandatory, ...shuffledPool.slice(0, 4)]; // 2 fixed + 4 random
    }, []);

    const currentQuestion = questions[step];

    const handleAnswer = (value) => {
        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            finishAssessment(newAnswers);
        }
    };

    const finishAssessment = async (finalAnswers) => {
        // Generate Behavioral Profile
        const behavioralProfile = generateBehavioralProfile(finalAnswers);

        // Collect simple traits for legacy compatibility
        const selectedPositive = Object.values(finalAnswers)
            .filter(a => a && a.trait && !a.dimensions) // Legacy or generic
            .map(a => a.trait);

        // Map dimensions from the new questions to positive/trauma tags for UI
        const dimensionTraits = Object.values(finalAnswers)
            .filter(a => a && a.trait && a.dimensions)
            .map(a => a.trait);

        const profileUpdate = {
            name: user?.name || "New Soul",
            email: user?.email || "",
            avatar: user?.avatar || "",
            positive: [...new Set([...(user?.positive || []), ...selectedPositive, ...dimensionTraits])],
            behavioralProfile,
            intent: finalAnswers?.intent || "",
            interests: finalAnswers?.interests || [],
            assessmentCompleted: true,
            updatedAt: serverTimestamp()
        };

        try {
            const { db } = await import('../firebase');
            const { doc, setDoc } = await import('firebase/firestore');

            if (user?.uid) {
                await setDoc(doc(db, "users", user.uid), profileUpdate, { merge: true });
            }
            setUser({ ...user, ...profileUpdate });
            navigate('/');
        } catch (e) {
            console.error("Error updating profile:", e);
            navigate('/');
        }
    };

    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100%' }}>
            <div className="animate-fade-in" style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ color: 'var(--color-secondary)', fontSize: '1.2rem' }}>Soul Discovery</h2>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Step {step + 1} of {questions.length}</span>
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-secondary)' }}>{user?.name || 'New Soul'}</h3>
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
