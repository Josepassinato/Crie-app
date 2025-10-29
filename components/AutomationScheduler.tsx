import React, { useContext } from 'react';
import { Schedule } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';

interface AutomationSchedulerProps {
    schedule?: Schedule;
    setSchedule: (schedule: Schedule) => void;
    isDisabled?: boolean;
}

const AutomationScheduler: React.FC<AutomationSchedulerProps> = ({ schedule, setSchedule, isDisabled = false }) => {
    const { t } = useContext(LanguageContext);

    const handleToggle = () => {
        if (schedule) {
            setSchedule({ ...schedule, isEnabled: !schedule.isEnabled });
        }
    };

    const handlePostsPerDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (schedule) {
            const count = parseInt(e.target.value, 10);
            const newTimes = Array.from({ length: count }, (_, i) => schedule.times[i] || '09:00');
            setSchedule({ ...schedule, postsPerDay: count, times: newTimes });
        }
    };

    const handleTimeChange = (index: number, value: string) => {
        if (schedule) {
            const newTimes = [...schedule.times];
            newTimes[index] = value;
            setSchedule({ ...schedule, times: newTimes });
        }
    };

    return (
        <div className={`space-y-6 ${isDisabled ? 'opacity-50' : ''}`}>
            <div>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-brand-text">{t('automation')}</h2>
                    <button
                        onClick={handleToggle}
                        disabled={isDisabled || !schedule}
                        className={`${
                        schedule?.isEnabled ? 'bg-brand-primary' : 'bg-slate-600'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-not-allowed`}
                        aria-pressed={schedule?.isEnabled}
                    >
                        <span className="sr-only">{t('enableAutomation')}</span>
                        <span
                        className={`${
                            schedule?.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>
                {isDisabled ? (
                    <p className="text-brand-subtle mt-2 text-sm">
                        {t('automationDisabledNote')}
                    </p>
                ) : (
                    <p className="text-brand-subtle mt-2 text-sm">
                        {t('automationDescription')}
                    </p>
                )}
            </div>

            {schedule?.isEnabled && !isDisabled && (
                <div className="space-y-4 animate-fade-in">
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