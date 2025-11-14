import React, { useState, useRef, useContext } from 'react';
import { transcribeAndEnhancePrompt } from '../services/audioService.ts';
import { LanguageContext } from '../contexts/LanguageContext.tsx';

interface VoicePromptButtonProps {
    onPromptGenerated: (text: string) => void;
    context: string;
    ariaLabel: string;
}

const VoicePromptButton: React.FC<VoicePromptButtonProps> = ({ onPromptGenerated, context, ariaLabel }) => {
    const { t } = useContext(LanguageContext);
    const [status, setStatus] = useState<'idle' | 'recording' | 'transcribing' | 'error'>('idle');
    const [error, setError] = useState('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve((reader.result as string).split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleStartRecording = async () => {
        if (status === 'error') {
            setError('');
        }
        setStatus('recording');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                setStatus('transcribing');
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioBase64 = await blobToBase64(audioBlob);
                
                try {
                    const enhancedPrompt = await transcribeAndEnhancePrompt(audioBase64, audioBlob.type, context);
                    onPromptGenerated(enhancedPrompt);
                    setStatus('idle');
                } catch (apiError: any) {
                    setError(t(apiError.message || 'audioProcessError'));
                    setStatus('error');
                }
                 stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError(t('microphoneError'));
            setStatus('error');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && status === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
    
    const renderIcon = () => {
        switch (status) {
            case 'recording':
                return (
                    <div className="relative flex items-center justify-center h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5 5h10v10H5z" /></svg>
                    </div>
                );
            case 'transcribing':
                return (
                    <svg className="animate-spin h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                );
            case 'error':
                 return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
            case 'idle':
            default:
                return (
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-6-6v-1.5a6 6 0 00-6 6v1.5a6 6 0 006 6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                );
        }
    };

    const getTooltip = () => {
        switch (status) {
            case 'recording': return t('stopRecording');
            case 'transcribing': return t('processingAudio');
            case 'error': return error;
            case 'idle':
            default: return ariaLabel;
        }
    }

    return (
        <div className="relative group">
            <button
                type="button"
                onClick={status === 'recording' ? handleStopRecording : handleStartRecording}
                className="p-2 rounded-full text-brand-subtle bg-brand-soft-bg hover:bg-brand-hover-bg hover:text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary"
                aria-label={ariaLabel}
            >
                {renderIcon()}
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 text-xs font-medium text-white bg-slate-900 border-brand-border rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {getTooltip()}
            </div>
        </div>
    );
};

export default VoicePromptButton;