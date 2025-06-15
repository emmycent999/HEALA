
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical } from 'lucide-react';

interface ChatHeaderSectionProps {
  onBack: () => void;
}

export const ChatHeaderSection: React.FC<ChatHeaderSectionProps> = ({ onBack }) => {
  return (
    <CardHeader className="border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-lg">Dr. Physician</CardTitle>
            <p className="text-sm text-gray-600">General Medicine</p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </CardHeader>
  );
};
