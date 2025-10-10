import React, { useState, useRef, useCallback, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotification } from '@/contexts/NotificationContext';

interface ProfilePictureEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (base64Image: string) => void;
}

const ProfilePictureEditor = ({ isOpen, onClose, onSave }: ProfilePictureEditorProps) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [mode, setMode] = useState<'options' | 'camera'>('options');
    const [image, setImage] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastMode = useRef<'options' | 'camera'>('options');

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStream(mediaStream);
            setMode('camera');
            lastMode.current = 'camera';
        } catch (err) {
            console.error("Camera error:", err);
            showNotification('cameraError', 'error');
        }
    }, [showNotification]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (isOpen && mode === 'camera') {
            startCamera();
        }
        if (!isOpen) {
            stopCamera();
            setMode('options');
            setImage(null);
        }
        return () => stopCamera();
    }, [isOpen, mode, startCamera, stopCamera]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                lastMode.current = 'options';
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setImage(canvas.toDataURL('image/jpeg'));
            stopCamera();
        }
    };

    const handleRetry = () => {
        setImage(null);
        if (lastMode.current === 'camera') {
            startCamera();
        }
    }

    const handleSaveImage = () => {
        if (image) {
            onSave(image);
            onClose();
        }
    };

    const renderContent = () => {
        if (image) {
            return (
                <div className="text-center">
                    <img src={image} alt={t('profilePicturePreview')} className="max-w-full max-h-80 mx-auto rounded-lg mb-4" />
                    <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={handleRetry}>{t('retakePhoto')}</Button>
                        <Button variant="primary" onClick={handleSaveImage}>{t('save')}</Button>
                    </div>
                </div>
            );
        }

        if (mode === 'camera') {
            return (
                <div className="text-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg mb-4 bg-black"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={() => { stopCamera(); setMode('options'); }}>{t('back')}</Button>
                        <Button variant="primary" onClick={handleCapture}>{t('capture')}</Button>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <Button icon="fas fa-upload" onClick={() => fileInputRef.current?.click()}>{t('uploadFromFile')}</Button>
                <Button icon="fas fa-camera" onClick={startCamera}>{t('takePhoto')}</Button>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('editProfilePicture')} size="lg">
            {renderContent()}
        </Modal>
    );
};

export default ProfilePictureEditor;