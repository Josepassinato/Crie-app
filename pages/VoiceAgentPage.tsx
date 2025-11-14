// pages/VoiceAgentPage.tsx
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
// FIX: Import FunctionDeclaration and Type for function calling feature.
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { decode, encode, decodeAudioData, createBlob } from '../lib/audioUtils.ts';
import { AppStateContext } from '../contexts/AppStateContext.tsx';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
// Fix: Corrected the import path for AuthContext from '../contexts/AuthContext.tsx' to '../lib/AuthContext.tsx'.
import { AuthContext } from '../lib/AuthContext.tsx';
// FIX: Import AccountsContext to correctly source account-related state.
import { AccountsContext } from '../contexts/AccountsContext.tsx';
import { TOKEN_COSTS } from '../lib/tokenCosts.ts';
import { GeneratedHistoryItem, VoiceSessionTranscript, VoiceSessionData } from '../types.ts';

interface VoiceAgentPageProps {
    onExit: () => void;
}

const VOICE_NAMES = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

const VoiceAgentPage: React.FC<VoiceAgentPageProps> = ({ onExit }) => {
    const { t } = useContext(LanguageContext);
    const { currentUser, updateUserTokens } = useContext(AuthContext);
    const appState = useContext(AppStateContext);
    const { selectedAccountId, accounts, addHistoryItem } = useContext(AccountsContext);

    const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string>(t('voiceAgentStatusIdle'));
    const [transcript, setTranscript] = useState<VoiceSessionTranscript[]>([]);
    const [isApiConnecting, setIsApiConnecting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentInputTranscription, setCurrentInputTranscription] = useState('');
    const [currentOutputTranscription, setCurrentOutputTranscription] = useState('');
    const [voiceName, setVoiceName] = useState('Zephyr');

    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef(0);
    const currentSessionTranscriptsRef = useRef<VoiceSessionTranscript[]>([]);
    const conversationTokenCostRef = useRef(0);
    const isFirstTurnRef = useRef(true); // To handle initial prompt/welcome
    
    if (!appState) return null; // Guard clause
    const { handleError, setContextualPrompt } = appState;

    const getGoogleAI = useCallback(() => {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            handleError(new Error("API_KEY environment variable not set."), "apiKeyError");
            throw new Error("API_KEY environment variable not set.");
        }
        return new GoogleGenAI({ apiKey });
    }, [handleError]);


    const stopAllAudioPlayback = useCallback(() => {
        for (const source of outputSourcesRef.current.values()) {
            try {
                source.stop();
            } catch (e) {
                console.warn("Error stopping audio source:", e);
            }
        }
        outputSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setIsSpeaking(false);
    }, []);

    const stopMicrophone = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close().catch(e => console.error("Error closing input audio context:", e));
            inputAudioContextRef.current = null;
        }
        setIsMicrophoneActive(false);
        setStatusMessage(t('voiceAgentStatusIdle'));
    }, [t]);

    const cleanupSession = useCallback(async () => {
        stopMicrophone();
        stopAllAudioPlayback();

        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) {
                console.error("Error closing live session:", e);
            } finally {
                sessionPromiseRef.current = null;
            }
        }
        if (outputAudioContextRef.current) {
            outputAudioContextRef.current.close().catch(e => console.error("Error closing output audio context:", e));
            outputAudioContextRef.current = null;
        }
        isFirstTurnRef.current = true;
        setTranscript([]);
        currentSessionTranscriptsRef.current = [];
        conversationTokenCostRef.current = 0;
        setCurrentInputTranscription('');
        setCurrentOutputTranscription('');
    }, [stopMicrophone, stopAllAudioPlayback]);

    const handleExitConversation = useCallback(() => {
        if (conversationTokenCostRef.current > 0 && selectedAccountId) {
            const historyItem: GeneratedHistoryItem = {
                id: Date.now().toString(),
                type: 'voiceSession',
                timestamp: new Date().toISOString(),
                data: {
                    transcript: currentSessionTranscriptsRef.current,
                    endedBy: 'user',
                    finalTokenCost: conversationTokenCostRef.current,
                } as VoiceSessionData,
                accountName: accounts[selectedAccountId]?.name || 'Conta desconhecida',
            };
            addHistoryItem(selectedAccountId, historyItem);
        }
        cleanupSession();
        onExit();
    }, [onExit, cleanupSession, selectedAccountId, accounts, addHistoryItem]);


    const startConversation = useCallback(async () => {
        if (!currentUser || (!currentUser.isAdmin && currentUser.tokens < TOKEN_COSTS.LIVE_CONVERSATION_START)) {
            handleError(new Error("insufficientTokens"), "insufficientTokens");
            return;
        }
        if (!currentUser.isAdmin) {
             updateUserTokens(currentUser.tokens - TOKEN_COSTS.LIVE_CONVERSATION_START);
             conversationTokenCostRef.current += TOKEN_COSTS.LIVE_CONVERSATION_START;
        }


        setIsApiConnecting(true);
        setStatusMessage(t('voiceAgentStatusConnecting'));
        setTranscript([]);
        currentSessionTranscriptsRef.current = [];
        isFirstTurnRef.current = true;
        
        try {
            const ai = getGoogleAI();
            // FIX: Add a fallback for `webkitAudioContext` for broader browser support.
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Set up prompt for the model
            let initialPrompt = t('voiceAgentSystemInstruction');
            if (selectedAccountId && accounts[selectedAccountId]) {
                const account = accounts[selectedAccountId];
                initialPrompt += `\n\nContexto da conta: Nome: ${account.name}, Tipo: ${account.type === 'content' ? 'Criador de Conteúdo' : 'Negócio/Produto'}. Detalhes: ${JSON.stringify(account.formData)}.`;
            }

            // Define function for setting contextual prompt in creator
            const setCreatorPromptFunctionDeclaration: FunctionDeclaration = {
                name: 'setCreatorPrompt',
                parameters: {
                    type: Type.OBJECT,
                    description: 'Set a textual prompt to pre-fill a field in the creator dashboard for the user. Use this when the user explicitly asks to "pre-fill" or "send this to the creator" and specifies content. You MUST confirm with the user first before setting a prompt.',
                    properties: {
                        prompt: {
                            type: Type.STRING,
                            description: 'The exact text prompt to set for the creator dashboard field (e.g., product description, professional context).'
                        },
                        field: {
                            type: Type.STRING,
                            description: 'The field in the creator dashboard to pre-fill (e.g., "productDescription", "professionalContext").'
                        }
                    },
                    required: ['prompt', 'field']
                }
            };

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        console.debug('Live session opened');
                        setIsApiConnecting(false);
                        setIsMicrophoneActive(true);
                        setStatusMessage(t('voiceAgentStatusListening'));

                        const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current!.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle audio output
                        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64EncodedAudioString) {
                            setIsSpeaking(true);
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
                            const audioBuffer = await decodeAudioData(
                                decode(base64EncodedAudioString),
                                outputAudioContextRef.current!,
                                24000,
                                1,
                            );
                            const source = outputAudioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current!.destination);
                            source.addEventListener('ended', () => {
                                outputSourcesRef.current.delete(source);
                                if (outputSourcesRef.current.size === 0) {
                                    setIsSpeaking(false);
                                }
                            });

                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                            outputSourcesRef.current.add(source);
                        }

                        // Handle transcriptions
                        if (message.serverContent?.outputTranscription) {
                            setCurrentOutputTranscription(prev => prev + message.serverContent.outputTranscription.text);
                        }
                        if (message.serverContent?.inputTranscription) {
                            setCurrentInputTranscription(prev => prev + message.serverContent.inputTranscription.text);
                        }

                        // Handle tool calls
                        if (message.toolCall) {
                            for (const fc of message.toolCall.functionCalls) {
                                console.debug('Function call:', fc);
                                if (fc.name === 'setCreatorPrompt') {
                                    // Assuming the model confirmed with the user before calling
                                    setContextualPrompt(fc.args.prompt as string);
                                    setTranscript(prev => [...prev, { role: 'model', text: t('voiceAgentConfirmSetCreatorPrompt') }]);
                                    currentSessionTranscriptsRef.current.push({ role: 'model', text: t('voiceAgentConfirmSetCreatorPrompt') });
                                    sessionPromiseRef.current!.then(session => {
                                        session.sendToolResponse({
                                            functionResponses: {
                                                id: fc.id,
                                                name: fc.name,
                                                response: { result: 'Prompt set successfully' }
                                            }
                                        });
                                    });
                                }
                            }
                        }

                        // When a turn is complete
                        if (message.serverContent?.turnComplete) {
                            if (currentInputTranscription) {
                                setTranscript(prev => [...prev, { role: 'user', text: currentInputTranscription }]);
                                currentSessionTranscriptsRef.current.push({ role: 'user', text: currentInputTranscription });
                                setCurrentInputTranscription('');
                            }
                            if (currentOutputTranscription) {
                                setTranscript(prev => [...prev, { role: 'model', text: currentOutputTranscription }]);
                                currentSessionTranscriptsRef.current.push({ role: 'model', text: currentOutputTranscription });
                                setCurrentOutputTranscription('');
                            }
                        }

                        // Handle interruption (user speaking during model's turn)
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                            stopAllAudioPlayback();
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setStatusMessage(t('voiceAgentStatusError'));
                        handleError(e.error, 'liveApiError');
                        cleanupSession();
                    },
                    onclose: (e: CloseEvent) => {
                        console.debug('Live session closed:', e);
                        if (e.code !== 1000) { // 1000 is normal closure
                            setStatusMessage(t('voiceAgentStatusDisconnectedError'));
                            handleError(new Error(`WebSocket closed with code ${e.code}`), 'liveApiError');
                        } else {
                            setStatusMessage(t('voiceAgentStatusDisconnected'));
                        }
                        cleanupSession();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
                    },
                    systemInstruction: initialPrompt,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    tools: [{ functionDeclarations: [setCreatorPromptFunctionDeclaration] }],
                },
            });
        } catch (err: any) {
            console.error("Error starting conversation:", err);
            handleError(err, 'liveApiError');
            setStatusMessage(t('voiceAgentStatusError'));
            setIsApiConnecting(false);
            cleanupSession();
        }
    }, [currentUser, updateUserTokens, handleError, t, getGoogleAI, stopAllAudioPlayback, stopMicrophone, cleanupSession, selectedAccountId, accounts, voiceName, setContextualPrompt]);


    useEffect(() => {
        // Initial welcome message from the agent
        if (!isApiConnecting && isMicrophoneActive && isFirstTurnRef.current) {
            isFirstTurnRef.current = false;
            // Add a synthetic initial response
            setTranscript(prev => [...prev, { role: 'model', text: t('voiceAgentWelcome') }]);
            currentSessionTranscriptsRef.current.push({ role: 'model', text: t('voiceAgentWelcome') });
            setStatusMessage(t('voiceAgentStatusListening'));
        }
    }, [isApiConnecting, isMicrophoneActive, t]);


    useEffect(() => {
        return () => {
            cleanupSession();
        };
    }, [cleanupSession]);


    return (
        <div className="min-h-screen bg-brand-bg text-brand-text font-sans flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-2xl bg-brand-surface p-8 rounded-lg shadow-2xl border border-slate-700 space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
                        {t('voiceAgentTitle')}
                    </h1>
                    <button
                        onClick={handleExitConversation}
                        className="p-2 rounded-full text-brand-subtle hover:bg-slate-700/50 hover:text-brand-light-text transition-colors"
                        aria-label={t('voiceAgentExit')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                    <label htmlFor="voiceSelect" className="text-brand-subtle">{t('voiceAgentVoiceSelection')}:</label>
                    <select
                        id="voiceSelect"
                        value={voiceName}
                        onChange={(e) => {
                            setVoiceName(e.target.value);
                            if (isMicrophoneActive) { // Restart conversation with new voice
                                cleanupSession().then(() => startConversation());
                            }
                        }}
                        className="px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text"
                        disabled={isApiConnecting || isMicrophoneActive}
                    >
                        {VOICE_NAMES.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-md min-h-[300px] max-h-[500px] overflow-y-auto border border-slate-700">
                    {transcript.length === 0 && !isApiConnecting && !isMicrophoneActive && (
                        <p className="text-brand-subtle text-center italic">{t('voiceAgentInitialInstruction')}</p>
                    )}
                    {transcript.map((msg, index) => (
                        <div key={index} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <span className={`inline-block p-2 rounded-lg ${
                                msg.role === 'user' ? 'bg-brand-primary/20 text-brand-light-text' : 'bg-slate-700/50 text-brand-subtle'
                            }`}>
                                {msg.text}
                            </span>
                        </div>
                    ))}
                    {(currentInputTranscription || currentOutputTranscription) && (
                         <div className="mb-3">
                            {currentInputTranscription && (
                                <div className="text-right">
                                    <span className="inline-block p-2 rounded-lg bg-brand-primary/10 text-brand-light-text italic animate-pulse-fade-in-out">
                                        {currentInputTranscription}
                                    </span>
                                </div>
                            )}
                            {currentOutputTranscription && (
                                <div className="text-left">
                                    <span className="inline-block p-2 rounded-lg bg-slate-800/50 text-brand-subtle italic animate-pulse-fade-in-out">
                                        {currentOutputTranscription}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    <div ref={useRef(null)} /> {/* Scroll to bottom */}
                </div>

                <div className="text-center text-brand-subtle text-sm font-medium mb-4">
                    <p className="flex items-center justify-center space-x-2">
                        {isSpeaking && (
                            <span className="inline-block h-3 w-3 bg-brand-secondary rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                        )}
                        {isSpeaking && (
                            <span className="inline-block h-3 w-3 bg-brand-secondary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                        )}
                         {isSpeaking && (
                            <span className="inline-block h-3 w-3 bg-brand-secondary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                        )}
                        <span>{statusMessage}</span>
                    </p>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={isMicrophoneActive ? cleanupSession : startConversation}
                        disabled={isApiConnecting}
                        className={`p-4 rounded-full ${isMicrophoneActive ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-primary hover:bg-brand-secondary'} text-white shadow-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-brand-primary/50`}
                        aria-label={isMicrophoneActive ? t('voiceAgentStopConversation') : t('voiceAgentStartConversation')}
                    >
                        {isApiConnecting ? (
                            <svg className="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : isMicrophoneActive ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 10H8.5a.5.5 0 00-.5.5v3a.5.5 0 00.5.5H9m5-4h.5a.5.5 0 01.5.5v3a.5.5 0 01-.5.5H14m-5-3v4m5-4v4" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VoiceAgentPage;