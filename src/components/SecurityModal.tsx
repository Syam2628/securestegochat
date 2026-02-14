import { X, AlertTriangle, Shield, Code } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  imageData: {
    security_status: string;
    has_hidden_data: boolean;
    is_code: boolean;
    confidence_score: number;
    extracted_text: string | null;
  };
}

export function SecurityModal({ isOpen, onClose, onProceed, imageData }: SecurityModalProps) {
  if (!isOpen) return null;

  const getSeverityColor = () => {
    if (imageData.is_code) return 'red';
    if (imageData.has_hidden_data) return 'yellow';
    return 'green';
  };

  const getSeverityIcon = () => {
    if (imageData.is_code) return <AlertTriangle className="w-12 h-12 text-red-500" />;
    if (imageData.has_hidden_data) return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
    return <Shield className="w-12 h-12 text-green-500" />;
  };

  const color = getSeverityColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className={`bg-${color}-50 border-b border-${color}-200 p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            {getSeverityIcon()}
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Security Analysis</h2>
              <p className={`text-${color}-700 font-medium mt-1`}>
                {imageData.is_code ? 'Suspicious Code Detected' :
                 imageData.has_hidden_data ? 'Hidden Data Detected' :
                 'Image Appears Clean'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className={`text-lg font-semibold text-${color}-600 uppercase`}>
                {imageData.security_status}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Confidence</p>
              <p className="text-lg font-semibold text-gray-800">
                {imageData.confidence_score}%
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Hidden Data:</p>
                <p className="text-blue-800">
                  {imageData.has_hidden_data ? 'Yes - Steganographic data detected' : 'None detected'}
                </p>
              </div>
            </div>

            {imageData.is_code && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <Code className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Code Detection:</p>
                  <p className="text-red-800">
                    Programming code detected in hidden payload
                  </p>
                </div>
              </div>
            )}
          </div>

          {imageData.extracted_text && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Extracted Payload (Preview):</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words">{imageData.extracted_text}</pre>
              </div>
            </div>
          )}

          {imageData.is_code && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Security Warning
              </h3>
              <p className="text-red-800 text-sm">
                This image contains hidden code that could potentially be malicious.
                Viewing this image is generally safe, but be cautious about executing
                any extracted code or sharing this image further.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Go Back
            </button>
            <button
              onClick={onProceed}
              className={`flex-1 px-4 py-3 bg-${color === 'red' ? 'red' : 'blue'}-600 text-white rounded-lg font-semibold hover:bg-${color === 'red' ? 'red' : 'blue'}-700 transition`}
            >
              View Image Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
