import { GoogleGenAI } from '@google/genai';

class PromptGenerator {
    constructor() {
        this.ai = null;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Input elements
        this.apiKeyInput = document.getElementById('apiKey');
        this.promptInput = document.getElementById('prompt');
        this.promptLabel = document.getElementById('promptLabel');
        this.contentTypeTabs = document.querySelectorAll('.tab-btn');
        this.artStyleSelect = document.getElementById('artStyle');
        this.detailLevelSelect = document.getElementById('detailLevel');
        this.aspectRatioSelect = document.getElementById('aspectRatio');
        this.numberOfPromptsSelect = document.getElementById('numberOfPrompts');
        this.modelSelect = document.getElementById('modelSelect');
        this.customSystemPromptInput = document.getElementById('customSystemPrompt');
        this.showDefaultPromptBtn = document.getElementById('showDefaultPromptBtn');
        this.useDefaultPromptBtn = document.getElementById('useDefaultPromptBtn');
        this.defaultPromptViewer = document.getElementById('defaultPromptViewer');
        this.defaultPromptContent = document.getElementById('defaultPromptContent');
        this.editDefaultPromptBtn = document.getElementById('editDefaultPromptBtn');
        this.resetSettingsBtn = document.getElementById('resetSettingsBtn');
        this.negativePromptInput = document.getElementById('negativePrompt');
        this.guidanceScaleInput = document.getElementById('guidanceScale');
        this.guidanceValueSpan = document.getElementById('guidanceValue');
        this.seedInput = document.getElementById('seed');
        
        // Control elements
        this.generateBtn = document.getElementById('generateBtn');
        this.btnText = document.querySelector('.btn-text');
        this.btnLoading = document.querySelector('.btn-loading');
        
        // Output elements
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.promptResults = document.getElementById('promptResults');
    }

