namespace GameLauncher.Forms;

public partial class MainForm : Form
{
    public MainForm()
    {
        InitializeComponent();
    }

    private void InitializeComponent()
    {
        Text = $"遊戲啟動器 - {Program.CurrentUser}";
        Size = new Size(800, 600);
        StartPosition = FormStartPosition.CenterScreen;

        // 歡迎標籤
        var lblWelcome = new Label
        {
            Text = $"歡迎回來, {Program.CurrentUser}!",
            Font = new Font("Microsoft YaHei", 16, FontStyle.Bold),
            AutoSize = true,
            Location = new Point(50, 30)
        };

        // 啟動遊戲按鈕
        var btnLaunch = new Button
        {
            Text = "🎮 啟動遊戲",
            Location = new Point(50, 100),
            Size = new Size(200, 60),
            Font = new Font("Microsoft YaHei", 14),
            BackColor = Color.FromArgb(40, 167, 69),
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat
        };
        btnLaunch.Click += BtnLaunch_Click;

        // 設定按鈕
        var btnSettings = new Button
        {
            Text = "⚙️ 設定",
            Location = new Point(50, 180),
            Size = new Size(200, 50),
            Font = new Font("Microsoft YaHei", 12),
            FlatStyle = FlatStyle.Flat
        };
        btnSettings.Click += BtnSettings_Click;

        // 登出按鈕
        var btnLogout = new Button
        {
            Text = "🚪 登出",
            Location = new Point(50, 250),
            Size = new Size(200, 50),
            Font = new Font("Microsoft YaHei", 12),
            FlatStyle = FlatStyle.Flat
        };
        btnLogout.Click += BtnLogout_Click;

        // 狀態區域
        var grpStatus = new GroupBox
        {
            Text = "狀態資訊",
            Location = new Point(300, 100),
            Size = new Size(450, 200)
        };

        var lblVersion = new Label
        {
            Text = $"版本: {Program.Config.CurrentVersion}",
            Location = new Point(20, 30),
            AutoSize = true,
            Font = new Font("Microsoft YaHei", 10)
        };

        var lblServer = new Label
        {
            Text = $"伺服器: {Program.Config.ApiBaseUrl}",
            Location = new Point(20, 60),
            AutoSize = true,
            Font = new Font("Microsoft YaHei", 10)
        };

        var lblAuth = new Label
        {
            Text = $"登入狀態: ✅ 已登入",
            Location = new Point(20, 90),
            AutoSize = true,
            Font = new Font("Microsoft YaHei", 10),
            ForeColor = Color.Green
        };

        grpStatus.Controls.AddRange(new Control[] { lblVersion, lblServer, lblAuth });

        Controls.AddRange(new Control[]
        {
            lblWelcome,
            btnLaunch,
            btnSettings,
            btnLogout,
            grpStatus
        });
    }

    private void BtnLaunch_Click(object? sender, EventArgs e)
    {
        if (string.IsNullOrEmpty(Program.Config.GameExecutablePath))
        {
            MessageBox.Show(
                "尚未設定遊戲路徑，請先至設定中指定遊戲執行檔位置。",
                "無法啟動",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
            return;
        }

        if (!File.Exists(Program.Config.GameExecutablePath))
        {
            MessageBox.Show(
                "找不到遊戲執行檔，請檢查設定中的路徑是否正確。",
                "無法啟動",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return;
        }

        try
        {
            var startInfo = new System.Diagnostics.ProcessStartInfo
            {
                FileName = Program.Config.GameExecutablePath,
                WorkingDirectory = Path.GetDirectoryName(Program.Config.GameExecutablePath),
                Arguments = $"--token {Program.AuthToken} --user {Program.CurrentUser}",
                UseShellExecute = true
            };

            System.Diagnostics.Process.Start(startInfo);

            if (Program.Config.Launcher.CloseAfterLaunch)
            {
                Close();
            }
            else if (Program.Config.Launcher.MinimizeToTray)
            {
                WindowState = FormWindowState.Minimized;
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show($"啟動失敗: {ex.Message}", "錯誤", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void BtnSettings_Click(object? sender, EventArgs e)
    {
        using var settingsForm = new SettingsForm();
        settingsForm.ShowDialog();
    }

    private void BtnLogout_Click(object? sender, EventArgs e)
    {
        var result = MessageBox.Show(
            "確定要登出嗎？",
            "登出確認",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Question);

        if (result == DialogResult.Yes)
        {
            Program.CurrentUser = null;
            Program.AuthToken = null;
            
            // 重新顯示登入視窗
            DialogResult = DialogResult.Cancel;
            Close();
        }
    }
}
