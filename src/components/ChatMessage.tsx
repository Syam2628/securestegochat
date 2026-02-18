import { useState } from 'react';
import { Message } from '../services/api';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { SecurityModal } from './SecurityModal';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [imageRevealed, setImageRevealed] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getSecurityBadge = () => {
    if (!message.image_data) return null;

    const { security_status, is_code } = message.image_data;

    if (security_status === 'clean') {
      return (
        <div className="flex items-center gap-1 text-green-600 text-xs">
          <CheckCircle className="w-3 h-3" />
          <span>Clean</span>
        </div>
      );
    }

    if (is_code || security_status === 'suspicious') {
      return (
        <div className="flex items-center gap-1 text-red-600 text-xs">
          <AlertTriangle className="w-3 h-3" />
          <span>Suspicious</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 text-yellow-600 text-xs">
        <Shield className="w-3 h-3" />
        <span>Warning</span>
      </div>
    );
  };

  const handleImageClick = () => {
    if (message.image_data && message.image_data.has_hidden_data && !imageRevealed) {
      setShowSecurityModal(true);
    }
  };

  const handleProceedToView = () => {
    setImageRevealed(true);
    setShowSecurityModal(false);
  };

  const shouldBlurImage = message.image_data?.has_hidden_data && !imageRevealed;

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          {!isOwn && (
            <span className="text-xs text-gray-600 mb-1 px-2">{message.sender_username}</span>
          )}
          <div
            className={`rounded-2xl px-4 py-2 ${isOwn
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
          >
            {message.message_type === 'text' ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="space-y-2">
                <div
                  className={`relative cursor-pointer ${shouldBlurImage ? 'filter blur-lg' : ''}`}
                  onClick={handleImageClick}
                >

                  <img
                    src={`https://securestegochat.onrender.com${message.content}`}
                    alt="Shared image"
                    className="rounded-lg max-w-xs max-h-64 object-cover"
                  />
                  {shouldBlurImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg shadow-lg">
                        <p className="text-red-600 font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5" />
                          Click to review security warning
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {message.image_data && (
                  <div className={`flex items-center gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {getSecurityBadge()}
                  </div>
                )}
              </div>
            )}
          </div>
          <span className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'} px-2`}>
            {formatTime(message.created_at)}
          </span>
        </div>
      </div>

      {message.image_data && (
        <SecurityModal
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
          onProceed={handleProceedToView}
          imageData={message.image_data}
        />
      )}
    </>
  );
}
