import { Platform } from 'obsidian';

const nodeRequire = typeof window !== 'undefined' ? (window as any).require : null;
const path = Platform.isDesktopApp && nodeRequire ? nodeRequire('path') : null;
const os = Platform.isDesktopApp && nodeRequire ? nodeRequire('os') : null;

export const GET_CACHE_LOC = path && os ? path.join(os.homedir(), "/.get/cache/") : "";
export const GET_PLAYWRIGHT_CACHE_LOC = path && os ? path.join(os.homedir(), "/.get/cache/playwright/") : "";
export const AUTH_FILE = GET_PLAYWRIGHT_CACHE_LOC + 'get_auth.json';
export const DOWNLOAD_FILE = GET_PLAYWRIGHT_CACHE_LOC + 'get_export.zip';

export const GET_LOGIN_URL = 'https://www.biji.com/';
export const GET_EXPORT_URL = 'https://www.biji.com/syncNote';