    bindEvents() {
        this.generateBtn.addEventListener('click', () => this.generatePrompts());
        this.guidanceScaleInput.addEventListener('input', (e) => {
            this.guidanceValueSpan.textContent = e.target.value;
        });
        
        // Enter key support for prompt
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generatePrompts();
            }
        });

        // Load saved settings
        this.loadSavedSettings();
        this.apiKeyInput.addEventListener('change', () => this.saveSettings());
        this.modelSelect.addEventListener('change', () => this.saveSettings());
        this.customSystemPromptInput.addEventListener('change', () => this.saveSettings());
        
        // Content type tabs
        this.currentContentType = 'image';
        this.contentTypeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchContentType(e.target.dataset.type));
        });
        
        // Prompt control buttons
        this.showDefaultPromptBtn.addEventListener('click', () => this.toggleDefaultPromptViewer());
        this.useDefaultPromptBtn.addEventListener('click', () => this.useDefaultPrompt());
        this.editDefaultPromptBtn.addEventListener('click', () => this.editDefaultPrompt());
        this.resetSettingsBtn.addEventListener('click', () => this.resetAllSettings());
    }

    loadSavedSettings() {
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }

        const savedModel = localStorage.getItem('gemini_model');
        if (savedModel) {
            this.modelSelect.value = savedModel;
        }

        const savedSystemPrompt = localStorage.getItem('custom_system_prompt');
        if (savedSystemPrompt) {
            this.customSystemPromptInput.value = savedSystemPrompt;
        }
    }

    saveSettings() {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
        } else {
            localStorage.removeItem('gemini_api_key');
        }

        localStorage.setItem('gemini_model', this.modelSelect.value);
        localStorage.setItem('custom_system_prompt', this.customSystemPromptInput.value.trim());
    }

    switchContentType(type) {
        this.currentContentType = type;
        
        // Update tab active state
        this.contentTypeTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.type === type) {
                tab.classList.add('active');
            }
        });

        // Update UI based on content type
        if (type === 'image') {
            this.promptLabel.textContent = 'Ý tưởng hình ảnh của bạn:';
            this.promptInput.placeholder = 'Ví dụ: Một con mèo dễ thương đang ngồi trên cỏ xanh...';
        } else if (type === 'video') {
            this.promptLabel.textContent = 'Ý tưởng video của bạn:';
            this.promptInput.placeholder = 'Ví dụ: Một con mèo đang chạy qua cánh đồng hoa, camera theo chuyển động...';
        }
    }

    getDefaultSystemPrompt() {
        if (this.currentContentType === 'video') {
            return `Bạn là một chuyên gia tạo prompt cho AI Video (Runway ML, Pika Labs, Stable Video). 
Nhiệm vụ của bạn là chuyển đổi ý tưởng đơn giản thành các prompt video chi tiết, chuyên nghiệp.

Quy tắc tạo prompt video:
1. Bắt đầu với chủ thể và hành động chính
2. Mô tả chuyển động, camera movement
3. Thiết lập môi trường, bối cảnh
4. Chỉ định phong cách quay phim
5. Thêm thông số kỹ thuật (lighting, timing, transition)
6. Kết thúc với negative prompt (những gì cần tránh)

Định dạng trả về:
**Video Prompt [số]:**
[Mô tả chi tiết bằng tiếng Anh với focus vào movement và camera]

**Mô tả tiếng Việt:**
[Giải thích prompt video bằng tiếng Việt để người dùng hiểu]

**Negative Prompt:**
[Những gì cần tránh trong video bằng tiếng Anh]

---`;
        } else {
            return `Bạn là một chuyên gia tạo prompt cho AI Art (Stable Diffusion, Midjourney, DALL-E). 
Nhiệm vụ của bạn là chuyển đổi ý tưởng đơn giản thành các prompt chi tiết, chuyên nghiệp.

Quy tắc tạo prompt:
1. Bắt đầu với chủ thể chính
2. Thêm chi tiết về hành động, cảm xúc
3. Mô tả môi trường, bối cảnh
4. Chỉ định phong cách nghệ thuật
5. Thêm thông số kỹ thuật (lighting, composition, quality)
6. Kết thúc với negative prompt (những gì cần tránh)

Định dạng trả về:
**Prompt [số]:**
[Mô tả chi tiết bằng tiếng Anh]

**Mô tả tiếng Việt:**
[Giải thích prompt bằng tiếng Việt để người dùng hiểu]

**Negative Prompt:**
[Những gì cần tránh bằng tiếng Anh]

---`;
        }
    }

    toggleDefaultPromptViewer() {
        if (this.defaultPromptViewer.style.display === 'none') {
            this.defaultPromptContent.textContent = this.getDefaultSystemPrompt();
            this.defaultPromptViewer.style.display = 'block';
            this.showDefaultPromptBtn.textContent = '🔼 Ẩn Prompt Mặc Định';
        } else {
            this.defaultPromptViewer.style.display = 'none';
            this.showDefaultPromptBtn.textContent = '📝 Xem Prompt Mặc Định';
        }
    }

    useDefaultPrompt() {
        this.customSystemPromptInput.value = '';
        this.saveSettings();
        alert('✅ Đã reset về system prompt mặc định!');
    }

    editDefaultPrompt() {
        const defaultPrompt = this.getDefaultSystemPrompt();
        this.customSystemPromptInput.value = defaultPrompt;
        this.saveSettings();
        
        // Scroll to the textarea
        this.customSystemPromptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        this.customSystemPromptInput.focus();
        
        alert('📝 Prompt mặc định đã được tải vào ô chỉnh sửa. Bạn có thể tùy chỉnh theo ý muốn!');
    }

    resetAllSettings() {
        if (confirm('⚠️ Bạn có chắc chắn muốn reset tất cả cài đặt về mặc định? (API key sẽ được giữ lại) Hành động này không thể hoàn tác!')) {
            // Clear localStorage (except API key)
            localStorage.removeItem('gemini_model');
            localStorage.removeItem('custom_system_prompt');
            
            // Reset form values (keep API key)
            this.modelSelect.value = 'gemini-1.5-flash';
            this.customSystemPromptInput.value = '';
            this.artStyleSelect.value = 'realistic';
            this.detailLevelSelect.value = 'detailed';
            this.aspectRatioSelect.value = '1:1';
            this.numberOfPromptsSelect.value = '3';
            this.negativePromptInput.value = '';
            this.guidanceScaleInput.value = '7';
            this.guidanceValueSpan.textContent = '7';
            this.seedInput.value = '';
            
            // Reset to image tab
            this.switchContentType('image');
            
            // Hide default prompt viewer
            this.defaultPromptViewer.style.display = 'none';
            this.showDefaultPromptBtn.textContent = '📝 Xem Prompt Mặc Định';
            
            alert('🔄 Đã reset tất cả cài đặt về mặc định! (API key được giữ lại)');
        }
    }

    validateInputs() {
        const apiKey = this.apiKeyInput.value.trim();
        const prompt = this.promptInput.value.trim();

        if (!apiKey) {
            throw new Error('Vui lòng nhập API key Gemini');
        }

        if (!prompt) {
            throw new Error('Vui lòng nhập ý tưởng hình ảnh');
        }

        if (prompt.length < 5) {
            throw new Error('Ý tưởng quá ngắn. Vui lòng mô tả chi tiết hơn');
        }

        return { apiKey, prompt };
    }

    getPromptGenerationConfig() {
        const artStyle = this.artStyleSelect.value;
        const detailLevel = this.detailLevelSelect.value;
        const aspectRatio = this.aspectRatioSelect.value;
        const numberOfPrompts = parseInt(this.numberOfPromptsSelect.value);
        const contentType = this.currentContentType;
        
        return {
            artStyle,
            detailLevel,
            aspectRatio,
            numberOfPrompts,
            contentType
        };
    }

    buildSystemPrompt() {
        const customPrompt = this.customSystemPromptInput.value.trim();
        
        if (customPrompt) {
            return customPrompt;
        }

        return this.getDefaultSystemPrompt();
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.loadingMessage.style.display = 'none';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showLoading() {
        this.loadingMessage.style.display = 'block';
        this.generateBtn.disabled = true;
        this.btnText.style.display = 'none';
        this.btnLoading.style.display = 'flex';
    }

    hideLoading() {
        this.loadingMessage.style.display = 'none';
        this.generateBtn.disabled = false;
        this.btnText.style.display = 'inline';
        this.btnLoading.style.display = 'none';
    }

    async generatePrompts() {
        try {
            this.hideError();
            
            // Validate inputs
            const { apiKey, prompt } = this.validateInputs();
            
            // Initialize AI client
            this.ai = new GoogleGenAI({ apiKey });
            
            // Show loading
            this.showLoading();
            
            // Get configuration
            const config = this.getPromptGenerationConfig();
            
            // Build the detailed prompt for Gemini
            const systemPrompt = this.buildSystemPrompt();
            const userPrompt = this.buildUserPrompt(prompt, config);
            
            // Generate prompts using Gemini
            const selectedModel = this.modelSelect.value;
            const response = await this.ai.models.generateContent({
                model: selectedModel,
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }
                ],
                config: {
                    temperature: 0.8,
                    maxOutputTokens: 2048
                }
            });

            // Process results
            this.displayPromptResults(response, prompt, config);
            
        } catch (error) {
            console.error('Error generating prompts:', error);
            this.showError(this.getErrorMessage(error));
        } finally {
            this.hideLoading();
        }
    }

    buildUserPrompt(userIdea, config) {
        const styleMap = {
            'realistic': 'realistic, photorealistic style',
            'photography': 'professional photography with technical camera terms and lighting',
            'cinematic': 'cinematic style with dramatic camera angles and movie-like composition',
            'anime': 'anime style, manga style, Japanese animation',
            'cartoon': 'cartoon style, animated, stylized illustration',
            'oil-painting': 'oil painting, classical art, traditional painting techniques',
            'watercolor': 'watercolor painting, soft colors, artistic brushwork',
            'digital-art': 'digital art, concept art, modern digital techniques',
            'fantasy': 'fantasy art, magical elements, mystical atmosphere',
            'cyberpunk': 'cyberpunk style, neon lights, futuristic, sci-fi aesthetic',
            'vintage': 'vintage style, retro aesthetic, nostalgic feeling',
            'minimalist': 'minimalist, simple, clean composition, focused elements',
            'commercial': 'commercial photography style, marketing-ready, professional presentation',
            'technical': 'technical illustration, precise details, professional specifications'
        };

        const detailMap = {
            'basic': 'simple description',
            'detailed': 'detailed description with lighting and composition',
            'very-detailed': 'very detailed with specific camera angles, lighting, and artistic techniques',
            'ultra-detailed': 'ultra detailed with professional photography terms, specific art techniques, and quality modifiers'
        };

        const contentTypeText = config.contentType === 'video' ? 'video' : 'hình ảnh';
        
        return `Ý tưởng gốc: "${userIdea}"
Loại nội dung: ${contentTypeText}
Phong cách: ${styleMap[config.artStyle]}
Mức độ chi tiết: ${detailMap[config.detailLevel]}
Tỷ lệ khung hình: ${config.aspectRatio}
Số lượng prompt cần tạo: ${config.numberOfPrompts}

Hãy tạo ${config.numberOfPrompts} prompt khác nhau cho ý tưởng này, mỗi prompt có cách diễn đạt khác nhau nhưng cùng phong cách "${config.artStyle}".`;
    }

    getErrorMessage(error) {
        if (error.message.includes('API key') || error.message.includes('401')) {
            return 'API key không hợp lệ. Vui lòng kiểm tra lại API key của bạn.';
        }
        
        if (error.message.includes('quota') || error.message.includes('429')) {
            return 'Bạn đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau.';
        }
        
        if (error.message.includes('safety')) {
            return 'Nội dung của bạn vi phạm chính sách an toàn. Vui lòng thử mô tả khác.';
        }
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.';
        }
        
        return error.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
    }

    displayPromptResults(response, originalIdea, config) {
        // Clear previous results
        this.promptResults.innerHTML = '';
        
        if (!response.text) {
            this.showError('Không thể tạo mô tả. Vui lòng thử lại.');
            return;
        }

        // Parse the response to extract individual prompts
        const generatedText = response.text;
        const prompts = this.parseGeneratedPrompts(generatedText);
        
        if (prompts.length === 0) {
            this.showError('Không thể phân tích kết quả. Vui lòng thử lại.');
            return;
        }

        prompts.forEach((promptData, index) => {
            this.createPromptElement(promptData, index, originalIdea, config);
        });
    }

    parseGeneratedPrompts(text) {
        const prompts = [];
        const sections = text.split('---').filter(section => section.trim());
        
        sections.forEach((section, index) => {
            const lines = section.trim().split('\n');
            let promptText = '';
            let vietnameseDescription = '';
            let negativePrompt = '';
            let currentSection = '';
            
            lines.forEach(line => {
                line = line.trim();
                if (line.startsWith('**Prompt')) {
                    currentSection = 'prompt';
                } else if (line.startsWith('**Mô tả tiếng Việt')) {
                    currentSection = 'vietnamese';
                } else if (line.startsWith('**Negative Prompt')) {
                    currentSection = 'negative';
                } else if (line && !line.startsWith('**')) {
                    if (currentSection === 'prompt') {
                        promptText += line + ' ';
                    } else if (currentSection === 'vietnamese') {
                        vietnameseDescription += line + ' ';
                    } else if (currentSection === 'negative') {
                        negativePrompt += line + ' ';
                    }
                }
            });
            
            if (promptText.trim()) {
                prompts.push({
                    prompt: promptText.trim(),
                    vietnameseDescription: vietnameseDescription.trim(),
                    negativePrompt: negativePrompt.trim(),
                    index: index + 1
                });
            }
        });
        
        return prompts;
    }

    createPromptElement(promptData, index, originalIdea, config) {
        const promptItem = document.createElement('div');
        promptItem.className = 'prompt-item';
        
        const styleMap = {
            'realistic': 'Thực tế',
            'anime': 'Anime/Manga',
            'cartoon': 'Cartoon',
            'oil-painting': 'Sơn dầu',
            'watercolor': 'Màu nước',
            'digital-art': 'Digital Art',
            'fantasy': 'Fantasy',
            'cyberpunk': 'Cyberpunk',
            'minimalist': 'Tối giản',
            'vintage': 'Vintage'
        };
        
        promptItem.innerHTML = `
            <div class="prompt-header">
                <h3 class="prompt-title">Prompt ${promptData.index}</h3>
                <span class="prompt-style">${styleMap[config.artStyle]}</span>
            </div>
            
            ${promptData.vietnameseDescription ? `
                <div class="vietnamese-description">
                    <h4>📝 Mô tả tiếng Việt:</h4>
                    <p>${promptData.vietnameseDescription}</p>
                </div>
            ` : ''}
            
            <div class="prompt-section">
                <h4>🎨 Prompt (English):</h4>
                <div class="prompt-content">${promptData.prompt}</div>
            </div>
            
            ${promptData.negativePrompt ? `
                <div class="prompt-section">
                    <h4>🚫 Negative Prompt:</h4>
                    <div class="prompt-content negative-prompt" style="border-color: #dc3545; background: #fff5f5;">
                        ${promptData.negativePrompt}
                    </div>
                </div>
            ` : ''}
            
            <div class="prompt-meta">
                <span>💡 Ý tưởng gốc: "${originalIdea}"</span>
                <span>📐 Tỷ lệ: ${config.aspectRatio}</span>
                <span>🎭 Phong cách: ${styleMap[config.artStyle]}</span>
            </div>
            
            <div class="prompt-actions">
                <button class="copy-prompt-btn" data-prompt-index="${index}">
                    📋 Sao chép Prompt
                </button>
                ${promptData.negativePrompt ? `
                    <button class="copy-negative-btn" data-prompt-index="${index}">
                        🚫 Sao chép Negative
                    </button>
                ` : ''}
                <button class="copy-all-btn" data-prompt-index="${index}">
                    📄 Sao chép Tất cả
                </button>
            </div>
        `;
        
        this.promptResults.appendChild(promptItem);
        
        // Add event listeners for this prompt item
        const copyBtn = promptItem.querySelector('.copy-prompt-btn');
        const copyNegativeBtn = promptItem.querySelector('.copy-negative-btn');
        const copyAllBtn = promptItem.querySelector('.copy-all-btn');
        
        copyBtn.addEventListener('click', () => this.copyPrompt(promptData.prompt));
        
        if (copyNegativeBtn) {
            copyNegativeBtn.addEventListener('click', () => this.copyPrompt(promptData.negativePrompt));
        }
        
        copyAllBtn.addEventListener('click', () => this.copyAllPrompts(promptData));
    }

    async copyPrompt(promptText) {
        try {
            if (!promptText || promptText.trim() === '') {
                this.showError('Không có nội dung để sao chép.');
                return;
            }
            
            await navigator.clipboard.writeText(promptText.trim());
            this.showSuccessMessage('Đã sao chép vào clipboard! 📋');
        } catch (error) {
            console.error('Copy error:', error);
            // Fallback method
            this.fallbackCopy(promptText);
        }
    }

    async copyAllPrompts(promptData) {
        try {
            let fullText = `Prompt:\n${promptData.prompt}`;
            
            if (promptData.negativePrompt) {
                fullText += `\n\nNegative Prompt:\n${promptData.negativePrompt}`;
            }
            
            await navigator.clipboard.writeText(fullText);
            this.showSuccessMessage('Đã sao chép tất cả prompt vào clipboard! 📄');
        } catch (error) {
            console.error('Copy all error:', error);
            this.fallbackCopy(fullText);
        }
    }

    fallbackCopy(text) {
        try {
            // Create a temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            this.showSuccessMessage('Đã sao chép vào clipboard! 📋');
        } catch (fallbackError) {
            console.error('Fallback copy error:', fallbackError);
            this.showError('Không thể sao chép. Vui lòng chọn và copy thủ công.');
        }
    }

    showSuccessMessage(message) {
        // Remove existing success messages
        const existingSuccess = document.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        this.errorMessage.parentNode.insertBefore(successDiv, this.errorMessage);
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// Initialize the application
window.promptApp = new PromptGenerator();

// Add some example prompts
const examplePrompts = [
    "Một con mèo dễ thương đang ngồi trên cỏ xanh dưới ánh nắng mặt trời, phong cách anime",
    "Phong cảnh núi non hùng vĩ với thác nước và cầu vồng, phong cách fantasy",
    "Robot thân thiện đang cầm ván trượt màu đỏ, phong cách vector tối giản",
    "Thành phố tương lai với xe bay và tòa nhà cao chọc trời, ban đêm với ánh đèn neon",
    "Khu vườn hoa anh đào nở rộ với con đường đá nhỏ, phong cách Nhật Bản truyền thống"
];

// Add example prompt functionality
document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('prompt');
    
    // Add placeholder with rotating examples
    let exampleIndex = 0;
    setInterval(() => {
        if (!promptInput.value && document.activeElement !== promptInput) {
            promptInput.placeholder = examplePrompts[exampleIndex];
            exampleIndex = (exampleIndex + 1) % examplePrompts.length;
        }
    }, 3000);
});