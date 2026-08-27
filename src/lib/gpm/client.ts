export interface GpmProfile {
  id: string;
  name: string;
  group_name?: string;
  created_at?: string;
  raw?: any;
}

export interface GpmStartResult {
  success: boolean;
  remoteDebuggingAddress?: string; // e.g. "127.0.0.1:12345"
  driverPath?: string;
  error?: string;
}

const GPM_BASE_URL = process.env.GPM_API_URL || 'http://192.168.1.141:9497';

export class GpmClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || GPM_BASE_URL;
  }

  async isApiAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/api/v1/profiles`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async getProfiles(): Promise<{ success: boolean; profiles: GpmProfile[]; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/profiles`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      
      // Normalize response formats from GPM Login API v3 / v2
      const rawList = json.data || json.profiles || (Array.isArray(json) ? json : []);
      const profiles: GpmProfile[] = rawList.map((item: any) => ({
        id: item.id || item.profile_id || item.Id,
        name: item.name || item.title || item.Name || `Profile ${item.id}`,
        group_name: item.group_name || item.group || '',
        created_at: item.created_at || '',
        raw: item,
      }));

      return { success: true, profiles };
    } catch (err: any) {
      return {
        success: false,
        profiles: [],
        error: `Không thể kết nối đến GPM Login API tại ${this.baseUrl}. Chi tiết: ${err.message}`,
      };
    }
  }

  async startProfile(profileId: string): Promise<GpmStartResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/profiles/start/${profileId}`);
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const json = await res.json();
      
      if (!json.success && json.status === false) {
        return {
          success: false,
          error: json.message || json.error || 'GPM API trả về thất bại khi mở Profile',
        };
      }

      const remoteDebuggingAddress =
        json.data?.websocket_debugging_url ||
        json.data?.remote_debugging_address ||
        json.data?.browser_location ||
        json.data?.ws_url ||
        json.remote_debugging_address;

      if (!remoteDebuggingAddress) {
        return {
          success: false,
          error: 'Không tìm thấy Remote Debugging Address trong phản hồi của GPM API',
        };
      }

      return {
        success: true,
        remoteDebuggingAddress,
        driverPath: json.data?.driver_path,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Lỗi khi gọi API Start Profile GPM (${profileId}): ${err.message}`,
      };
    }
  }

  async stopProfile(profileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/profiles/stop/${profileId}`);
      const json = await res.json();
      return { success: json.success ?? true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- THÊM MỚI: Hàm tạo Profile tự động ---
  async createProfile(name: string, groupName?: string): Promise<{ success: boolean; profileId?: string; error?: string }> {
    try {
      // Chuẩn bị payload (Body) để tạo profile
      const payload = {
        name: name,
        group_name: groupName || 'GPM Automation', 
        // Bạn có thể truyền thêm proxy, user_agent, fingerprint_config tùy theo API Docs của GPM
      };
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${this.baseUrl}/api/v1/profiles/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name, 
          group_name: groupName || 'GPM Automation',
          browser_type: 1 // 1 = Chromium/Chrome
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      // Nếu API của GPM Login V3 bản hiện tại của bạn dùng method GET thì bạn đổi thành:
      // const res = await fetch(`${this.baseUrl}/api/v1/profiles/create?name=${encodeURIComponent(name)}&group_id=${encodeURIComponent(groupName || '')}`);

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      
      const json = await res.json();
      
      if (!json.success && json.status === false) {
        return { success: false, error: json.message || 'Lỗi khi tạo profile từ GPM' };
      }

      // Lấy Profile ID trả về từ GPM
      const profileId = json.data?.id || json.id || json.profile_id;
      
      return { 
        success: true, 
        profileId 
      };
    } catch (err: any) {
      return { success: false, error: `Lỗi gọi API Create Profile: ${err.message}` };
    }
  }
}

export const gpmClient = new GpmClient();
