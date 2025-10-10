import { Project, Technology } from '@/types';

// ASSETS
// FIX: Added placeholder base64 strings for logos
const PLH_B64_CNK = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTMwIDM1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iMzUiIHJ4PSI1IiBmaWxsPSIjMWUyOTNiIi8+PHBhdGggZD0iTTggNCBIIDI4IFYgMzEgSCA4IFYgMjYgTCAxOCAyMSBMIDggMTYgViAxMSBMIDE4IDE2IEwgOCAyMSBWIDQiIHN0cm9rZT0iI2MwMDAwMCIgc3Ryb2tlV2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48dGV4dCB4PSIzNSIgeT0iMjUiIGZvbnRGYW-pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250U2l6ZT0iMjAiIGZvbnRXZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj5DTks8L3RleHQ+PHRleHQgeD0iODAiIHk9IjI1IiBmb250RmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udFNpemU9IjIwIiBmb250V2VpZ2h0PSJib2xkIiBmaWxsPSIjZjFmNWY5IiBvcGFjaXR5PSIwLjgiPlBybzwvdGV4dD48L3N2Zz4=';
const PLH_B64_BWORKS = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTUwIDQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUiIHk9IjMwIiBmb250RmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udFNpemU9IjMwIiBmb250V2VpZ2h0PSJib2xkIiBmaWxsPSIjMzM0MTU1Ij5CV29ya3M8L3RleHQ+PC9zdmc+';

export const ASSETS = {
    LOGIN_BG_CNK_OFFICE: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2832&auto=format&fit=crop',
    CNK_LOGO_BASE64: PLH_B64_CNK,
    BWORKS_LOGO_BASE64: PLH_B64_BWORKS
};

// COMPANY INFO
export const COMPANY_INFO = {
    name: 'CNK KESİCİ TAKIM',
    taxOffice: 'Ostim V.D.',
    taxNumber: '1234567890',
    phone: '+90 312 345 67 89',
    fax: '+90 312 345 67 90',
    email: 'satis@cnkkesicitakim.com.tr',
    website: 'www.cnkkesicitakim.com.tr',
    authorizedPerson: 'Cenk Dikmen'
};

// SECURITY
export const PASSWORD_MIN_LENGTH = 4;

// GEOLOCATION & SHIFTS
export const WORKPLACE_COORDS = { latitude: 39.983334, longitude: 32.766666 }; // Ostim, Ankara
export const WORKPLACE_RADIUS_KM = 1; // 1km radius to be considered "at work"
export const WORK_HOURS = {
    1: { start: '08:30', end: '18:00', lunch: 1 }, // Monday
    2: { start: '08:30', end: '18:00', lunch: 1 }, // Tuesday
    3: { start: '08:30', end: '18:00', lunch: 1 }, // Wednesday
    4: { start: '08:30', end: '18:00', lunch: 1 }, // Thursday
    5: { start: '08:30', end: '18:00', lunch: 1 }, // Friday
    6: null, // Saturday
    0: null, // Sunday
};


