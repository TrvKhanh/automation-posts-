import { chromium, Browser, Page } from 'playwright-core';
import { gpmClient } from '../gpm/client';
import { parseSpintax } from '../utils/spintax';

export interface PostOptions {
  gpmProfileId: string;
  groupUrl: string;
  postContent: string; // Raw content with spintax
  mediaPaths?: string[]; // Array of local file paths for images/videos
}

export interface PostResult {
  success: boolean;
  postUrl?: string;
  errorMessage?: string;
  executedAt: string;
}

// Utility for human-like delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const randomDelay = (minMs: number, maxMs: number) =>
  delay(Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs);

export async function postToFbGroup(options: PostOptions): Promise<PostResult> {
  const executedAt = new Date().toISOString();

  // 1. Parse Spintax content
  const finalContent = parseSpintax(options.postContent);
  console.log(`[FB Poster] Starting post to ${options.groupUrl} via GPM Profile ${options.gpmProfileId}`);
  console.log(`[FB Poster] Parsed Content:\n${finalContent}`);

  // 2. Start GPM Profile
  const gpmRes = await gpmClient.startProfile(options.gpmProfileId);
  if (!gpmRes.success || !gpmRes.remoteDebuggingAddress) {
    return {
      success: false,
      errorMessage: gpmRes.error || 'Khởi chạy GPM Profile thất bại',
      executedAt,
    };
  }

  let browser: Browser | null = null;
  try {
    // 3. Connect to Browser via CDP
    const endpoint = gpmRes.remoteDebuggingAddress.startsWith('http') || gpmRes.remoteDebuggingAddress.startsWith('ws')
      ? gpmRes.remoteDebuggingAddress
      : `http://${gpmRes.remoteDebuggingAddress}`;

    browser = await chromium.connectOverCDP(endpoint);
    const context = browser.contexts()[0] || (await browser.newContext());
    const page: Page = context.pages()[0] || (await context.newPage());

    // 4. Navigate to FB Group
    await page.goto(options.groupUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await randomDelay(3000, 5000);

    // Check if logged in / redirected to login page
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
      return {
        success: false,
        errorMessage: 'Tài khoản chưa đăng nhập Facebook hoặc bị dính Checkpoint',
        executedAt,
      };
    }

    // 5. Locate Post Creation Box
    // Common FB selectors for "Write something..." / "Viết gì đó..."
    const postBoxSelectors = [
      'div[role="button"]:has-text("Viết gì đó")',
      'div[role="button"]:has-text("Write something")',
      'div[role="button"]:has-text("Tạo bài viết")',
      'div[role="button"]:has-text("Create a public post")',
      'div[role="textbox"]',
      'span:has-text("Viết gì đó...")',
      'span:has-text("Write something...")',
    ];

    let postBoxClicked = false;
    for (const selector of postBoxSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          postBoxClicked = true;
          break;
        }
      } catch (e) {
        // continue trying other selectors
      }
    }

    if (!postBoxClicked) {
      // Try fallback clicking near main content area
      await page.keyboard.press('PageDown');
      await randomDelay(1000, 2000);
      const fallbackBox = page.locator('div[role="main"] div[role="button"]').first();
      if (await fallbackBox.isVisible()) {
        await fallbackBox.click();
        postBoxClicked = true;
      }
    }

    if (!postBoxClicked) {
      return {
        success: false,
        errorMessage: 'Không tìm thấy khung nhập bài viết trên Facebook Group',
        executedAt,
      };
    }

    await randomDelay(2000, 3500);

    // 6. Focus Modal Dialog & Editor Area
    const editorSelectors = [
      'div[role="dialog"] div[role="textbox"]',
      'div[role="dialog"] div[contenteditable="true"]',
      'div[role="textbox"]',
    ];

    let editorLocator = null;
    for (const sel of editorSelectors) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 2000 })) {
        editorLocator = loc;
        break;
      }
    }

    if (!editorLocator) {
      return {
        success: false,
        errorMessage: 'Không mở được khung soạn thảo nội dung trong modal',
        executedAt,
      };
    }

    // 7. Type content with Human Typing Simulation (random delay between keys)
    await editorLocator.click();
    await randomDelay(500, 1000);

    // Type text line by line to support newlines properly
    const lines = finalContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      await page.keyboard.type(lines[i], { delay: Math.floor(Math.random() * 40) + 30 });
      if (i < lines.length - 1) {
        await page.keyboard.press('Enter');
        await randomDelay(200, 500);
      }
    }

    await randomDelay(1500, 3000);

    // 8. Handle Optional Media Uploads
    if (options.mediaPaths && options.mediaPaths.length > 0) {
      try {
        const fileInput = page.locator('div[role="dialog"] input[type="file"]').first();
        if (await fileInput.count() > 0) {
          await fileInput.setInputFiles(options.mediaPaths);
          await randomDelay(3000, 6000); // Wait for media upload to finish
        }
      } catch (err: any) {
        console.warn(`[FB Poster] Media upload warning: ${err.message}`);
      }
    }

    // 9. Click Post Button
    const postBtnSelectors = [
      'div[role="dialog"] div[role="button"]:has-text("Đăng")',
      'div[role="dialog"] div[role="button"]:has-text("Post")',
      'div[role="dialog"] div[aria-label="Đăng"]',
      'div[role="dialog"] div[aria-label="Post"]',
    ];

    let postSubmitted = false;
    for (const btnSel of postBtnSelectors) {
      try {
        const btn = page.locator(btnSel).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          // Ensure button is enabled
          const isDisabled = await btn.getAttribute('aria-disabled');
          if (isDisabled !== 'true') {
            await btn.click();
            postSubmitted = true;
            break;
          }
        }
      } catch (e) {}
    }

    if (!postSubmitted) {
      return {
        success: false,
        errorMessage: 'Nút "Đăng" bị vô hiệu hóa hoặc không thể nhấp vào',
        executedAt,
      };
    }

    // 10. Wait for submission completion
    await randomDelay(4000, 7000);

    // Extract current URL or confirmation state
    const postUrl = page.url();

    return {
      success: true,
      postUrl,
      executedAt,
    };
  } catch (err: any) {
    return {
      success: false,
      errorMessage: `Lỗi trong quá trình tự động hóa: ${err.message}`,
      executedAt,
    };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
  }
}
