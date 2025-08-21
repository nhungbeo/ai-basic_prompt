import { GoogleGenerativeAI } from '@google/generative-ai';
import { ImageGenerator } from './imageGenerator.js';

// UI State Manager for tab switching and state management
class UIStateManager {
    constructor() {
        this.currentTab = 'image';
        this.setupTabs();
    }

    setupTabs() {
        this.navTabs = document.querySelectorAll('.nav-tab');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.apiKeyGlobal = document.getElementById('apiKeyGlobal');
        
        // Bind tab click events
        this.navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.target.dataset.tab;
                this.switchTab(tabType);
            });
        });

        // Initially hide API key if already saved
        this.checkApiKeyVisibility();
    }

    switchTab(tabType) {
        if (tabType === this.currentTab) return;
        
        this.currentTab = tabType;
        
        // Update nav tabs
        this.navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabType);
        });
        
        // Update tab contents with animation
        this.tabContents.forEach(content => {
            const isActive = content.id === `${tabType}Tab`;
            if (isActive) {
                content.classList.add('active');
                content.style.display = 'block';
            } else {
                content.classList.remove('active');
                // Delay hiding to allow animation
                setTimeout(() => {
                    if (!content.classList.contains('active')) {
                        content.style.display = 'none';
                    }
                }, 100);
            }
        });
    }

    checkApiKeyVisibility() {
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey && savedApiKey.trim()) {
            this.apiKeyGlobal.style.display = 'none';
        }
    }

    showApiKeySection() {
        this.apiKeyGlobal.style.display = 'block';
    }

    hideApiKeySection() {
        this.apiKeyGlobal.style.display = 'none';
    }
}

// History Manager for localStorage integration
class HistoryManager {
    constructor() {
        this.maxHistoryItems = 50;
        this.setupHistoryUI();
    }

    setupHistoryUI() {
        this.historyBtn = document.getElementById('historyBtn');
        this.historySidebar = document.getElementById('historySidebar');
        this.historyToggle = document.getElementById('historyToggle');
        this.historyContent = document.getElementById('historyContent');
        
        // Bind events
        this.historyBtn.addEventListener('click', () => this.showHistory());
        this.historyToggle.addEventListener('click', () => this.hideHistory());
        
        // Load and display history
        this.loadHistory();
    }

    showHistory() {
        this.historySidebar.classList.add('active');
    }

    hideHistory() {
        this.historySidebar.classList.remove('active');
    }

    addToHistory(type, prompt, results) {
        const historyItem = {
            id: Date.now(),
            type: type, // 'image' or 'video'
            prompt: prompt,
            results: results,
            timestamp: new Date().toISOString()
        };

        let history = this.getHistory();
        history.unshift(historyItem);
        
        // Keep only maxHistoryItems
        if (history.length > this.maxHistoryItems) {
            history = history.slice(0, this.maxHistoryItems);
        }
        
        localStorage.setItem('prompt_history', JSON.stringify(history));
        this.renderHistory();
    }

