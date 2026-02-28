using GameLauncher.Network.Models;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace GameLauncher.Network.Http;

/// <summary>
/// HTTP API 客戶端 - 處理與伺服器的通訊
/// </summary>
public class ApiClient : IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl;

    public ApiClient(string baseUrl)
    {
        _baseUrl = baseUrl.TrimEnd('/');
        _httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(30)
        };
        _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
    }

    /// <summary>
    /// 驗證版本
    /// </summary>
    public async Task<VersionCheckResponse> CheckVersionAsync(string currentVersion)
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/version?current={currentVersion}");
            
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<VersionCheckResponse>();
                return result ?? new VersionCheckResponse 
                { 
                    IsValid = false, 
                    Message = "無法解析伺服器回應" 
                };
            }

            return new VersionCheckResponse 
            { 
                IsValid = false, 
                Message = $"伺服器錯誤: {response.StatusCode}" 
            };
        }
        catch (HttpRequestException ex)
        {
            return new VersionCheckResponse 
            { 
                IsValid = false, 
                Message = $"連線失敗: {ex.Message}" 
            };
        }
        catch (TaskCanceledException)
        {
            return new VersionCheckResponse 
            { 
                IsValid = false, 
                Message = "連線逾時，請檢查網路" 
            };
        }
    }

    /// <summary>
    /// 登入
    /// </summary>
    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        try
        {
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PostAsync($"{_baseUrl}/api/auth/login", content);
            
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
                return result ?? new LoginResponse 
                { 
                    Success = false, 
                    Message = "無法解析伺服器回應" 
                };
            }
            else if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                return new LoginResponse 
                { 
                    Success = false, 
                    Message = "帳號或密碼錯誤" 
                };
            }

            return new LoginResponse 
            { 
                Success = false, 
                Message = $"伺服器錯誤: {response.StatusCode}" 
            };
        }
        catch (HttpRequestException ex)
        {
            return new LoginResponse 
            { 
                Success = false, 
                Message = $"連線失敗: {ex.Message}" 
            };
        }
        catch (TaskCanceledException)
        {
            return new LoginResponse 
            { 
                Success = false, 
                Message = "連線逾時，請檢查網路" 
            };
        }
    }

    /// <summary>
    /// 驗證 Token 是否有效
    /// </summary>
    public async Task<bool> ValidateTokenAsync(string token)
    {
        try
        {
            _httpClient.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            
            var response = await _httpClient.GetAsync($"{_baseUrl}/api/auth/validate");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public void Dispose()
    {
        _httpClient.Dispose();
        GC.SuppressFinalize(this);
    }
}
