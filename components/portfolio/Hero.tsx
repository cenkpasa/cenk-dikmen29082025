
import React from 'react';
import { TypeAnimation } from 'react-type-animation';
import { useLanguage } from '@/contexts/LanguageContext';

const Hero = () => {
    const { t } = useLanguage();

    return (
        <section className="text-center min-h-[60vh] flex flex-col justify-center items-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-cnk-txt-primary-light mb-4">
                <span className="block mb-2 text-lg md:text-xl font-medium text-cnk-txt-secondary-light">Merhaba, ben</span>
                <TypeAnimation
                    sequence={[
                        'Cenk Dikmen',
                        2000,
                        'Bir Yazılım Geliştirici',
                        2000,
                        'Bir Teknoloji Tutkunu',
                        2000,
                    ]}
                    wrapper="span"
                    cursor={true}
                    repeat={Infinity}
                    className="text-cnk-accent-primary"
                />
            </h1>
            <p className="text-lg md:text-xl text-cnk-txt-muted-light max-w-2xl mx-auto">
                {t('portfolio_subtitle')}
            </p>
            <div className="mt-8">
                <a href="#projects" className="px-8 py-3 bg-cnk-accent-primary text-white font-semibold rounded-lg shadow-lg hover:bg-cnk-accent-primary-hover transform hover:scale-105 transition-transform">
                    Projelerimi Gör
                </a>
            </div>
        </section>
    );
};

export default Hero;