// LOCALIZATION
export const MESSAGES: Record<string, Record<string, string>> = {
    tr: {
        // --- Sidebar & General ---
        'dashboard': 'Dashboard',
        'crm': 'CRM',
        'customerList': 'Müşteri Listesi',
        'appointmentsTitle': 'Randevular',
        'interviewForms': 'Görüşme Formları',
        'offerManagement': 'Teklif Yönetimi',
        'salesPipeline': 'Satış Akışı',
        'email': 'E-posta',
        'personnel': 'Personel',
        'personnelManagement': 'Personel Yönetimi',
        'locationTracking': 'Konum Takibi',
        'calculationTools': 'Hesaplama Araçları',
        'aiHub': 'Yapay Zeka Merkezi',
        'settings': 'Ayarlar & Yönetim',
        'erpIntegration': 'ERP Entegrasyonu',
        'aiSettings': 'AI Ayarları',
        'reports': 'Raporlar',
        'emailDrafts': 'E-posta Taslakları',
        'reconciliation': 'Mutabakat',
        'auditLog': 'Denetim Kayıtları',
        'profileTitle': 'Profil',
        'view': 'Görüntüle',
        'edit': 'Düzenle',
        'save': 'Kaydet',
        'cancel': 'İptal',
        'delete': 'Sil',
        'close': 'Kapat',
        'areYouSure': 'Emin misiniz?',
        'success': 'Başarılı',
        'error': 'Hata',
        'warning': 'Uyarı',
        'info': 'Bilgi',
        'actions': 'İşlemler',
        'status': 'Durum',
        'active': 'Aktif',
        'passive': 'Pasif',
        'date': 'Tarih',
        'notes': 'Notlar',
        'details': 'Detaylar',
        'name': 'İsim',
        'phone': 'Telefon',
        'address': 'Adres',
        'taxNumber': 'Vergi Numarası',
        'taxOffice': 'Vergi Dairesi',
        'createdAt': 'Oluşturma Tarihi',
        'backToList': 'Listeye Dön',

        // --- Login Page ---
        'loginFormTitle': 'CRM PRO',
        'username': 'Kullanıcı Adı (E-posta)',
        'password': 'Şifre',
        'keepSignedIn': 'Oturumu açık tut',
        'forgotPassword': 'Şifremi unuttum',
        'loginBtn': 'Giriş Yap',
        'forgotPasswordPrompt': 'Şifrenizi sıfırlamak için kayıtlı e-posta adresinizi girin.',
        'enterYourEmail': 'E-posta adresinizi girin',
        'sendResetCode': 'Sıfırlama Kodu Gönder',
        'backToLogin': 'Giriş ekranına geri dön',
        'verifyCode': 'Kodu Doğrula',
        'enterResetCode': 'E-postanıza gönderilen sıfırlama kodunu girin.',
        'verificationCode': 'Doğrulama Kodu',
        'setNewPassword': 'Yeni Şifre Belirle',
        'newPassword': 'Yeni Şifre',
        'confirmNewPassword': 'Yeni Şifreyi Onayla',
        
        // --- Notifications ---
        'userNotFound': 'Kullanıcı bulunamadı.',
        'invalidPassword': 'Hatalı şifre.',
        'loggedInWelcome': 'Hoşgeldin, {username}!',
        'loggedOut': 'Başarıyla çıkış yaptınız.',
        'usernameExists': 'Bu kullanıcı adı zaten mevcut.',
        'registrationSuccess': 'Kayıt başarılı! Giriş yapabilirsiniz.',
        'passwordsDoNotMatch': 'Şifreler eşleşmiyor.',
        'passwordTooShort': 'Şifre en az {minLength} karakter olmalıdır.',
        'wrongOldPassword': 'Eski şifreniz yanlış.',
        'passwordChanged': 'Şifreniz başarıyla değiştirildi.',
        'resetPasswordSuccess': 'Şifreniz başarıyla sıfırlandı.',
        'resetCodeSent': 'Şifre sıfırlama kodu e-postanıza gönderildi.',
        'codeVerified': 'Kod doğrulandı. Yeni şifrenizi belirleyebilirsiniz.',
        'invalidCode': 'Geçersiz doğrulama kodu.',
        'permissionDenied': 'Bu işlem için yetkiniz yok.',
        'genericError': 'Bir hata oluştu. Lütfen tekrar deneyin.',
        'fieldsRequired': 'Lütfen gerekli tüm alanları doldurun.',
        'customerAdded': 'Müşteri başarıyla eklendi.',
        'customerUpdated': 'Müşteri bilgileri güncellendi.',
        'appointmentAdded': 'Randevu başarıyla eklendi.',
        'appointmentUpdated': 'Randevu bilgileri güncellendi.',
        'interviewSaved': 'Görüşme formu kaydedildi.',
        'interviewUpdated': 'Görüşme formu güncellendi.',
        'offerAdded': 'Teklif başarıyla oluşturuldu.',
        'offerUpdated': 'Teklif güncellendi.',
        'pdfDownloaded': 'PDF başarıyla indirildi.',
        'pdfError': 'PDF oluşturulurken bir hata oluştu.',
        'aiError': 'Yapay zeka servisine ulaşılamadı.',
        'descriptionEnhanced': 'Açıklama yapay zeka ile zenginleştirildi.',
        'emailSaved': 'E-posta taslağı kaydedildi.',
        'copiedToClipboard': 'Panoya kopyalandı!',
        'userUpdatedSuccess': 'Kullanıcı bilgileri başarıyla güncellendi.',
        'userAddedSuccess': 'Yeni kullanıcı başarıyla eklendi.',
        'passwordRequired': 'Yeni kullanıcı için şifre zorunludur.',
        'invalidTCKN': 'Geçersiz T.C. Kimlik Numarası.',
        'usernameInUse': 'Bu e-posta adresi zaten kullanılıyor.',
        'leaveRequestSent': 'İzin talebiniz gönderildi.',
        'leaveStatusUpdated': 'İzin durumu güncellendi.',
        'shiftAssigned': 'Vardiya başarıyla atandı.',
        'saveReport': 'Raporu Kaydet',
        'settingsSaved': 'Ayarlar kaydedildi.',
        'excelUploadSuccess': '{count} yeni müşteri başarıyla içe aktarıldı.',
        'excelUploadError': 'Excel dosyası okunurken bir hata oluştu.',
        'noValidDataToImport': 'İçe aktarılacak geçerli veri bulunamadı.',
        'cardDataTransferred': 'Kartvizit bilgileri forma aktarıldı.',
        'cardReadError': 'Kartvizit okunurken hata: {error}',
        'cameraError': 'Kamera erişimi sağlanamadı.',
        'voiceNoteBrowserNotSupported': 'Tarayıcınız ses tanımayı desteklemiyor.',
        'voiceNotePermissionError': 'Mikrofon erişim izni vermeniz gerekiyor.',
        'reconciliationSuccess': '{count} adet mutabakat başarıyla oluşturuldu.',
        'noMatchesFound': 'Otomatik eşleştirme için uygun fatura bulunamadı.',
        'reconciliationPdfDownloaded': 'Mutabakat PDF olarak indirildi.',
        'emailClientOpened': 'E-posta göndermek için e-posta istemciniz açılıyor...',
        'profilePicturePreview': 'Profil fotoğrafı önizlemesi',
        'capturedBusinessCard': 'Yakalanan kartvizit görüntüsü',

        // --- AI Robot Widget ---
        'ai_assistant': 'Yapay Zeka Asistan',
        'ask_a_question': 'Bir soru sorun...',
        'send': 'Gönder',
        'intro_message': 'Merhaba! Ben Cenk\'in yapay zeka asistanı. Sana nasıl yardımcı olabilirim?',

        // --- Other components will go here...
        'all': 'Tümü',
        'home': 'Anasayfa',
        'projects': 'Projelerim',
        'tech_stack': 'Teknolojiler',
        'contact': 'İletişim',
    }
};

// MOCK DATA - Kept for portfolio components that might still be in the codebase
export const MOCK_PROJECTS: Project[] = [];
export const TECH_STACK: Technology[] = [];