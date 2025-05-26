
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, AlertTriangle, Info, Heart } from 'lucide-react';

interface Symptom {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  category: string;
}

interface Diagnosis {
  condition: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  recommendations: string[];
  symptoms_matched: string[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  diagnosis?: Diagnosis;
}

export const EnhancedAIBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your AI health assistant. I can help analyze your symptoms and provide initial guidance. Please describe how you\'re feeling.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Enhanced symptom database with more comprehensive coverage
  const symptomDatabase = {
    respiratory: {
      'cough': { severity: 'mild', related: ['chest pain', 'shortness of breath', 'fever'] },
      'shortness of breath': { severity: 'moderate', related: ['chest pain', 'dizziness', 'fatigue'] },
      'chest pain': { severity: 'severe', related: ['shortness of breath', 'arm pain', 'sweating'] },
      'wheezing': { severity: 'moderate', related: ['cough', 'breathing difficulty'] },
      'sore throat': { severity: 'mild', related: ['fever', 'headache', 'swollen glands'] }
    },
    cardiovascular: {
      'chest pain': { severity: 'severe', related: ['arm pain', 'jaw pain', 'sweating', 'nausea'] },
      'palpitations': { severity: 'moderate', related: ['dizziness', 'shortness of breath'] },
      'arm pain': { severity: 'moderate', related: ['chest pain', 'jaw pain'] },
      'jaw pain': { severity: 'moderate', related: ['chest pain', 'arm pain'] }
    },
    neurological: {
      'headache': { severity: 'mild', related: ['nausea', 'sensitivity to light', 'neck stiffness'] },
      'dizziness': { severity: 'moderate', related: ['nausea', 'balance problems', 'headache'] },
      'confusion': { severity: 'severe', related: ['memory problems', 'disorientation'] },
      'numbness': { severity: 'moderate', related: ['tingling', 'weakness'] },
      'seizure': { severity: 'severe', related: ['confusion', 'loss of consciousness'] }
    },
    gastrointestinal: {
      'nausea': { severity: 'mild', related: ['vomiting', 'stomach pain', 'dizziness'] },
      'vomiting': { severity: 'moderate', related: ['nausea', 'dehydration', 'stomach pain'] },
      'stomach pain': { severity: 'moderate', related: ['nausea', 'vomiting', 'bloating'] },
      'diarrhea': { severity: 'mild', related: ['stomach pain', 'dehydration', 'fever'] },
      'constipation': { severity: 'mild', related: ['stomach pain', 'bloating'] }
    },
    general: {
      'fever': { severity: 'moderate', related: ['chills', 'sweating', 'headache', 'fatigue'] },
      'fatigue': { severity: 'mild', related: ['weakness', 'dizziness', 'sleep problems'] },
      'sweating': { severity: 'mild', related: ['fever', 'chest pain', 'anxiety'] },
      'chills': { severity: 'mild', related: ['fever', 'fatigue'] },
      'weight loss': { severity: 'moderate', related: ['fatigue', 'appetite loss'] }
    }
  };

  // Enhanced diagnosis rules with more conditions
  const diagnosisRules = [
    {
      condition: 'Possible Heart Attack',
      urgency: 'high' as const,
      requiredSymptoms: ['chest pain'],
      supportingSymptoms: ['arm pain', 'jaw pain', 'sweating', 'nausea', 'shortness of breath'],
      minSupporting: 2,
      recommendations: [
        'CALL 911 IMMEDIATELY',
        'Chew aspirin if not allergic',
        'Rest and stay calm',
        'Do not drive yourself to hospital'
      ]
    },
    {
      condition: 'Respiratory Infection',
      urgency: 'medium' as const,
      requiredSymptoms: ['cough'],
      supportingSymptoms: ['fever', 'sore throat', 'fatigue', 'headache'],
      minSupporting: 2,
      recommendations: [
        'Rest and stay hydrated',
        'Consider over-the-counter fever reducers',
        'Isolate if fever present',
        'See physician if symptoms worsen'
      ]
    },
    {
      condition: 'Migraine Headache',
      urgency: 'medium' as const,
      requiredSymptoms: ['headache'],
      supportingSymptoms: ['nausea', 'sensitivity to light', 'dizziness'],
      minSupporting: 1,
      recommendations: [
        'Rest in dark, quiet room',
        'Apply cold compress',
        'Stay hydrated',
        'Consider pain medication as directed'
      ]
    },
    {
      condition: 'Gastroenteritis',
      urgency: 'medium' as const,
      requiredSymptoms: ['nausea'],
      supportingSymptoms: ['vomiting', 'diarrhea', 'stomach pain', 'fever'],
      minSupporting: 2,
      recommendations: [
        'Stay hydrated with clear fluids',
        'BRAT diet (bananas, rice, applesauce, toast)',
        'Rest',
        'Seek care if severe dehydration occurs'
      ]
    },
    {
      condition: 'Anxiety/Panic Attack',
      urgency: 'low' as const,
      requiredSymptoms: ['palpitations'],
      supportingSymptoms: ['sweating', 'shortness of breath', 'dizziness', 'chest pain'],
      minSupporting: 2,
      recommendations: [
        'Practice deep breathing exercises',
        'Find a calm environment',
        'Use grounding techniques',
        'Consider speaking with a mental health professional'
      ]
    },
    {
      condition: 'Stroke Warning Signs',
      urgency: 'high' as const,
      requiredSymptoms: ['confusion'],
      supportingSymptoms: ['numbness', 'dizziness', 'headache'],
      minSupporting: 1,
      recommendations: [
        'CALL 911 IMMEDIATELY',
        'Note time symptoms started',
        'Do not give food or water',
        'Stay with patient until help arrives'
      ]
    }
  ];

