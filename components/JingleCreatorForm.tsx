import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.tsx';

const JingleCreatorForm: React.FC = () => {
    const { t } = useContext(LanguageContext);
    
    const [jinglePrompt, setJinglePrompt] = useState('');
    const [productName, setProductName] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [websiteOrSocial, setWebsiteOrSocial] = useState('');
    const [musicStyle, setMusicStyle] = useState('upbeat');
    const [duration, setDuration] = useState('30');
    const [language, setLanguage] = useState('pt-BR');
    const [importantInfo, setImportantInfo] = useState('');
    const [instrumental, setInstrumental] = useState(false);
    
    // Website analysis states
    const [analyzingWebsite, setAnalyzingWebsite] = useState(false);
    const [websiteAnalysis, setWebsiteAnalysis] = useState<any>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    
    // Check for data from Voice Agent on mount
    React.useEffect(() => {
        const voiceData = sessionStorage.getItem('voiceAgentJingleData');
        if (voiceData) {
            try {
                const data = JSON.parse(voiceData);
                if (data.productName) setProductName(data.productName);
                if (data.targetAudience) setTargetAudience(data.targetAudience);
                if (data.websiteOrSocial) setWebsiteOrSocial(data.websiteOrSocial);
                if (data.musicStyle) setMusicStyle(data.musicStyle);
                if (data.language) setLanguage(data.language);
                if (data.importantInfo) setImportantInfo(data.importantInfo);
                if (data.duration) setDuration(data.duration);
                
                // Clear the data after reading
                sessionStorage.removeItem('voiceAgentJingleData');
                
                // Auto-generate prompt with the data
                setTimeout(() => {
                    generateAutoPrompt();
                }, 100);
            } catch (e) {
                console.error('Error parsing voice agent data:', e);
            }
        }
    }, []);
    
    const [generatingMusic, setGeneratingMusic] = useState(false);
    const [generatingVideo, setGeneratingVideo] = useState(false);
    const [musicTaskId, setMusicTaskId] = useState<string | null>(null);
    const [musicUrl, setMusicUrl] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateJingle = async () => {
        if (!jinglePrompt.trim()) {
            setError('Por favor, descreva o jingle que você deseja criar');
            return;
        }

        setGeneratingMusic(true);
        setError(null);
        setMusicUrl(null);

        try {
            // Generate music
            const response = await fetch(`/api/kie/music/generate?prompt=${encodeURIComponent(jinglePrompt)}&instrumental=${instrumental}&model=V3_5`, {
                method: 'POST',
            });

            const data = await response.json();
            
            if (data.code === 200 && data.data?.taskId) {
                const taskId = data.data.taskId;
                setMusicTaskId(taskId);
                
                // Poll for music completion
                pollMusicStatus(taskId);
            } else {
                throw new Error(data.msg || 'Erro ao gerar jingle');
            }
        } catch (err: any) {
            setError(err.message);
            setGeneratingMusic(false);
        }
    };

    const pollMusicStatus = async (taskId: string) => {
        const maxAttempts = 60; // 5 minutes
        let attempts = 0;

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/kie/music/details/${taskId}`);
                const data = await response.json();

                if (data.code === 200) {
                    const status = data.data?.status;
                    
                    if (status === 'SUCCESS' || status === 'FIRST_SUCCESS') {
                        // Get the first track URL
                        const tracks = data.data?.response?.sunoData || [];
                        if (tracks.length > 0) {
                            const audioUrl = tracks[0].streamAudioUrl || tracks[0].audioUrl;
                            setMusicUrl(audioUrl);
                            setGeneratingMusic(false);
                            return;
                        }
                    } else if (status?.includes('FAILED') || status?.includes('ERROR')) {
                        throw new Error('Falha ao gerar jingle');
                    }
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkStatus, 5000); // Check every 5 seconds
                } else {
                    throw new Error('Tempo limite excedido');
                }
            } catch (err: any) {
                setError(err.message);
                setGeneratingMusic(false);
            }
        };

        checkStatus();
    };

    const generateVideoClip = async () => {
        if (!musicUrl) {
            setError('Primeiro gere um jingle antes de criar o videoclipe');
            return;
        }

        setGeneratingVideo(true);
        setError(null);

        try {
            const videoPrompt = `Commercial video clip for ${productName || 'a product'}. ${jinglePrompt}. Professional, engaging, ${musicStyle} style.`;
            
            const response = await fetch('/api/kie/video/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: videoPrompt,
                    duration: '5',
                    resolution: '720p',
                    aspect_ratio: '16:9',
                    enable_prompt_expansion: true
                })
            });

            const data = await response.json();
            
            if (data.generation_id) {
                pollVideoStatus(data.generation_id);
            } else {
                throw new Error('Erro ao gerar videoclipe');
            }
        } catch (err: any) {
            setError(err.message);
            setGeneratingVideo(false);
        }
    };

    const pollVideoStatus = async (generationId: string) => {
        const maxAttempts = 60; // 5 minutes
        let attempts = 0;

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/kie/video/details/${generationId}`);
                const data = await response.json();

                if (data.status === 'complete' && data.video?.url) {
                    setVideoUrl(data.video.url);
                    setGeneratingVideo(false);
                    return;
                } else if (data.status === 'failed') {
                    throw new Error('Falha ao gerar videoclipe');
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkStatus, 5000);
                } else {
                    throw new Error('Tempo limite excedido');
                }
            } catch (err: any) {
                setError(err.message);
                setGeneratingVideo(false);
            }
        };

        checkStatus();
    };

    const analyzeWebsite = async () => {
        if (!websiteOrSocial.trim()) {
            setAnalysisError('Por favor, insira uma URL antes de analisar');
            return;
        }

        setAnalyzingWebsite(true);
        setAnalysisError(null);
        setWebsiteAnalysis(null);

        try {
            const response = await fetch('/api/analyze-website', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: websiteOrSocial })
            });

            const data = await response.json();
            
            if (data.success && data.data) {
                setWebsiteAnalysis(data.data);
                
                // Auto-update product name if empty
                if (!productName && data.data.brand_identity) {
                    const brandName = data.data.brand_identity.split(':')[0].trim();
                    setProductName(brandName);
                }
            } else {
                setAnalysisError(data.error || 'Erro ao analisar o site');
            }
        } catch (err: any) {
            setAnalysisError('Erro de conexão ao analisar o site');
        } finally {
            setAnalyzingWebsite(false);
        }
    };

    const generateAutoPrompt = () => {
        if (productName && targetAudience) {
            const styles: Record<string, string> = {
                upbeat: 'animada e energética',
                calm: 'calma e relaxante',
                epic: 'épica e motivacional',
                fun: 'divertida e alegre'
            };
            
            const languages: Record<string, string> = {
                'pt-BR': 'em português brasileiro',
                'en-US': 'in English',
                'es-ES': 'en español',
                'fr-FR': 'en français',
                'de-DE': 'auf Deutsch',
                'it-IT': 'in italiano'
            };
            
            let prompt = `Jingle comercial ${styles[musicStyle]} para ${productName}, direcionado a ${targetAudience}. ${languages[language]}. Aproximadamente ${duration} segundos. Melodia memorável e cativante.`;
            
            // Add website analysis context if available
            if (websiteAnalysis) {
                prompt += ` CONTEXTO DA MARCA: ${websiteAnalysis.summary}`;
                
                if (websiteAnalysis.differentiators && websiteAnalysis.differentiators.length > 0) {
                    prompt += ` DIFERENCIAIS: ${websiteAnalysis.differentiators.join(', ')}.`;
                }
                
                if (websiteAnalysis.target_values && websiteAnalysis.target_values.length > 0) {
                    prompt += ` VALORES: ${websiteAnalysis.target_values.join(', ')}.`;
                }
            } else if (websiteOrSocial.trim()) {
                // Fallback to simple context mention
                prompt += ` Contexto da marca disponível em: ${websiteOrSocial}. Use este contexto para criar um jingle alinhado com a identidade e valores da marca.`;
            }
            
            // Add important information if provided
            if (importantInfo.trim()) {
                prompt += ` IMPORTANTE: Mencionar no jingle: ${importantInfo}`;
            }
            
            setJinglePrompt(prompt);
        }
    };

    return (
        <div className="bg-brand-surface p-8 rounded-lg shadow-2xl border border-brand-border">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-2">
                🎵 Jingles Comerciais e Videoclipes
            </h2>
            <p className="text-brand-subtle mb-6">
                Crie jingles profissionais com IA e transforme em videoclipes
            </p>

            <div className="space-y-6">
                {/* Product Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Nome do Produto/Marca
                        </label>
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            className="w-full px-4 py-2 bg-brand-input-bg border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary"
                            placeholder="Ex: FastFood Delivery"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Público-Alvo
                        </label>
                        <input
                            type="text"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            className="w-full px-4 py-2 bg-brand-input-bg border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary"
                            placeholder="Ex: Jovens 18-35 anos"
                        />
                    </div>
                </div>

                {/* Website/Social Media */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        🌐 Site, Instagram ou Rede Social (Opcional)
                    </label>
                    <input
                        type="text"
                        value={websiteOrSocial}
                        onChange={(e) => setWebsiteOrSocial(e.target.value)}
                        className="w-full px-4 py-2 bg-brand-input-bg border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary"
                        placeholder="Ex: www.minhaempresa.com.br ou @minhaempresa"
                    />
                    <p className="text-xs text-brand-subtle mt-1">
                        A IA irá analisar o conteúdo para criar um jingle mais personalizado e alinhado com sua marca
                    </p>
                </div>

                {/* Music Style and Language */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Estilo Musical
                        </label>
                        <select
                            value={musicStyle}
                            onChange={(e) => setMusicStyle(e.target.value)}
                            className="w-full px-4 py-2 bg-brand-input-bg border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="upbeat">Animado / Pop</option>
                            <option value="calm">Calmo / Relaxante</option>
                            <option value="epic">Épico / Motivacional</option>
                            <option value="fun">Divertido / Alegre</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            🌍 Idioma do Jingle
                        </label>
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-4 py-2 bg-brand-input-bg border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="pt-BR">🇧🇷 Português (BR)</option>
                            <option value="en-US">🇺🇸 English (US)</option>
                            <option value="es-ES">🇪🇸 Español</option>
                            <option value="fr-FR">🇫🇷 Français</option>
                            <option value="de-DE">🇩🇪 Deutsch</option>
                            <option value="it-IT">🇮🇹 Italiano</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Duração Aproximada
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full px-4 py-2 bg-brand-input-bg border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary"
                        >
                            <option value="15">15 segundos</option>
                            <option value="30">30 segundos</option>
                            <option value="60">60 segundos</option>
                        </select>
                    </div>
                </div>

                {/* Important Info */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        📌 Informações Importantes (Opcional)
                    </label>
                    <input
                        type="text"
                        value={importantInfo}
                        onChange={(e) => setImportantInfo(e.target.value)}
                        className="w-full px-4 py-2 bg-brand-input-bg border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary"
                        placeholder="Ex: Telefone (11) 9999-9999, Endereço Rua Principal 123, Slogan 'A melhor pizza da cidade'"
                    />
                    <p className="text-xs text-brand-subtle mt-1">
                        Adicione informações que DEVEM aparecer no jingle (telefone, endereço, slogan, promoção, etc)
                    </p>
                </div>

                {/* Instrumental Option */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="instrumental"
                        checked={instrumental}
                        onChange={(e) => setInstrumental(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label htmlFor="instrumental" className="text-sm">
                        Instrumental (sem vocais)
                    </label>
                </div>

                {/* Prompt */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">
                            Descrição do Jingle
                        </label>
                        <button
                            onClick={generateAutoPrompt}
                            className="text-sm text-brand-primary hover:underline"
                        >
                            ✨ Gerar Automático
                        </button>
                    </div>
                    <textarea
                        value={jinglePrompt}
                        onChange={(e) => setJinglePrompt(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 bg-brand-input-bg border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary"
                        placeholder="Descreva o jingle que você quer criar..."
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Generate Jingle Button */}
                <button
                    onClick={generateJingle}
                    disabled={generatingMusic}
                    className="w-full py-3 px-6 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {generatingMusic ? '🎵 Gerando Jingle...' : '🎵 Gerar Jingle'}
                </button>

                {/* Music Player */}
                {musicUrl && (
                    <div className="p-6 bg-brand-soft-bg rounded-lg border border-brand-border">
                        <h3 className="font-bold mb-3">✅ Jingle Gerado!</h3>
                        <audio controls className="w-full mb-4">
                            <source src={musicUrl} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                        <button
                            onClick={generateVideoClip}
                            disabled={generatingVideo}
                            className="w-full py-2 px-4 bg-brand-primary text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generatingVideo ? '🎬 Gerando Videoclipe...' : '🎬 Criar Videoclipe'}
                        </button>
                    </div>
                )}

                {/* Video Player */}
                {videoUrl && (
                    <div className="p-6 bg-brand-soft-bg rounded-lg border border-brand-border">
                        <h3 className="font-bold mb-3">🎬 Videoclipe Pronto!</h3>
                        <video controls className="w-full rounded-lg">
                            <source src={videoUrl} type="video/mp4" />
                            Seu navegador não suporta o elemento de vídeo.
                        </video>
                        <div className="mt-4 flex gap-2">
                            <a
                                href={musicUrl!}
                                download
                                className="flex-1 py-2 px-4 bg-brand-secondary text-white text-center font-semibold rounded-lg hover:bg-opacity-90"
                            >
                                ⬇️ Baixar Jingle
                            </a>
                            <a
                                href={videoUrl}
                                download
                                className="flex-1 py-2 px-4 bg-brand-secondary text-white text-center font-semibold rounded-lg hover:bg-opacity-90"
                            >
                                ⬇️ Baixar Vídeo
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JingleCreatorForm;
