using System.Security.Cryptography;

namespace FiinGroupApp.Api.Auth;

public sealed class SessionTokenService
{
    public const int TokenBytes = 32;

    public string CreateToken() => Base64Url(RandomNumberGenerator.GetBytes(TokenBytes));

    public static string HashToken(string token)
    {
        ArgumentException.ThrowIfNullOrEmpty(token);
        return Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));
    }

    private static string Base64Url(byte[] value) => Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
