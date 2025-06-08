
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertTriangle, Info, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SymptomRule {
  id: string;
  symptom_name: string;
  keywords: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  advice: string;
  recommended_action: string;
  specialist_required?: string;
}

interface SymptomMatch {
  rule: SymptomRule;
  matchedKeywords: string[];
  score: number;
}

export const SymptomChecker: React.FC = () => {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState('');
  const [rules, setRules] = useState<SymptomRule[]>([]);
  const [matches, setMatches] = useState<SymptomMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSymptomRules();
  }, []);

  const fetchSymptomRules = async () => {
    try {
      const { data, error } = await supabase
        .from('symptom_rules')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching symptom rules:', error);
    }
  };

  const analyzeSymptoms = () => {
    if (!symptoms.trim()) {
      toast({
        title: "Please describe your symptoms",
        description: "Enter your symptoms to get health advice.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const symptomText = symptoms.toLowerCase();
    const newMatches: SymptomMatch[] = [];

    rules.forEach(rule => {
      const matchedKeywords = rule.keywords.filter(keyword => 
        symptomText.includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        const score = (matchedKeywords.length / rule.keywords.length) * 100;
        newMatches.push({
          rule,
          matchedKeywords,
          score
        });
      }
    });

    // Sort by score and severity
    newMatches.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityWeight[b.rule.severity] - severityWeight[a.rule.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.score - a.score;
    });

    setMatches(newMatches);
    setLoading(false);

    if (newMatches.length === 0) {
      toast({
        title: "No specific matches found",
        description: "Consider consulting a healthcare professional for personalized advice."
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical' || severity === 'high') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Info className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Symptom Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              This tool provides general health information only. For medical emergencies, call emergency services immediately. Always consult a healthcare professional for proper diagnosis and treatment.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Describe your symptoms
              </label>
              <Input
                placeholder="e.g., fever, headache, stomach pain..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full"
              />
            </div>

            <Button 
              onClick={analyzeSymptoms}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Analyzing...' : 'Check Symptoms'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {matches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Possible Conditions</h3>
          {matches.map((match, index) => (
            <Card key={match.rule.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-lg">{match.rule.symptom_name}</h4>
                  <Badge className={getSeverityColor(match.rule.severity)}>
                    {getSeverityIcon(match.rule.severity)}
                    <span className="ml-1">{match.rule.severity.toUpperCase()}</span>
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-sm mb-1">Matched symptoms:</h5>
                    <div className="flex flex-wrap gap-1">
                      {match.matchedKeywords.map(keyword => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-1">Health Advice:</h5>
                    <p className="text-gray-700">{match.rule.advice}</p>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm mb-1">Recommended Action:</h5>
                    <p className="text-gray-700">{match.rule.recommended_action}</p>
                  </div>

                  {match.rule.specialist_required && (
                    <div>
                      <h5 className="font-medium text-sm mb-1">Specialist Required:</h5>
                      <p className="text-gray-700">{match.rule.specialist_required}</p>
                    </div>
                  )}

                  {match.rule.severity === 'critical' && (
                    <Alert className="border-red-200 bg-red-50">
                      <Phone className="w-4 h-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        This appears to be a medical emergency. Please call emergency services immediately or visit the nearest hospital.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
