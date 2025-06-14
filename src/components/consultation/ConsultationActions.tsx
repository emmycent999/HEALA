
import React from 'react';
import { Button } from '@/components/ui/button';
import { Video, Clock, UserCheck } from 'lucide-react';

interface ConsultationActionsProps {
  sessionStatus: string;
  isPhysician: boolean;
  isPatient: boolean;
  consultationStarted: boolean;
  showJoinButton: boolean;
  isCallActive: boolean;
  onStartConsultation: () => void;
  onPatientJoin: () => void;
  onStartCall: () => void;
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
  // Session not started yet
  if (sessionStatus === 'scheduled') {
    if (isPhysician) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-blue-200 max-w-md">
            <Video className="w-20 h-20 mx-auto mb-6 text-blue-500" />
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Ready to Start Video Consultation</h3>
            <p className="text-gray-600 mb-6">
              Click "Start Consultation" to begin the video session and notify the patient.
            </p>
            <Button
              onClick={onStartConsultation}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              size="lg"
            >
              <UserCheck className="w-5 h-5 mr-2" />
              Start Video Consultation
            </Button>
            <div className="mt-4 text-sm text-gray-500">
              Patient will be notified when you start
            </div>
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
              The video consultation has not started yet. You will be notified when the doctor begins the session.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                📱 Make sure notifications are enabled so you don't miss when the doctor starts the consultation.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-center text-sm text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full mr-2"></div>
              Waiting for doctor to start...
            </div>
          </div>
        </div>
      );
    }
  }

  // Session started - patient needs to join
  if (sessionStatus === 'in_progress' && isPatient && showJoinButton && !isCallActive) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-green-200 animate-pulse max-w-md">
          <Video className="w-20 h-20 mx-auto mb-6 text-green-500 animate-bounce" />
          <h3 className="text-2xl font-bold text-gray-800 mb-4">🚨 Video Consultation Started!</h3>
          <p className="text-gray-600 mb-6">
            The doctor has started the video consultation. Click below to join the video call now.
          </p>
          <Button
            onClick={onPatientJoin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg animate-pulse"
            size="lg"
          >
            <Video className="w-5 h-5 mr-2" />
            Join Video Call Now
          </Button>
          <div className="mt-4 text-sm text-green-600 font-medium">
            Doctor is waiting for you!
          </div>
        </div>
      </div>
    );
  }

  // Session started - physician waiting for patient or call active
  if (sessionStatus === 'in_progress' && !isCallActive) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg border-2 border-purple-200 max-w-md">
          <Video className="w-20 h-20 mx-auto mb-6 text-purple-500" />
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {isPhysician ? 'Waiting for patient to join video call...' : 'Preparing video call...'}
          </h3>
          {isPhysician && (
            <>
              <p className="text-gray-600 mb-6">
                The patient will join automatically. You can also start the video call manually if needed.
              </p>
              <Button
                onClick={onStartCall}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                <Video className="w-4 h-4 mr-2" />
                Start Video Call
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};
