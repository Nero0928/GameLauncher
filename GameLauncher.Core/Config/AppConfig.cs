using System.Text.Json;

namespace GameLauncher.Core.Config;

/// <summary>
/// 應用程式設定
/// </summary>
public class AppConfig
{
    public string ApiBaseUrl { get; set; } = "https://api.example.com";
    public string GameExecutablePath { get; set; } = "";
    public string CurrentVersion { get; set; } = "1.0.0";
    public bool AutoLogin { get; set; } = false;
    public string? SavedUsername { get; set; }
    public WindowSettings Window { get; set; } = new();
    public LauncherSettings Launcher { get; set; } = new();

    private static string ConfigPath => Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
        "GameLauncher",
        "config.json"
    );

    /// <summary>
    /// 載入設定
    /// </summary>
    public static AppConfig Load()
    {
        try
        {
            if (File.Exists(ConfigPath))
            {
                var json = File.ReadAllText(ConfigPath);
                var config = JsonSerializer.Deserialize<AppConfig>(json);
                if (config != null)
                    return config;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"載入設定失敗: {ex.Message}");
        }

        return new AppConfig();
    }

    /// <summary>
    /// 儲存設定
    /// </summary>
    public void Save()
    {
        try
        {
            var directory = Path.GetDirectoryName(ConfigPath);
            if (!string.IsNullOrEmpty(directory))
                Directory.CreateDirectory(directory);

            var options = new JsonSerializerOptions 
            { 
                WriteIndented = true 
            };
            var json = JsonSerializer.Serialize(this, options);
            File.WriteAllText(ConfigPath, json);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"儲存設定失敗: {ex.Message}");
        }
    }
}

public class WindowSettings
{
    public int Width { get; set; } = 400;
    public int Height { get; set; } = 500;
    public int X { get; set; } = 0;
    public int Y { get; set; } = 0;
}

public class LauncherSettings
{
    public bool CloseAfterLaunch { get; set; } = false;
    public bool MinimizeToTray { get; set; } = true;
    public string? LastSelectedServer { get; set; }
}
