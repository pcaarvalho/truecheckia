"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputValidator = exports.aiDetectionService = exports.MetricsService = exports.QueueService = exports.CacheService = exports.VideoAnalyzer = exports.TextAnalyzer = exports.RealAIDetectionService = exports.MockAIDetectionService = exports.BaseDetectionService = void 0;
__exportStar(require("../types/detection.types"), exports);
var baseDetectionService_1 = require("./aiDetection/baseDetectionService");
Object.defineProperty(exports, "BaseDetectionService", { enumerable: true, get: function () { return baseDetectionService_1.BaseDetectionService; } });
var mockAIDetectionService_1 = require("./aiDetection/mockAIDetectionService");
Object.defineProperty(exports, "MockAIDetectionService", { enumerable: true, get: function () { return mockAIDetectionService_1.MockAIDetectionService; } });
var realAIDetectionService_1 = require("./aiDetection/realAIDetectionService");
Object.defineProperty(exports, "RealAIDetectionService", { enumerable: true, get: function () { return realAIDetectionService_1.RealAIDetectionService; } });
var textAnalyzer_1 = require("../utils/textAnalyzer");
Object.defineProperty(exports, "TextAnalyzer", { enumerable: true, get: function () { return textAnalyzer_1.TextAnalyzer; } });
var videoAnalyzer_1 = require("../utils/videoAnalyzer");
Object.defineProperty(exports, "VideoAnalyzer", { enumerable: true, get: function () { return videoAnalyzer_1.VideoAnalyzer; } });
var cacheService_1 = require("./cache/cacheService");
Object.defineProperty(exports, "CacheService", { enumerable: true, get: function () { return cacheService_1.CacheService; } });
var queueService_1 = require("./queue/queueService");
Object.defineProperty(exports, "QueueService", { enumerable: true, get: function () { return queueService_1.QueueService; } });
var metricsService_1 = require("./metrics/metricsService");
Object.defineProperty(exports, "MetricsService", { enumerable: true, get: function () { return metricsService_1.MetricsService; } });
const realAIDetectionService_2 = require("./aiDetection/realAIDetectionService");
exports.aiDetectionService = realAIDetectionService_2.RealAIDetectionService.getInstance();
class InputValidator {
    static validateTextInput(text, maxLength = 50000) {
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid text input');
        }
        if (text.trim().length === 0) {
            throw new Error('Text cannot be empty');
        }
        if (text.length > maxLength) {
            throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
        }
    }
    static validateVideoUrl(url) {
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid video URL');
        }
        try {
            new URL(url);
        }
        catch {
            throw new Error('Invalid URL format');
        }
        const validExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
        const hasValidExtension = validExtensions.some(ext => url.toLowerCase().includes(ext));
        if (!hasValidExtension) {
            throw new Error('Invalid video file format');
        }
    }
    static sanitizeInput(input) {
        return input
            .trim()
            .replace(/[<>]/g, '')
            .replace(/\0/g, '');
    }
}
exports.InputValidator = InputValidator;
//# sourceMappingURL=aiDetection.js.map