import React, { useState, useCallback, useContext } from 'react';
import { GeneratedContent, AppMode, MediaType, ContentMarketingPost, ProductPostContent } from '../types.ts';
import { LanguageContext } from '../contexts/LanguageContext';

interface OutputDisplayProps {
  generatedContent: GeneratedContent | null;
  isLoading: boolean;
  error: string | null;
  appMode: AppMode;
  outputType: MediaType; // Kept for product mode spinner message
}

const Spinner: React.FC<{ message: string; subtext: string; }> = ({ message, subtext }) => (
  <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary"></div>
    <p className="text-lg text-brand-subtle">{message}</p>
    <p className="text-sm text-slate-500">{subtext}</p>
  </div>
);

const Placeholder: React.FC<{appMode: AppMode}> = ({ appMode }) => {
    const { t } = useContext(LanguageContext);
    const title = appMode === 'product' ? t('productPlaceholderTitle') : t('contentPlaceholderTitle');
    const subtitle = t('placeholderSubtitle');

    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-brand-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-brand-text">{title}</h3>
            <p className="mt-1">{subtitle}</p>
        </div>
    );
}

const dataURLtoFile = async (dataUrl: string, filename: string): Promise<File | null> => {
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
    } catch (error) {
        console.error("Error converting data URL to File:", error);
        return null;
    }
};

const ShareButton: React.FC<{ textToShare: string; mediaUrls: string[]; mediaType: MediaType; shareId: string; }> = ({ textToShare, mediaUrls, mediaType, shareId }) => {
    const { t } = useContext(LanguageContext);
    const [feedback, setFeedback] = useState('');

    const showFeedback = (message: string) => {
        setFeedback(message);
        setTimeout(() => setFeedback(''), 2000);
    };

    const handleShare = async () => {
        const mediaUrl = mediaUrls[0]; // Always share the first media item
        const fileExtension = mediaType === 'video' ? 'mp4' : 'png';
        const fileName = `${shareId.toLowerCase().replace(/\s+/g, '-')}.${fileExtension}`;
        const file = await dataURLtoFile(mediaUrl, fileName);
        
        const shareData: ShareData = {
            text: textToShare,
            files: file ? [file] : [],
        };

        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.log('Share cancelled or failed', error);
            }
        } else {
             // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(textToShare).then(() => {
                showFeedback(t('textCopied'));
            }, () => {
                showFeedback(t('copyFailed'));
            });
        }
    };

    const isShareSupported = typeof navigator.share === 'function';

    return (
        <button
            onClick={handleShare}
            className="px-4 py-1.5 text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-md transition-colors flex items-center space-x-2"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367 2.684z" />
            </svg>
            <span>{feedback || (isShareSupported ? t('share') : t('copyText'))}</span>
        </button>
    );
};


