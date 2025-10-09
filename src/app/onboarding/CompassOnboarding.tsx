'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/Lib/firebase';
import { CoreInterest, Interest } from '@/app/types/firestoreSchema';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Users,
  Calendar,
  Globe,
  Hash,
  User2,
  Users2,
  PartyPopper,
  Zap,
  RotateCcw,
  Heart,
  Compass,
  Palette,
  Navigation,
  Clipboard,
  UserCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'archetype',
    title: 'Your Social Style',
    description: 'How do you typically engage with others?',
    icon: <Users className="w-8 h-8" />
  },
  {
    id: 'interests',
    title: 'Your Passions',
    description: 'What lights you up? Select your core interests.',
    icon: <Heart className="w-8 h-8" />
  },
  {
    id: 'tempo',
    title: 'Social Preferences',
    description: 'How do you prefer to connect?',
    icon: <Calendar className="w-8 h-8" />
  },
  {
    id: 'languages',
    title: 'Languages',
    description: 'What languages do you speak?',
    icon: <Globe className="w-8 h-8" />
  }
];

export default function CompassOnboarding() {
  const { user, firebaseUser } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  
  // Form state
  const [archetype, setArchetype] = useState<string>('');
  const [selectedInterests, setSelectedInterests] = useState<CoreInterest[]>([]);
  const [socialTempo, setSocialTempo] = useState<string>('');
  const [connectionIntent, setConnectionIntent] = useState<string>('');
  const [languages, setLanguages] = useState<string[]>(['en']); // Default to English

  // Fetch available interests from Firestore
  useEffect(() => {
    const fetchInterests = async () => {
      try {
        console.log('Fetching interests...', { user: user?.uid, userAuth: !!user });
        
        // Wait a moment for auth state to stabilize
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const snapshot = await getDocs(collection(db, 'interests'));
        const interests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Interest));
        console.log('Fetched interests:', interests.length);
        setAvailableInterests(interests);
      } catch (error) {
        console.error('Error fetching interests:', error);
        console.error('Error details:', error.message);
        
        // If it's a permission error, try again after a delay
        if (error.code === 'permission-denied') {
          console.log('Permission denied, retrying in 1 second...');
          setTimeout(() => {
            if (user) {
              fetchInterests();
            }
          }, 1000);
        }
      }
    };

    if (user) {
      fetchInterests();
    }
  }, [user]);

  const handleInterestToggle = (interestId: string, interest: Interest) => {
    const existingIndex = selectedInterests.findIndex(i => i.tag === `#${interestId}`);
    
    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedInterests(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add with default casual passion
      setSelectedInterests(prev => [...prev, {
        tag: `#${interestId}`,
        passion: 'casual',
        type: interest.type
      }]);
    }
  };

  const handlePassionChange = (tag: string, passion: 'casual' | 'passionate' | 'pro') => {
    setSelectedInterests(prev => 
      prev.map(interest => 
        interest.tag === tag ? { ...interest, passion } : interest
      )
    );
  };

  const handleLanguageToggle = (lang: string) => {
    setLanguages(prev => 
      prev.includes(lang) 
        ? prev.filter(l => l !== lang)
        : [...prev, lang]
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return archetype !== '';
      case 1: return selectedInterests.length >= 3;
      case 2: return socialTempo !== '' && connectionIntent !== '';
      case 3: return languages.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user || !firebaseUser) return;

    setLoading(true);
    try {
      // Update user profile with DNA
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'dna.archetype': archetype,
        'dna.coreInterests': selectedInterests,
        'dna.socialTempo': socialTempo,
        'dna.connectionIntent': connectionIntent,
        'dna.languages': languages,
        updatedAt: new Date()
      });

      // Initialize preference vector
      const token = await firebaseUser.getIdToken();
      const response = await fetch('/api/compass/initialize-vector', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        // Navigate to Compass
        router.push('/compass');
      } else {
        throw new Error('Failed to initialize preference vector');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6">How do you typically engage in social settings?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setArchetype('creator')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  archetype === 'creator' 
                    ? 'border-white bg-accent-primary/10' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Palette className="w-10 h-10 mb-3 mx-auto text-content-primary" />
                <h3 className="font-bold text-lg mb-2 text-content-primary">Creator</h3>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  I love initiating projects and bringing ideas to life
                </p>
              </button>

              <button
                onClick={() => setArchetype('explorer')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  archetype === 'explorer' 
                    ? 'border-white bg-accent-primary/10' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Navigation className="w-10 h-10 mb-3 mx-auto text-content-primary" />
                <h3 className="font-bold text-lg mb-2 text-content-primary">Explorer</h3>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  I'm always seeking new experiences and adventures
                </p>
              </button>

              <button
                onClick={() => setArchetype('organizer')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  archetype === 'organizer' 
                    ? 'border-white bg-accent-primary/10' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <Clipboard className="w-10 h-10 mb-3 mx-auto text-content-primary" />
                <h3 className="font-bold text-lg mb-2 text-content-primary">Organizer</h3>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  I enjoy planning events and bringing people together
                </p>
              </button>

              <button
                onClick={() => setArchetype('participant')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  archetype === 'participant' 
                    ? 'border-white bg-accent-primary/10' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCheck className="w-10 h-10 mb-3 mx-auto text-content-primary" />
                <h3 className="font-bold text-lg mb-2 text-content-primary">Participant</h3>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  I love joining activities and supporting others' ideas
                </p>
              </button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-2">Select your interests</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose at least 3 interests and set your passion level for each
            </p>

            <div className="max-h-96 overflow-y-auto space-y-8">
              {Object.entries(
                availableInterests.reduce((acc, interest) => {
                  const category = interest.category;
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(interest);
                  return acc;
                }, {} as Record<string, Interest[]>)
              ).map(([category, interests]) => (
                <div key={category} className="relative">
                  <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pb-4">
                    {interests.map((interest) => {
                      const isSelected = selectedInterests.some(i => i.tag === `#${interest.id}`);
                      const currentInterest = selectedInterests.find(i => i.tag === `#${interest.id}`);
                      
                      return (
                        <div key={interest.id} className="relative">
                          <button
                            onClick={() => handleInterestToggle(interest.id!, interest)}
                            className={`w-full p-3 rounded-lg border transition-all ${
                              isSelected 
                                ? 'border-accent-primary bg-accent-primary/10' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {interest.displayName}
                              </span>
                              {interest.type === 'in-person' && (
                                <Users className="w-3 h-3 text-gray-500" />
                              )}
                            </div>
                          </button>
                          
                          {isSelected && currentInterest && (
                            <div className="mt-3 p-3 bg-background-secondary rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Passion Level</div>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 relative">
                                  <input
                                    type="range"
                                    min="1"
                                    max="3"
                                    step="1"
                                    value={currentInterest.passion === 'casual' ? 1 : currentInterest.passion === 'passionate' ? 2 : 3}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value);
                                      const passion = value === 1 ? 'casual' : value === 2 ? 'passionate' : 'pro';
                                      handlePassionChange(currentInterest.tag, passion);
                                    }}
                                    className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                                    style={{
                                      background: `linear-gradient(to right, 
                                        #ffffff 0%, 
                                        #ffffff ${currentInterest.passion === 'casual' ? '33.33%' : currentInterest.passion === 'passionate' ? '66.66%' : '100%'}, 
                                        #374151 ${currentInterest.passion === 'casual' ? '33.33%' : currentInterest.passion === 'passionate' ? '66.66%' : '100%'}, 
                                        #374151 100%)`
                                    }}
                                  />
                                  <div className="flex justify-between mt-1">
                                    <span className={`text-xs ${currentInterest.passion === 'casual' ? 'text-accent-primary font-medium' : 'text-gray-500'}`}>
                                      Casual
                                    </span>
                                    <span className={`text-xs ${currentInterest.passion === 'passionate' ? 'text-accent-primary font-medium' : 'text-gray-500'}`}>
                                      Passionate
                                    </span>
                                    <span className={`text-xs ${currentInterest.passion === 'pro' ? 'text-accent-primary font-medium' : 'text-gray-500'}`}>
                                      Pro
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
              Selected: {selectedInterests.length} interests
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">How do you prefer to socialize?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <button
                  onClick={() => setSocialTempo('one-on-one')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    socialTempo === 'one-on-one' 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <User2 className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="font-medium">One-on-One</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Deep conversations</div>
                </button>

                <button
                  onClick={() => setSocialTempo('small-group')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    socialTempo === 'small-group' 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Users2 className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="font-medium">Small Groups</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">3-5 people</div>
                </button>

                <button
                  onClick={() => setSocialTempo('large-group')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    socialTempo === 'large-group' 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <PartyPopper className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="font-medium">Large Groups</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Social gatherings</div>
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">How do you prefer to make plans?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setConnectionIntent('spontaneous')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    connectionIntent === 'spontaneous' 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Zap className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="font-medium">Spontaneous</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Let's go now!</div>
                </button>

                <button
                  onClick={() => setConnectionIntent('planned')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    connectionIntent === 'planned' 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="font-medium">Planned</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Schedule ahead</div>
                </button>

                <button
                  onClick={() => setConnectionIntent('both')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    connectionIntent === 'both' 
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <RotateCcw className="w-8 h-8 mx-auto mb-2 text-content-primary" />
                  <div className="font-medium">Both</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Flexible</div>
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-2">What languages do you speak?</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Select all languages you're comfortable conversing in
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { code: 'en', name: 'English', flag: '🇬🇧' },
                { code: 'es', name: 'Spanish', flag: '🇪🇸' },
                { code: 'fr', name: 'French', flag: '🇫🇷' },
                { code: 'de', name: 'German', flag: '🇩🇪' },
                { code: 'it', name: 'Italian', flag: '🇮🇹' },
                { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
                { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
                { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
                { code: 'ko', name: 'Korean', flag: '🇰🇷' },
                { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
                { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
                { code: 'ru', name: 'Russian', flag: '🇷🇺' }
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageToggle(lang.code)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    languages.includes(lang.code)
                      ? 'border-accent-primary bg-accent-primary/10' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative z-10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Compass className="w-16 h-16 text-content-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome to Connection Hub</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Let's personalize your discovery experience
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {ONBOARDING_STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${
                    index <= currentStep ? 'text-content-primary' : 'text-gray-400'
                  }`}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${index < currentStep 
                      ? 'bg-accent-primary text-white' 
                      : index === currentStep
                      ? 'bg-white text-gray-900'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {index < currentStep ? '✓' : index + 1}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
              <div className="relative flex items-center">
                <div 
                  className="h-1 bg-accent-primary rounded transition-all duration-300"
                  style={{ width: `${(currentStep / (ONBOARDING_STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="liquid-glass rounded-lg shadow-xl p-8 mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg liquid-glass text-content-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed() || loading}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg liquid-glass text-content-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span>
                {currentStep === ONBOARDING_STEPS.length - 1 
                  ? (loading ? 'Initializing...' : 'Complete') 
                  : 'Next'}
              </span>
              {!loading && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
