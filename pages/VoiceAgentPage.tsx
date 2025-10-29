import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { useAppState } from '../contexts/AppStateContext';
import { AccountsContext } from '../contexts/AccountsContext';
import { GoogleGenAI, FunctionDeclaration, Type, LiveServerMessage, Modality } from '@google/genai';
import { AppPage, SavedAccount } from '../types';
import { createBlob, decode, decodeAudioData } from '../lib/audioUtils';

interface VoiceAgentPageProps {
    onExit: () => void;
}

const tools: FunctionDeclaration[] = [
    // Navigation
    {
        name: 'navigateToPage',
        description: 'Navigates the user to a different page in the application.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                page: {
                    type: Type.STRING,
                    description: "The page to navigate to. Must be one of: 'creator', 'analyzer', 'trafficManager', 'strategy'."
                },
            },
            required: ['page']
        },
    },
    // Account Management
    {
        name: 'selectAccount',
        description: 'Selects a saved user account to load its settings and history.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                accountName: {
                    type: Type.STRING,
                    description: 'The exact name of the account to select.'
                },
            },
            required: ['accountName']
        },
    },
    // Creator Page Actions
    {
        name: 'updateCreatorFormField',
        description: "Updates a specific field in the form on the Creator page. The agent must know which mode ('content' or 'product') is active to know which fields are available.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                field: { type: Type.STRING, description: "Field name, e.g., 'profession', 'productName', 'postFormat'." },
                value: { type: Type.STRING, description: "The new value for the field." },
            },
            required: ['field', 'value']
        },
    },
    {
        name: 'setCreatorMode',
        description: "Sets the Creator page mode to either 'content' or 'product'.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                mode: { type: Type.STRING, description: "Must be 'content' or 'product'." },
            },
            required: ['mode']
        },
    },
    {
        name: 'startCreatorGeneration',
        description: 'Starts the content or product generation process on the Creator page using the current form values.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    // Analyzer Page Actions
    {
        name: 'updateAnalyzerUrl',
        description: 'Updates the profile URL field on the Analyzer page.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                url: { type: Type.STRING, description: "The social media profile URL to be analyzed." },
            },
            required: ['url']
        },
    },
    {
        name: 'startProfileAnalysis',
        description: "Starts the profile analysis. The AI should prompt the user to upload feed/analytics screenshots if they haven't already.",
        parameters: { type: Type.OBJECT, properties: {} },
    },
    // Traffic Manager Page Actions
    {
        name: 'updateCampaignPlanField',
        description: 'Updates a specific field in the campaign planner form on the Traffic Manager page.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                field: { type: Type.STRING, description: "Field name, e.g., 'productService', 'targetAudience', 'objective', 'budget'." },
                value: { type: Type.STRING, description: "The new value for the field." },
            },
            required: ['field', 'value']
        },
    },
    {
        name: 'startCampaignPlanGeneration',
        description: 'Starts the campaign plan generation process using the current form values.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'startCampaignPerformanceAnalysis',
        description: "Starts the campaign performance analysis. The AI should prompt the user to upload an ads manager screenshot if they haven't already.",
        parameters: { type: Type.OBJECT, properties: {} },
    },
    // Strategy Page Actions
    {
        name: 'startHolisticStrategyGeneration',
        description: 'Generates a holistic strategy for the currently selected account.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'startAccountPerformanceAnalysis',
        description: 'Generates a performance report for the currently selected account.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
];

