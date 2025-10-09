"use strict";
// functions/src/vectorUtils.ts
// Cloud Functions version of vector utilities
// This is a simplified version for use in Firebase Functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferenceVector = exports.normalize = exports.generateVectorFromDna = void 0;
const VECTOR_DIMENSION = 128;
// Map archetype to vector indices
const ARCHETYPE_INDICES = {
    'creator': 0,
    'explorer': 1,
    'organizer': 2,
    'participant': 3
};
// Map social tempo to vector indices
const TEMPO_INDICES = {
    'one-on-one': 4,
    'small-group': 5,
    'large-group': 6
};
// Map connection intent to vector indices
const INTENT_INDICES = {
    'spontaneous': 7,
    'planned': 8,
    'both': 9
};
function getIndexForTag(tag) {
    const RESERVED_INDICES = 10;
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = (hash << 5) - hash + tag.charCodeAt(i);
        hash |= 0;
    }
    return RESERVED_INDICES + (Math.abs(hash) % (VECTOR_DIMENSION - RESERVED_INDICES));
}
function generateVectorFromDna(dna) {
    const vector = new Array(VECTOR_DIMENSION).fill(0);
    // Encode archetype
    if (dna.archetype && ARCHETYPE_INDICES[dna.archetype] !== undefined) {
        vector[ARCHETYPE_INDICES[dna.archetype]] = 1.0;
    }
    // Encode social tempo
    if (dna.socialTempo && TEMPO_INDICES[dna.socialTempo] !== undefined) {
        vector[TEMPO_INDICES[dna.socialTempo]] = 0.8;
    }
    // Encode connection intent
    if (dna.connectionIntent) {
        if (dna.connectionIntent === 'both') {
            vector[INTENT_INDICES['spontaneous']] = 0.5;
            vector[INTENT_INDICES['planned']] = 0.5;
        }
        else if (INTENT_INDICES[dna.connectionIntent] !== undefined) {
            vector[INTENT_INDICES[dna.connectionIntent]] = 0.8;
        }
    }
    // Encode interests
    if (dna.coreInterests && Array.isArray(dna.coreInterests)) {
        dna.coreInterests.forEach((interest) => {
            const index = getIndexForTag(interest.tag);
            let value = 1.0;
            if (interest.passion === 'passionate')
                value = 1.5;
            if (interest.passion === 'pro')
                value = 2.0;
            if (interest.type === 'in-person')
                value *= 1.1;
            vector[index] = Math.max(vector[index], value);
        });
    }
    return normalize(vector);
}
exports.generateVectorFromDna = generateVectorFromDna;
function normalize(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0)
        return vector;
    return vector.map(v => v / magnitude);
}
exports.normalize = normalize;
function updatePreferenceVector(currentVector, targetVector, action, learningRate = 0.05) {
    if (currentVector.length !== targetVector.length) {
        throw new Error('Vectors must have the same dimension');
    }
    let newVector;
    if (action === 'connect') {
        // Move towards the target vector
        newVector = currentVector.map((val, i) => val * (1 - learningRate) + targetVector[i] * learningRate);
    }
    else {
        // Move away from the target vector
        newVector = currentVector.map((val, i) => val * (1 + learningRate) - targetVector[i] * learningRate);
    }
    return normalize(newVector);
}
exports.updatePreferenceVector = updatePreferenceVector;
//# sourceMappingURL=vectorUtils.js.map