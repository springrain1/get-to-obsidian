import * as path from 'path';
import * as os from 'os';

export const GET_CACHE_LOC = path.join(os.homedir(), "/.get/cache/");
export const GET_PLAYWRIGHT_CACHE_LOC = path.join(os.homedir(), "/.get/cache/playwright/");
export const AUTH_FILE = GET_PLAYWRIGHT_CACHE_LOC + 'get_auth.json';
export const DOWNLOAD_FILE = GET_PLAYWRIGHT_CACHE_LOC + 'get_export.zip';

// Get笔记 URLs
export const GET_LOGIN_URL = 'https://www.biji.com/';
export const GET_EXPORT_URL = 'https://www.biji.com/syncNote'; // 待确认实际导出页面URL