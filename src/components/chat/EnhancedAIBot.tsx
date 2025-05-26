
export class EnhancedAIBot {
  private static symptoms = {
    fever: {
      keywords: ['fever', 'temperature', 'hot', 'chills', 'burning up', 'feverish'],
      severity: 'moderate' as const
    },
    headache: {
      keywords: ['headache', 'head pain', 'migraine', 'head hurt', 'head ache'],
      severity: 'mild' as const
    },
    cough: {
      keywords: ['cough', 'coughing', 'hack', 'phlegm', 'dry cough', 'wet cough'],
      severity: 'mild' as const
    },
    sore_throat: {
      keywords: ['sore throat', 'throat pain', 'swallow hurt', 'throat ache', 'scratchy throat'],
      severity: 'mild' as const
    },
    nausea: {
      keywords: ['nausea', 'sick', 'vomit', 'throw up', 'queasy', 'nauseated'],
      severity: 'moderate' as const
    },
    fatigue: {
      keywords: ['tired', 'fatigue', 'exhausted', 'weak', 'no energy', 'weary'],
      severity: 'mild' as const
    },
    chest_pain: {
      keywords: ['chest pain', 'chest hurt', 'chest tight', 'heart pain', 'chest pressure'],
      severity: 'severe' as const
    },
    shortness_of_breath: {
      keywords: ['shortness of breath', 'hard to breathe', 'breathing difficult', 'cant breathe', 'breathless'],
      severity: 'severe' as const
    },
    stomach_pain: {
      keywords: ['stomach pain', 'belly hurt', 'abdominal pain', 'tummy ache', 'stomach ache'],
      severity: 'moderate' as const
    },
    dizziness: {
      keywords: ['dizzy', 'lightheaded', 'spinning', 'vertigo', 'unsteady'],
      severity: 'moderate' as const
    },
    rash: {
      keywords: ['rash', 'skin irritation', 'red spots', 'itchy skin', 'bumps'],
      severity: 'mild' as const
    },
    joint_pain: {
      keywords: ['joint pain', 'arthritis', 'stiff joints', 'aching joints'],
      severity: 'moderate' as const
    }
  };

  private static conditions = {
    common_cold: {
      symptoms: ['cough', 'sore_throat', 'fatigue', 'headache'],
      advice: 'This sounds like a common cold. Rest, stay hydrated, and consider over-the-counter medications. If symptoms persist beyond 7-10 days, consult a doctor.',
      urgency: 'low' as const,
      duration: '7-10 days'
    },
    flu: {
      symptoms: ['fever', 'headache', 'fatigue', 'cough', 'joint_pain'],
      advice: 'These symptoms suggest flu. Rest, drink plenty of fluids, and consider antiviral medication if seen within 48 hours. Seek medical attention if symptoms worsen.',
      urgency: 'medium' as const,
      duration: '1-2 weeks'
    },
    gastroenteritis: {
      symptoms: ['nausea', 'stomach_pain', 'fatigue', 'dizziness'],
      advice: 'This could be gastroenteritis (stomach flu). Stay hydrated with clear fluids, rest, and eat bland foods when able. Contact a doctor if symptoms are severe.',
      urgency: 'medium' as const,
      duration: '3-7 days'
    },
    heart_emergency: {
      symptoms: ['chest_pain', 'shortness_of_breath'],
      advice: '🚨 URGENT: These symptoms could indicate a heart condition. Seek immediate medical attention or call emergency services.',
      urgency: 'high' as const,
      duration: 'immediate attention needed'
    },
    respiratory_emergency: {
      symptoms: ['shortness_of_breath', 'chest_pain', 'fever'],
      advice: '🚨 These symptoms require immediate medical attention. Please visit an emergency room or urgent care center.',
      urgency: 'high' as const,
      duration: 'immediate attention needed'
    },
    allergic_reaction: {
      symptoms: ['rash', 'shortness_of_breath', 'nausea'],
      advice: 'This could be an allergic reaction. If breathing difficulties persist, seek immediate medical attention. For mild reactions, antihistamines may help.',
      urgency: 'medium' as const,
      duration: 'varies'
    },
    migraine: {
      symptoms: ['headache', 'nausea', 'dizziness'],
      advice: 'This appears to be a migraine. Rest in a dark, quiet room, stay hydrated, and consider over-the-counter pain relievers. If severe or frequent, consult a doctor.',
      urgency: 'low' as const,
      duration: '4-72 hours'
    }
  };

  static getDiagnosisResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    const detectedSymptoms: Array<{name: string, severity: 'mild' | 'moderate' | 'severe'}> = [];

