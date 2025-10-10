// src/services/apiService.ts
// IMPORTANT: This file simulates communication with a backend server.
// In a real application, this would make fetch/axios requests to a real API.

import { db } from '@/services/dbService';

export const api = {
  /**
   * Simulates a user registration API call.
   */
  async register(username: string, password: string): Promise<{ success: boolean; messageKey: string }> {
    // In a real app, this would be a POST request to '/api/register'.
    console.log(`Simulating API registration for: ${username}`);
    // The actual user creation is handled in AuthContext, which calls this.
    // This is just a placeholder for the API layer.
    return { success: true, messageKey: 'registrationSuccess' };
  },

  /**
   * Securely sends a text generation request via the simulated backend.
   */
  async generateText(prompt: string): Promise<string> {
    // In a real app, this would be a POST request to '/api/generate-text'.
    // The backend would then use its secret API key to call the Gemini API.
    console.log(`Simulating Gemini API call with prompt: "${prompt.substring(0, 50)}..."`);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
    return `"${prompt.substring(0, 30)}..." istemi için sunucudan gelen yapay zeka cevabı.`;
  },
  
   /**
   * Simulates parsing a business card via the backend.
   */
  async parseCard(base64Image: string): Promise<any> {
    console.log('Simulating business card parsing via API.');
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Return mock data
    return {
        name: 'Simüle Edilmiş İsim',
        company: 'Simülasyon A.Ş.',
        title: 'Yazılım Geliştirici',
        email: 'test@simulasyon.com',
        phone: '0312 555 1234',
        mobile: '0555 987 6543',
        address: 'Simülasyon Vadisi, Teknokent, Ankara',
        website: 'www.simulasyon.com'
    };
  },
  
  async sendPasswordResetCode(email: string): Promise<{ success: boolean; messageKey: string }> {
    console.log(`Simulating sending password reset code to: ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const user = await db.users.where('username').equalsIgnoreCase(email).first();
    if (!user) {
        // To prevent user enumeration, a real API might always return success.
        // For this simulation, returning failure is clearer for development.
        return { success: false, messageKey: 'userNotFound' };
    }
    // In a real app, the backend would generate a code, store it with an expiry, and send an email.
    console.log(`Simulated code for ${email} is 123456`);
    return { success: true, messageKey: 'resetCodeSent' };
  },

  async verifyPasswordResetCode(email: string, code: string): Promise<{ success: boolean; messageKey: string }> {
    console.log(`Simulating verifying code ${code} for email ${email}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simple simulation: the correct code is '123456'
    if (code === '123456') {
        return { success: true, messageKey: 'codeVerified' };
    }
    return { success: false, messageKey: 'invalidCode' };
  },

  async getChatResponse(message: string): Promise<{ success: boolean; text: string }> {
    console.log(`[API Sim] Getting chat response for: "${message}"`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate thinking

    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes('merhaba') || lowerCaseMessage.includes('selam')) {
        return { success: true, text: 'Merhaba! Sana nasıl yardımcı olabilirim?' };
    } else if (lowerCaseMessage.includes('nasılsın')) {
        return { success: true, text: 'Harikayım! Kodlarım her zamanki gibi kusursuz çalışıyor. Senin için ne yapabilirim?' };
    } else if (lowerCaseMessage.includes('proje')) {
        return { success: true, text: 'Projelerimi görmek için menüdeki "Projelerim" linkine tıklayabilirsin.' };
    } else if (lowerCaseMessage.includes('teşekkür')) {
        return { success: true, text: 'Rica ederim! Başka bir sorun olursa çekinme, ben buradayım.' };
    } else {
        return { success: true, text: 'Hmm, bu konuyu tam olarak anlayamadım. Farklı bir şekilde sorabilir misin?' };
    }
  }
};
