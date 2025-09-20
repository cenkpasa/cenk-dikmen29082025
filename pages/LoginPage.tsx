
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotification } from '@/contexts/NotificationContext';
import Button from '@/components/common/Button';
import { ASSETS, PASSWORD_MIN_LENGTH } from '@/constants';
import { api } from '@/services/apiService';
import Input from '@/components/common/Input';
import UserAvatar from '@/components/assets/UserAvatar';

type View = 'login' | 'forgot_password' | 'verify_code' | 'reset_password';

const LoginPage = () => {
    const { login, resetPassword } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    
    const [view, setView] = useState<View>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [loginState, setLoginState] = useState({ username: '', password: '', rememberMe: false });
    const [resetState, setResetState] = useState({ email: '', code: '', newPassword: '', confirmPassword: '' });

    const handleLoginStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        setLoginState(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
    };

    const handleResetStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setResetState(prev => ({ ...prev, [id]: value }));
    };
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const { username, password, rememberMe } = loginState;
        const result = await login(username, password, rememberMe);
        if (result.success) {
            showNotification(result.messageKey, 'success', { username });
        } else {
            setError(t(result.messageKey));
        }
        setIsLoading(false);
    };
    
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await api.sendPasswordResetCode(resetState.email);
        if (result.success) {
            showNotification(result.messageKey, 'success');
            setView('verify_code');
        } else {
            setError(t(result.messageKey));
        }
        setIsLoading(false);
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await api.verifyPasswordResetCode(resetState.email, resetState.code);
        if (result.success) {
            showNotification(result.messageKey, 'info');
            setView('reset_password');
        } else {
            setError(t(result.messageKey));
        }
        setIsLoading(false);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const { email, code, newPassword, confirmPassword } = resetState;
        if (newPassword !== confirmPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }
        if (newPassword.length < PASSWORD_MIN_LENGTH) {
            setError(t('passwordTooShort', { minLength: String(PASSWORD_MIN_LENGTH) }));
            return;
        }
        setIsLoading(true);
        const result = await resetPassword(email, newPassword, code);
        if (result.success) {
            showNotification(result.messageKey, 'success');
            changeView('login');
        } else {
            setError(t(result.messageKey));
        }
        setIsLoading(false);
    };
    
    const changeView = (newView: View) => {
        setError('');
        const emailToCarryOver = (newView === 'forgot_password' && view === 'login') ? loginState.username : resetState.email;
        setLoginState({ username: '', password: '', rememberMe: false });
        setResetState({ email: emailToCarryOver, code: '', newPassword: '', confirmPassword: '' });
        setView(newView);
    };

    const renderContent = () => {
        switch (view) {
            case 'forgot_password':
                return (
                    <>
                        <h2 className="text-xl text-slate-200 mb-2 text-center font-semibold">{t('forgotPassword')}</h2>
                        <p className="text-slate-300 text-sm mb-6 text-center">{t('forgotPasswordPrompt')}</p>
                        <form onSubmit={handleSendCode}>
                           <Input id="email" variant="transparent" type="email" value={resetState.email} onChange={handleResetStateChange} placeholder={t('enterYourEmail')} required />
                           <Button type="submit" isLoading={isLoading} variant="login" className="w-full !py-3">{t('sendResetCode')}</Button>
                           <button type="button" onClick={() => changeView('login')} className="block w-full text-center text-sm text-slate-300 mt-4 hover:underline">{t('backToLogin')}</button>
                        </form>
                    </>
                );
            case 'verify_code':
                 return (
                    <>
                        <h2 className="text-xl text-slate-200 mb-2 text-center font-semibold">{t('verifyCode')}</h2>
                        <p className="text-slate-300 text-sm mb-6 text-center">{t('enterResetCode')}</p>
                        <form onSubmit={handleVerifyCode}>
                            <Input id="code" variant="transparent" type="text" value={resetState.code} onChange={handleResetStateChange} placeholder={t('verificationCode')} required />
                            <Button type="submit" isLoading={isLoading} variant="login" className="w-full !py-3">{t('verifyCode')}</Button>
                        </form>
                    </>
                );
            case 'reset_password':
                 return (
                     <>
                        <h2 className="text-xl text-slate-200 mb-2 text-center font-semibold">{t('setNewPassword')}</h2>
                        <form onSubmit={handleResetPassword}>
                            <Input id="newPassword" variant="transparent" type="password" value={resetState.newPassword} onChange={handleResetStateChange} placeholder={t('newPassword')} required />
                            <Input id="confirmPassword" variant="transparent" type="password" value={resetState.confirmPassword} onChange={handleResetStateChange} placeholder={t('confirmNewPassword')} required />
                            <Button type="submit" isLoading={isLoading} variant="login" className="w-full !py-3">{t('save')}</Button>
                        </form>
                    </>
                );
            case 'login':
            default:
                return (
                    <>
                        <h2 className="text-2xl text-slate-200 mb-6 text-center font-bold tracking-wider">{t('loginFormTitle')}</h2>
                        <form onSubmit={handleLogin}>
                            <Input id="username" variant="transparent" type="text" value={loginState.username} onChange={handleLoginStateChange} placeholder={t('username')} required autoComplete="username" />
                            <Input id="password" variant="transparent" type="password" value={loginState.password} onChange={handleLoginStateChange} placeholder={t('password')} required autoComplete="current-password" />
                            <div className="flex items-center justify-between text-sm my-4">
                                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={loginState.rememberMe}
                                        onChange={handleLoginStateChange}
                                        className="h-4 w-4 rounded border-slate-500 bg-transparent text-emerald-400 focus:ring-emerald-400"/>
                                    {t('keepSignedIn')}
                                </label>
                                <button type="button" onClick={() => changeView('forgot_password')} className="text-slate-300 hover:underline bg-transparent border-none cursor-pointer">{t('forgotPassword')}</button>
                            </div>
                            <Button type="submit" isLoading={isLoading} variant="login" className="w-full !py-3">{t('loginBtn')}</Button>
                        </form>
                    </>
                );
        }
    };
    
    return (
        <div 
            className="flex min-h-screen items-center justify-center bg-cover bg-center p-4"
            style={{ backgroundImage: `url(${ASSETS.LOGIN_BG_CNK_OFFICE})` }}
        >
             <div className="absolute inset-0 bg-black/50"></div>
            <div className="w-full max-w-sm z-10">
                <div className="relative rounded-lg bg-slate-800/60 backdrop-blur-sm p-8 shadow-2xl pt-16">
                     <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <UserAvatar className="h-24 w-24 border-4 border-slate-600 shadow-lg"/>
                    </div>
                    {error && <p className="text-center text-sm text-red-400 mb-4 bg-red-500/10 p-2 rounded-md border border-red-500/20">{error}</p>}
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
