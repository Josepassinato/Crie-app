// components/SelfieCaptureModal.tsx
import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { UploadedImage } from '../types.ts';
import { LanguageContext } from '../contexts/LanguageContext.tsx';

interface SelfieCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelfieConfirm: (selfie: UploadedImage) => void;
}

const SelfieCaptureModal: React.FC<SelfieCaptureModalProps> = ({ isOpen, onClose, onSelfieConfirm }) => {
  const { t } = useContext(LanguageContext);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCapturedImage(null);
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Camera access error:", err);
          setError(t('cameraError'));
        });
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera, t]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Restart camera stream
     navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        });
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onSelfieConfirm({
        base64: capturedImage.split(',')[1],
        mimeType: 'image/jpeg',
        name: 'user_selfie.jpg'
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-brand-surface p-6 rounded-lg shadow-2xl border border-slate-700 max-w-lg w-full">
        <h2 className="text-xl font-bold text-brand-text mb-4 text-center">{t('selfieCaptureTitle')}</h2>
        
        {error && (
            <div className="text-center text-red-400 p-4 bg-red-900/20 border border-red-500/30 rounded-md">
                {error}
                <button onClick={onClose} className="mt-4 w-full py-2 px-4 bg-slate-700/50 hover:bg-slate-700 rounded-md">{t('cancel')}</button>
            </div>
        )}
        
        {!error && (
            <>
                <div className="relative w-full aspect-square bg-slate-900 rounded-md overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}></video>
                    {capturedImage && (
                        <img src={capturedImage} alt="Selfie Preview" className="w-full h-full object-cover" />
                    )}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>
                
                <p className="text-brand-subtle text-sm text-center my-4">{t('selfieCaptureInstruction')}</p>

                <div className="flex justify-center gap-4 mt-4">
                    {!capturedImage ? (
                        <button onClick={handleCapture} className="flex-1 py-3 px-4 bg-brand-primary text-slate-900 font-bold rounded-md hover:opacity-90">{t('capture')}</button>
                    ) : (
                        <>
                            <button onClick={handleRetake} className="flex-1 py-3 px-4 bg-slate-700/50 hover:bg-slate-700 text-brand-subtle font-semibold rounded-md">{t('retake')}</button>
                            <button onClick={handleConfirm} className="flex-1 py-3 px-4 bg-brand-secondary text-white font-bold rounded-md hover:opacity-90">{t('confirm')}</button>
                        </>
                    )}
                </div>
                 <button onClick={onClose} className="w-full mt-4 py-2 px-4 text-sm text-brand-subtle hover:bg-slate-800/50 rounded-md">{t('cancel')}</button>
            </>
        )}
      </div>
    </div>
  );
};

export default SelfieCaptureModal;