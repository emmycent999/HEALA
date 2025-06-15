
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, AlertTriangle, Info, Phone, Stethoscope } from 'lucide-react';
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
  is_active: boolean;
}

interface SymptomResult {
  rule: SymptomRule;
  matchedKeywords: string[];
  confidence: number;
}

export const SymptomChecker: React.FC = () => {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState('');
  const [results, setResults] = useState<SymptomResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [symptomRules, setSymptomRules] = useState<SymptomRule[]>([]);
  const [fetchingRules, setFetchingRules] = useState(true);

  useEffect(() => {
    fetchSymptomRules();
  }, []);

  const fetchSymptomRules = async () => {
    try {
      setFetchingRules(true);
      const { data, error } = await supabase
        .from('symptom_rules')
        .select('*')
        .eq('is_active', true)
        .order('symptom_name');

      if (error) {
        console.error('Error fetching symptom rules:', error);
        toast({
          title: "Error Loading Data",
          description: "Unable to load symptom database. Please try again later.",
          variant: "destructive"
        });
        return;
      }
      
      setSymptomRules(data || []);
    } catch (error) {
      console.error('Error fetching symptom rules:', error);
      toast({
        title: "Error Loading Data",
        description: "Unable to load symptom database. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setFetchingRules(false);
    }
  };

  const analyzeSymptoms = () => {
    if (!symptoms.trim()) {
      toast({
        title: "No Symptoms Entered",
        description: "Please describe your symptoms to get recommendations.",
        variant: "destructive"
      });
      return;
    }

    if (symptomRules.length === 0) {
      toast({
        title: "Database Not Available",
        description: "Symptom database is not available. Please try again later.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Enhanced keyword matching algorithm
    const symptomWords = symptoms.toLowerCase()
      .split(/[\s,;.!?-]+/)
      .filter(word => word.length > 2); // Filter out short words
    
    const matches: SymptomResult[] = [];

    symptomRules.forEach(rule => {
      const matchedKeywords = rule.keywords.filter(keyword =>
        symptomWords.some(word => 
          word.includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(word) ||
          // Check for partial matches
          word.length > 3 && keyword.toLowerCase().includes(word.substring(0, -1))
        )
      );

      if (matchedKeywords.length > 0) {
        // Calculate confidence based on keyword matches and symptom coverage
        const keywordScore = (matchedKeywords.length / rule.keywords.length) * 100;
        const coverageScore = (matchedKeywords.length / symptomWords.length) * 100;
        const confidence = Math.min((keywordScore + coverageScore) / 2, 100);
        
        matches.push({
          rule,
          matchedKeywords,
          confidence: Math.round(confidence)
        });
      }
    });

    // Sort by confidence and severity weight
    matches.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const aWeight = severityWeight[a.rule.severity] * a.confidence;
      const bWeight = severityWeight[b.rule.severity] * b.confidence;
      return bWeight - aWeight;
    });

    setResults(matches.slice(0, 5)); // Show top 5 matches
    setLoading(false);

    if (matches.length === 0) {
      toast({
        title: "No Matches Found",
        description: "Your symptoms don't match our database. Please consult a healthcare professional for proper evaluation.",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (fetchingRules) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span className="text-gray-600">Loading symptom database...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Nigerian Health Symptom Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              This symptom checker focuses on common illnesses in Nigeria and is for informational purposes only. 
              It should not replace professional medical advice. Always consult with a healthcare provider for proper diagnosis and treatment.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="symptoms">Describe your symptoms in detail</Label>
            <Textarea
              id="symptoms"
              placeholder="e.g., I have been experiencing fever, headache, and body aches for the past 2 days..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="min-h-[120px] resize-none"
              rows={5}
            />
            <p className="text-sm text-gray-500">
              Be as specific as possible. Include duration, intensity, and any other relevant details.
            </p>
          </div>

          <Button 
            onClick={analyzeSymptoms} 
            disabled={loading || !symptoms.trim() || fetchingRules}
            className="w-full"
            size="lg"
          >
            <Search className="w-4 h-4 mr-2" />
            {loading ? 'Analyzing Symptoms...' : 'Check Symptoms'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Possible Conditions</h3>
            <Badge variant="outline" className="text-xs">
              {results.length} match{results.length !== 1 ? 'es' : ''} found
            </Badge>
          </div>
          
          {results.map((result, index) => (
            <Card key={result.rule.id} className={`border-l-4 transition-all hover:shadow-md ${getSeverityColor(result.rule.severity)}`}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{result.rule.symptom_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Based on {result.matchedKeywords.length} matching symptom{result.matchedKeywords.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={getSeverityColor(result.rule.severity)}>
                        {getSeverityIcon(result.rule.severity)}
                        {result.rule.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {result.confidence}% match
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-1">Matched symptoms:</h5>
                      <div className="flex flex-wrap gap-1">
                        {result.matchedKeywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-1">General advice:</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">{result.rule.advice}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm text-gray-700 mb-1">Recommended action:</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">{result.rule.recommended_action}</p>
                    </div>

                    {result.rule.specialist_required && (
                      <div>
                        <h5 className="font-medium text-sm text-gray-700 mb-1">Specialist consultation:</h5>
                        <p className="text-sm text-gray-600">{result.rule.specialist_required}</p>
                      </div>
                    )}
                  </div>

                  {result.rule.severity === 'critical' && (
                    <Alert className="border-red-200 bg-red-50 mt-4">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        <strong>This appears to be a medical emergency.</strong> Please seek immediate medical attention 
                        or call emergency services right away.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Emergency Contact Information</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    If this is a medical emergency, don't wait - call for help immediately.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <p><strong>National Emergency:</strong> 199 or 112</p>
                      <p><strong>Lagos State Emergency:</strong> 199 or 767</p>
                    </div>
                    <div>
                      <p><strong>Abuja Emergency:</strong> 112</p>
                      <p><strong>Medical Emergency:</strong> Contact nearest hospital</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