    getHistory() {
        try {
            const history = localStorage.getItem('prompt_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    loadHistory() {
        this.renderHistory();
    }

    renderHistory() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            this.historyContent.innerHTML = '<p class="history-empty">Chưa có lịch sử nào</p>';
            return;
        }

        const historyHTML = history.map(item => {
            const date = new Date(item.timestamp).toLocaleDateString('vi-VN');
            const time = new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const icon = item.type === 'image' ? '🖼️' : '🎬';
            const truncatedPrompt = item.prompt.length > 100 ? 
                item.prompt.substring(0, 100) + '...' : item.prompt;
            
            return `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-header">
                        <span class="history-icon">${icon}</span>
                        <span class="history-date">${date} ${time}</span>
                    </div>
                    <div class="history-prompt">${truncatedPrompt}</div>
                    <div class="history-actions">
                        <button class="history-reuse" onclick="historyManager.reusePrompt('${item.id}')">
                            🔄 Sử dụng lại
                        </button>
                        <button class="history-delete" onclick="historyManager.deleteItem('${item.id}')">
                            🗑️ Xóa
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        this.historyContent.innerHTML = historyHTML;
    }

    reusePrompt(itemId) {
        const history = this.getHistory();
        const item = history.find(h => h.id == itemId);
        
        if (item) {
            // Switch to appropriate tab
            window.uiStateManager.switchTab(item.type);
            
            // Fill the prompt
            const promptInput = item.type === 'image' ? 
                document.getElementById('imagePrompt') : 
                document.getElementById('videoPrompt');
            
            if (promptInput) {
                promptInput.value = item.prompt;
            }
            
            // Hide history
            this.hideHistory();
        }
    }

    deleteItem(itemId) {
        if (confirm('Bạn có chắc chắn muốn xóa mục này khỏi lịch sử?')) {
            let history = this.getHistory();
            history = history.filter(item => item.id != itemId);
            localStorage.setItem('prompt_history', JSON.stringify(history));
            this.renderHistory();
        }
    }

    clearHistory() {
        if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?')) {
            localStorage.removeItem('prompt_history');
            this.renderHistory();
        }
    }
}

// Main Prompt Generator Class
class PromptGenerator {
    constructor() {
        this.ai = null;
        this.imageGenerator = new ImageGenerator();
        console.log('ImageGenerator initialized:', this.imageGenerator);
        this.currentContentType = 'image';
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Global elements
        this.apiKeyInput = document.getElementById('apiKey');
        this.apiKeySave = document.getElementById('apiKeySave');
        
        // Advanced API key elements
        this.advancedApiKeyInput = document.getElementById('advancedApiKey');
        this.showApiKeyBtn = document.getElementById('showApiKey');
        this.saveAdvancedApiKeyBtn = document.getElementById('saveAdvancedApiKey');
        this.clearApiKeyBtn = document.getElementById('clearApiKey');
        
        // Video API key elements
        this.videoAdvancedApiKeyInput = document.getElementById('videoAdvancedApiKey');
        this.showVideoApiKeyBtn = document.getElementById('showVideoApiKey');
        this.saveVideoApiKeyBtn = document.getElementById('saveVideoApiKey');
        this.clearVideoApiKeyBtn = document.getElementById('clearVideoApiKey');
        
        // Image tab elements
        this.imagePromptInput = document.getElementById('imagePrompt');
        this.imageStyleOptions = document.querySelectorAll('#imageTab .style-option');
        this.generateImageBtn = document.getElementById('generateImageBtn');
        this.imageResults = document.getElementById('imageResults');
        
        // Video tab elements
        this.videoPromptInput = document.getElementById('videoPrompt');
        this.videoStyleOptions = document.querySelectorAll('#videoTab .style-option');
        this.templateChips = document.querySelectorAll('.template-chip');
        this.generateVideoBtn = document.getElementById('generateVideoBtn');
        this.videoResults = document.getElementById('videoResults');
        
        // Shared config elements
        this.artStyleSelect = document.getElementById('artStyle');
        this.videoStyleInput = document.getElementById('videoStyle');
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
        
        // Video specific config elements
        this.videoModelSelect = document.getElementById('videoModelSelect');
        this.videoCustomSystemPromptInput = document.getElementById('videoCustomSystemPrompt');
        this.showVideoDefaultPromptBtn = document.getElementById('showVideoDefaultPromptBtn');
        this.useVideoDefaultPromptBtn = document.getElementById('useVideoDefaultPromptBtn');
        this.editVideoDefaultPromptBtn = document.getElementById('editVideoDefaultPromptBtn');
        this.videoDefaultPromptViewer = document.getElementById('videoDefaultPromptViewer');
        this.videoDefaultPromptContent = document.getElementById('videoDefaultPromptContent');
        this.editVideoPromptBtn = document.getElementById('editVideoPromptBtn');
        
        // Video specific elements
        this.videoDetailLevelSelect = document.getElementById('videoDetailLevel');
        this.videoAspectRatioSelect = document.getElementById('videoAspectRatio');
        this.videoLengthSelect = document.getElementById('videoLength');
        this.numberOfVideoPromptsSelect = document.getElementById('numberOfVideoPrompts');

        // Image generation elements
        this.imageGenProviderSelect = document.getElementById('imageGenProvider');
        this.imageGenModelSelect = document.getElementById('imageGenModel');
        this.imageGenStyleSelect = document.getElementById('imageGenStyle');
        this.imageGenQualitySelect = document.getElementById('imageGenQuality');
        this.autoGenerateImageCheckbox = document.getElementById('autoGenerateImage');
        this.testImageGenBtn = document.getElementById('testImageGenBtn');
        
        // Status elements
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingMessage = document.getElementById('loadingMessage');
    }

    bindEvents() {
        // API Key management
        this.apiKeySave.addEventListener('click', () => this.saveApiKey());
        this.apiKeyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
        
        // Advanced API Key management
        this.bindAdvancedApiKeyEvents();
        
        // Image tab events
        this.generateImageBtn.addEventListener('click', () => this.generatePrompts('image'));
        this.imagePromptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generatePrompts('image');
            }
        });
        
        // Video tab events
        this.generateVideoBtn.addEventListener('click', () => this.generatePrompts('video'));
        this.videoPromptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generatePrompts('video');
            }
        });
        
        // Style selection events
        this.bindStyleSelectionEvents();
        this.bindTemplateEvents();
        
        // Settings events
        this.guidanceScaleInput?.addEventListener('input', (e) => {
            if (this.guidanceValueSpan) {
                this.guidanceValueSpan.textContent = e.target.value;
            }
        });
        
        // Load saved settings
        this.loadSavedSettings();
        this.modelSelect?.addEventListener('change', () => this.saveSettings());
        this.customSystemPromptInput?.addEventListener('change', () => this.saveSettings());
        this.videoModelSelect?.addEventListener('change', () => this.saveSettings());
        this.videoCustomSystemPromptInput?.addEventListener('change', () => this.saveSettings());
        
        // Image generation settings events
        this.bindImageGenerationEvents();

        // Image generation settings button
        const imageGenSettingsBtn = document.getElementById('imageGenSettingsBtn');
        if (imageGenSettingsBtn) {
            imageGenSettingsBtn.addEventListener('click', () => this.openImageGenerationSettings());
        }
        
        // Prompt control buttons
        this.showDefaultPromptBtn?.addEventListener('click', () => this.toggleDefaultPromptViewer());
        this.useDefaultPromptBtn?.addEventListener('click', () => this.useDefaultPrompt());
        this.editDefaultPromptBtn?.addEventListener('click', () => this.editDefaultPrompt());
        this.resetSettingsBtn?.addEventListener('click', () => this.resetAllSettings());
        this.testImageGenBtn?.addEventListener('click', () => this.testImageGeneration());
        
        // Video prompt control buttons
        this.showVideoDefaultPromptBtn?.addEventListener('click', () => this.toggleVideoDefaultPromptViewer());
        this.useVideoDefaultPromptBtn?.addEventListener('click', () => this.useVideoDefaultPrompt());
        this.editVideoDefaultPromptBtn?.addEventListener('click', () => this.editVideoDefaultPrompt());
        this.editVideoPromptBtn?.addEventListener('click', () => this.editVideoDefaultPrompt());
    }

    bindImageGenerationEvents() {
        // Image generation settings change events
        this.imageGenModelSelect?.addEventListener('change', () => {
            const selectedModel = this.imageGenModelSelect.value;
            this.imageGenerator.setModel(selectedModel);
            localStorage.setItem('image_gen_model', selectedModel);
            this.showSuccessMessage('✅ Model tạo ảnh đã được cập nhật!');
        });

        this.imageGenStyleSelect?.addEventListener('change', () => {
            localStorage.setItem('image_gen_style', this.imageGenStyleSelect.value);
        });

        this.imageGenQualitySelect?.addEventListener('change', () => {
            localStorage.setItem('image_gen_quality', this.imageGenQualitySelect.value);
        });

        this.autoGenerateImageCheckbox?.addEventListener('change', () => {
            localStorage.setItem('auto_generate_image', this.autoGenerateImageCheckbox.checked);
        });
    }

    // Test image generation functionality
    async testImageGeneration() {
        try {
            this.hideError();
            
            // Hiển thị loading
            const testBtn = this.testImageGenBtn;
            const originalText = testBtn.textContent;
            testBtn.disabled = true;
            testBtn.textContent = '🔄 Đang test...';

            // Test với prompt đơn giản
            const testPrompt = 'Một con mèo dễ thương đang ngồi trên cỏ xanh';
            const options = {
                style: this.imageGenStyleSelect?.value || 'photorealistic',
                quality: this.imageGenQualitySelect?.value || 'standard',
                aspectRatio: '1:1'
            };

            console.log('Testing image generation with:', { testPrompt, options });

            const result = await this.imageGenerator.generateImage(testPrompt, options);

            if (result.success) {
                this.showSuccessMessage('🎉 Test tạo ảnh thành công! Kiểm tra kết quả ở tab Tạo Ảnh.');
                
                // Hiển thị kết quả test trong một modal nhỏ
                this.showTestImageResult(result, testPrompt);
            } else {
                throw new Error(result.error || 'Không thể test tạo ảnh');
            }

        } catch (error) {
            console.error('Test image generation error:', error);
            this.showError(`❌ Test thất bại: ${error.message}`);
        } finally {
            // Reset button
            const testBtn = this.testImageGenBtn;
            testBtn.disabled = false;
            testBtn.textContent = '🧪 Test Tạo Ảnh';
        }
    }

    // Hiển thị kết quả test image
    showTestImageResult(result, testPrompt) {
        // Tạo modal để hiển thị kết quả test
        const modal = document.createElement('div');
        modal.className = 'test-result-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🧪 Kết quả Test Tạo Ảnh</h3>
                    <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">✕</button>
                </div>
                <div class="modal-body">
                    <p><strong>Prompt test:</strong> "${testPrompt}"</p>
                    <div class="test-image-results">
                        ${result.images.map(image => `
                            <div class="test-image-item">
                                ${image.url ? `
                                    <img src="${image.url}" alt="Test generated image" style="max-width: 100%; height: auto; border-radius: 8px;" />
                                ` : ''}
                                ${image.description ? `
                                    <div class="test-description">
                                        <strong>Mô tả:</strong> ${image.description}
                                    </div>
                                ` : ''}
                                <div class="test-info">
                                    <small>Method: ${image.method || 'unknown'} | Type: ${image.type}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="test-actions">
                        <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" class="close-btn">Đóng</button>
                    </div>
                </div>
            </div>
        `;

        // Thêm styles cho modal
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.querySelector('.modal-content').style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 90%;
            max-height: 90%;
            overflow-y: auto;
        `;

        document.body.appendChild(modal);

        // Auto close after 10 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 10000);
    }

    bindStyleSelectionEvents() {
        // Image style selection
        this.imageStyleOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectStyle(option, 'image');
            });
        });
        
        // Video style selection
        this.videoStyleOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectStyle(option, 'video');
            });
        });
    }
    
    selectStyle(selectedOption, type) {
        const container = selectedOption.closest('.style-selection');
        const options = container.querySelectorAll('.style-option');
        const styleValue = selectedOption.dataset.style;
        
        // Update visual selection
        options.forEach(opt => opt.classList.remove('active'));
        selectedOption.classList.add('active');
        
        // Update hidden input
        if (type === 'image') {
            this.artStyleSelect.value = styleValue;
        } else {
            this.videoStyleInput.value = styleValue;
        }
    }
    
    bindAdvancedApiKeyEvents() {
        // Image tab advanced API key
        this.showApiKeyBtn?.addEventListener('click', () => this.toggleApiKeyVisibility('advancedApiKey'));
        this.saveAdvancedApiKeyBtn?.addEventListener('click', () => this.saveAdvancedApiKey('advancedApiKey'));
        this.clearApiKeyBtn?.addEventListener('click', () => this.clearAdvancedApiKey('advancedApiKey'));
        
        // Video tab advanced API key
        this.showVideoApiKeyBtn?.addEventListener('click', () => this.toggleApiKeyVisibility('videoAdvancedApiKey'));
        this.saveVideoApiKeyBtn?.addEventListener('click', () => this.saveAdvancedApiKey('videoAdvancedApiKey'));
        this.clearVideoApiKeyBtn?.addEventListener('click', () => this.clearAdvancedApiKey('videoAdvancedApiKey'));
        
        // Load current API key to advanced inputs
        this.loadApiKeyToAdvanced();
    }
    
    loadApiKeyToAdvanced() {
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey) {
            if (this.advancedApiKeyInput) {
                this.advancedApiKeyInput.value = savedApiKey;
                this.advancedApiKeyInput.type = 'password';
            }
            if (this.videoAdvancedApiKeyInput) {
                this.videoAdvancedApiKeyInput.value = savedApiKey;
                this.videoAdvancedApiKeyInput.type = 'password';
            }
        }
    }
    
    toggleApiKeyVisibility(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        if (input.type === 'password') {
            input.type = 'text';
            // Update button text
            const showBtn = inputId === 'advancedApiKey' ? this.showApiKeyBtn : this.showVideoApiKeyBtn;
            showBtn.innerHTML = '🙈 Ẩn';
        } else {
            input.type = 'password';
            const showBtn = inputId === 'advancedApiKey' ? this.showApiKeyBtn : this.showVideoApiKeyBtn;
            showBtn.innerHTML = '👁️ Hiện';
        }
    }
    
    saveAdvancedApiKey(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const apiKey = input.value.trim();
        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
            // Sync to other inputs
            this.syncApiKeyInputs(apiKey);
            this.showSuccessMessage('API key đã được lưu thành công! 🔑');
            window.uiStateManager.hideApiKeySection();
        } else {
            this.showError('Vui lòng nhập API key hợp lệ');
        }
    }
    
    clearAdvancedApiKey(inputId) {
        if (confirm('Bạn có chắc chắn muốn xóa API key? Bạn sẽ cần nhập lại để sử dụng ứng dụng.')) {
            localStorage.removeItem('gemini_api_key');
            // Clear all API key inputs
            this.apiKeyInput.value = '';
            if (this.advancedApiKeyInput) this.advancedApiKeyInput.value = '';
            if (this.videoAdvancedApiKeyInput) this.videoAdvancedApiKeyInput.value = '';
            
            this.showSuccessMessage('API key đã được xóa! 🗑️');
            window.uiStateManager.showApiKeySection();
        }
    }
    
    syncApiKeyInputs(apiKey) {
        // Sync API key to all inputs
        this.apiKeyInput.value = apiKey;
        if (this.advancedApiKeyInput) this.advancedApiKeyInput.value = apiKey;
        if (this.videoAdvancedApiKeyInput) this.videoAdvancedApiKeyInput.value = apiKey;
    }
    
    toggleVideoDefaultPromptViewer() {
        if (!this.videoDefaultPromptViewer || !this.videoDefaultPromptContent || !this.showVideoDefaultPromptBtn) {
            this.showError('Video default prompt viewer elements not found');
            return;
        }

        if (this.videoDefaultPromptViewer.style.display === 'none') {
            this.videoDefaultPromptContent.textContent = this.getDefaultSystemPrompt('video');
            this.videoDefaultPromptViewer.style.display = 'block';
            this.showVideoDefaultPromptBtn.textContent = '🔼 Ẩn Video Prompt Mặc Định';
        } else {
            this.videoDefaultPromptViewer.style.display = 'none';
            this.showVideoDefaultPromptBtn.textContent = '📝 Xem Prompt Mặc Định';
        }
    }
    
    useVideoDefaultPrompt() {
        if (this.videoCustomSystemPromptInput) {
            this.videoCustomSystemPromptInput.value = '';
            this.saveSettings();
            this.showSuccessMessage('✅ Đã reset về system prompt mặc định cho video!');
        }
    }
    
    editVideoDefaultPrompt() {
        if (this.videoCustomSystemPromptInput) {
            const defaultPrompt = this.getDefaultSystemPrompt('video');
            this.videoCustomSystemPromptInput.value = defaultPrompt;
            this.saveSettings();
            
            // Scroll to the textarea
            this.videoCustomSystemPromptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.videoCustomSystemPromptInput.focus();
            
            this.showSuccessMessage('📝 Video prompt mặc định đã được tải vào ô chỉnh sửa. Bạn có thể tùy chỉnh theo ý muốn!');
        }
    }

    bindTemplateEvents() {
        // Video template chips
        this.templateChips.forEach(chip => {
            chip.addEventListener('click', () => this.handleTemplateClick(chip));
        });
    }

    loadSavedSettings() {
        const savedApiKey = localStorage.getItem('gemini_api_key');
        if (savedApiKey) {
            this.apiKeyInput.value = savedApiKey;
        }

        const savedModel = localStorage.getItem('gemini_model');
        if (savedModel && this.modelSelect) {
            this.modelSelect.value = savedModel;
        }

        const savedSystemPrompt = localStorage.getItem('custom_system_prompt');
        if (savedSystemPrompt && this.customSystemPromptInput) {
            this.customSystemPromptInput.value = savedSystemPrompt;
        }
        
        const savedVideoModel = localStorage.getItem('video_gemini_model');
        if (savedVideoModel && this.videoModelSelect) {
            this.videoModelSelect.value = savedVideoModel;
        }
        
        const savedVideoSystemPrompt = localStorage.getItem('video_custom_system_prompt');
        if (savedVideoSystemPrompt && this.videoCustomSystemPromptInput) {
            this.videoCustomSystemPromptInput.value = savedVideoSystemPrompt;
        }

        // Load image generation settings
        const savedImageModel = localStorage.getItem('image_gen_model');
        if (savedImageModel && this.imageGenModelSelect) {
            this.imageGenModelSelect.value = savedImageModel;
        }

        const savedImageStyle = localStorage.getItem('image_gen_style');
        if (savedImageStyle && this.imageGenStyleSelect) {
            this.imageGenStyleSelect.value = savedImageStyle;
        }

        const savedImageQuality = localStorage.getItem('image_gen_quality');
        if (savedImageQuality && this.imageGenQualitySelect) {
            this.imageGenQualitySelect.value = savedImageQuality;
        }

        const autoGenerateImage = localStorage.getItem('auto_generate_image');
        if (this.autoGenerateImageCheckbox) {
            this.autoGenerateImageCheckbox.checked = autoGenerateImage === 'true';
        }
    }

    saveSettings() {
        if (this.modelSelect) {
            localStorage.setItem('gemini_model', this.modelSelect.value);
        }
        if (this.customSystemPromptInput) {
            localStorage.setItem('custom_system_prompt', this.customSystemPromptInput.value.trim());
        }
        if (this.videoModelSelect) {
            localStorage.setItem('video_gemini_model', this.videoModelSelect.value);
        }
        if (this.videoCustomSystemPromptInput) {
            localStorage.setItem('video_custom_system_prompt', this.videoCustomSystemPromptInput.value.trim());
        }
    }
    
    saveApiKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('gemini_api_key', apiKey);
            // Sync to advanced inputs
            this.syncApiKeyInputs(apiKey);
            window.uiStateManager.hideApiKeySection();
            this.showSuccessMessage('API key đã được lưu thành công! 🔑');
        } else {
            this.showError('Vui lòng nhập API key hợp lệ');
        }
    }

    // This method is no longer needed as tab switching is handled by UIStateManager

    getDefaultSystemPrompt(contentType = 'image') {
        if (contentType === 'video') {
            return `You are an expert AI video prompt engineer.
Your role is to assist users in generating **structured, cinematic-quality prompts** for AI video generation tools (e.g., Runway Gen-4, Pika, Sora).

### Core Responsibilities:
1. Always guide the user to build prompts using **structured templates** that include:
   - **Nhân vật (Character/Subject)**: ngoại hình, hành động, cảm xúc
   - **Góc quay (Camera angle/shot type)**: wide, close-up, tracking, dolly, drone…
   - **Bối cảnh (Scene/Background)**: địa điểm, môi trường, chi tiết phụ trợ
   - **Ánh sáng (Lighting)**: golden hour, soft light, dramatic shadows, neon…
   - **Chuyển động (Motion)**: chuyển động nhân vật, camera, cảnh vật
   - **Cảm xúc / Mood**: tình cảm, căng thẳng, hài hước, lãng mạn…
   - **Phong cách / Style**: cinematic, documentary, minimalist, anime…

2. Provide users with a set of **ready-made templates (Mẫu)** they can choose from, such as:
   - **Close-up Emotion Shot**: nhấn mạnh cảm xúc qua cận cảnh gương mặt
   - **Establishing Wide Shot**: giới thiệu bối cảnh rộng lớn
   - **Action Tracking Shot**: theo dõi chuyển động nhân vật trong hành động
   - **Documentary Interview Shot**: phong cách tư liệu / phỏng vấn
   - **Match-cut Transition**: cắt ghép cảnh có liên kết ý nghĩa

3. For each template, include:
   - A **structure outline** (fields to fill in)
   - A **short description** (how/why this template works)
   - A **sample prompt** with placeholders

4. When a user enters their description, adapt it to the chosen template, optimize wording, and output a **final prompt** in both **Vietnamese** and **English** for maximum compatibility with AI tools.

### Output Rules:
- Always maintain **clarity, cinematic detail, and strong visual cues**.
- Keep prompts concise but descriptive (avoid unnecessary adjectives).
- Highlight **motion** clearly (camera + subject + scene).
- Provide both **ready-to-use final prompt** and the **structured breakdown**.

Your ultimate goal is to **help users create cinematic, professional AI video prompts effortlessly** by combining their input with optimized templates.

### Response Format:
**Video Prompt [số]:**
[Detailed English prompt optimized for AI video tools]

**Mô tả Tiếng Việt:**
[Vietnamese explanation of the video concept]

**Structured Breakdown:**
- Nhân vật: [character details]
- Góc quay: [camera technique]
- Bối cảnh: [scene/environment]
- Ánh sáng: [lighting setup]
- Chuyển động: [motion description]
- Mood: [emotional tone]
- Style: [visual style]

**Negative Prompt:**
[Things to avoid in the video]

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
            // Switch to image tab and reset style selection
            window.uiStateManager.switchTab('image');
            
            // Reset image style selection
            this.imageStyleOptions.forEach(opt => opt.classList.remove('active'));
            this.imageStyleOptions[0]?.classList.add('active');
            this.artStyleSelect.value = 'realistic';
            
            // Reset video style selection
            this.videoStyleOptions.forEach(opt => opt.classList.remove('active'));
            this.videoStyleOptions[0]?.classList.add('active');
            this.videoStyleInput.value = 'cinematic';
            
            // Hide image default prompt viewer
            if (this.defaultPromptViewer) {
                this.defaultPromptViewer.style.display = 'none';
            }
            if (this.showDefaultPromptBtn) {
                this.showDefaultPromptBtn.textContent = '📝 Xem Prompt Mặc Định';
            }
            
            // Reset template chips
            this.templateChips.forEach(chip => {
                chip.classList.remove('active');
            });
            
            // Reset video-specific settings
            if (this.videoModelSelect) this.videoModelSelect.value = 'gemini-1.5-flash';
            if (this.videoCustomSystemPromptInput) this.videoCustomSystemPromptInput.value = '';
            
            // Hide video default prompt viewer
            if (this.videoDefaultPromptViewer) {
                this.videoDefaultPromptViewer.style.display = 'none';
                if (this.showVideoDefaultPromptBtn) {
                    this.showVideoDefaultPromptBtn.textContent = '📝 Xem Prompt Mặc Định';
                }
            }
            
            alert('🔄 Đã reset tất cả cài đặt về mặc định! (API key được giữ lại)');
        }
    }

    handleTemplateClick(chip) {
        const template = chip.dataset.template;
        const currentPrompt = this.videoPromptInput.value.trim();
        
        // Toggle selected state
        chip.classList.toggle('active');
        
        // Add or remove template from prompt
        if (chip.classList.contains('active')) {
            if (currentPrompt) {
                this.videoPromptInput.value = currentPrompt + ', ' + template;
            } else {
                this.videoPromptInput.value = template;
            }
        } else {
            // Remove template from prompt
            const newPrompt = currentPrompt.replace(new RegExp(`,?\\s*${template.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'), '').replace(/^,\s*/, '').replace(/,\s*,/g, ',').trim();
            this.videoPromptInput.value = newPrompt;
        }
    }

    validateInputs(contentType) {
        const apiKey = this.apiKeyInput.value.trim() || localStorage.getItem('gemini_api_key');
        const promptInput = contentType === 'image' ? this.imagePromptInput : this.videoPromptInput;
        const prompt = promptInput.value.trim();

        if (!apiKey) {
            window.uiStateManager.showApiKeySection();
            throw new Error('Vui lòng nhập API key Gemini');
        }

        if (!prompt) {
            const contentName = contentType === 'image' ? 'hình ảnh' : 'video';
            throw new Error(`Vui lòng nhập ý tưởng ${contentName}`);
        }

        if (prompt.length < 5) {
            throw new Error('Ý tưởng quá ngắn. Vui lòng mô tả chi tiết hơn');
        }

        return { apiKey, prompt };
    }

    getPromptGenerationConfig(contentType) {
        if (contentType === 'image') {
            return {
                artStyle: this.artStyleSelect.value,
                detailLevel: this.detailLevelSelect?.value || 'detailed',
                aspectRatio: this.aspectRatioSelect?.value || '1:1',
                numberOfPrompts: parseInt(this.numberOfPromptsSelect?.value || '3'),
                contentType: 'image'
            };
        } else {
            return {
                artStyle: this.videoStyleInput.value,
                detailLevel: this.videoDetailLevelSelect?.value || 'detailed',
                aspectRatio: this.videoAspectRatioSelect?.value || '16:9',
                numberOfPrompts: parseInt(this.numberOfVideoPromptsSelect?.value || '3'),
                videoLength: this.videoLengthSelect?.value || 'medium',
                contentType: 'video'
            };
        }
    }

    buildSystemPrompt(contentType) {
        let customPrompt;
        
        if (contentType === 'video') {
            customPrompt = this.videoCustomSystemPromptInput?.value.trim();
        } else {
            customPrompt = this.customSystemPromptInput?.value.trim();
        }
        
        if (customPrompt) {
            return customPrompt;
        }

        return this.getDefaultSystemPrompt(contentType);
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.loadingMessage.style.display = 'none';
    }

    hideError() {
        this.errorMessage.style.display = 'none';
    }

    showLoading(contentType) {
        this.loadingMessage.style.display = 'block';
        
        const generateBtn = contentType === 'image' ? this.generateImageBtn : this.generateVideoBtn;
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoading = generateBtn.querySelector('.btn-loading');
        
        generateBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
    }

    hideLoading(contentType) {
        this.loadingMessage.style.display = 'none';
        
        const generateBtn = contentType === 'image' ? this.generateImageBtn : this.generateVideoBtn;
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoading = generateBtn.querySelector('.btn-loading');
        
        generateBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }

    async generatePrompts(contentType = 'image') {
        try {
            this.hideError();
            
            // Validate inputs
            const { apiKey, prompt } = this.validateInputs(contentType);
            
            // Initialize AI client with proper API key format
            this.ai = new GoogleGenerativeAI(apiKey);
            
            // Show loading
            this.showLoading(contentType);
            
            // Get configuration
            const config = this.getPromptGenerationConfig(contentType);
            
            // Build the detailed prompt for Gemini
            const systemPrompt = this.buildSystemPrompt(contentType);
            const userPrompt = this.buildUserPrompt(prompt, config);
            
            // Generate prompts using Gemini
            let selectedModel;
            if (contentType === 'video') {
                selectedModel = this.videoModelSelect?.value || 'gemini-1.5-flash';
            } else {
                selectedModel = this.modelSelect?.value || 'gemini-1.5-flash';
            }
            const model = this.ai.getGenerativeModel({ model: selectedModel });
            
            const response = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [{ text: systemPrompt + '\n\n' + userPrompt }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 2048
                }
            });

            // Process results
            this.displayPromptResults(response, prompt, config, contentType);
            
            // Add to history
            if (window.historyManager) {
                window.historyManager.addToHistory(contentType, prompt, response.response.text());
            }
            
        } catch (error) {
            console.error('Error generating prompts:', error);
            this.showError(this.getErrorMessage(error));
        } finally {
            this.hideLoading(contentType);
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
        const videoLengthInfo = config.videoLength ? `
Độ dài video: ${config.videoLength}` : '';
        
        return `Ý tưởng gốc: "${userIdea}"
Loại nội dung: ${contentTypeText}
Phong cách: ${styleMap[config.artStyle]}
Mức độ chi tiết: ${detailMap[config.detailLevel]}
Tỷ lệ khung hình: ${config.aspectRatio}${videoLengthInfo}
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

    displayPromptResults(response, originalIdea, config, contentType) {
        // Get the appropriate results container
        const resultsContainer = contentType === 'image' ? this.imageResults : this.videoResults;
        
        // Clear previous results
        resultsContainer.innerHTML = '';
        
        if (!response.response?.text()) {
            this.showError('Không thể tạo mô tả. Vui lòng thử lại.');
            return;
        }

        // Parse the response to extract individual prompts
        const generatedText = response.response.text();
        const prompts = this.parseGeneratedPrompts(generatedText);
        
        if (prompts.length === 0) {
            this.showError('Không thể phân tích kết quả. Vui lòng thử lại.');
            return;
        }

        // Create prompt elements
        prompts.forEach((promptData, index) => {
            this.createPromptElement(promptData, index, originalIdea, config, contentType, resultsContainer);
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

                // Check for new format headers
                if (line.startsWith('**Video Prompt') || line.startsWith('**Prompt')) {
                    currentSection = 'prompt';
                } else if (line.startsWith('**English:**')) {
                    currentSection = 'prompt';
                    // Extract content after "English:"
                    const content = line.replace('**English:**', '').trim();
                    if (content) promptText += content + ' ';
                } else if (line.startsWith('**Mô tả Tiếng Việt:**')) {
                    currentSection = 'vietnamese';
                    // Extract content after "Mô tả Tiếng Việt:"
                    const content = line.replace('**Mô tả Tiếng Việt:**', '').trim();
                    if (content) vietnameseDescription += content + ' ';
                } else if (line.startsWith('**Negative Prompt:**')) {
                    currentSection = 'negative';
                    // Extract content after "Negative Prompt:"
                    const content = line.replace('**Negative Prompt:**', '').trim();
                    if (content) negativePrompt += content + ' ';
                } else if (line && !line.startsWith('**') && currentSection) {
                    // Continue collecting content for current section
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

    createPromptElement(promptData, index, originalIdea, config, contentType, container) {
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
                ${contentType === 'image' ? `
                    <button class="generate-image-btn" data-prompt-index="${index}" data-prompt="${promptData.prompt.replace(/"/g, '&quot;')}">
                        🎨 Tạo Ảnh
                    </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(promptItem);
        
        // Add event listeners for this prompt item
        const copyBtn = promptItem.querySelector('.copy-prompt-btn');
        const copyNegativeBtn = promptItem.querySelector('.copy-negative-btn');
        const copyAllBtn = promptItem.querySelector('.copy-all-btn');
        const generateImageBtn = promptItem.querySelector('.generate-image-btn');
        
        copyBtn.addEventListener('click', () => this.copyPrompt(promptData.prompt));
        
        if (copyNegativeBtn) {
            copyNegativeBtn.addEventListener('click', () => this.copyPrompt(promptData.negativePrompt));
        }
        
        copyAllBtn.addEventListener('click', () => this.copyAllPrompts(promptData));
        
        if (generateImageBtn) {
            generateImageBtn.addEventListener('click', () => this.generateImageFromPrompt(promptData.prompt, promptItem, config));
        }
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

    // Generate image from prompt using Gemini API
    async generateImageFromPrompt(prompt, promptItem, config) {
        try {
            this.hideError();

            if (!prompt || prompt.trim() === '') {
                throw new Error('Prompt trống, không thể tạo ảnh.');
            }

            // Hiển thị loading cho prompt item này
            this.showImageGenerationLoading(promptItem);

            // Tạo options từ config
            const options = {
                style: this.getStyleFromConfig(config.artStyle),
                quality: config.detailLevel || 'high',
                aspectRatio: config.aspectRatio || '1:1'
            };

            console.log('Generating image with options:', options);

            // Gọi ImageGenerator để tạo ảnh
            const result = await this.imageGenerator.generateImage(prompt, options);

            if (!result.success) {
                throw new Error(result.error || 'Không thể tạo hình ảnh');
            }

            // Hiển thị kết quả
            this.displayGeneratedImageInPrompt(result, promptItem, prompt);
            
            this.showSuccessMessage('🎨 Ảnh đã được tạo thành công!');

        } catch (error) {
            console.error('Image generation error:', error);
            this.showError(error.message || 'Đã xảy ra lỗi khi tạo ảnh');
        } finally {
            this.hideImageGenerationLoading();
        }
    }

    // Map config style to ImageGenerator style
    getStyleFromConfig(artStyle) {
        const styleMap = {
            'realistic': 'photorealistic',
            'anime': 'anime',
            'digital-art': 'artistic',
            'fantasy': 'fantasy',
            'cinematic': 'artistic',
            'minimalist': 'minimalist'
        };
        
        return styleMap[artStyle] || 'photorealistic';
    }

    // Hiển thị ảnh được tạo trong prompt item
    displayGeneratedImageInPrompt(result, promptItem, originalPrompt) {
        // Xóa ảnh cũ nếu có
        const existingImage = promptItem.querySelector('.generated-image-display');
        if (existingImage) {
            existingImage.remove();
        }

        // Tạo container cho ảnh
        const imageDisplay = document.createElement('div');
        imageDisplay.className = 'generated-image-display';

        if (result.images && result.images.length > 0) {
            const image = result.images[0];
            
            let imageHTML = '';
            
            if (image.type === 'svg') {
                imageHTML = `
                    <div class="generated-image-header">
                        <h4>🎨 Ảnh được tạo (SVG)</h4>
                        <span class="image-method">Method: ${image.method || 'svg_generation'}</span>
                    </div>
                    <div class="generated-image-container">
                        <img src="${image.url}" alt="Generated SVG image" class="generated-image" />
                    </div>
                `;
            } else if (image.type === 'text') {
                imageHTML = `
                    <div class="generated-image-header">
                        <h4>📝 Mô tả ảnh chi tiết</h4>
                        <span class="image-method">Method: text_description</span>
                    </div>
                    <div class="generated-text-content">
                        <p>${image.description}</p>
                    </div>
                `;
            } else if (image.url) {
                imageHTML = `
                    <div class="generated-image-header">
                        <h4>🎨 Ảnh được tạo</h4>
                        <span class="image-method">Method: ${image.method || 'gemini_api'}</span>
                    </div>
                    <div class="generated-image-container">
                        <img src="${image.url}" alt="Generated image" class="generated-image" />
                    </div>
                `;
            }

            // Thêm action buttons
            imageHTML += `
                <div class="generated-image-actions">
                    ${image.url ? `
                        <button class="download-image-btn" onclick="promptApp.downloadGeneratedImage('${image.url}', 'generated-${Date.now()}')">
                            💾 Tải xuống
                        </button>
                        <button class="copy-image-url-btn" onclick="promptApp.copyImageUrl('${image.url}')">
                            📋 Copy URL
                        </button>
                    ` : ''}
                    <button class="regenerate-image-btn" onclick="promptApp.regenerateImage('${originalPrompt.replace(/'/g, "\\'")}', this)">
                        🔄 Tạo lại
                    </button>
                </div>
            `;

            imageDisplay.innerHTML = imageHTML;
        } else {
            imageDisplay.innerHTML = `
                <div class="generated-image-header">
                    <h4>❌ Không thể tạo ảnh</h4>
                </div>
                <div class="error-content">
                    <p>Gemini API hiện tại có thể không hỗ trợ tạo ảnh trực tiếp. Vui lòng thử lại sau.</p>
                </div>
            `;
        }

        // Thêm vào prompt item
        promptItem.appendChild(imageDisplay);

        // Scroll to image
        imageDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Regenerate image
    async regenerateImage(originalPrompt, buttonElement) {
        const promptItem = buttonElement.closest('.prompt-item');
        const config = {
            artStyle: 'realistic',
            aspectRatio: '1:1',
            detailLevel: 'high'
        };
        
        await this.generateImageFromPrompt(originalPrompt, promptItem, config);
    }

    // Image Generation Methods
    async generateActualImage(promptIndex = 0) {
        try {
            this.hideError();

            // Get the prompt from the results
            const promptItems = this.imageResults.querySelectorAll('.prompt-item');
            if (promptItems.length === 0) {
                throw new Error('Không có prompt nào để tạo hình ảnh. Vui lòng tạo prompt trước.');
            }

            const selectedPromptItem = promptItems[promptIndex];
            if (!selectedPromptItem) {
                throw new Error('Không tìm thấy prompt được chọn.');
            }

            const promptContent = selectedPromptItem.querySelector('.prompt-content');
            if (!promptContent) {
                throw new Error('Không thể lấy nội dung prompt.');
            }

            const prompt = promptContent.textContent.trim();
            if (!prompt) {
                throw new Error('Prompt trống, không thể tạo hình ảnh.');
            }

            // Show loading for image generation
            this.showImageGenerationLoading(selectedPromptItem);

            // Generate image using the ImageGenerator
            const result = await this.imageGenerator.generateImage(prompt, {
                provider: this.imageGenerator.currentModel,
                size: '1024x1024',
                quality: 'standard'
            });

            if (!result.success || result.images.length === 0) {
                throw new Error('Không thể tạo hình ảnh. Vui lòng thử lại.');
            }

            // Display the generated image
            this.displayGeneratedImage(result.images[0], selectedPromptItem, prompt);

            // Show success message
            this.showSuccessMessage('🎨 Hình ảnh đã được tạo thành công!');

        } catch (error) {
            console.error('Image generation error:', error);
            this.showError(this.parseImageGenerationError(error));
        } finally {
            // Hide loading
            this.hideImageGenerationLoading();
        }
    }

    showImageGenerationLoading(promptItem) {
        // Add loading indicator to the prompt item
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'image-generation-loading';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Đang tạo hình ảnh...</p>
        `;

        promptItem.appendChild(loadingDiv);
    }

    hideImageGenerationLoading() {
        const loadingDivs = document.querySelectorAll('.image-generation-loading');
        loadingDivs.forEach(div => div.remove());
    }

    displayGeneratedImage(imageData, promptItem, originalPrompt) {
        // Create image display element
        const imageDisplay = document.createElement('div');
        imageDisplay.className = 'generated-image-display';

        imageDisplay.innerHTML = `
            <div class="generated-image-header">
                <h4>🎨 Hình ảnh đã tạo</h4>
                <span class="image-provider">Provider: ${imageData.provider || 'Unknown'}</span>
            </div>
            <div class="generated-image-container">
                <img src="${imageData.url}" alt="Generated image" class="generated-image" />
            </div>
            <div class="generated-image-actions">
                <button class="download-image-btn" onclick="promptApp.downloadGeneratedImage('${imageData.url}', '${originalPrompt.substring(0, 30).replace(/'/g, "\\'")}...')">
                    💾 Tải xuống
                </button>
                <button class="copy-image-url-btn" onclick="promptApp.copyImageUrl('${imageData.url}')">
                    📋 Sao chép URL
                </button>
                <button class="generate-new-image-btn" onclick="promptApp.generateNewVariation('${originalPrompt.replace(/'/g, "\\'")}')">
                    🔄 Tạo biến thể mới
                </button>
            </div>
        `;

        promptItem.appendChild(imageDisplay);
    }

    async downloadGeneratedImage(imageUrl, filename) {
        try {
            await this.imageGenerator.downloadImage(imageUrl, filename);
            this.showSuccessMessage('✅ Hình ảnh đã được tải xuống!');
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Không thể tải xuống hình ảnh. Vui lòng thử lại.');
        }
    }

    async copyImageUrl(imageUrl) {
        try {
            await navigator.clipboard.writeText(imageUrl);
            this.showSuccessMessage('📋 URL hình ảnh đã được sao chép!');
        } catch (error) {
            console.error('Copy URL error:', error);
            this.showError('Không thể sao chép URL. Vui lòng thử lại.');
        }
    }

    // Show loading for image generation
    showImageGenerationLoading(promptItem) {
        // Remove existing loading if any
        this.hideImageGenerationLoading();
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'image-generation-loading';
        loadingDiv.id = 'imageGenLoading';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">🎨 Đang tạo ảnh với Gemini AI...</div>
            <div class="loading-subtext">Vui lòng đợi một chút...</div>
        `;
        
        promptItem.appendChild(loadingDiv);
        
        // Scroll to loading
        loadingDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Hide loading for image generation
    hideImageGenerationLoading() {
        const existing = document.getElementById('imageGenLoading');
        if (existing) {
            existing.remove();
        }
    }

    async generateNewVariation(originalPrompt) {
        try {
            // Add some variation to the prompt
            const variedPrompt = `${originalPrompt}, different composition, new perspective, unique style`;

            const result = await this.imageGenerator.generateImage(variedPrompt, {
                provider: this.imageGenerator.currentModel,
                size: '1024x1024',
                quality: 'standard'
            });

            if (result.success && result.images.length > 0) {
                // Find the parent prompt item and add the new image
                const promptItems = this.imageResults.querySelectorAll('.prompt-item');
                const lastItem = promptItems[promptItems.length - 1];

                this.displayGeneratedImage(result.images[0], lastItem, variedPrompt);
                this.showSuccessMessage('🎨 Biến thể mới đã được tạo!');
            }
        } catch (error) {
            console.error('Variation generation error:', error);
            this.showError('Không thể tạo biến thể mới. Vui lòng thử lại.');
        }
    }

    parseImageGenerationError(error) {
        if (error.message.includes('API key')) {
            return 'API key không hợp lệ. Vui lòng kiểm tra lại API key của bạn trong phần cài đặt.';
        }

        if (error.message.includes('quota') || error.message.includes('429')) {
            return 'Bạn đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau hoặc nâng cấp tài khoản.';
        }

        if (error.message.includes('network')) {
            return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.';
        }

        return error.message || 'Đã xảy ra lỗi khi tạo hình ảnh. Vui lòng thử lại.';
    }

    // Initialize image generation UI elements
    initializeImageGenerationUI() {
        // Add image generation button to each prompt item
        const promptItems = this.imageResults.querySelectorAll('.prompt-item');
        promptItems.forEach((item, index) => {
            const actionsDiv = item.querySelector('.prompt-actions');
            if (actionsDiv && !actionsDiv.querySelector('.generate-image-btn')) {
                const generateImageBtn = document.createElement('button');
                generateImageBtn.className = 'generate-image-btn';
                generateImageBtn.textContent = '🎨 Tạo hình ảnh';
                generateImageBtn.onclick = () => this.generateActualImage(index);
                actionsDiv.appendChild(generateImageBtn);
            }
        });
    }

    // Settings for image generation
    openImageGenerationSettings() {
        // Create a modal for Gemini image generation settings
        const settingsModal = document.createElement('div');
        settingsModal.className = 'image-gen-settings-modal';
        settingsModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>⚙️ Cài đặt tạo hình ảnh với Gemini</h3>
                    <button class="close-modal" onclick="this.parentElement.parentElement.remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="setting-group">
                        <label for="geminiModel">Model Gemini:</label>
                        <select id="geminiModel">
                            <option value="gemini-2.5-flash-exp">Gemini 2.5 Flash (Experimental)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Đáng tin cậy)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Nhanh)</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <label for="imageStyle">Phong cách hình ảnh:</label>
                        <select id="imageStyle">
                            <option value="photorealistic">Photorealistic (Chân thực)</option>
                            <option value="artistic">Artistic (Nghệ thuật)</option>
                            <option value="anime">Anime Style</option>
                            <option value="cartoon">Cartoon</option>
                            <option value="minimalist">Minimalist (Tối giản)</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <label for="imageQuality">Chất lượng:</label>
                        <select id="imageQuality">
                            <option value="high">Cao</option>
                            <option value="standard">Tiêu chuẩn</option>
                            <option value="low">Thấp (Nhanh hơn)</option>
                        </select>
                    </div>

                    <div class="setting-group">
                        <div class="info-box">
                            <strong>📝 Lưu ý:</strong><br>
                            - Gemini tạo hình ảnh thông qua tích hợp với các dịch vụ khác<br>
                            - Sử dụng API key Gemini hiện tại của bạn<br>
                            - Hình ảnh sẽ được tạo với chất lượng cao nhất có thể
                        </div>
                    </div>

                    <div class="setting-group">
                        <button id="saveImageGenSettings" class="save-btn">💾 Lưu cài đặt</button>
                        <button id="testImageGen" class="validate-btn">🧪 Test tạo hình ảnh</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(settingsModal);

        // Load current settings
        const modelSelect = settingsModal.querySelector('#geminiModel');
        const styleSelect = settingsModal.querySelector('#imageStyle');
        const qualitySelect = settingsModal.querySelector('#imageQuality');

        // Load saved preferences
        modelSelect.value = localStorage.getItem('image_gen_model') || 'gemini-1.5-pro';
        styleSelect.value = localStorage.getItem('image_style') || 'photorealistic';
        qualitySelect.value = localStorage.getItem('image_quality') || 'high';

        // Bind events
        const saveBtn = settingsModal.querySelector('#saveImageGenSettings');
        const testBtn = settingsModal.querySelector('#testImageGen');

        saveBtn.addEventListener('click', () => {
            localStorage.setItem('image_gen_model', modelSelect.value);
            localStorage.setItem('image_style', styleSelect.value);
            localStorage.setItem('image_quality', qualitySelect.value);
            this.imageGenerator.setModel(modelSelect.value);
            this.showSuccessMessage('✅ Cài đặt đã được lưu!');
        });

        testBtn.addEventListener('click', async () => {
            try {
                const testPrompt = "Tạo một hình ảnh đơn giản để test chức năng";
                const result = await this.imageGenerator.generateImage(testPrompt, {
                    style: styleSelect.value,
                    quality: qualitySelect.value
                });

                if (result.success) {
                    alert('✅ Test thành công! Hình ảnh đã được tạo.');
                }
            } catch (error) {
                alert('❌ Test thất bại: ' + error.message);
            }
        });
    }
}

