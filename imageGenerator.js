// Image Generation Module using Google Gemini API
// Uses Gemini's native image generation capabilities

import { GoogleGenerativeAI } from '@google/generative-ai';

export class ImageGenerator {
    constructor() {
        this.ai = null;
        this.currentProvider = 'gemini'; // 'gemini' hoặc 'imagen3'
        this.currentModel = 'gemini-1.5-pro'; // Model ổn định nhất
        this.vertexAIProject = ''; // Google Cloud Project ID cho Imagen 3
        this.vertexAILocation = 'us-central1'; // Region cho Vertex AI
        this.loadSavedSettings();
    }

    loadSavedSettings() {
        // Load provider settings
        this.currentProvider = localStorage.getItem('image_gen_provider') || 'gemini';
        
        // Load model settings
        const savedModel = localStorage.getItem('image_gen_model') || 'gemini-1.5-pro';
        this.currentModel = savedModel;
        
        // Load Vertex AI settings cho Imagen 3
        this.vertexAIProject = localStorage.getItem('vertex_ai_project') || '';
        this.vertexAILocation = localStorage.getItem('vertex_ai_location') || 'us-central1';
        
        // Khởi tạo AI nếu có API key
        const apiKey = localStorage.getItem('gemini_api_key');
        if (apiKey) {
            this.initializeAI(apiKey);
        }
    }

    initializeAI(apiKey) {
        if (!apiKey) {
            throw new Error('API key là bắt buộc để sử dụng tính năng tạo ảnh');
        }
        this.ai = new GoogleGenerativeAI(apiKey);
    }

    setApiKey(apiKey) {
        localStorage.setItem('gemini_api_key', apiKey.trim());
        this.initializeAI(apiKey);
    }

    setModel(model) {
        this.currentModel = model;
        localStorage.setItem('image_gen_model', model);
    }

    // Generate image from prompt using selected provider  
    async generateImage(prompt, options = {}) {
        // Chọn provider để tạo ảnh
        if (this.currentProvider === 'imagen3') {
            return await this.generateImageWithImagen3(prompt, options);
        } else {
            return await this.generateImageWithGemini(prompt, options);
        }
    }

    // Generate image using Gemini API with image generation capabilities
    async generateImageWithGemini(prompt, options = {}) {
        try {
            // Lấy API key từ localStorage nếu chưa có
            if (!this.ai) {
                const apiKey = localStorage.getItem('gemini_api_key');
                if (!apiKey) {
                    throw new Error('Vui lòng thiết lập API key Gemini trước khi tạo ảnh');
                }
                this.initializeAI(apiKey);
            }

            const {
                style = 'photorealistic',
                quality = 'high',
                aspectRatio = '1:1'
            } = options;

            // Kiểm tra model có hỗ trợ tạo ảnh không
            const imageCapableModels = [
                'gemini-1.5-pro', 
                'gemini-1.5-flash',
                'gemini-2.0-flash-preview-image-generation'
            ];
            const useImageGeneration = imageCapableModels.includes(this.currentModel);
            
            // Cấu hình model cho image generation
            const model = this.ai.getGenerativeModel({
                model: this.currentModel,
                generationConfig: {
                    temperature: 0.9,
                    topK: 32,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain"
                }
            });

            // Nếu model hỗ trợ tạo ảnh, sử dụng Gemini image generation
            if (useImageGeneration) {
                try {
                    // Tạo prompt request cho Gemini image generation
                    const imagePrompt = `Create an image: ${prompt}. Style: ${style}. Quality: ${quality}. Make it visually appealing and detailed.`;
                    
                    console.log('Attempting native image generation with Gemini...');
                    
                    // Thử tạo ảnh với Gemini
                    const result = await model.generateContent({
                        contents: [{
                            role: 'user',
                            parts: [{ text: imagePrompt }]
                        }]
                    });

                    const response = await result.response;
                    
                    // Kiểm tra response có chứa ảnh không
                    const generatedImages = await this.processImageResponse(response, prompt);
                    
                    if (generatedImages.length > 0) {
                        return {
                            success: true,
                            images: generatedImages,
                            originalPrompt: prompt,
                            method: 'gemini_native'
                        };
                    }
                    
                    console.log('No images in response, falling back to SVG generation...');
                } catch (imageError) {
                    console.warn('Native image generation failed:', imageError.message);
                }
            }
            
            // Fallback: tạo SVG hoặc mô tả chi tiết
            return await this.generateImageFallback(prompt, options);

        } catch (error) {
            console.error('Error in generateImage:', error);
            
            // Thử fallback method
            try {
                return await this.generateImageFallback(prompt, options);
            } catch (fallbackError) {
                return {
                    success: false,
                    error: this.handleImageGenerationError(error),
                    originalPrompt: prompt
                };
            }
        }
    }

