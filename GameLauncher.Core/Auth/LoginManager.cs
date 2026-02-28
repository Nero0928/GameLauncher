using GameLauncher.Network.Http;
using GameLauncher.Network.Models;
using System.Security.Cryptography;
using System.Text;

namespace GameLauncher.Core.Auth;

/// <summary>
/// 登入管理器 - 處理登入邏輯
/// </summary>
public class LoginManager
{
    private readonly ApiClient _apiClient;
    private readonly string _clientVersion;

    public LoginManager(string apiBaseUrl, string clientVersion)
    {
        _apiClient = new ApiClient(apiBaseUrl);
        _clientVersion = clientVersion;
    }

    /// <summary>
    /// 執行登入
    /// </summary>
    public async Task<LoginResult> LoginAsync(string username, string password, bool rememberMe = false)
    {
        // 驗證輸入
        if (string.IsNullOrWhiteSpace(username))
            return LoginResult.Fail("請輸入帳號");

        if (string.IsNullOrWhiteSpace(password))
            return LoginResult.Fail("請輸入密碼");

        // 建立登入請求
        var request = new LoginRequest
        {
            Username = username.Trim(),
            Password = HashPassword(password),  // 密碼雜湊
            ClientVersion = _clientVersion,
            DeviceId = GetDeviceId()
        };

        // 發送登入請求
        var response = await _apiClient.LoginAsync(request);

        if (response.Success && !string.IsNullOrEmpty(response.AuthToken))
        {
            // 儲存登入資訊
            if (rememberMe)
            {
                SaveCredentials(username);
            }

            return LoginResult.Success(
                response.AuthToken, 
                response.Username ?? username,
                response.UserInfo
            );
        }

        return LoginResult.Fail(response.Message);
    }

    /// <summary>
    /// 密碼雜湊 (SHA256)
    /// </summary>
    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    /// <summary>
    /// 取得裝置識別碼
    /// </summary>
    private static string GetDeviceId()
    {
        // 簡易實作：使用環境資訊雜湊
        var machineName = Environment.MachineName;
        var userName = Environment.UserName;
        var osVersion = Environment.OSVersion.VersionString;
        
        using var sha256 = SHA256.Create();
        var input = $"{machineName}-{userName}-{osVersion}";
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).Substring(0, 16);
    }

    /// <summary>
    /// 儲存憑證 (簡易實作，實際應用應使用更安全的方式)
    /// </summary>
    private static void SaveCredentials(string username)
    {
        // 這裡可以使用 Windows Credential Manager 或加密檔案
        // 簡化範例：僅儲存使用者名稱
        var configPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "GameLauncher",
            "user.config"
        );

        Directory.CreateDirectory(Path.GetDirectoryName(configPath)!);
        File.WriteAllText(configPath, username);
    }

    /// <summary>
    /// 讀取儲存的使用者名稱
    /// </summary>
    public static string? LoadSavedUsername()
    {
        var configPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "GameLauncher",
            "user.config"
        );

        return File.Exists(configPath) ? File.ReadAllText(configPath) : null;
    }

    public void Dispose()
    {
        _apiClient.Dispose();
    }
}

/// <summary>
/// 登入結果
/// </summary>
public class LoginResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AuthToken { get; set; }
    public string? Username { get; set; }
    public UserInfo? UserInfo { get; set; }

    public static LoginResult Success(string token, string username, UserInfo? userInfo = null)
    {
        return new LoginResult
        {
            Success = true,
            AuthToken = token,
            Username = username,
            UserInfo = userInfo,
            Message = "登入成功"
        };
    }

    public static LoginResult Fail(string message)
    {
        return new LoginResult
        {
            Success = false,
            Message = message
        };
    }
}
