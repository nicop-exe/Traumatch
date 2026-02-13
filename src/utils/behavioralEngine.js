/**
 * Behavioral Analysis Engine
 * Analyzes user questionnaire responses to generate a structured behavioral profile.
 */

export const ANALYSIS_DIMENSIONS = {
    energy_style: ["introvert_regulated", "introvert_avoidant", "extrovert_expansive", "extrovert_impulsive"],
    emotional_regulation_style: ["conscious_regulator", "reactive_intense", "emotional_avoidant", "affective_dependent"],
    attachment_style: ["secure", "anxious", "avoidant", "ambivalent"],
    conflict_style: ["direct_resolver", "escalator", "withdrawer", "people_pleaser"],
    life_orientation: ["stable_builder", "explorer", "creative_disruptor", "protector_pragmatic"]
};

export const generateBehavioralProfile = (answers) => {
    // Structure of answers expected: 
    // { [questionId]: { dimensions: { [dimName]: [traitName] }, weights: { [indexName]: value } } }

    const scores = {
        energy_style: {},
        emotional_regulation_style: {},
        attachment_style: {},
        conflict_style: {},
        life_orientation: {}
    };

    const indexes = {
        emotional_regulation_index: 50,
        reactivity_index: 50,
        security_vincular_index: 50,
        self_awareness_index: 50
    };

    const indexCounts = {
        emotional_regulation_index: 0,
        reactivity_index: 0,
        security_vincular_index: 0,
        self_awareness_index: 0
    };

    // Calculate Scores and Indexes
    Object.values(answers).forEach(answer => {
        if (!answer || typeof answer !== 'object') return;

        // Dimension Scores
        if (answer.dimensions) {
            Object.entries(answer.dimensions).forEach(([dim, trait]) => {
                if (scores[dim]) {
                    scores[dim][trait] = (scores[dim][trait] || 0) + 1;
                }
            });
        }

        // Weighted Indexes
        if (answer.weights) {
            Object.entries(answer.weights).forEach(([index, weight]) => {
                if (indexes.hasOwnProperty(index)) {
                    indexes[index] += weight;
                    indexCounts[index]++;
                }
            });
        }
    });

    // Normalize Indexes (Keep within 0-100)
    Object.keys(indexes).forEach(key => {
        // We start at 50 to have a neutral baseline
        indexes[key] = Math.max(0, Math.min(100, indexes[key]));
    });

    // Determine Dominant Traits for each Dimension
    const dominantTraits = {};
    Object.entries(scores).forEach(([dim, traitScores]) => {
        const sorted = Object.entries(traitScores).sort((a, b) => b[1] - a[1]);
        dominantTraits[dim] = sorted.length > 0 ? sorted[0][0] : ANALYSIS_DIMENSIONS[dim][0];
    });

    // Generate Archetype Name (Combine top two dimensions: attachment + life_orientation)
    const attachment = dominantTraits.attachment_style.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    const orientation = dominantTraits.life_orientation.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    const archetype_name = `${attachment} ${orientation}`;

    // Static mapping for strengths/risks based on dimensions (could be expanded)
    const profile = {
        archetype_name,
        dominant_traits: Object.values(dominantTraits),
        behavioral_strengths: [],
        risk_patterns: [],
        decision_biases: [],
        growth_recommendations: [],
        calculated_indexes: indexes
    };

    // Example logic for strengths/risks
    if (dominantTraits.attachment_style === 'secure') {
        profile.behavioral_strengths.push("High relational resilience", "Effective emotional communication");
    } else if (dominantTraits.attachment_style === 'anxious') {
        profile.risk_patterns.push("Tendency to prioritize others' needs over self");
        profile.decision_biases.push("Fear-based commitment");
    }

    if (indexes.self_awareness_index > 70) {
        profile.behavioral_strengths.push("High capacity for introspection");
    }

    return profile;
};