const OutputDisplay: React.FC<OutputDisplayProps> = ({ generatedContent, isLoading, error, appMode, outputType }) => {
  const { t } = useContext(LanguageContext);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'instagram' | 'facebook' | 'linkedin' | 'tiktok'>('instagram');

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

  const handleDownload = useCallback(async () => {
      if (!generatedContent) return;

      setIsDownloading(true);
      try {
          if ('mediaUrls' in generatedContent) { // ContentMarketingPost
              const content = generatedContent as ContentMarketingPost;
              const fileExtension = content.mediaType === 'video' ? 'mp4' : 'png';
              for (let i = 0; i < content.mediaUrls.length; i++) {
                  const url = content.mediaUrls[i];
                  const fileName = `content-post-${i + 1}.${fileExtension}`;
                  await downloadFile(url, fileName);
                  if (i < content.mediaUrls.length - 1) {
                      await new Promise(resolve => setTimeout(resolve, 300));
                  }
              }
          } else { // ProductPostContent
              const content = generatedContent as ProductPostContent;
              const isVideo = content.mediaType === 'video';
              const fileName = `${content.productName.toLowerCase().replace(/\s+/g, '-')}.${isVideo ? 'mp4' : 'png'}`;
              await downloadFile(content.mediaUrl, fileName);
          }
      } catch (err) {
          console.error("Download error:", err);
          alert(t('downloadAlertError'));
      } finally {
          setIsDownloading(false);
      }
  }, [generatedContent, t]);


  const renderProductPost = (content: ProductPostContent) => (
      <>
        <div>
            <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-brand-text">{t('generatedVisual')}</h3>
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-4 py-1.5 text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>{isDownloading ? t('saving') : t('saveMedia')}</span>
                </div>
            </button>
            </div>
            {content.mediaType === 'image' ? (
                <img src={content.mediaUrl} alt={t('generatedPromotionalAlt')} className="w-full rounded-lg shadow-lg border border-slate-700" />
            ) : (
                <video src={content.mediaUrl} controls autoPlay loop muted className="w-full rounded-lg shadow-lg border border-slate-700" >
                {t('videoTagError')}
                </video>
            )}
        </div>
        <div>
            <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-bold text-brand-text">{t('postText')}</h3>
             <ShareButton 
                textToShare={content.postText} 
                mediaUrls={[content.mediaUrl]}
                mediaType={content.mediaType}
                shareId={content.productName}
             />
            </div>
            <div className="bg-slate-900/50 p-4 rounded-md whitespace-pre-wrap text-brand-subtle text-sm border border-slate-700 font-mono">
                {content.postText}
            </div>
        </div>
    </>
  );

  const renderContentPost = (content: ContentMarketingPost) => {
      const isCarousel = content.mediaType === 'image' && content.mediaUrls.length > 1;
      const isVideo = content.mediaType === 'video';
      
      const downloadButtonText = isDownloading 
        ? t('saving') 
        : (isVideo ? t('saveMedia') : (isCarousel ? t('downloadAll') : t('saveImage')));

      return (
      <>
        <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-brand-text">{isVideo ? t('generatedVideo') : (isCarousel ? t('generatedCarousel') : t('generatedImage'))}</h3>
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-4 py-1.5 text-sm font-medium text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                    <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>{downloadButtonText}</span>
                    </div>
                </button>
            </div>

            {isVideo ? (
                 <video src={content.mediaUrls[0]} controls autoPlay loop muted className="w-full rounded-lg shadow-lg border border-slate-700" >
                    {t('videoTagError')}
                </video>
            ) : isCarousel ? (
                 <div className="flex overflow-x-auto space-x-4 p-2 bg-slate-900/50 rounded-lg border border-slate-700 snap-x snap-mandatory">
                    {content.mediaUrls.map((url, index) => (
                        <div key={index} className="flex-shrink-0 w-4/5 sm:w-2/3 md:w-1/2 snap-center">
                            <img src={url} alt={`${t('generatedContentMarketingAlt')} - ${index + 1}`} className="w-full rounded-md shadow-lg" />
                             <p className="text-center text-xs text-brand-subtle mt-2">{t('carouselIndicator', { current: index + 1, total: content.mediaUrls.length })}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <img src={content.mediaUrls[0]} alt={t('generatedContentMarketingAlt')} className="w-full rounded-lg shadow-lg border border-slate-700" />
            )}
        </div>
        <div>
            <div className="flex justify-between items-center mb-2">
                 <h3 className="text-xl font-bold text-brand-text">{t('adaptedTexts')}</h3>
                 <ShareButton 
                    textToShare={content.platformTexts[activeTab]} 
                    mediaUrls={content.mediaUrls}
                    mediaType={content.mediaType}
                    shareId="content-post"
                 />
            </div>
            <div className="border-b border-slate-700">
                <div className="overflow-x-auto">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('instagram')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'instagram' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-500'}`}>Instagram</button>
                        <button onClick={() => setActiveTab('facebook')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'facebook' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-500'}`}>Facebook</button>
                        <button onClick={() => setActiveTab('linkedin')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'linkedin' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-500'}`}>LinkedIn</button>
                        <button onClick={() => setActiveTab('tiktok')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'tiktok' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-subtle hover:text-brand-text hover:border-slate-500'}`}>TikTok</button>
                    </nav>
                </div>
            </div>
            <div className="mt-4 bg-slate-900/50 p-4 rounded-b-md whitespace-pre-wrap text-brand-subtle text-sm border border-slate-700 border-t-0 font-mono min-h-[150px]">
                {content.platformTexts[activeTab]}
            </div>
        </div>
    </>
    );
  };


  const renderContent = () => {
    if (isLoading) {
      const message = appMode === 'product' || (appMode === 'content' && outputType === 'video')
        ? (outputType === 'video' ? t('spinnerVideoMessage') : t('spinnerImageMessage'))
        : t('spinnerContentMessage');
      const subtext = (appMode === 'product' || appMode === 'content') && outputType === 'video' ? t('spinnerVideoSubtext') : t('spinnerSubtext');
      return <Spinner message={message} subtext={subtext} />;
    }
    if (error) {
      return <div className="text-center text-red-400 p-4 bg-red-900/20 border border-red-500/30 rounded-md">{error}</div>;
    }
    if (generatedContent) {
      // Type guard to determine which content to render
      const isContentPost = 'platformTexts' in generatedContent;
      return (
        <div className="space-y-6 animate-fade-in">
          {isContentPost 
            ? renderContentPost(generatedContent as ContentMarketingPost) 
            : renderProductPost(generatedContent as ProductPostContent)}
        </div>
      );
    }
    return <Placeholder appMode={appMode} />;
  };

  return (
    <div className="bg-brand-surface p-6 rounded-lg shadow-2xl min-h-[500px] flex flex-col justify-center border border-slate-700">
      {renderContent()}
    </div>
  );
};

export default OutputDisplay;