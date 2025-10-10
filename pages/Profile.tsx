import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ProfilePictureEditor from '../components/common/ProfilePictureEditor';

const Profile = () => {
    const { currentUser, changePassword, logout, updateUser } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError(t('passwordTooShort'));
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError(t('passwordsDoNotMatch'));
            return;
        }

        setIsLoading(true);
        if(currentUser) {
            const result = await changePassword(currentUser.id, oldPassword, newPassword);
            if (result.success) {
                showNotification(result.messageKey, 'success');
                showNotification('passwordChangeRequiresLogin', 'info');
                setTimeout(() => {
                    logout();
                }, 1500);
            } else {
                setError(t(result.messageKey));
            }
        }
        setIsLoading(false);
    };

    const handleAvatarSave = async (base64Image: string) => {
        if (currentUser) {
            const result = await updateUser({ ...currentUser, avatar: base64Image });
            if (result.success) {
                showNotification(result.messageKey, 'success');
            } else {
                showNotification(result.messageKey, 'error');
            }
        }
    };

    if (!currentUser) {
        return <p>{t('noUserLoggedIn')}</p>;
    }

    return (
        <div>
            <div className="max-w-2xl rounded-cnk-card border border-cnk-border-light bg-cnk-panel-light p-6 shadow-md">
                <div className="flex items-center justify-center mb-6">
                    <div className="relative group w-24 h-24">
                        <img src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} alt="Avatar" className="w-24 h-24 rounded-full object-cover shadow-md" />
                         <button
                            type="button"
                            onClick={() => setIsAvatarEditorOpen(true)}
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={t('editPhoto')}
                        >
                            <i className="fas fa-camera text-2xl"></i>
                        </button>
                    </div>
                </div>

                <h3 className="mb-4 text-xl font-semibold text-cnk-accent-primary">{t('userInfo')}</h3>
                <div className="space-y-4">
                     <Input label={t('username')} id="prof_username" value={currentUser.username} readOnly />
                     <Input label={t('role')} id="prof_role" value={t(currentUser.role)} readOnly />
                </div>

                <div className="mt-8 border-t border-cnk-border-light pt-6">
                     <h3 className="mb-4 text-xl font-semibold text-cnk-accent-primary">{t('changePassword')}</h3>
                     <form onSubmit={handlePasswordChange} className="space-y-4">
                        <Input type="password" label={t('oldPassword')} id="old_password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                        <Input type="password" label={t('newPassword')} id="new_password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                        <Input type="password" label={t('confirmNewPassword')} id="confirm_new_password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required />
                        
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        
                        <div className="flex justify-end">
                            <Button type="submit" variant="primary" isLoading={isLoading}>{t('save')}</Button>
                        </div>
                     </form>
                </div>
            </div>
            {isAvatarEditorOpen && (
                <ProfilePictureEditor
                    isOpen={isAvatarEditorOpen}
                    onClose={() => setIsAvatarEditorOpen(false)}
                    onSave={handleAvatarSave}
                />
            )}
        </div>
    );
};

export default Profile;