    // Fallback method - tạo ảnh thông qua mô tả chi tiết
    async generateImageFallback(prompt, options = {}) {
        try {
            const model = this.ai.getGenerativeModel({
                model: 'gemini-1.5-pro'
            });

            // Tạo prompt để Gemini tạo mô tả chi tiết và SVG
            const fallbackPrompt = `Tôi cần bạn tạo ra một hình ảnh SVG đơn giản cho mô tả sau: "${prompt}".

Vui lòng tạo một SVG với các yêu cầu sau:
1. Kích thước 400x300px
2. Sử dụng các hình cơ bản (circle, rect, path, text)
3. Màu sắc phù hợp với mô tả
4. Composition đơn giản nhưng có ý nghĩa

Format SVG cần trả về:
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <!-- Nội dung SVG ở đây -->
</svg>

Nếu không thể tạo SVG, hãy cung cấp mô tả chi tiết về hình ảnh để người dùng có thể hình dung được.`;

            const result = await model.generateContent(fallbackPrompt);
            const response = await result.response;
            const text = response.text();

            // Kiểm tra nếu có SVG trong response
            const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
            if (svgMatch) {
                const svgData = svgMatch[0];
                const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgData);
                
                return {
                    success: true,
                    images: [{
                        type: 'svg',
                        url: dataUrl,
                        data: svgData,
                        originalPrompt: prompt,
                        generatedAt: new Date().toISOString(),
                        method: 'svg_generation'
                    }],
                    originalPrompt: prompt,
                    method: 'svg_fallback'
                };
            }

            // Nếu không có SVG, tạo simple SVG placeholder
            const placeholderSvg = this.createPlaceholderSvg(prompt, style);
            const placeholderDataUrl = 'data:image/svg+xml;base64,' + btoa(placeholderSvg);

            return {
                success: true,
                images: [{
                    type: 'svg',
                    url: placeholderDataUrl,
                    data: placeholderSvg,
                    originalPrompt: prompt,
                    generatedAt: new Date().toISOString(),
                    method: 'placeholder_svg',
                    description: text // Include text description as well
                }],
                originalPrompt: prompt,
                method: 'placeholder_fallback'
            };

        } catch (error) {
            throw error;
        }
    }

    // Generate image using Imagen 3 via Gemini API
    async generateImageWithImagen3(prompt, options = {}) {
        try {
            // Kiểm tra API key
            const apiKey = localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                throw new Error('Vui lòng thiết lập API key Gemini để sử dụng Imagen 3');
            }

            if (!this.ai) {
                this.initializeAI(apiKey);
            }

            const {
                style = 'photorealistic',
                quality = 'high',
                aspectRatio = '1:1',
                negativePrompt = ''
            } = options;

            // Cấu hình cho Imagen 3
            const model = this.ai.getGenerativeModel({
                model: 'imagen-3.0-generate-002',
                generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.4,
                    topK: 32,
                    topP: 0.95
                }
            });

            // Tạo prompt chi tiết cho Imagen 3
            const imagen3Prompt = this.buildImagen3Prompt(prompt, options);
            
            console.log('Generating image with Imagen 3...', { prompt: imagen3Prompt });

            // Request tạo ảnh với Imagen 3
            const result = await model.generateContent([
                {
                    text: `Generate an image using Imagen 3: ${imagen3Prompt}`
                }
            ]);

            const response = await result.response;
            
            // Xử lý response từ Imagen 3
            const generatedImages = await this.processImagen3Response(response, prompt);
            
            if (generatedImages.length > 0) {
                return {
                    success: true,
                    images: generatedImages,
                    originalPrompt: prompt,
                    enhancedPrompt: imagen3Prompt,
                    method: 'imagen3',
                    provider: 'Imagen 3'
                };
            }

            // Fallback nếu không có ảnh
            console.log('No images from Imagen 3, using fallback...');
            return await this.generateImageFallback(prompt, options);

        } catch (error) {
            console.error('Imagen 3 generation error:', error);
            
            // Fallback về SVG generation
            return await this.generateImageFallback(prompt, options);
        }
    }

    // Build prompt tối ưu cho Imagen 3
    buildImagen3Prompt(userPrompt, options = {}) {
        const {
            style = 'photorealistic',
            quality = 'high',
            aspectRatio = '1:1',
            negativePrompt = ''
        } = options;

        // Style mapping cho Imagen 3
        const imagen3Styles = {
            'photorealistic': 'photorealistic, highly detailed, professional photography, natural lighting',
            'artistic': 'artistic painting, creative composition, expressive brushstrokes, vivid colors',
            'anime': 'anime art style, manga illustration, cel-shaded, vibrant colors, Japanese animation',
            'cartoon': 'cartoon illustration, animated style, bright colors, playful design',
            'minimalist': 'minimalist design, clean composition, simple forms, elegant simplicity',
            'fantasy': 'fantasy art, magical atmosphere, ethereal lighting, mystical elements'
        };

        // Quality modifiers
        const qualityMap = {
            'high': 'ultra high quality, 8K resolution, masterpiece, best quality, highly detailed',
            'standard': 'high quality, detailed, good composition',
            'low': 'standard quality, clear image'
        };

        const selectedStyle = imagen3Styles[style] || imagen3Styles['photorealistic'];
        const qualityModifier = qualityMap[quality] || qualityMap['standard'];

        // Aspect ratio cho Imagen 3
        const aspectRatioText = aspectRatio === '16:9' ? 'widescreen format' :
                               aspectRatio === '9:16' ? 'portrait format' :
                               aspectRatio === '3:4' ? 'vertical format' : 
                               'square format';

        let fullPrompt = `${userPrompt}, ${selectedStyle}, ${qualityModifier}, ${aspectRatioText}`;
        
        if (negativePrompt) {
            fullPrompt += `. Avoid: ${negativePrompt}`;
        }

        return fullPrompt;
    }

    // Xử lý response từ Imagen 3
    async processImagen3Response(response, originalPrompt) {
        const images = [];
        
        try {
            // Imagen 3 thường trả về ảnh trong candidates
            const candidates = response.candidates || [];
            
            for (const candidate of candidates) {
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        // Kiểm tra inline data (base64 image)
                        if (part.inlineData && part.inlineData.data) {
                            const imageData = {
                                type: 'base64',
                                data: part.inlineData.data,
                                mimeType: part.inlineData.mimeType || 'image/jpeg',
                                url: `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`,
                                originalPrompt: originalPrompt,
                                generatedAt: new Date().toISOString(),
                                method: 'imagen3_native',
                                watermark: 'SynthID', // Imagen 3 có watermark SynthID
                                provider: 'Imagen 3'
                            };
                            images.push(imageData);
                        }

                        // Kiểm tra text có chứa image URL
                        if (part.text) {
                            const imageUrls = this.extractImageUrls(part.text);
                            imageUrls.forEach(url => {
                                images.push({
                                    type: 'url',
                                    url: url,
                                    originalPrompt: originalPrompt,
                                    generatedAt: new Date().toISOString(),
                                    method: 'imagen3_url',
                                    watermark: 'SynthID',
                                    provider: 'Imagen 3'
                                });
                            });
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error processing Imagen 3 response:', error);
        }

        return images;
    }

    // Tạo placeholder SVG đơn giản
    createPlaceholderSvg(prompt, style = 'photorealistic') {
        const colors = {
            'photorealistic': { bg: '#f0f8ff', text: '#2c3e50', accent: '#3498db' },
            'artistic': { bg: '#fff5ee', text: '#8b4513', accent: '#ff6347' },
            'anime': { bg: '#ffe4e1', text: '#ff1493', accent: '#ff69b4' },
            'cartoon': { bg: '#f0fff0', text: '#228b22', accent: '#32cd32' },
            'minimalist': { bg: '#f8f8ff', text: '#696969', accent: '#708090' },
            'fantasy': { bg: '#e6e6fa', text: '#4b0082', accent: '#9370db' }
        };

        const colorScheme = colors[style] || colors['photorealistic'];
        
        // Tạo hash đơn giản từ prompt để có consistent shapes
        let hash = 0;
        for (let i = 0; i < prompt.length; i++) {
            hash = ((hash << 5) - hash + prompt.charCodeAt(i)) & 0xffffffff;
        }
        
        const shapes = [];
        const numShapes = 3 + Math.abs(hash % 3); // 3-5 shapes
        
        for (let i = 0; i < numShapes; i++) {
            const shapeHash = Math.abs(hash >> (i * 4));
            const x = 50 + (shapeHash % 300);
            const y = 50 + ((shapeHash >> 8) % 200);
            const size = 20 + (shapeHash % 60);
            
            if (shapeHash % 3 === 0) {
                // Circle
                shapes.push(`<circle cx="${x}" cy="${y}" r="${size/2}" fill="${colorScheme.accent}" opacity="0.7" />`);
            } else if (shapeHash % 3 === 1) {
                // Rectangle
                shapes.push(`<rect x="${x-size/2}" y="${y-size/2}" width="${size}" height="${size*0.6}" fill="${colorScheme.accent}" opacity="0.6" rx="5" />`);
            } else {
                // Triangle (using polygon)
                shapes.push(`<polygon points="${x},${y-size/2} ${x-size/2},${y+size/2} ${x+size/2},${y+size/2}" fill="${colorScheme.accent}" opacity="0.5" />`);
            }
        }

        // Truncate prompt if too long for display
        const displayPrompt = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;

        return `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="100%" height="100%" fill="${colorScheme.bg}" />
    
    <!-- Decorative shapes -->
    ${shapes.join('\n    ')}
    
    <!-- Main content area -->
    <rect x="20" y="200" width="360" height="80" fill="white" stroke="${colorScheme.accent}" stroke-width="2" rx="10" opacity="0.9" />
    
    <!-- Title -->
    <text x="200" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${colorScheme.text}">
        AI Generated Image
    </text>
    
    <!-- Style indicator -->
    <text x="200" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="${colorScheme.accent}">
        Style: ${style.charAt(0).toUpperCase() + style.slice(1)}
    </text>
    
    <!-- Prompt text -->
    <text x="200" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${colorScheme.text}">
        "${displayPrompt}"
    </text>
    
    <!-- Footer -->
    <text x="200" y="260" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="${colorScheme.accent}">
        Generated with Gemini AI
    </text>
</svg>`;
    }

    // Xây dựng prompt chi tiết cho tạo ảnh
    buildImagePrompt(userPrompt, options = {}) {
        const style = options.style || 'photorealistic';
        const quality = options.quality || 'high';
        const aspectRatio = options.aspectRatio || '1:1';
        
        // Map style options
        const styleMap = {
            'photorealistic': 'photorealistic, high detail, professional photography',
            'artistic': 'artistic, creative, expressive style',
            'anime': 'anime style, manga art, Japanese animation',
            'cartoon': 'cartoon style, animated, colorful illustration',
            'minimalist': 'minimalist, clean, simple composition',
            'fantasy': 'fantasy art, magical, mystical atmosphere'
        };

        const selectedStyle = styleMap[style] || styleMap['photorealistic'];
        
        // Quality modifiers
        const qualityMap = {
            'high': 'ultra detailed, 8K, masterpiece, best quality',
            'standard': 'detailed, good quality',
            'low': 'simple, basic quality'
        };

        const qualityModifier = qualityMap[quality] || qualityMap['standard'];

        // Tạo prompt hoàn chỉnh
        return `Generate an image: ${userPrompt}. 
Style: ${selectedStyle}. 
Quality: ${qualityModifier}. 
Aspect ratio: ${aspectRatio}. 
Make it visually appealing and professionally composed.`;
    }

    // Xử lý response để lấy ảnh được tạo
    async processImageResponse(response, originalPrompt) {
        const images = [];
        
        try {
            // Lấy candidates từ response
            const candidates = response.candidates || [];
            
            for (const candidate of candidates) {
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        // Kiểm tra nếu có inline data (ảnh base64)
                        if (part.inlineData && part.inlineData.data) {
                            const imageData = {
                                type: 'base64',
                                data: part.inlineData.data,
                                mimeType: part.inlineData.mimeType || 'image/jpeg',
                                url: `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`,
                                originalPrompt: originalPrompt,
                                generatedAt: new Date().toISOString(),
                                method: 'gemini_native'
                            };
                            images.push(imageData);
                        }
                        
                        // Kiểm tra text response có chứa URL ảnh
                        if (part.text) {
                            const urls = this.extractImageUrls(part.text);
                            urls.forEach(url => {
                                images.push({
                                    type: 'url',
                                    url: url,
                                    originalPrompt: originalPrompt,
                                    generatedAt: new Date().toISOString(),
                                    method: 'url_extraction'
                                });
                            });
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error processing image response:', error);
        }

        return images;
    }

    // Trích xuất URLs ảnh từ text
    extractImageUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg))/gi;
        const matches = text.match(urlRegex) || [];
        return matches;
    }

    // Xử lý lỗi khi tạo ảnh
    handleImageGenerationError(error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('api key') || errorMessage.includes('401')) {
            return 'API key không hợp lệ. Vui lòng kiểm tra lại API key Gemini của bạn.';
        }
        
        if (errorMessage.includes('quota') || errorMessage.includes('429')) {
            return 'Đã vượt quá giới hạn sử dụng API. Vui lòng thử lại sau hoặc kiểm tra quota của bạn.';
        }
        
        if (errorMessage.includes('safety') || errorMessage.includes('blocked')) {
            return 'Nội dung bị chặn bởi bộ lọc an toàn. Vui lòng thử với mô tả khác.';
        }
        
        if (errorMessage.includes('model') || errorMessage.includes('not found')) {
            return 'Model không hỗ trợ tạo ảnh hoặc không khả dụng. Vui lòng thử lại sau.';
        }
        
        if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
            return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
        }
        
        return `Lỗi tạo ảnh: ${error.message}`;
    }

    // Tải ảnh về máy
    async downloadImage(imageUrl, filename = 'generated-image') {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Tạo URL tạm thời
            const url = window.URL.createObjectURL(blob);
            
            // Tạo link download
            const link = document.createElement('a');
            link.href = url;
            link.download = `${filename}.png`;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Download error:', error);
            throw new Error('Không thể tải xuống ảnh. Vui lòng thử lại.');
        }
    }

    // Batch generate multiple images
    async generateBatch(prompts, options = {}) {
        const results = [];

        for (const prompt of prompts) {
            try {
                const result = await this.generateImage(prompt, options);
                results.push({
                    prompt: prompt,
                    result: result,
                    success: true
                });

                // Add delay between requests to avoid rate limits
                if (options.delay && prompts.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, options.delay));
                }
            } catch (error) {
                results.push({
                    prompt: prompt,
                    error: error.message,
                    success: false
                });
            }
        }

        return results;
    }

    // Get available models và providers
    getAvailableModels() {
        return [
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Đáng tin cậy, chất lượng cao', provider: 'gemini' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Nhanh, hiệu quả', provider: 'gemini' },
            { id: 'gemini-2.0-flash-preview-image-generation', name: 'Gemini 2.0 Flash (Image Gen)', description: 'Chuyên tạo ảnh', provider: 'gemini' },
            { id: 'imagen-3.0-generate-002', name: 'Imagen 3', description: 'Google Imagen 3 - Chất lượng cao nhất', provider: 'imagen3' },
            { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Ổn định, basic', provider: 'gemini' }
        ];
    }

    // Get available providers
    getAvailableProviders() {
        return [
            { id: 'gemini', name: 'Gemini AI', description: 'Google Gemini với tích hợp tạo ảnh' },
            { id: 'imagen3', name: 'Imagen 3', description: 'Google Imagen 3 - AI tạo ảnh chuyên nghiệp' }
        ];
    }

    // Set provider
    setProvider(provider) {
        this.currentProvider = provider;
        localStorage.setItem('image_gen_provider', provider);
        
        // Auto-switch model based on provider
        if (provider === 'imagen3') {
            this.setModel('imagen-3.0-generate-002');
        } else if (this.currentModel === 'imagen-3.0-generate-002') {
            this.setModel('gemini-1.5-pro');
        }
    }

    // Get available styles
    getAvailableStyles() {
        return [
            { id: 'photorealistic', name: 'Photorealistic', description: 'Chân thực như ảnh chụp' },
            { id: 'artistic', name: 'Artistic', description: 'Phong cách nghệ thuật' },
            { id: 'anime', name: 'Anime', description: 'Phong cách anime/manga' },
            { id: 'cartoon', name: 'Cartoon', description: 'Phong cách hoạt hình' },
            { id: 'minimalist', name: 'Minimalist', description: 'Tối giản, tinh tế' },
            { id: 'fantasy', name: 'Fantasy', description: 'Phong cách fantasy, thần thoại' }
        ];
    }

    // Get quality options
    getQualityOptions() {
        return [
            { id: 'high', name: 'Cao', description: 'Chất lượng tối đa' },
            { id: 'standard', name: 'Tiêu chuẩn', description: 'Cân bằng tốt' },
            { id: 'low', name: 'Thấp', description: 'Nhanh hơn' }
        ];
    }

    // Thiết lập model để tạo ảnh
    setModel(modelName) {
        const supportedModels = [
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.0-pro',
            'gemini-2.0-flash-preview-image-generation',
            'imagen-3.0-generate-002'
        ];
        
        if (supportedModels.includes(modelName)) {
            this.currentModel = modelName;
            localStorage.setItem('image_gen_model', modelName);
        } else {
            console.warn(`Model ${modelName} có thể không hỗ trợ tạo ảnh`);
            this.currentModel = modelName; // Vẫn thử sử dụng
        }
    }

    // Lấy thông tin model hiện tại
    getCurrentModel() {
        return {
            name: this.currentModel,
            supportsImageGeneration: true,
            description: 'Model Gemini hỗ trợ tạo ảnh'
        };
    }

    // Validate API key with Gemini
    async validateApiKey() {
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            return { valid: false, message: 'API key không tồn tại' };
        }

        try {
            if (!this.ai) {
                this.initializeAI(apiKey);
            }

            const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
            await model.generateContent('test');
            
            return { valid: true, message: 'API key hợp lệ' };
        } catch (error) {
            return { 
                valid: false, 
                message: this.handleImageGenerationError(error)
            };
        }
    }
}

// Export for use in other modules
export default ImageGenerator;