// Initialize the application components
window.uiStateManager = new UIStateManager();
window.historyManager = new HistoryManager();
window.promptApp = new PromptGenerator();

// Add example prompts
const examplePrompts = [
    "Một con mèo dễ thương đang ngồi trên cỏ xanh dưới ánh nắng mặt trời, phong cách anime",
    "Phong cảnh núi non hùng vĩ với thác nước và cầu vồng, phong cách fantasy",
    "Robot thân thiện đang cầm ván trượt màu đỏ, phong cách vector tối giản",
    "Thành phố tương lai với xe bay và tòa nhà cao chọc trời, ban đêm với ánh đèn neon",
    "Khu vườn hoa anh đào nở rộ với con đường đá nhỏ, phong cách Nhật Bản truyền thống"
];

// Add CSS for history items (dynamic styles)
const historyStyles = document.createElement('style');
historyStyles.textContent = `
.history-item {
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-md);
    border: 2px solid var(--border-color);
    transition: all var(--transition-base);
}

.history-item:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-md);
}

.history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-sm);
}

.history-icon {
    font-size: var(--font-size-lg);
}

.history-date {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
}

.history-prompt {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.4;
    margin-bottom: var(--spacing-md);
    border-left: 3px solid var(--primary-color);
    padding-left: var(--spacing-md);
    background: white;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
}

.history-actions {
    display: flex;
    gap: var(--spacing-sm);
}

.history-reuse,
.history-delete {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 2px solid var(--primary-color);
    background: transparent;
    color: var(--primary-color);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-base);
    flex: 1;
}

.history-reuse:hover {
    background: var(--primary-color);
    color: white;
}

.history-delete {
    border-color: var(--danger-color);
    color: var(--danger-color);
}

.history-delete:hover {
    background: var(--danger-color);
    color: white;
}
`;
document.head.appendChild(historyStyles);