const VoiceAgentPage: React.FC<VoiceAgentPageProps> = ({ onExit }) => {
    const { t } = useContext(LanguageContext);
    const [statusText, setStatusText] = useState('Toque no botão para começar');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    
    const appState = useAppState();
    const { accounts, selectAccount: selectAccountById } = useContext(AccountsContext);

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const executeFunctionCall = useCallback(async (name: string, args: any): Promise<string> => {
        let confirmationText = "Ok.";
        switch (name) {
            case 'navigateToPage':
                appState.setActivePage(args.page as AppPage);
                confirmationText = `Claro, navegando para a página ${args.page}.`;
                break;
            case 'selectAccount':
                const accountToSelect = (Object.values(accounts) as SavedAccount[]).find(acc => acc.name.toLowerCase() === args.accountName.toLowerCase());
                if (accountToSelect) {
                    selectAccountById(accountToSelect.id);
                    confirmationText = `Certo, selecionei a conta "${args.accountName}".`;
                } else {
                    const accountNames = (Object.values(accounts) as SavedAccount[]).map(a => a.name).join(', ');
                    confirmationText = `Desculpe, não encontrei uma conta chamada "${args.accountName}". As contas disponíveis são: ${accountNames || 'nenhuma'}.`;
                }
                break;
            case 'updateCreatorFormField':
                appState.updateCreatorFormField(args.field, args.value);
                confirmationText = `Ok, atualizei o campo "${args.field}".`;
                break;
            case 'setCreatorMode':
                appState.setAppMode(args.mode);
                confirmationText = `Modo do criador definido para ${args.mode}.`;
                break;
            case 'startCreatorGeneration':
                confirmationText = "Tudo certo! Iniciando a geração agora...";
                await appState.startGeneration();
                break;
            case 'updateAnalyzerUrl':
                appState.setAnalyzerFormState(prev => ({...prev, profileUrl: args.url}));
                confirmationText = "URL do analisador atualizada.";
                break;
            case 'startProfileAnalysis':
                confirmationText = "Iniciando análise de perfil.";
                await appState.handleProfileAnalysisSubmit();
                break;
            case 'updateCampaignPlanField':
                appState.setTrafficPlanForm(prev => ({...prev, [args.field]: args.value}));
                confirmationText = `Campo do plano de campanha "${args.field}" atualizado.`;
                break;
            case 'startCampaignPlanGeneration':
                confirmationText = "Gerando o plano de campanha.";
                await appState.handleCampaignPlanSubmit();
                break;
            case 'startCampaignPerformanceAnalysis':
                confirmationText = "Analisando a performance da campanha. Certifique-se de que uma imagem foi enviada.";
                await appState.handleCampaignPerformanceSubmit();
                break;
            case 'startHolisticStrategyGeneration':
                confirmationText = "Iniciando a geração da estratégia holística.";
                await appState.handleStrategySubmit();
                break;
             case 'startAccountPerformanceAnalysis':
                confirmationText = "Iniciando o relatório de performance da conta.";
                await appState.handlePerformanceReportSubmit();
                break;
            default:
                confirmationText = `Função desconhecida: ${name}`;
                break;
        }
        return confirmationText;
    }, [appState, accounts, selectAccountById]);


    const stopSession = useCallback(async () => {
        setIsSessionActive(false);
        setStatusText('Toque no botão para começar');

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
             await inputAudioContextRef.current.close();
        }
         if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
             await outputAudioContextRef.current.close();
        }
        if (sessionPromiseRef.current) {
            try {
                const session = await sessionPromiseRef.current;
                session.close();
            } catch (e) { console.error("Error closing session:", e); }
            sessionPromiseRef.current = null;
        }
    }, []);

    const startSession = useCallback(async () => {
        setIsSessionActive(true);
        setStatusText("Ouvindo...");
        nextStartTimeRef.current = 0;
        outputSourcesRef.current.clear();

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const accountNames = (Object.values(accounts) as SavedAccount[]).map(acc => acc.name).join(', ') || 'Nenhuma conta salva ainda.';
            const systemInstruction = `
                Você é uma IA de marketing digital e gestora de tráfego sênior, chamada 'Cria'. Sua função é ajudar o usuário a operar esta aplicação usando apenas a voz. Você tem controle total das funções do aplicativo: navegar entre páginas, selecionar contas de clientes, preencher formulários para criação de conteúdo, análise de perfil, planejamento de campanhas e iniciar todas as tarefas de geração.

                Suas capacidades, via chamadas de função, são:
                - Navegar para qualquer página: 'Creator', 'Analyzer', 'Traffic Manager', 'Strategy'.
                - Gerenciar contas: Você pode listar e selecionar contas existentes. Contas atuais: ${accountNames}.
                - Preencher formulários: Você pode atualizar qualquer campo em qualquer página.
                - Iniciar tarefas de IA: Gerar conteúdo, analisar perfis, criar planos de campanha e desenvolver estratégias.
                - Lidar com imagens: O usuário pode enviar uma imagem, e você pode usá-la para análise ou inspiração.

                Seu modelo de interação:
                1.  **Conversacional e Proativo:** Não espere por comandos. Entenda o objetivo do usuário. Se ele disser "preciso de um post para um cliente nutricionista", faça perguntas para esclarecer, como "Ótimo! Qual o tema? É para Instagram, imagem única ou carrossel?" antes de preencher o formulário.
                2.  **Guie o Usuário:** Conduza o usuário pelo processo. Ex: "Ok, preenchi a profissão como 'Nutricionista' e o tema como 'benefícios da proteína'. Vou configurar como um carrossel de 5 slides. Parece bom antes de eu gerar?".
                3.  **Dê Conselhos de Especialista:** Aja como um especialista. Ofereça sugestões. "Para uma nutricionista com foco em jovens adultos, um estilo visual vibrante funciona bem. Posso usar o template 'Moderno com Círculo'. O que acha?".
                4.  **Confirme Ações:** Antes de uma ação importante que custa tokens, confirme. "Tudo pronto. Posso gerar o conteúdo?".
                5.  **Seja Transparente:** Ao usar uma ferramenta, mencione brevemente. "Ok, selecionando a conta 'Carla Cabeleireira'." ou "Navegando para a página do Analisador."

                Seu objetivo é fazer o usuário sentir que tem um parceiro especialista humano, permitindo que ele execute qualquer tarefa no app de forma fluida e eficiente por voz.
            `;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction,
                    tools: [{ functionDeclarations: tools }],
                },
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: createBlob(inputData) });
                            });
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.toolCall) {
                             for (const call of message.toolCall.functionCalls) {
                                const result = await executeFunctionCall(call.name, call.args);
                                sessionPromiseRef.current?.then(session => {
                                    session.sendToolResponse({
                                        functionResponses: { id: call.id, name: call.name, response: { result } }
                                    });
                                });
                            }
                        }

                        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (audioData && outputAudioContextRef.current) {
                            setStatusText("Falando...");
                            const outCtx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                            const source = outCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outCtx.destination);
                            
                            outputSourcesRef.current.add(source);
                            source.onended = () => {
                                outputSourcesRef.current.delete(source);
                                if (outputSourcesRef.current.size === 0) setStatusText("Ouvindo...");
                            };

                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                        }

                        if (message.serverContent?.interrupted) {
                             outputSourcesRef.current.forEach(source => source.stop());
                             outputSourcesRef.current.clear();
                             nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error("Session error:", e);
                        setStatusText(`Erro: ${e.message}`);
                        stopSession();
                    },
                    onclose: () => {
                        if (isSessionActive) stopSession();
                    },
                }
            });

        } catch (error: any) {
            console.error("Failed to start session:", error);
            setStatusText(`Erro: ${error.message}`);
            await stopSession();
        }
    }, [accounts, executeFunctionCall, stopSession, isSessionActive]);
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && sessionPromiseRef.current) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64Data = result.split(',')[1];
                
                setUploadedImage(result); 

                const imageBlob = {
                    data: base64Data,
                    mimeType: file.type,
                };
                sessionPromiseRef.current?.then((session) => {
                    session.sendRealtimeInput({ media: imageBlob });
                });

                // Also update the correct form state in the context
                if (appState.activePage === 'analyzer') {
                    appState.setAnalyzerFormState(prev => ({ ...prev, analyticsImage: { base64: base64Data, mimeType: file.type, name: file.name } }));
                } else if (appState.activePage === 'trafficManager') {
                    appState.setTrafficAnalysisImage({ base64: base64Data, mimeType: file.type, name: file.name });
                }

                setStatusText("Imagem enviada. Continue a conversa.");

                if (event.target) {
                    event.target.value = '';
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEndCall = () => {
        if (isSessionActive) {
            stopSession();
        }
        onExit();
    };

    useEffect(() => {
        startSession(); // Start session automatically on component mount
        return () => {
            stopSession(); // Cleanup on unmount
        };
    }, []); // Empty dependency array ensures it runs only once

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-[#0f172a] text-white flex flex-col font-sans">
            <header className="p-4 flex justify-between items-center w-full max-w-4xl mx-auto">
                <div className="flex items-center space-x-2">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L12 4M12 20L12 22M20 12L22 12M2 12L4 12M18.5 5.5L19.5 4.5M4.5 19.5L5.5 18.5M18.5 18.5L19.5 19.5M4.5 4.5L5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M9 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M15 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="font-semibold text-lg">Live</span>
                </div>
                <button onClick={onExit} aria-label="Return to dashboard">
                     <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.251-.146.52-.[26.793-.349L12 2.25M9.75 3.104l2.25 1.313M12 2.25c.251.146.52.26.793.349L15 4.417M12 2.25l2.25-1.313M15 4.417v5.714a2.25 2.25 0 00.659 1.591L19 14.5M15 4.417l-2.25 1.313M12 18.75a3.75 3.75 0 00-3.75-3.75H6a3.75 3.75 0 00-3.75 3.75v.035A3.75 3.75 0 006 22.5h1.125a3.75 3.75 0 003.625-3.465V18.75zM12 18.75a3.75 3.75 0 013.75-3.75h2.25a3.75 3.75 0 013.75 3.75v.035A3.75 3.75 0 0118 22.5h-1.125a3.75 3.75 0 01-3.625-3.465V18.75z" />
                    </svg>
                </button>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-4 relative">
                <div className="w-24 h-24 border-4 border-blue-400 rounded-full animate-pulse"></div>
                <p className="mt-6 text-lg text-slate-300">{statusText}</p>
                 {uploadedImage && (
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 p-1.5 bg-black/40 rounded-lg backdrop-blur-sm border border-white/10 animate-fade-in">
                        <img src={uploadedImage} alt="Uploaded preview" className="h-20 w-auto object-contain rounded-md" />
                        <button 
                            onClick={() => setUploadedImage(null)} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                            aria-label="Remove image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </main>

            <footer className="w-full p-4 pb-8">
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <div className="max-w-md mx-auto bg-white/5 backdrop-blur-md rounded-full p-3 flex justify-around items-center border border-white/10">
                     <button onClick={handleUploadClick} className="bg-white/10 p-4 rounded-full hover:bg-white/20 transition-colors" aria-label="Upload file">
                        <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                    </button>
                    <button className="bg-white/10 p-4 rounded-full hover:bg-white/20 transition-colors" aria-label="Pause session">
                        <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                    </button>
                    <button onClick={handleEndCall} className="bg-red-500 p-4 rounded-full hover:bg-red-600 transition-colors" aria-label="End session">
                         <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default VoiceAgentPage;
