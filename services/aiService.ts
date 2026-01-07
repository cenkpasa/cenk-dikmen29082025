import { Offer, Customer, DFMAnalysisItem, QuoteEstimation } from '../types';
import { api } from './apiService';

const callAI = async (prompt: string): Promise<{ success: boolean; text: string }> => {
    try {
        // This now calls our secure, simulated backend instead of Google GenAI directly
        const responseText = await api.generateText(prompt);
        return { success: true, text: responseText };
    } catch (error) {
        console.error("Error calling AI service:", error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred while calling the AI service.";
        return { success: false, text: message };
    }
};

export const parseBusinessCard = async (base64Image: string): Promise<{ success: boolean; data?: any; text: string }> => {
     try {
        // This is a complex call, we'll simulate a successful response
        const responseData = await api.parseCard(base64Image);
        return { success: true, data: responseData, text: "Card parsed successfully." };
    } catch (error) {
        console.error("Error parsing business card:", error);
        const message = error instanceof Error ? error.message : "An unexpected error occurred while parsing the card.";
        return { success: false, text: message };
    }
};

export const summarizeText = (textToSummarize: string) => 
    callAI(`Aşağıdaki görüşme notlarını profesyonel bir dille, anahtar noktaları vurgulayarak özetle:\n\n---\n${textToSummarize}\n---\n\nÖzet:`);

export const enhanceDescription = (description: string) => 
    callAI(`Aşağıdaki ürün açıklamasını daha çekici ve profesyonel hale getirmek için metin önerileri sun:\n\n"${description}"`);

export const enhanceEmailBody = (emailBody: string) => 
    callAI(`Aşağıdaki e-posta metnini daha profesyonel, akıcı ve dilbilgisi açısından doğru hale getir. Metnin ana anlamını ve amacını koru:\n\n---\n${emailBody}\n---\n\nİyileştirilmiş Metin:`);

export const analyzeSentiment = (notes: string) => 
    callAI(`Aşağıdaki müşteri notlarındaki genel hissiyatı analiz et (örneğin, Olumlu, Olumsuz, Nötr) ve kısa bir gerekçe sun:\n\n---\n${notes}\n---`);

export const suggestNextStep = (customer: Customer) => {
    const prompt = `Sen, CNK Kesici Takım firmasında çalışan proaktif bir müşteri ilişkileri uzmanısın. Aşağıdaki müşteri için en mantıklı ve etkili bir sonraki adımı belirle. Müşterinin notlarındaki son etkileşimleri, şikayetleri veya taleplerini analiz ederek kişiselleştirilmiş ve spesifik bir eylem öner. Önerin "telefonla ara", "e-posta gönder", "ziyaret planla" gibi net bir eylem içermeli ve amacını belirtmeli (örneğin, "X projesindeki gecikme hakkında bilgi almak ve çözüm sunmak için ara", "Yeni Z serisi matkap uçları hakkında bir demo ayarlamak için e-posta gönder").\n\nMüşteri: ${customer.name}\nNotlar: ${customer.notes}\n\nÖnerilen Eylem:`;
    return callAI(prompt);
};

export const analyzeOpportunities = (customer: Customer) => {
    const prompt = `Sen, kesici takımlar (CNC, freze, matkap vb.) satan CNK firması için çalışan deneyimli bir satış strateğistisin. Aşağıdaki müşteri bilgilerini ve notlarını analiz et. Müşterinin ticari unvanını, potansiyel sektörünü (örn: makine imalatı, havacılık) ve notlardaki ipuçlarını (örn: "yeni makine aldılar", "üretim kapasitesini artırıyorlar") dikkate alarak firmamızın ürünleriyle ilgili somut, eyleme geçirilebilir satış fırsatları öner. Önerilerin çapraz satış (cross-sell), üst satış (up-sell) veya yeni ürün tanıtımı gibi spesifik olmalı. Önerilerini 2-3 madde halinde sun.\n\nMüşteri: ${customer.name}\nTicari Unvan: ${customer.commercialTitle}\nNotlar: ${customer.notes}\n\nSatış Fırsatları:`;
    return callAI(prompt);
};

export const generateFollowUpEmail = async (offer: Offer, customer: Customer | undefined): Promise<{ success: boolean; text: string }> => {
    const offerDetails = offer.items.map(item => `- ${item.miktar} ${item.birim} ${item.cins}`).join('\n');
    const prompt = `Bir CRM sistemi için yapay zeka asistanıyım. Aşağıdaki bilgilere göre, müşteriye gönderilecek profesyonel ve nazik bir takip e-postası taslağı oluştur. E-posta, teklifi hatırlatmalı ve bir sonraki adımlar hakkında soru sormalıdır. Cevabını şu formatta ver: ilk satırda "Konu: [E-posta Konusu]" ve ardından e-posta metni. İmza ekleme.\n\nMüşteri: ${customer?.name}, Yetkili: ${offer.firma.yetkili}\nTeklif No: ${offer.teklifNo}, Toplam: ${offer.genelToplam.toLocaleString('tr-TR')} TL\nÜrünler:\n${offerDetails}`;
    return callAI(prompt);
};

export const analyzeSalesPerformance = (userName: string, target: number, sales: number, daysLeft: number) => {
    const prompt = `Kullanıcı ${userName} için bu aylık satış performansını analiz et ve hedefe ulaşması için stratejiler öner. Mevcut Durum: Aylık Satış Hedefi: ${target.toLocaleString('tr-TR')} TL, Bu Ay Yapılan Satış: ${sales.toLocaleString('tr-TR')} TL, Kalan Gün: ${daysLeft}. Öneriler (3-4 madde halinde, kısa ve net):`;
    return callAI(prompt);
};

// AI Hub Specific Functions
export const generateMarketingEmail = (topic: string) => 
    callAI(`Bir satış ve pazarlama uzmanı olarak, "${topic}" konusuyla ilgili potansiyel müşterilere gönderilecek, dikkat çekici ve profesyonel bir pazarlama e-postası metni yaz.`);

export const analyzeCustomerInteractionForHub = (customerNotes: string) => 
    callAI(`Bir CRM uzmanı olarak, aşağıdaki müşteri notlarını analiz et. Müşterinin hissiyatını (pozitif, negatif, nötr), potansiyel satış fırsatlarını ve bir sonraki adım için önerilerini madde madde belirt.\n\nNotlar:\n${customerNotes}`);

export const createMarketReport = (topic: string) => 
    callAI(`Bir pazar araştırması uzmanı olarak, "${topic}" konusu hakkında kısa, öz ve bilgilendirici bir pazar araştırması raporu oluştur. Rapor, ana trendleri, fırsatları ve potansiyel zorlukları içermelidir.`);

export const getFinancialSummary = (financialData: string) => 
    callAI(`Bir finans uzmanı olarak, aşağıdaki finansal verileri analiz et, anahtar metrikleri özetle ve gelecek döneme yönelik basit bir tahmin yap.\n\nVeriler:\n${financialData}`);

export const answerTechnicalQuestion = (question: string) => 
    callAI(`Bir yazılım uzmanı olarak, aşağıdaki teknik soruyu anlaşılır ve doğru bir şekilde cevapla:\n\nSoru: ${question}`);

export const executeAgentTask = (task: string) => 
    callAI(`Bir proaktif yapay zeka ajanı olarak, aşağıdaki görevi anla ve tamamlamak için gereken adımları ve çıktıyı oluştur. Çıktı, görevin doğasına uygun olmalı (e-posta taslağı, yapılacaklar listesi, rapor vb.).\n\nGörev: ${task}`);

// Reconciliation specific functions
export const generateReconciliationEmail = (customer: Customer, type: string, period: string, amount: number) => {
    const prompt = `Bir CRM sistemi için yapay zeka asistanıyım. Aşağıdaki bilgilere göre, müşteriye gönderilecek profesyonel bir mutabakat e-postası taslağı oluştur. E-posta sadece metin olarak oluşturulsun, imza veya "Konu:" başlığı ekleme.\n\nMüşteri: ${customer.name}\nMutabakat Tipi: ${type}\nDönem: ${period}\nTutar: ${amount.toLocaleString('tr-TR')} TL`;
    return callAI(prompt);
};

export const analyzeDisagreement = (response: string) => {
    const prompt = `Bir müşteri mutabakatı reddetti ve şu açıklamayı yaptı: "${response}". Bu açıklamayı analiz et ve sorunun olası nedenlerini (örneğin, eksik fatura, tarih uyuşmazlığı, farklı kayıtlar) ve çözüm için atılması gereken adımları özetle.`;
    return callAI(prompt);
};

export const analyze3DModelForManufacturability = async (modelData: string): Promise<{ success: boolean; dfmAnalysis: DFMAnalysisItem[]; quoteEstimation: QuoteEstimation; }> => {
    const prompt = `You are an expert AI assistant for a CNC machining company called CNK. Your task is to analyze a customer's uploaded 3D model data for manufacturability (DFM) and then provide a detailed cost estimation and quote.

    **INPUT:**
    A string representing the 3D model data (e.g., contents of a STEP/IGES file). For this simulation, the input is: "${modelData}"

    **ANALYSIS & OUTPUT:**
    Your response must be a single, valid JSON object with no explanations or extra text outside of the JSON structure. The JSON object must have two main keys: "dfmAnalysis" and "quoteEstimation".

    1.  **dfmAnalysis Key:**
        *   This should be an array of objects.
        *   Each object represents a potential manufacturing issue found in the model.
        *   Each object must have three string properties:
            *   "issueType": Can be one of "critical", "warning", or "info".
            *   "description": A clear, concise explanation of the problem in Turkish.
            *   "suggestion": A practical, actionable recommendation to fix the problem, also in Turkish.
        *   Identify at least one "critical" and one "warning" issue based on common CNC machining problems (e.g., sharp internal corners, thin walls, non-standard hole sizes, difficult-to-reach features).

    2.  **quoteEstimation Key:**
        *   This should be an object representing the cost breakdown and final quote.
        *   It must have the following properties:
            *   "materialCost": A number representing the raw material cost.
            *   "machiningTimeHours": A number representing the estimated hours for CNC machining.
            *   "machiningCost": A number (machiningTimeHours * hourly_rate). Assume an hourly rate of 150.
            *   "setupCost": A number for machine setup.
            *   "totalEstimatedCost": A number (sum of the above costs).
            *   "suggestedQuotePrice": A number (totalEstimatedCost * 1.3 for a 30% markup).
            *   "lineItems": An array containing a single object for the final quote. This object must have "description" (string), "quantity" (number, usually 1), "unitPrice" (number, same as suggestedQuotePrice), and "totalPrice" (number, same as suggestedQuotePrice).

    **EXAMPLE OF DESIRED JSON OUTPUT:**
    {
      "dfmAnalysis": [
        {
          "issueType": "critical",
          "description": "Bu iç köşe radyüsü (1mm) standart bir 3mm parmak frezenin giremeyeceği kadar dar.",
          "suggestion": "Verimlilik için radyüsü 1.5mm'ye çıkarın."
        },
        {
          "issueType": "warning",
          "description": "Bu duvar kalınlığı (0.5mm) işleme sırasında titreşim yapabilir ve kırılabilir.",
          "suggestion": "Kalınlığı 1mm'ye çıkarmanız veya buraya bir destek nervürü eklemeniz önerilir."
        }
      ],
      "quoteEstimation": {
        "materialCost": 15.75,
        "machiningTimeHours": 1.25,
        "machiningCost": 187.50,
        "setupCost": 50.00,
        "totalEstimatedCost": 253.25,
        "suggestedQuotePrice": 329.23,
        "lineItems": [
          {
            "description": "Parça XYZ Üretimi (Malzeme: Alüminyum 6061)",
            "quantity": 1,
            "unitPrice": 329.23,
            "totalPrice": 329.23
          }
        ]
      }
    }`;
    
    // In a real application, you would call the AI with the prompt.
    // For this simulation, we return a mock JSON object that matches the required structure.
    await new Promise(res => setTimeout(res, 2500)); // Simulate AI processing time
    const mockResponse: { dfmAnalysis: DFMAnalysisItem[]; quoteEstimation: QuoteEstimation; } = {
        dfmAnalysis: [
            { issueType: 'critical', description: 'İç köşe radyüsü (1mm) standart bir 3mm parmak frezenin giremeyeceği kadar dar.', suggestion: 'Verimlilik için radyüsü 1.5mm\'ye çıkarın.' },
            { issueType: 'warning', description: 'Duvar kalınlığı (0.5mm) işleme sırasında titreşim yapabilir ve kırılabilir.', suggestion: 'Kalınlığı 1mm\'ye çıkarmanız veya buraya bir destek nervürü eklemeniz önerilir.' },
            { issueType: 'info', description: 'Bu delik, standart olmayan bir matkap çapı gerektiriyor (8.1mm).', suggestion: 'Maliyeti düşürmek için standart 8.0mm veya 8.5mm kullanmayı düşünün.' },
        ],
        quoteEstimation: {
            materialCost: 22.50,
            machiningTimeHours: 1.5,
            machiningCost: 225.00,
            setupCost: 75.00,
            totalEstimatedCost: 322.50,
            suggestedQuotePrice: 419.25,
            lineItems: [
                { description: 'Model Dosyası Üretimi (Malzeme: Paslanmaz Çelik 304)', quantity: 1, unitPrice: 419.25, totalPrice: 419.25 }
            ]
        }
    };
    return { success: true, ...mockResponse };
};