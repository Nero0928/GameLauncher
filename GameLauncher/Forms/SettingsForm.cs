namespace GameLauncher.Forms;

public partial class SettingsForm : Form
{
    public SettingsForm()
    {
        InitializeComponent();
        LoadSettings();
    }

    private TextBox txtApiUrl = null!;
    private TextBox txtGamePath = null!;
    private CheckBox chkCloseAfterLaunch = null!;
    private CheckBox chkMinimizeToTray = null!;

    private void InitializeComponent()
    {
        Text = "設定";
        Size = new Size(500, 400);
        StartPosition = FormStartPosition.CenterParent;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;

        // API URL
        var lblApiUrl = new Label
        {
            Text = "API 位址:",
            Location = new Point(30, 30),
            Size = new Size(100, 25)
        };

        txtApiUrl = new TextBox
        {
            Location = new Point(140, 28),
            Size = new Size(300, 25)
        };

        // 遊戲路徑
        var lblGamePath = new Label
        {
            Text = "遊戲路徑:",
            Location = new Point(30, 70),
            Size = new Size(100, 25)
        };

        txtGamePath = new TextBox
        {
            Location = new Point(140, 68),
            Size = new Size(220, 25),
            ReadOnly = true
        };

        var btnBrowse = new Button
        {
            Text = "瀏覽...",
            Location = new Point(370, 66),
            Size = new Size(70, 28)
        };
        btnBrowse.Click += BtnBrowse_Click;

        // 啟動器選項
        var grpOptions = new GroupBox
        {
            Text = "啟動器選項",
            Location = new Point(30, 110),
            Size = new Size(420, 120)
        };

        chkCloseAfterLaunch = new CheckBox
        {
            Text = "啟動遊戲後關閉啟動器",
            Location = new Point(20, 30),
            AutoSize = true
        };

        chkMinimizeToTray = new CheckBox
        {
            Text = "啟動遊戲後最小化到系統列",
            Location = new Point(20, 60),
            AutoSize = true
        };

        grpOptions.Controls.AddRange(new Control[] { chkCloseAfterLaunch, chkMinimizeToTray });

        // 按鈕
        var btnSave = new Button
        {
            Text = "儲存",
            Location = new Point(140, 280),
            Size = new Size(100, 35),
            BackColor = Color.FromArgb(0, 123, 255),
            ForeColor = Color.White
        };
        btnSave.Click += BtnSave_Click;

        var btnCancel = new Button
        {
            Text = "取消",
            Location = new Point(260, 280),
            Size = new Size(100, 35)
        };
        btnCancel.Click += (s, e) => DialogResult = DialogResult.Cancel;

        Controls.AddRange(new Control[]
        {
            lblApiUrl, txtApiUrl,
            lblGamePath, txtGamePath, btnBrowse,
            grpOptions,
            btnSave, btnCancel
        });
    }

    private void LoadSettings()
    {
        txtApiUrl.Text = Program.Config.ApiBaseUrl;
        txtGamePath.Text = Program.Config.GameExecutablePath;
        chkCloseAfterLaunch.Checked = Program.Config.Launcher.CloseAfterLaunch;
        chkMinimizeToTray.Checked = Program.Config.Launcher.MinimizeToTray;
    }

    private void BtnBrowse_Click(object? sender, EventArgs e)
    {
        using var openFileDialog = new OpenFileDialog
        {
            Filter = "執行檔 (*.exe)|*.exe|所有檔案 (*.*)|*.*",
            Title = "選擇遊戲執行檔"
        };

        if (openFileDialog.ShowDialog() == DialogResult.OK)
        {
            txtGamePath.Text = openFileDialog.FileName;
        }
    }

    private void BtnSave_Click(object? sender, EventArgs e)
    {
        Program.Config.ApiBaseUrl = txtApiUrl.Text.Trim();
        Program.Config.GameExecutablePath = txtGamePath.Text;
        Program.Config.Launcher.CloseAfterLaunch = chkCloseAfterLaunch.Checked;
        Program.Config.Launcher.MinimizeToTray = chkMinimizeToTray.Checked;
        
        Program.Config.Save();
        
        DialogResult = DialogResult.OK;
        Close();
    }
}
