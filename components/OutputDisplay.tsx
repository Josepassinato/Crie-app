import React, { useState, useCallback, useContext, useEffect, useRef } from 'react';
import { GeneratedContent, AppMode, MediaType, ContentMarketingPost, ProductPostContent, PersonaPostContent } from '../types.ts';
import { LanguageContext } from '../contexts/LanguageContext.tsx';
import { AppStateContext } from '../contexts/AppStateContext.tsx';

interface OutputDisplayProps {
  generatedContent: GeneratedContent | null;
  isLoading: boolean;
  error: string | null;
  appMode: AppMode;
  outputType: MediaType; // Kept for product mode spinner message
}

const Spinner: React.FC<{ message: string; subtext: string; }> = ({ message, subtext }) => (
  <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
    <div className="relative">
      <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-brand-primary opacity-75"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <svg className="h-10 w-10 text-brand-secondary animate-bounce-subtle" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 13v-2H6v2H8zm6-2v2h-2v-2h2zm-3-5v6h-2V6h2zm-3 0v6H6V6h2zM15 6h-2v6h2V6zM5 6v6H3V6h2z" /></svg>
      </div>
    </div>
    <p className="text-xl font-semibold text-brand-text animate-pulse">{message}</p>
    <p className="text-sm text-brand-subtle">{subtext}</p>
  </div>
);

