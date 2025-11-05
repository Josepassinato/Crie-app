import React, { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
// Fix: Add file extension to fix module resolution error.
import { useAppState } from '../contexts/AppStateContext';
import { AccountsContext } from '../contexts/AccountsContext';
import { GoogleGenAI, FunctionDeclaration, Type, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { AppPage, SavedAccount, VoiceSessionTranscript, GeneratedHistoryItem, VoiceSessionData } from '../types';
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
        name: 'setCreativeParameters',
        description: "Sets multiple creative parameters for image or video generation at once. Use this to apply visual styles.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                artisticStyle: { type: Type.STRING, description: "The artistic style, e.g., 'Vintage', 'Cyberpunk', 'Padrão'." },
                aspectRatio: { type: Type.STRING, description: "The aspect ratio, e.g., '1:1', '16:9', '9:16'." },
                negativePrompt: { type: Type.STRING, description: "A description of elements to exclude from the image." },
            },
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
    const { t, language } = useContext(LanguageContext);
    const appState = useAppState();
    const { accounts, selectAccount: selectAccountById, addHistoryItem, selectedAccountId } = useContext(AccountsContext);

    const [statusText, setStatusText] = useState('Conectando...');
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const transcriptRef = useRef<VoiceSessionTranscript[]>([]);
    const currentUserTranscriptionRef = useRef('');
    const currentModelTranscriptionRef = useRef('');
    const timeoutRef = useRef<number | null>(null);
    const sessionWasActive = useRef(false);

    const executeFunctionCall = useCallback(async (name: string, args: any): Promise<string> => {
        let confirmationText = "Ok.";
        try {
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
                case 'setCreativeParameters':
                    if (args.artisticStyle) appState.updateCreatorFormField('artisticStyle', args.artisticStyle);
                    if (args.aspectRatio) appState.updateCreatorFormField('aspectRatio', args.aspectRatio);
                    if (args.negativePrompt) appState.updateCreatorFormField('negativePrompt', args.negativePrompt);
                    confirmationText = "Parâmetros criativos aplicados.";
                    break;
                case 'setCreatorMode':
                    appState.setAppMode(args.mode);
                    confirmationText = `Modo do criador definido para ${args.mode}.`;
                    break;
                case 'startCreatorGeneration':
                    confirmationText = "Tudo certo! Iniciando a geração agora...";
                    onExit(); // Exit voice mode to show dashboard
                    await appState.startGeneration();
                    break;
                case 'updateAnalyzerUrl':
                    appState.setAnalyzerFormState(prev => ({...prev, profileUrl: args.url}));
                    confirmationText = "URL do analisador atualizada.";
                    break;
                case 'startProfileAnalysis':
                    confirmationText = "Iniciando análise de perfil. Você pode me enviar os prints da tela se precisar.";
                    onExit();
                    await appState.handleProfileAnalysisSubmit();
                    break;
                case 'updateCampaignPlanField':
                    appState.setTrafficPlanForm(prev => ({...prev, [args.field]: args.value}));
                    confirmationText = `Campo do plano de campanha "${args.field}" atualizado.`;
                    break;
                case 'startCampaignPlanGeneration':
                    confirmationText = "Gerando o plano de campanha.";
                    onExit();
                    await appState.handleCampaignPlanSubmit();
                    break;
                case 'startCampaignPerformanceAnalysis':
                    confirmationText = "Analisando a performance da campanha. Certifique-se de que uma imagem foi enviada.";
                    onExit();
                    await appState.handleCampaignPerformanceSubmit();
                    break;
                case 'startHolisticStrategyGeneration':
                    confirmationText = "Iniciando a geração da estratégia holística.";
                    onExit();
                    await appState.handleStrategySubmit();
                    break;
                 case 'startAccountPerformanceAnalysis':
                    confirmationText = "Iniciando o relatório de performance da conta.";
                    onExit();
                    await appState.handlePerformanceReportSubmit();
                    break;
                default:
                    confirmationText = `Função desconhecida: ${name}`;
                    break;
            }
        } catch(e: any) {
            console.error(`Error executing function ${name}:`, e);
            confirmationText = `Ocorreu um erro ao executar a ação: ${e.message}`;
        }
        return confirmationText;
    }, [appState, accounts, selectAccountById, onExit]);


    const saveSessionHistory = useCallback(async (endedBy: 'user' | 'timeout') => {
        if (!selectedAccountId) return;
    
        const finalUserText = currentUserTranscriptionRef.current.trim();
        if (finalUserText) {
            transcriptRef.current.push({ role: 'user', text: finalUserText });
        }
    
        const finalModelText = currentModelTranscriptionRef.current.trim();
        if (finalModelText) {
            transcriptRef.current.push({ role: 'model', text: finalModelText });
        }
    
        if (transcriptRef.current.length === 0) return;
    
        const sessionData: VoiceSessionData = {
            transcript: transcriptRef.current,
            endedBy,
        };
    
        const historyItem: GeneratedHistoryItem = {
            id: Date.now().toString(),
            type: 'voiceSession',
            timestamp: new Date().toISOString(),
            data: sessionData,
            accountName: accounts[selectedAccountId]?.name || 'Unknown',
        };
        
        addHistoryItem(selectedAccountId, historyItem);
        // Reset for next potential session
        transcriptRef.current = [];
        currentUserTranscriptionRef.current = '';
        currentModelTranscriptionRef.current = '';
    
    }, [selectedAccountId, addHistoryItem, accounts]);


    const stopSession = useCallback(async () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        setIsSessionActive(false);
        sessionWasActive.current = false;

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
    
    const handleEndCall = useCallback(async () => {
        if (sessionWasActive.current) {
            await saveSessionHistory('user');
        }
        await stopSession();
        onExit();
    }, [saveSessionHistory, stopSession, onExit]);


    const startSession = useCallback(async () => {
        if (isSessionActive) return;

        sessionWasActive.current = true;
        transcriptRef.current = [];
        currentUserTranscriptionRef.current = '';
        currentModelTranscriptionRef.current = '';
        
        setIsSessionActive(true);
        setStatusText("Ouvindo...");
        nextStartTimeRef.current = 0;
        outputSourcesRef.current.clear();

        timeoutRef.current = window.setTimeout(async () => {
            setStatusText("Sessão expirada.");
            await saveSessionHistory('timeout');
            await stopSession();
            alert(t('voiceSessionTimeoutMessage'));
            onExit();
        }, 5 * 60 * 1000); // 5 minutes

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const accountNames = (Object.values(accounts) as SavedAccount[]).map(acc => acc.name).join(', ') || 'Nenhuma conta salva ainda.';
            const systemInstruction = `
                CRITICAL: You must speak and respond to the user exclusively in the following language: ${language}. All your audio responses must be in this language.

                Você é uma IA de marketing digital e gestora de tráfego sênior, chamada 'Cria'. Sua função é ajudar o usuário a operar esta aplicação usando apenas a voz. Você tem controle total das funções do aplicativo: navegar entre páginas, selecionar contas de clientes, preencher formulários para criação de conteúdo, análise de perfil, planejamento de campanhas e iniciar todas as tarefas de geração.

                Suas capacidades, via chamadas de função, são:
                - Navegar para qualquer página: 'Creator', 'Analyzer', 'Traffic Manager', 'Strategy'.
                - Gerenciar contas: Você pode listar e selecionar contas existentes. Contas atuais: ${accountNames}.
                - Preencher formulários: Você pode atualizar qualquer campo em qualquer página, incluindo parâmetros criativos detalhados.
                - Parâmetros criativos: Você pode definir 'artisticStyle', 'aspectRatio' (ex: '16:9'), e 'negativePrompt' (o que NÃO deve aparecer na imagem).
                - Iniciar tarefas de IA: Gerar conteúdo, analisar perfis, criar planos de campanha e desenvolver estratégias.
                - Lidar com imagens: O usuário pode enviar uma imagem, e você pode usá-la para análise ou inspiração.

                Seu modelo de interação:
                1.  **Conversacional e Proativo:** Não espere por comandos. Entenda o objetivo do usuário. Se ele disser "quero uma imagem 16 por 9 para o meu produto de tênis", use a função 'setCreativeParameters' e pergunte "Ok, proporção 16 por 9. Qual é a vibe da campanha? Quer excluir algo da imagem?".
                2.  **Guie o Usuário:** Conduza o usuário pelo processo. Ex: "Ok, preenchi a profissão como 'Nutricionista' e o tema como 'benefícios da proteína'. Vou configurar como um carrossel de 5 slides. Parece bom antes de eu gerar?".
                3.  **Dê Conselhos de Especialista:** Aja como um especialista. Ofereça sugestões. "Para uma nutricionista com foco em jovens adultos, um estilo visual vibrante funciona bem. Posso usar o estilo 'Aquarela'. O que acha?".
                4.  **Confirme Ações:** Antes de uma ação importante que custa tokens, confirme. "Tudo pronto. Posso gerar o conteúdo?".
                5.  **Seja Transparente:** Ao usar uma ferramenta, mencione brevemente. "Ok, selecionando a conta 'Carla Cabeleireira'." ou "Aplicando o estilo 'Cyberpunk' e proporção '9:16'."

                **Fluxo de Trabalho CRÍTICO:**
                1.  **Navegue Primeiro:** Antes de executar uma ação específica de uma página (como 'startProfileAnalysis' ou 'startCreatorGeneration'), você DEVE primeiro chamar a função 'navigateToPage' para garantir que o usuário esteja na página correta. Por exemplo, se o usuário pedir para analisar um perfil, primeiro chame 'navigateToPage({ page: 'analyzer' })' e DEPOIS 'startProfileAnalysis()'.
                2.  **Preencha e Confirme:** Preencha os campos necessários usando as funções de atualização ('updateCreatorFormField', etc.) com base na conversa. Confirme com o usuário antes de iniciar a geração.
                3.  **Inicie a Geração:** Chame a função de início ('startCreatorGeneration', etc.). A interface de voz será fechada automaticamente e o usuário verá o resultado no painel. Sua tarefa termina ao chamar a função de geração.

                Seu objetivo é fazer o usuário sentir que tem um parceiro especialista humano, permitindo que ele execute qualquer tarefa no app de forma fluida e eficiente por voz.
            `;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction,
                    tools: [{ functionDeclarations: tools }],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
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
                        
                        if (message.serverContent?.inputTranscription) {
                            currentUserTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentModelTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const userText = currentUserTranscriptionRef.current.trim();
                            if (userText) transcriptRef.current.push({ role: 'user', text: userText });
                            
                            const modelText = currentModelTranscriptionRef.current.trim();
                            if (modelText) transcriptRef.current.push({ role: 'model', text: modelText });
                            
                            currentUserTranscriptionRef.current = '';
                            currentModelTranscriptionRef.current = '';
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
                                if (outputSourcesRef.current.size === 0 && isSessionActive) setStatusText("Ouvindo...");
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
    }, [accounts, executeFunctionCall, stopSession, isSessionActive, t, onExit, saveSessionHistory, language]);
    
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

    useEffect(() => {
        startSession();
        return () => {
            if (sessionWasActive.current) {
                saveSessionHistory('user');
            }
            stopSession();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                <button onClick={handleEndCall} aria-label="Return to dashboard">
                     <svg className="w-8 h-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                </button>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-4 relative">
                <div className={`w-24 h-24 border-4 ${isSessionActive && statusText === "Falando..." ? 'border-purple-400' : 'border-blue-400'} rounded-full transition-colors duration-300 ${isSessionActive && statusText === "Ouvindo..." ? 'animate-pulse' : ''}`}></div>
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
                     <button onClick={handleUploadClick} disabled={!isSessionActive} className="bg-white/10 p-4 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50" aria-label="Upload file">
                        <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
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