
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, Clock, UserCheck, Play } from 'lucide-react';

interface ConsultationActionsProps {
  sessionStatus: string;
  isPhysician: boolean;
  isPatient: boolean;
  consultationStarted: boolean;
  showJoinButton: boolean;
  isCallActive: boolean;
  autoJoinAttempted: boolean;
  onStartConsultation: () => void;
  onPatientJoin: () => void;
  onStartCall: () => void;
  onEnableManualJoin: () => void;
}

export const ConsultationActions: React.FC<ConsultationActionsProps> = ({
  sessionStatus,
  isPhysician,
  isPatient,
  consultationStarted,
  showJoinButton,
  isCallActive,
  onStartConsultation,
  onPatientJoin,
  onStartCall
}) => {
  console.log('🎬 [ConsultationActions] Rendering:', {
    sessionStatus,
    isPhysician,
    isPatient,
    consultationStarted,
    showJoinButton
  });

  // Session not started yet
  if (sessionStatus === 'scheduled') {
    if (isPhysician) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-blue-200 max-w-md">
            <Video className="w-20 h-20 mx-auto mb-6 text-blue-500" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start</h3>
            <p className="text-gray-600 mb-6">
              Click below to start the video consultation immediately.
            </p>
            <Button
              onClick={onStartConsultation}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              size="lg"
            >
              <UserCheck className="w-5 h-5 mr-2" />
              Start Video Consultation
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-gray-200 max-w-md">
            <Clock className="w-20 h-20 mx-auto mb-6 text-gray-400 animate-pulse" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Waiting for Doctor</h3>
            <p className="text-gray-600 mb-4">
              The doctor will start the video consultation shortly.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                📱 You'll be able to join when the doctor starts.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }

  // Session started - show different options for patient vs physician
  if (sessionStatus === 'in_progress' && !isCallActive) {
    if (isPatient) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-green-200 max-w-md">
            <Video className="w-20 h-20 mx-auto mb-6 text-green-500" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Doctor Started Consultation!
            </h3>
            <p className="text-gray-600 mb-6">
              The doctor is ready for you. Join the video call now.
            </p>
            <Button
              onClick={onPatientJoin}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg w-full"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Join Now
            </Button>
          </div>
        </div>
      );
    } else {
      // For physician when session is in progress but video not started
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-green-200 max-w-md">
            <Video className="w-20 h-20 mx-auto mb-6 text-green-500" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Start Video Call
            </h3>
            <p className="text-gray-600 mb-6">
              The consultation is ready. Start your video now.
            </p>
            <Button
              onClick={onStartCall}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg w-full"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Video Call
            </Button>
          </div>
        </div>
      );
    }
  }

  return null;
};
