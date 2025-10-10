
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TECH_STACK } from '@/constants';

const TechStack = () => {
    const { t } = useLanguage();

    return (
        <section id="tech-stack" className="py-12 md:py-20 bg-cnk-bg-light">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-cnk-txt-primary-light mb-4">{t('tech_stack_title')}</h2>
            <p className="text-center text-cnk-txt-muted-light mb-12">{t('tech_stack_description')}</p>

            <div className="max-w-4xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-8">
                {TECH_STACK.map(tech => (
                    <div key={tech.name} className="flex flex-col items-center justify-center gap-2 p-4 bg-cnk-panel-light rounded-lg shadow-md border border-cnk-border-light transform hover:scale-110 hover:-translate-y-1 transition-transform duration-300">
                        <i className={`${tech.icon} text-4xl ${tech.color}`}></i>
                        <p className="text-sm font-semibold text-cnk-txt-secondary-light mt-2">{tech.name}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default TechStack;
