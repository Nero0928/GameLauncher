using GameLauncher.Core.Auth;
using GameLauncher.Core.Version;

namespace GameLauncher.Forms;

public partial class LoginForm : Form
{
    private readonly LoginManager _loginManager;
    private readonly VersionChecker _versionChecker;
    private bool _versionChecked = false;

    public LoginForm()
    {
        InitializeComponent();
        
        _loginManager = new LoginManager(Program.Config.ApiBaseUrl, Program.Config.CurrentVersion);
        _versionChecker = new VersionChecker(Program.Config.ApiBaseUrl, Program.Config.CurrentVersion);
        
        LoadSavedCredentials();
        _ = CheckVersionAsync();  // 非同步檢查版本
    }

    private void InitializeComponent()
    {
        Text = "遊戲登入器";
        Size = new Size(450, 400);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;

        // Logo/標題
        var lblTitle = new Label
        {
            Text = "🎮 Game Launcher",
            Font = new Font("Microsoft YaHei", 20, FontStyle.Bold),
            AutoSize = true,
            Location = new Point(110, 30)
        };

        // 版本標籤
        var lblVersion = new Label
        {
            Text = $"v{Program.Config.CurrentVersion}",
            Font = new Font("Microsoft YaHei", 9),
            ForeColor = Color.Gray,
            AutoSize = true,
            Location = new Point(195, 70)
        };

        // 帳號輸入
        var lblUsername = new Label
        {
            Text = "帳號:",
            Location = new Point(50, 110),
            Size = new Size(60, 25)
        };

        txtUsername = new TextBox
        {
            Location = new Point(120, 108),
            Size = new Size(250, 25),
            Font = new Font("Microsoft YaHei", 10)
        };

        // 密碼輸入
        var lblPassword = new Label
        {
            Text = "密碼:",
            Location = new Point(50, 150),
            Size = new Size(60, 25)
        };

        txtPassword = new TextBox
        {
            Location = new Point(120, 148),
            Size = new Size(250, 25),
            Font = new Font("Microsoft YaHei", 10),
            PasswordChar = '●'
        };

        // 記住帳號
        chkRemember = new CheckBox
        {
            Text = "記住帳號",
            Location = new Point(120, 185),
            AutoSize = true
        };

        // 版本狀態標籤
        lblVersionStatus = new Label
        {
            Text = "🔍 正在檢查版本...",
            Location = new Point(50, 225),
            Size = new Size(350, 25),
            ForeColor = Color.Blue
        };

        // 狀態標籤
        lblStatus = new Label
        {
            Text = "",
            Location = new Point(50, 255),
            Size = new Size(350, 25),
            ForeColor = Color.Red
        };

        // 登入按鈕
        btnLogin = new Button
        {
            Text = "登入",
            Location = new Point(120, 290),
            Size = new Size(120, 40),
            Font = new Font("Microsoft YaHei", 12),
            BackColor = Color.FromArgb(0, 123, 255),
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat
        };
        btnLogin.Click += BtnLogin_Click;

        // 離開按鈕
        btnExit = new Button
        {
            Text = "離開",
            Location = new Point(250, 290),
            Size = new Size(120, 40),
            Font = new Font("Microsoft YaHei", 12),
            FlatStyle = FlatStyle.Flat
        };
        btnExit.Click += (s, e) => DialogResult = DialogResult.Cancel;

        Controls.AddRange(new Control[]
        {
            lblTitle, lblVersion,
            lblUsername, txtUsername,
            lblPassword, txtPassword,
            chkRemember,
            lblVersionStatus, lblStatus,
            btnLogin, btnExit
        };
    }

    private TextBox txtUsername = null!;
    private TextBox txtPassword = null!;
    private CheckBox chkRemember = null!;
    private Label lblVersionStatus = null!;
    private Label lblStatus = null!;
    private Button btnLogin = null!;

    private void LoadSavedCredentials()
    {
        var savedUsername = LoginManager.LoadSavedUsername();
        if (!string.IsNullOrEmpty(savedUsername))
        {
            txtUsername.Text = savedUsername;
            chkRemember.Checked = true;
        }
    }

    private async Task CheckVersionAsync()
    {
        var result = await _versionChecker.CheckVersionAsync();
        _versionChecked = true;

        Invoke(() =>
        {
            switch (result.Status)
            {
                case VersionStatus.UpToDate:
                    lblVersionStatus.Text = "✅ 已是最新版本";
                    lblVersionStatus.ForeColor = Color.Green;
                    break;

                case VersionStatus.NeedsUpdate:
                    if (result.IsMandatory)
                    {
                        lblVersionStatus.Text = "⚠️ 需要強制更新";
                        lblVersionStatus.ForeColor = Color.Red;
                        btnLogin.Enabled = false;
                        
                        var dr = MessageBox.Show(
                            $"發現新版本 {result.UpdateInfo?.LatestVersion}\n\n" +
                            $"更新內容:\n{result.UpdateInfo?.ReleaseNotes}\n\n" +
                            "必須更新才能繼續使用，是否現在下載？",
                            "需要更新",
                            MessageBoxButtons.YesNo,
                            MessageBoxIcon.Information);
                        
                        if (dr == DialogResult.Yes)
                        {
                            // 開啟下載連結
                            System.Diagnostics.Process.Start(
                                new System.Diagnostics.ProcessStartInfo
                                {
                                    FileName = result.UpdateInfo?.DownloadUrl,
                                    UseShellExecute = true
                                });
                        }
                    }
                    else
                    {
                        lblVersionStatus.Text = $"📦 有新版本可用: {result.UpdateInfo?.LatestVersion}";
                        lblVersionStatus.ForeColor = Color.Orange;
                    }
                    break;

                case VersionStatus.Error:
                    lblVersionStatus.Text = $"⚠️ 版本檢查失敗: {result.Message}";
                    lblVersionStatus.ForeColor = Color.Orange;
                    break;
            }
        });
    }

    private async void BtnLogin_Click(object? sender, EventArgs e)
    {
        lblStatus.Text = "";
        btnLogin.Enabled = false;
        btnLogin.Text = "登入中...";

        try
        {
            var result = await _loginManager.LoginAsync(
                txtUsername.Text,
                txtPassword.Text,
                chkRemember.Checked
            );

            if (result.Success)
            {
                Program.CurrentUser = result.Username;
                Program.AuthToken = result.AuthToken;
                
                // 儲存設定
                Program.Config.AutoLogin = chkRemember.Checked;
                Program.Config.Save();

                DialogResult = DialogResult.OK;
                Close();
            }
            else
            {
                lblStatus.Text = result.Message;
                btnLogin.Enabled = true;
                btnLogin.Text = "登入";
            }
        }
        catch (Exception ex)
        {
            lblStatus.Text = $"錯誤: {ex.Message}";
            btnLogin.Enabled = true;
            btnLogin.Text = "登入";
        }
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        _loginManager.Dispose();
        _versionChecker.Dispose();
        base.OnFormClosing(e);
    }
}