  const extractSymptoms = (text: string): Symptom[] => {
    const symptoms: Symptom[] = [];
    const lowerText = text.toLowerCase();

    // Check all symptom categories
    Object.entries(symptomDatabase).forEach(([category, categorySymptoms]) => {
      Object.entries(categorySymptoms).forEach(([symptom, details]) => {
        if (lowerText.includes(symptom)) {
          symptoms.push({
            name: symptom,
            severity: details.severity,
            category
          });
        }
      });
    });

    return symptoms;
  };

  const analyzeDiagnosis = (symptoms: Symptom[]): Diagnosis | null => {
    const symptomNames = symptoms.map(s => s.name);
    let bestMatch: Diagnosis | null = null;
    let highestConfidence = 0;

    diagnosisRules.forEach(rule => {
      const hasRequired = rule.requiredSymptoms.every(req => 
        symptomNames.includes(req)
      );

      if (hasRequired) {
        const supportingCount = rule.supportingSymptoms.filter(sup => 
          symptomNames.includes(sup)
        ).length;

        if (supportingCount >= rule.minSupporting) {
          const confidence = Math.min(95, 
            40 + (supportingCount * 15) + (symptoms.length * 5)
          );

          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = {
              condition: rule.condition,
              confidence,
              urgency: rule.urgency,
              recommendations: rule.recommendations,
              symptoms_matched: [
                ...rule.requiredSymptoms.filter(s => symptomNames.includes(s)),
                ...rule.supportingSymptoms.filter(s => symptomNames.includes(s))
              ]
            };
          }
        }
      }
    });

    return bestMatch;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsAnalyzing(true);

    // Simulate analysis delay
    setTimeout(() => {
      const symptoms = extractSymptoms(input);
      const diagnosis = analyzeDiagnosis(symptoms);

      let botResponse = '';
      if (symptoms.length === 0) {
        botResponse = 'I understand you\'re not feeling well. Could you be more specific about your symptoms? For example, do you have pain, fever, nausea, or breathing difficulties?';
      } else {
        botResponse = `I've identified the following symptoms: ${symptoms.map(s => s.name).join(', ')}. `;
        
        if (diagnosis) {
          botResponse += `Based on this information, you might be experiencing ${diagnosis.condition}.`;
        } else {
          botResponse += 'I recommend speaking with a healthcare professional for a proper evaluation.';
        }
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        diagnosis
      };

      setMessages(prev => [...prev, botMessage]);
      setIsAnalyzing(false);
    }, 1500);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      default: return <Heart className="w-4 h-4" />;
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-purple-600" />
          <span>Enhanced AI Health Assistant</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                
                {message.diagnosis && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getUrgencyColor(message.diagnosis.urgency)}>
                        <div className="flex items-center space-x-1">
                          {getUrgencyIcon(message.diagnosis.urgency)}
                          <span className="capitalize">{message.diagnosis.urgency} Priority</span>
                        </div>
                      </Badge>
                      <span className="text-xs">Confidence: {message.diagnosis.confidence}%</span>
                    </div>
                    
                    <div className="text-xs">
                      <p className="font-medium mb-1">Recommendations:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {message.diagnosis.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-sm">Analyzing symptoms...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isAnalyzing}
            />
            <Button onClick={handleSendMessage} disabled={isAnalyzing || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
