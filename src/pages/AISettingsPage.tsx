

import React, { useEffect, useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { AISettings } from '../types';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const Switch = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
    <label className="flex items-center justify-between p-4 bg-cnk-bg-light rounded-cnk-element border border-cnk-border-light">
        <span className="font-medium">{label}</span>
        <div onClick={() => onChange(!checked)} className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${checked ? 'bg-cnk-accent-primary' : 'bg-gray-300'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
    </label>
);


const AISettingsPage = () => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const { settings, updateSettings, loadingSettings } = useSettings();
    const { showNotification } = useNotification();
    const [localSettings, setLocalSettings] = useState<AISettings | null>(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);
    
    if (currentUser?.role !== 'admin') {
        return <p className="text-center p-4 bg-yellow-500/10 text-yellow-300 rounded-lg">{t('permissionDenied')}</p>;
    }

    if (loadingSettings || !localSettings) {
        return <Loader fullScreen />;
    }

    const handleSwitchChange = (key: keyof AISettings, value: boolean) => {
        setLocalSettings(prev => prev ? { ...prev, [key]: value } : null);
    };

    const handleInputChange = (key: keyof AISettings, value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            setLocalSettings(prev => prev ? { ...prev, [key]: numValue } : null);
        }
    };
    
    const handleSave = async () => {
        if (localSettings) {
            await updateSettings(localSettings);
            showNotification('settingsSaved', 'success');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold">Yapay Zeka Ajanı Ayarları</h1>
                <p className="text-cnk-txt-muted-light mt-1">Proaktif AI Ajanı her zaman aktiftir. Buradan ajanınızın otomasyon senaryolarını yönetebilirsiniz.</p>
            </div>
            
            <div className="bg-cnk-panel-light p-6 rounded-cnk-card shadow-md border border-cnk-border-light">
                <h2 className="text-lg font-bold mb-4">Otomasyon Senaryoları</h2>
                <div className="space-y-4">
                    <div title="AI, belirli bir süredir takip edilmeyen başarılı teklifleri tespit eder ve ilgili müşteriye göndermek üzere bir e-posta taslağı oluşturur.">
                        <Switch label="Takip Fırsatları için Otomatik E-posta Taslağı Oluştur" checked={localSettings.enableFollowUpDrafts} onChange={val => handleSwitchChange('enableFollowUpDrafts', val)} />
                    </div>
                    <div title="AI'nin bir teklifi 'takip edilmemiş' olarak değerlendirmesi için geçmesi gereken gün sayısı.">
                        <Input type="number" label="Takip için beklenecek gün sayısı" value={String(localSettings.followUpDays)} onChange={e => handleInputChange('followUpDays', e.target.value)} />
                    </div>
                    <hr className="my-4"/>

                    <div title="AI, belirli bir süredir kendisiyle etkileşime geçilmeyen (yeni teklif, randevu, görüşme vb.) aktif müşterileri tespit ederek bir uyarı oluşturur.">
                        <Switch label="Risk Altındaki Müşteriler için Uyarı Oluştur" checked={localSettings.enableAtRiskAlerts} onChange={val => handleSwitchChange('enableAtRiskAlerts', val)} />
                    </div>
                    <div title="Bir müşterinin 'riskli' olarak işaretlenmesi için üzerinden geçmesi gereken etkileşim olmayan gün sayısı.">
                        <Input type="number" label="Bir müşteriyi 'riskli' saymak için geçmesi gereken etkileşimsiz gün sayısı" value={String(localSettings.atRiskDays)} onChange={e => handleInputChange('atRiskDays', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} size="lg">{t('save')}</Button>
            </div>
        </div>
    );
};

export default AISettingsPage;
