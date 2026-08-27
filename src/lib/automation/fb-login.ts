import { chromium, Browser, Page } from 'playwright-core';
import { gpmClient } from '../gpm/client';

export interface FbLoginOptions {
  gpmProfileId: string;
  loginMethod: 'cookie' | 'uid';
  credentials: {
    cookie?: string;
    uid?: string;
    pass?: string;
    twoFa?: string;
  };
}

export interface FbLoginResult {
  success: boolean;
  errorMessage?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loginFacebookAuto(options: FbLoginOptions): Promise<FbLoginResult> {
  // 1. Khởi chạy GPM Profile
  console.log(`[FB Login] Khởi chạy Profile ${options.gpmProfileId}`);
  const gpmRes = await gpmClient.startProfile(options.gpmProfileId);
  if (!gpmRes.success || !gpmRes.remoteDebuggingAddress) {
    return { success: false, errorMessage: gpmRes.error || 'Khởi chạy GPM Profile thất bại' };
  }

  let browser: Browser | null = null;
  try {
    const endpoint = gpmRes.remoteDebuggingAddress.startsWith('http') || gpmRes.remoteDebuggingAddress.startsWith('ws')
      ? gpmRes.remoteDebuggingAddress
      : `http://${gpmRes.remoteDebuggingAddress}`;

    browser = await chromium.connectOverCDP(endpoint);
    const context = browser.contexts()[0] || (await browser.newContext());
    const page: Page = context.pages()[0] || (await context.newPage());

    if (options.loginMethod === 'cookie' && options.credentials.cookie) {
      console.log(`[FB Login] Injecting Cookie...`);
      // Parse raw cookie string to Playwright format
      const rawCookies = options.credentials.cookie.split(';');
      const cookies = [];
      for (const rc of rawCookies) {
        const parts = rc.trim().split('=');
        if (parts.length >= 2) {
          const name = parts.shift()?.trim();
          const value = parts.join('=').trim();
          if (name && value) {
            cookies.push({
              name,
              value,
              domain: '.facebook.com',
              path: '/',
            });
          }
        }
      }
      
      await context.addCookies(cookies);
      await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
      await delay(4000);
      
      // Check if logged in
      const currentUrl = page.url();
      if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
        return { success: false, errorMessage: 'Cookie bị lỗi (Die) hoặc dính Checkpoint' };
      }
      
      return { success: true };
    } 
    else if (options.loginMethod === 'uid' && options.credentials.uid && options.credentials.pass) {
      console.log(`[FB Login] Nhập UID và Mật khẩu...`);
      await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' });
      await delay(2000);

      // Điền form
      await page.fill('#email', options.credentials.uid);
      await delay(500);
      await page.fill('#pass', options.credentials.pass);
      await delay(500);
      await page.click('button[name="login"]');
      
      await delay(5000);

      // Check 2FA
      const url = page.url();
      if (url.includes('checkpoint') && options.credentials.twoFa) {
        // Tự động giải 2FA bằng 2fa.live (qua fetch)
        console.log(`[FB Login] Đang giải mã 2FA...`);
        try {
          // Lấy mã TOTP 6 số
          const faRes = await fetch(`https://2fa.live/tok/${options.credentials.twoFa}`);
          const faData = await faRes.json();
          const code = faData.token;

          if (code) {
            // Điền mã 2FA trên Facebook (thường có id approvals_code)
            const input2fa = page.locator('input[type="text"][id="approvals_code"]');
            if (await input2fa.isVisible({ timeout: 3000 })) {
              await input2fa.fill(code);
              await delay(1000);
              await page.click('button[id="checkpointSubmitButton"]');
              await delay(3000);
              
              // Có thể hỏi "Save browser"
              const saveBrowserBtn = page.locator('button[id="checkpointSubmitButton"]');
              if (await saveBrowserBtn.isVisible({ timeout: 2000 })) {
                 await saveBrowserBtn.click();
                 await delay(3000);
              }
            }
          }
        } catch (e: any) {
          console.error(`[FB Login] Lỗi 2FA: ${e.message}`);
        }
      }

      await delay(3000);
      const finalUrl = page.url();
      if (finalUrl.includes('login') || finalUrl.includes('checkpoint')) {
         return { success: false, errorMessage: 'Đăng nhập UID/Pass thất bại (Sai mật khẩu hoặc bị Checkpoint)' };
      }

      return { success: true };
    }

    return { success: false, errorMessage: 'Phương thức hoặc dữ liệu đăng nhập không hợp lệ' };
  } catch (err: any) {
    return { success: false, errorMessage: `Lỗi Auto Login: ${err.message}` };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
  }
}
