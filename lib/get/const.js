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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_EXPORT_URL = exports.GET_LOGIN_URL = exports.DOWNLOAD_FILE = exports.AUTH_FILE = exports.GET_PLAYWRIGHT_CACHE_LOC = exports.GET_CACHE_LOC = void 0;
const path = __importStar(require("path"));
const os = __importStar(require("os"));
exports.GET_CACHE_LOC = path.join(os.homedir(), "/.get/cache/");
exports.GET_PLAYWRIGHT_CACHE_LOC = path.join(os.homedir(), "/.get/cache/playwright/");
exports.AUTH_FILE = exports.GET_PLAYWRIGHT_CACHE_LOC + 'get_auth.json';
exports.DOWNLOAD_FILE = exports.GET_PLAYWRIGHT_CACHE_LOC + 'get_export.zip';
// Get笔记 URLs
exports.GET_LOGIN_URL = 'https://www.biji.com/';
exports.GET_EXPORT_URL = 'https://www.biji.com/syncNote'; // 待确认实际导出页面URL
