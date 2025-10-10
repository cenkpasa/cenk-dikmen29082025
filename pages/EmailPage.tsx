import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/common/Button';

const EmailPage = () => {
    const { t } = useLanguage();

    const openCorporateEmail = () => {
        window.open('https://mail.kurumsaleposta.com/', '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="rounded-cnk-card bg-cnk-panel-light shadow-md flex flex-col items-center justify-center p-8 text-center" style={{ height: 'calc(100vh - 120px)' }}>
            <i className="fas fa-envelope-open-text text-5xl text-cnk-accent-primary mb-4"></i>
            <h3 className="text-xl font-bold text-cnk-txt-primary-light">{t('corporateEmailTitle')}</h3>
            <p className="text-cnk-txt-secondary-light my-2 max-w-md">{t('corporateEmailBody')}</p>
            <Button onClick={openCorporateEmail} icon="fas fa-external-link-alt">
                {t('openCorporateEmail')}
            </Button>
        </div>
    );
};

export default EmailPage;