    // Detect symptoms from user message
    Object.entries(this.symptoms).forEach(([symptom, config]) => {
      if (config.keywords.some(keyword => message.includes(keyword))) {
        detectedSymptoms.push({
          name: symptom,
          severity: config.severity
        });
      }
    });

    if (detectedSymptoms.length === 0) {
      return "I understand you're not feeling well. Could you describe your symptoms in more detail? For example, are you experiencing fever, pain, nausea, or any other specific symptoms?";
    }

    // Check for emergency symptoms
    const hasEmergencySymptoms = detectedSymptoms.some(s => s.severity === 'severe');
    if (hasEmergencySymptoms) {
      return "🚨 **EMERGENCY**: The symptoms you've described could indicate a serious medical condition. Please seek immediate medical attention by calling emergency services or visiting the nearest emergency room. Do not delay seeking professional medical care.";
    }

    // Find matching conditions
    const possibleConditions = Object.entries(this.conditions).filter(([_, condition]) => {
      const symptomNames = detectedSymptoms.map(s => s.name);
      const matchingSymptoms = condition.symptoms.filter(symptom => 
        symptomNames.includes(symptom)
      );
      return matchingSymptoms.length >= Math.min(2, condition.symptoms.length);
    });

    if (possibleConditions.length === 0) {
      const symptomList = detectedSymptoms.map(s => s.name.replace('_', ' ')).join(', ');
      return `I noticed you mentioned symptoms like ${symptomList}. While I can provide general information, I recommend consulting with a healthcare professional for proper diagnosis and treatment. Would you like to chat with one of our physicians?`;
    }

    // Sort by urgency and number of matching symptoms
    possibleConditions.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b[1].urgency] - urgencyOrder[a[1].urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // If same urgency, sort by number of matching symptoms
      const aMatches = a[1].symptoms.filter(s => detectedSymptoms.map(d => d.name).includes(s)).length;
      const bMatches = b[1].symptoms.filter(s => detectedSymptoms.map(d => d.name).includes(s)).length;
      return bMatches - aMatches;
    });

    const [conditionName, topCondition] = possibleConditions[0];
    const symptomList = detectedSymptoms.map(s => s.name.replace('_', ' ')).join(', ');
    
    let response = `**Possible Condition**: ${conditionName.replace('_', ' ').toUpperCase()}\n\n`;
    response += `**Symptoms Detected**: ${symptomList}\n\n`;
    response += `**Assessment**: ${topCondition.advice}\n\n`;
    response += `**Expected Duration**: ${topCondition.duration}\n\n`;

    // Add severity-based recommendations
    const maxSeverity = Math.max(...detectedSymptoms.map(s => 
      s.severity === 'severe' ? 3 : s.severity === 'moderate' ? 2 : 1
    ));

    if (maxSeverity >= 2) {
      response += "**Recommendation**: Monitor your symptoms closely. ";
    }

    if (topCondition.urgency === 'high') {
      response += "\n\n🚨 **URGENT**: This is not a substitute for professional medical advice. Please seek immediate medical attention.";
    } else if (topCondition.urgency === 'medium') {
      response += "\n\n⚠️ **IMPORTANT**: Consider scheduling an appointment with a healthcare provider if symptoms persist or worsen.";
    } else {
      response += "\n\n💡 **Note**: These are mild symptoms that often resolve on their own, but don't hesitate to seek medical care if you're concerned.";
    }

    response += "\n\n**Disclaimer**: This is general information only and cannot replace professional medical advice. Would you like to connect with one of our physicians for a consultation?";

    return response;
  }

  static getGreeting(): string {
    return "👋 Hello! I'm your AI Health Assistant. I can help provide general information about symptoms and when to seek medical care.\n\n**How to use me:**\n• Describe your symptoms in detail\n• Be specific about location, duration, and severity\n• Mention any relevant medical history\n\n**Important**: I provide general information only and cannot replace professional medical advice. For serious symptoms, always seek immediate medical attention.\n\nPlease describe how you're feeling or what symptoms you're experiencing.";
  }

  static getRandomHealthTip(): string {
    const tips = [
      "💧 Stay hydrated! Aim for 8 glasses of water daily.",
      "🏃‍♀️ Regular exercise can boost your immune system and mood.",
      "😴 Adults need 7-9 hours of quality sleep each night.",
      "🥗 Eating a variety of colorful fruits and vegetables provides essential nutrients.",
      "🧼 Wash your hands frequently to prevent the spread of illness.",
      "🧘‍♂️ Practice stress management through meditation or deep breathing.",
      "☀️ Get some sunlight for natural vitamin D production.",
      "🚭 Avoid smoking and limit alcohol consumption for better health."
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }
}