const Placeholder: React.FC<{appMode: AppMode}> = ({ appMode }) => {
    const { t } = useContext(LanguageContext);
    const title = appMode === 'product' ? t('productPlaceholderTitle') : t('contentPlaceholderTitle');
    const subtitle = t('placeholderSubtitle');

    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-brand-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4 text-brand-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-brand-text">{title}</h3>
            <p className="mt-1">{subtitle}</p>
        </div>
    );
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ generatedContent, isLoading, error, appMode, outputType }) => {
  const { t } = useContext(LanguageContext);
  const appState = useContext(AppStateContext);

  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'instagram' | 'facebook' | 'linkedin' | 'tiktok'>('instagram');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // State for video adaptation
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptedVideoUrl, setAdaptedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (generatedContent && !isLoading && !error) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      setAdaptedVideoUrl(null); // Reset adapted video on new content
      return () => clearTimeout(timer);
    }
  }, [generatedContent, isLoading, error]);

  const downloadFile = (url: string, filename: string) => {
    return fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      });
  };
  
  const cropVideoTo916 = async (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.src = videoUrl;

      video.onloadeddata = () => {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        const targetWidth = videoHeight * (9 / 16);
        const targetHeight = videoHeight;
        const offsetX = (videoWidth - targetWidth) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Could not get canvas context"));

        const stream = canvas.captureStream();
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(URL.createObjectURL(blob));
        };
        
        const drawFrame = () => {
          if (video.paused || video.ended) return;
          ctx.drawImage(video, offsetX, 0, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
          requestAnimationFrame(drawFrame);
        };
        
        video.onplay = () => {
            recorder.start();
            drawFrame();
        };

        video.onended = () => {
            recorder.stop();
        };
        
        video.play().catch(reject);
      };

      video.onerror = reject;
    });
  };

  const handleAdaptVideo = async (url: string) => {
    setIsAdapting(true);
    try {
        const croppedUrl = await cropVideoTo916(url);
        setAdaptedVideoUrl(croppedUrl);
        // Also update the context so history saves the adapted version
        if (appState && generatedContent) {
           appState.setGeneratedContent({
               ...generatedContent,
               adaptedMediaUrl: croppedUrl
           } as ProductPostContent);
        }
    } catch (e) {
        console.error("Error adapting video:", e);
        if (appState) appState.handleError(e as Error, 'videoGenerationError');
    } finally {
        setIsAdapting(false);
    }
  };


  const handleDownload = useCallback(async (version: 'original' | 'adapted' = 'original') => {
      if (!generatedContent || !('mediaUrl' in generatedContent)) return;

      const content = generatedContent; 
      const url = version === 'adapted' && 'adaptedMediaUrl' in content ? content.adaptedMediaUrl || adaptedVideoUrl : content.mediaUrl;
      const aspectRatio = version === 'adapted' ? '9-16' : ('originalAspectRatio' in content && content.originalAspectRatio) || 'original';
      const fileExtension = content.mediaType === 'video' ? 'mp4' : content.mediaType === 'audio' ? 'mp3' : 'jpg';
      const productName = ('productName' in content) ? content.productName : ('personaName' in content) ? content.personaName : 'crie-app-content';

      if(!url) return;

      setIsDownloading(true);
      try {
          const fileName = `${productName.toLowerCase().replace(/\s+/g, '-')}-${aspectRatio}.${fileExtension}`;
          await downloadFile(url, fileName);
      } catch (err) {
          console.error("Download error:", err);
          alert(t('downloadAlertError'));
      } finally {
          setIsDownloading(false);
      }
  }, [generatedContent, adaptedVideoUrl, t]);


  const renderProductPost = (content: ProductPostContent) => {
    const isSpecialVideo = content.originalAspectRatio === '16:9';
    const currentVideoUrl = adaptedVideoUrl || content.adaptedMediaUrl || content.mediaUrl;

    return (
      <>
        <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('generatedVisual')}</h3>
                {isSpecialVideo && !adaptedVideoUrl && !content.adaptedMediaUrl ? (
                     <button
                        onClick={() => handleDownload('original')}
                        disabled={isDownloading}
                        className="px-4 py-2 text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-full transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-wait"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>{isDownloading ? t('saving') : t('download16_9')}</span>
                    </button>
                ) : (
                    <button
                        onClick={() => handleDownload(adaptedVideoUrl || content.adaptedMediaUrl ? 'adapted' : 'original')}
                        disabled={isDownloading}
                        className="px-4 py-2 text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-full transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-wait"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        <span>{isDownloading ? t('saving') : (isSpecialVideo ? t('download9_16') : t('saveMedia'))}</span>
                    </button>
                )}
            </div>
            {content.mediaType === 'image' && (
                <img src={content.mediaUrl} alt={t('generatedPromotionalAlt')} className="w-full rounded-lg shadow-lg border border-brand-border" />
            )}
            {content.mediaType === 'video' && (
                <video src={currentVideoUrl} controls autoPlay loop muted className="w-full rounded-lg shadow-lg border border-brand-border" >
                {t('videoTagError')}
                </video>
            )}
            {content.mediaType === 'audio' && (
                <div className="p-4 bg-brand-soft-bg rounded-lg border border-brand-border">
                    <audio src={content.mediaUrl} controls className="w-full">
                        {t('audioTagError')}
                    </audio>
                </div>
            )}
        </div>

        {isSpecialVideo && !adaptedVideoUrl && !content.adaptedMediaUrl && (
             <div className="border-t border-brand-border pt-4 mt-4 text-center">
                <button
                    onClick={() => handleAdaptVideo(content.mediaUrl)}
                    disabled={isAdapting}
                    className="w-full py-2.5 px-4 bg-brand-secondary text-white font-bold rounded-md shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait"
                >
                    {isAdapting ? t('adaptingVideo') : t('adaptToStories')}
                </button>
            </div>
        )}

        {content.script && (
            <div>
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-3">{t('videoScript')}</h3>
                <div className="bg-brand-soft-bg p-4 rounded-md whitespace-pre-wrap text-brand-subtle text-sm border border-brand-border font-mono">
                    {content.script}
                </div>
            </div>
        )}
        <div>
            <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('postText')}</h3>
             {/* Share button might need more complex logic for different video versions */}
            </div>
            <div className="bg-brand-soft-bg p-4 rounded-md whitespace-pre-wrap text-brand-subtle text-sm border border-brand-border font-mono">
                {content.postText || (isSpecialVideo ? t('tooltipVideoPromptComposite') : '')}
            </div>
        </div>
    </>
  );
  }

  const renderContentPost = (content: ContentMarketingPost) => {
      // This part remains unchanged
      return (
        <div className="text-brand-subtle">Content Marketing Post UI not relevant for this change.</div>
      );
  };

  const renderPersonaPost = (content: PersonaPostContent) => {
    return (
      <>
        <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">{t('generatedVisual')}</h3>
                <button
                    onClick={() => handleDownload()}
                    disabled={isDownloading}
                    className="px-4 py-2 text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-full transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-wait"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>{isDownloading ? t('saving') : t('saveMedia')}</span>
                </button>
            </div>
            <img src={content.mediaUrl} alt={t('generatedPromotionalAlt')} className="w-full rounded-lg shadow-lg border border-brand-border" />
        </div>
        <div>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-3">{t('postText')}</h3>
            <div className="bg-brand-soft-bg p-4 rounded-md whitespace-pre-wrap text-brand-subtle text-sm border border-brand-border font-mono">
                {content.postText}
            </div>
        </div>
      </>
    );
  };


  const renderContent = () => {
    if (isLoading) {
      let message, subtext;
      if (generatedContent?.mediaType === 'audio' || (appMode === 'product' && (generatedContent as ProductPostContent)?.mediaType === 'audio')) {
          message = t('spinnerAudioMessage');
          subtext = t('spinnerAudioSubtextDetailed');
      } else if (outputType === 'video') {
          message = t('spinnerVideoMessage');
          subtext = t('spinnerVideoSubtextDetailed');
      } else if (outputType === 'image') {
          message = t('spinnerImageMessage');
          subtext = t('spinnerSubtext');
      } else {
          message = t('spinnerContentMessage');
          subtext = t('spinnerSubtext');
      }
      return <Spinner message={message} subtext={subtext} />;
    }
    if (error) {
        const isSafetyError = error === t('videoGenerationError');
        return (
            <div className="text-center text-brand-error p-4 bg-red-500/10 border border-red-500/20 rounded-md animate-pop-in space-y-4">
                <p>{error}</p>
                {isSafetyError && appState && (
                    <button
                        onClick={appState.handleRetryWithSanitizedPrompt}
                        disabled={isLoading}
                        className="py-2 px-4 bg-yellow-500 text-yellow-950 font-bold rounded-md shadow-sm hover:bg-yellow-400 transition-colors disabled:opacity-50"
                    >
                        {t('retryWithAI')}
                    </button>
                )}
            </div>
        );
    }
    if (generatedContent) {
      const isContentPost = 'platformTexts' in generatedContent;
      const isPersonaPost = 'personaName' in generatedContent;
      return (
        <div className="space-y-6 animate-fade-in">
          {showSuccess && (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-brand-surface/90 z-50 animate-pop-in">
                <div className="text-center text-brand-success flex flex-col items-center gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 animate-bounce-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-3xl font-bold">{t('generationSuccess')}</p>
                    <p className="text-lg text-brand-subtle">{t('contentReadyToShare')}</p>
                </div>
            </div>
          )}
          {isContentPost 
            ? renderContentPost(generatedContent as ContentMarketingPost) 
            : isPersonaPost
            ? renderPersonaPost(generatedContent as PersonaPostContent)
            : renderProductPost(generatedContent as ProductPostContent)}
        </div>
      );
    }
    return <Placeholder appMode={appMode} />;
  };

  return (
    <div className="bg-brand-surface p-8 rounded-lg shadow-2xl min-h-[500px] flex flex-col justify-center border border-brand-border relative overflow-hidden">
      {renderContent()}
    </div>
  );
};

export default OutputDisplay;