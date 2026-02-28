using GameLauncher.Network.Http;
using GameLauncher.Network.Models;

namespace GameLauncher.Core.Version;

/// <summary>
/// 版本檢查器 - 處理版本驗證與更新
/// </summary>
public class VersionChecker
{
    private readonly ApiClient _apiClient;
    private readonly string _currentVersion;

    public VersionChecker(string apiBaseUrl, string currentVersion)
    {
        _apiClient = new ApiClient(apiBaseUrl);
        _currentVersion = currentVersion;
    }

    /// <summary>
    /// 檢查版本
    /// </summary>
    public async Task<VersionCheckResult> CheckVersionAsync()
    {
        var response = await _apiClient.CheckVersionAsync(_currentVersion);

        if (!response.IsValid)
        {
            return VersionCheckResult.Error(response.Message);
        }

        if (response.NeedsUpdate)
        {
            return VersionCheckResult.NeedsUpdate(
                response.VersionInfo!,
                response.IsMandatory
            );
        }

        return VersionCheckResult.UpToDate();
    }

    /// <summary>
    /// 比較版本號
    /// </summary>
    public static int CompareVersions(string version1, string version2)
    {
        var v1Parts = version1.Split('.').Select(int.Parse).ToArray();
        var v2Parts = version2.Split('.').Select(int.Parse).ToArray();

        for (int i = 0; i < Math.Max(v1Parts.Length, v2Parts.Length); i++)
        {
            int part1 = i < v1Parts.Length ? v1Parts[i] : 0;
            int part2 = i < v2Parts.Length ? v2Parts[i] : 0;

            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }

        return 0;
    }

    /// <summary>
    /// 取得當前版本
    /// </summary>
    public string GetCurrentVersion() => _currentVersion;

    public void Dispose()
    {
        _apiClient.Dispose();
    }
}

/// <summary>
/// 版本檢查結果
/// </summary>
public class VersionCheckResult
{
    public VersionStatus Status { get; set; }
    public string Message { get; set; } = string.Empty;
    public VersionInfo? UpdateInfo { get; set; }
    public bool IsMandatory { get; set; }

    public static VersionCheckResult UpToDate()
    {
        return new VersionCheckResult
        {
            Status = VersionStatus.UpToDate,
            Message = "已是最新版本"
        };
    }

    public static VersionCheckResult NeedsUpdate(VersionInfo info, bool mandatory)
    {
        return new VersionCheckResult
        {
            Status = VersionStatus.NeedsUpdate,
            Message = $"發現新版本: {info.LatestVersion}",
            UpdateInfo = info,
            IsMandatory = mandatory
        };
    }

    public static VersionCheckResult Error(string message)
    {
        return new VersionCheckResult
        {
            Status = VersionStatus.Error,
            Message = message
        };
    }
}

public enum VersionStatus
{
    UpToDate,      // 已是最新
    NeedsUpdate,   // 需要更新
    Error          // 檢查失敗
}
