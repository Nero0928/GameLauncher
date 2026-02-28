namespace GameLauncher.Network.Models;

/// <summary>
/// 登入請求模型
/// </summary>
public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ClientVersion { get; set; } = string.Empty;
    public string DeviceId { get; set; } = string.Empty;
}

/// <summary>
/// 登入回應模型
/// </summary>
public class LoginResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AuthToken { get; set; }
    public string? Username { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public UserInfo? UserInfo { get; set; }
}

/// <summary>
/// 使用者資訊
/// </summary>
public class UserInfo
{
    public string UserId { get; set; } = string.Empty;
    public string Nickname { get; set; } = string.Empty;
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// 版本資訊
/// </summary>
public class VersionInfo
{
    public string LatestVersion { get; set; } = string.Empty;
    public string MinimumVersion { get; set; } = string.Empty;
    public string DownloadUrl { get; set; } = string.Empty;
    public string ReleaseNotes { get; set; } = string.Empty;
    public DateTime ReleasedAt { get; set; }
    public bool IsMandatory { get; set; }
}

/// <summary>
/// 版本驗證回應
/// </summary>
public class VersionCheckResponse
{
    public bool IsValid { get; set; }
    public bool NeedsUpdate { get; set; }
    public bool IsMandatory { get; set; }
    public VersionInfo? VersionInfo { get; set; }
    public string Message { get; set; } = string.Empty;
}
