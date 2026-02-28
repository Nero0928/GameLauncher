using GameLauncher.Core.Config;
using GameLauncher.Forms;
using System.Windows.Forms;

namespace GameLauncher;

public static class Program
{
    public static AppConfig Config { get; private set; } = new();
    public static string? CurrentUser { get; set; }
    public static string? AuthToken { get; set; }

    [STAThread]
    public static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        // 載入設定
        Config = AppConfig.Load();

        // 顯示登入表單
        using var loginForm = new LoginForm();
        if (loginForm.ShowDialog() == DialogResult.OK)
        {
            // 登入成功，顯示主視窗
            Application.Run(new MainForm());
        }
    }
}
