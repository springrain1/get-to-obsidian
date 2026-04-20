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
exports.FlomoAuth = void 0;
const fs = __importStar(require("fs-extra"));
const playwright = __importStar(require("playwright"));
const const_1 = require("./const");
class FlomoAuth {
    constructor() {
        fs.mkdirpSync(const_1.GET_PLAYWRIGHT_CACHE_LOC);
    }
    // Step 1: 请求发送短信验证码
    async requestSmsCode(phone) {
        let browser;
        try {
            // 浏览器必须可见，让用户看到验证码发送过程
            browser = await playwright.chromium.launch({ headless: false });
            const context = await browser.newContext(playwright.devices['Desktop Chrome']);
            const page = await context.newPage();
            console.log('正在打开 Get笔记 登录页面...');
            await page.goto(const_1.GET_LOGIN_URL);
            // 等待页面加载
            await page.waitForLoadState('networkidle');
            console.log('页面加载完成');
            // 等待一段时间让页面完全渲染
            await page.waitForTimeout(2000);
            // 填写手机号
            console.log('正在填写手机号...');
            await page.getByPlaceholder('请输入手机号').fill(phone);
            console.log('手机号已填写:', phone);
            // 等待一下让输入生效
            await page.waitForTimeout(1000);
            console.log('验证码已准备发送，请在浏览器中手动点击"获取验证码"或"发送验证码"按钮');
            // 返回浏览器状态，让用户手动操作
            return [true, "Please click the verification code button in the browser manually", browser, context, page];
        }
        catch (error) {
            console.log('发生错误:', error);
            if (browser) {
                try {
                    await browser.close();
                }
                catch (e) { }
            }
            return [false, error.message || error];
        }
    }
    // Step 2: 等待用户手动输入验证码并登录，然后保存认证状态
    async waitForManualLogin(browser, context, page) {
        try {
            console.log('等待用户手动输入验证码并点击登录按钮...');
            // 等待10秒，让用户有足够时间手动输入验证码并点击登录
            await page.waitForTimeout(10000);
            // 等待登录成功跳转到 https://www.biji.com/note
            try {
                await page.waitForURL('**/note**', { timeout: 30000 });
                console.log('检测到登录成功，URL已跳转到笔记页面');
            }
            catch (e) {
                console.warn('未能检测到URL跳转，但将继续尝试保存认证状态');
            }
            // 保存认证状态
            await page.context().storageState({ path: const_1.AUTH_FILE });
            // 清理
            await context.close();
            await browser.close();
            return [true, ""];
        }
        catch (error) {
            console.log(error);
            // 清理
            try {
                await browser.close();
            }
            catch (e) { }
            return [false, error.message || error];
        }
    }
    // 兼容旧的 auth 方法（保持接口兼容）
    // 但 Get笔记 不支持密码登录，这个方法会抛出错误
    async auth(uid, passwd) {
        return [false, "Get笔记 only supports SMS verification code login. Please use requestSmsCode() and completeAuth() instead."];
    }
}
exports.FlomoAuth = FlomoAuth;
