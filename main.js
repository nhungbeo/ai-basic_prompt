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
        this.artStyleSelect = document.getElementById('artStyle');
        this.detailLevelSelect = document.getElementById('detailLevel');
        this.aspectRatioSelect = document.getElementById('aspectRatio');
        this.numberOfPromptsSelect = document.getElementById('numberOfPrompts');
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

        // Load saved API key
        this.loadSavedApiKey();
        this.apiKeyInput.addEventListener('change', () => this.saveApiKey());
    }

    loadSavedApiKey() {
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }
    }

    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
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
        
        return {
            artStyle,
            detailLevel,
            aspectRatio,
            numberOfPrompts
        };
    }

    buildSystemPrompt() {
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
            const response = await this.ai.models.generateContent({
                model: 'gemini-1.5-flash',
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
            'realistic': 'realistic, photorealistic',
            'anime': 'anime style, manga style',
            'cartoon': 'cartoon style, animated',
            'oil-painting': 'oil painting, classical art',
            'watercolor': 'watercolor painting, soft colors',
            'digital-art': 'digital art, concept art',
            'fantasy': 'fantasy art, magical',
            'cyberpunk': 'cyberpunk style, neon, futuristic',
            'minimalist': 'minimalist, simple, clean',
            'vintage': 'vintage style, retro'
        };

        const detailMap = {
            'basic': 'simple description',
            'detailed': 'detailed description with lighting and composition',
            'very-detailed': 'very detailed with specific camera angles, lighting, and artistic techniques',
            'ultra-detailed': 'ultra detailed with professional photography terms, specific art techniques, and quality modifiers'
        };

        return `Ý tưởng gốc: "${userIdea}"
Phong cách: ${styleMap[config.artStyle]}
Mức độ chi tiết: ${detailMap[config.detailLevel]}
Tỷ lệ khung hình: ${config.aspectRatio}
Số lượng prompt cần tạo: ${config.numberOfPrompts}

Hãy tạo ${config.numberOfPrompts} prompt khác nhau cho ý tưởng này, mỗi prompt có góc nhìn và cách diễn đạt khác nhau nhưng cùng phong cách "${config.artStyle}".`;
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