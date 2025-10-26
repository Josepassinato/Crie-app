import React, { useContext } from 'react';
import { Schedule } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';

interface AutomationSchedulerProps {
    schedule: Schedule;
    setSchedule: React.Dispatch<React.SetStateAction<Schedule>>;
}

const AutomationScheduler: React.FC<AutomationSchedulerProps> = ({ schedule, setSchedule }) => {
    const { t } = useContext(LanguageContext);

    const handleToggle = () => {
        setSchedule(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
    };

    const handlePostsPerDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const count = parseInt(e.target.value, 10);
        const newTimes = Array.from({ length: count }, (_, i) => schedule.times[i] || '09:00');
        setSchedule(prev => ({ ...prev, postsPerDay: count, times: newTimes }));
    };

    const handleTimeChange = (index: number, value: string) => {
        const newTimes = [...schedule.times];
        newTimes[index] = value;
        setSchedule(prev => ({ ...prev, times: newTimes }));
    };

    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text">{t('automation')}</h2>
                    <button
                        onClick={handleToggle}
                        className={`${
                        schedule.isEnabled ? 'bg-brand-primary' : 'bg-slate-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                        aria-pressed={schedule.isEnabled}
                    >
                        <span className="sr-only">{t('enableAutomation')}</span>
                        <span
                        className={`${
                            schedule.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>
                <p className="text-brand-subtle mt-2 text-sm">
                   {t('automationDescription')}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                   {t('automationNote')}
                </p>
            </div>

            {schedule.isEnabled && (
                <div className="space-y-4 animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-brand-subtle mb-2">
                           {t('automationGenerationMode')}
                        </label>
                        <div className="flex rounded-md shadow-sm">
                            <button onClick={() => setSchedule(prev => ({ ...prev, appMode: 'product' }))} className={`relative inline-flex items-center justify-center w-1/2 rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${schedule.appMode === 'product' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>
                               {t('productPost')}
                            </button>
                            <button onClick={() => setSchedule(prev => ({ ...prev, appMode: 'content' }))} className={`relative -ml-px inline-flex items-center justify-center w-1/2 rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${schedule.appMode === 'content' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>
                               {t('contentPost')}
                            </button>
                        </div>
                    </div>

                    {schedule.appMode === 'product' && (
                        <div className="animate-fade-in">
                            <label className="block text-sm font-medium text-brand-subtle mb-2">{t('automationOutputFormat')}</label>
                            <div className="flex rounded-md shadow-sm">
                                <button onClick={() => setSchedule(prev => ({ ...prev, outputType: 'image' }))} className={`relative inline-flex items-center justify-center w-1/2 rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${schedule.outputType === 'image' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>{t('image')}</button>
                                <button onClick={() => setSchedule(prev => ({ ...prev, outputType: 'video' }))} className={`relative -ml-px inline-flex items-center justify-center w-1/2 rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-600 focus:z-10 ${schedule.outputType === 'video' ? 'bg-brand-primary text-slate-900' : 'bg-slate-800 text-brand-subtle hover:bg-slate-700'}`}>{t('video')}</button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="posts-per-day" className="block text-sm font-medium text-brand-subtle mb-2">
                            {t('postsPerDay')}
                        </label>
                        <select
                            id="posts-per-day"
                            value={schedule.postsPerDay}
                            onChange={handlePostsPerDayChange}
                            className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text"
                        >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {schedule.times.map((time, index) => (
                            <div key={index}>
                                <label htmlFor={`time-${index}`} className="block text-sm font-medium text-brand-subtle mb-2">
                                    {t('time')} {index + 1}
                                </label>
                                <input
                                    type="time"
                                    id={`time-${index}`}
                                    value={time}
                                    onChange={(e) => handleTimeChange(index, e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-600 bg-slate-900 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 text-brand-text"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutomationScheduler;