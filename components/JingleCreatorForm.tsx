import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext.tsx';

const JingleCreatorForm: React.FC = () => {
    const { t } = useContext(LanguageContext);
    
    const [jinglePrompt, setJinglePrompt] = useState('');
    const [productName, setProductName] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [musicStyle, setMusicStyle] = useState('upbeat');
    const [duration, setDuration] = useState('30');
    const [instrumental, setInstrumental] = useState(false);
    
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

    const generateAutoPrompt = () => {
        if (productName && targetAudience) {
            const styles: Record<string, string> = {
                upbeat: 'animada e energética',
                calm: 'calma e relaxante',
                epic: 'épica e motivacional',
                fun: 'divertida e alegre'
            };
            
            const prompt = `Jingle comercial ${styles[musicStyle]} para ${productName}, direcionado a ${targetAudience}. Aproximadamente ${duration} segundos. Melodia memorável e cativante.`;
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

                {/* Music Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
