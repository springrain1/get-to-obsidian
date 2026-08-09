/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
const path = require("path");
const os = require("os");

export const GET_CACHE_LOC = path.join(os.homedir(), "/.get/cache/");
export const GET_PLAYWRIGHT_CACHE_LOC = path.join(os.homedir(), "/.get/cache/playwright/");
export const AUTH_FILE = GET_PLAYWRIGHT_CACHE_LOC + 'get_auth.json';
export const DOWNLOAD_FILE = GET_PLAYWRIGHT_CACHE_LOC + 'get_export.zip';

// Get笔记 URLs
export const GET_LOGIN_URL = 'https://www.biji.com/';
export const GET_EXPORT_URL = 'https://www.biji.com/syncNote'; // 待确认实际导出页面URL