// Add rotating placeholder functionality
document.addEventListener('DOMContentLoaded', () => {
    const imagePromptInput = document.getElementById('imagePrompt');
    const videoPromptInput = document.getElementById('videoPrompt');
    
    if (imagePromptInput) {
        let exampleIndex = 0;
        setInterval(() => {
            if (!imagePromptInput.value && document.activeElement !== imagePromptInput) {
                imagePromptInput.placeholder = examplePrompts[exampleIndex];
                exampleIndex = (exampleIndex + 1) % examplePrompts.length;
            }
        }, 4000);
    }
    
    // Video examples
    const videoExamples = [
        "Một con mèo đang chạy qua cánh đồng hoa, camera theo chuyển động từ xa đến gần",
        "Cảnh bình minh trên núi, ánh nắng chiếu qua sương mù, camera pan từ trái sang phải",
        "Nhân vật đang đi bộ trên phố, camera handheld tạo cảm giác tự nhiên",
        "Drone bay qua thành phố về đêm, đèn neon lung linh, chuyển động mượt mà",
        "Cận cảnh đôi mắt, zoom out để lộ khuôn mặt, ánh sáng kịch tính"
    ];
    
    if (videoPromptInput) {
        let videoExampleIndex = 0;
        setInterval(() => {
            if (!videoPromptInput.value && document.activeElement !== videoPromptInput) {
                videoPromptInput.placeholder = videoExamples[videoExampleIndex];
                videoExampleIndex = (videoExampleIndex + 1) % videoExamples.length;
            }
        }, 4000);
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + 1 = Switch to Image tab
    if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        window.uiStateManager.switchTab('image');
    }
    
    // Ctrl/Cmd + 2 = Switch to Video tab
    if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        window.uiStateManager.switchTab('video');
    }
    
    // Ctrl/Cmd + H = Toggle History
    if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        if (window.historyManager.historySidebar.classList.contains('active')) {
            window.historyManager.hideHistory();
        } else {
            window.historyManager.showHistory();
        }
    }
});
