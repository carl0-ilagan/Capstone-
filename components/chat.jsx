import { Phone, Video } from 'lucide-react';
import { useCall } from '@/contexts/call-context';

export default function Chat({ conversation, messages, onSendMessage }) {
  const { initiateCall } = useCall();
  const router = useRouter();

  const handleStartCall = async (type) => {
    try {
      const callId = await initiateCall(conversation.doctorId, type);
      router.push(`/dashboard/calls/${type}/${callId}`);
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gray-200">
            {conversation.doctorPhotoURL ? (
              <img
                src={conversation.doctorPhotoURL}
                alt={conversation.doctorName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {conversation.doctorName?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-medium">{conversation.doctorName}</h3>
            <p className="text-sm text-gray-500">{conversation.doctorSpecialty}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleStartCall('voice')}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={() => handleStartCall('video')}
            className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            <Video size={20} />
          </button>
        </div>
      </div>

      {/* Rest of the chat component ... */}
    </div>
  );
} 