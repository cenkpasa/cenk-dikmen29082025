import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/apiService';
import { ChatMessage } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import Button from '@/components/common/Button';

// Lottie is loaded from a script tag in index.html
declare const lottie: any;

const AIRobotWidget = () => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const robotContainerRef = useRef<HTMLDivElement>(null);
    const animationInstanceRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load Lottie animation
    useEffect(() => {
        if (robotContainerRef.current) {
            animationInstanceRef.current = lottie.loadAnimation({
                container: robotContainerRef.current,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: 'https://assets3.lottiefiles.com/packages/lf20_v92o72md.json'
            });

            return () => {
                animationInstanceRef.current?.destroy();
            };
        }
    }, []);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Set initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setTimeout(() => {
                setMessages([{ id: uuidv4(), sender: 'ai', text: t('intro_message') }]);
            }, 300);
        }
    }, [isOpen, messages.length, t]);

    const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        const userMessage = inputValue.trim();
        if (!userMessage || isLoading) return;

        setMessages(prev => [...prev, { id: uuidv4(), sender: 'user', text: userMessage }]);
        setInputValue('');
        setIsLoading(true);
        animationInstanceRef.current?.setSpeed(2.5); // Thinking animation

        try {
            const result = await api.getChatResponse(userMessage);
            if (result.success) {
                const aiMessage: ChatMessage = { id: uuidv4(), sender: 'ai', text: '' };
                setMessages(prev => [...prev, aiMessage]);

                let i = 0;
                const typingInterval = setInterval(() => {
                    if (i < result.text.length) {
                         setMessages(prev => prev.map(msg => 
                            msg.id === aiMessage.id ? { ...msg, text: result.text.substring(0, i + 1) } : msg
                        ));
                        i++;
                    } else {
                        clearInterval(typingInterval);
                        setIsLoading(false);
                        animationInstanceRef.current?.setSpeed(1); // Back to idle
                    }
                }, 40);

            } else {
                throw new Error(result.text);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: uuidv4(), sender: 'ai', text: 'Üzgünüm, bir sorun oluştu.' }]);
            setIsLoading(false);
            animationInstanceRef.current?.setSpeed(1);
        }
    }, [inputValue, isLoading]);

    return (
        <>
            <div
                ref={robotContainerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-5 right-5 w-24 h-24 md:w-32 md:h-32 cursor-pointer z-[9998] transition-transform hover:scale-110"
                title={t('ai_assistant')}
            />
            <div className={`fixed bottom-28 right-5 w-[calc(100%-2.5rem)] max-w-sm bg-cnk-panel-light rounded-cnk-card shadow-2xl border border-cnk-border-light z-[9999] flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                <div className="flex-shrink-0 p-3 bg-cnk-bg-light border-b border-cnk-border-light rounded-t-cnk-card flex justify-between items-center">
                    <h3 className="font-bold text-cnk-txt-primary-light">{t('ai_assistant')}</h3>
                    <button onClick={() => setIsOpen(false)} className="text-cnk-txt-muted-light text-2xl hover:text-cnk-txt-primary-light">&times;</button>
                </div>
                <div className="flex-grow p-4 h-80 overflow-y-auto space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <i className="fas fa-robot text-cnk-accent-primary text-xl mb-1"></i>}
                            <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-cnk-accent-primary text-white rounded-br-none' : 'bg-cnk-bg-light text-cnk-txt-secondary-light rounded-bl-none'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex-shrink-0 p-3 border-t border-cnk-border-light flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder={t('ask_a_question')}
                        className="flex-grow w-full rounded-cnk-element border border-cnk-border-light bg-cnk-panel-light p-2 text-cnk-txt-primary-light shadow-sm focus:outline-none focus:ring-1 focus:ring-cnk-accent-primary"
                        disabled={isLoading}
                    />
                    <Button type="submit" isLoading={isLoading} disabled={!inputValue.trim()}>
                        {t('send')}
                    </Button>
                </form>
            </div>
        </>
    );
};

export default AIRobotWidget;
