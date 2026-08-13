using FiinGroupApp.Api.Auth;
using Xunit;

namespace FiinGroupApp.Api.Tests;

public sealed class SessionTokenServiceTests
{
    [Fact]
    public void Creates_url_safe_random_tokens_and_one_way_hashes()
    {
        var service = new SessionTokenService();
        var first = service.CreateToken();
        var second = service.CreateToken();
        Assert.NotEqual(first, second);
        Assert.DoesNotContain("+", first);
        Assert.DoesNotContain("/", first);
        Assert.DoesNotContain("=", first);
        Assert.Equal(64, SessionTokenService.HashToken(first).Length);
        Assert.NotEqual(first, SessionTokenService.HashToken(first));
        Assert.NotEqual(SessionTokenService.HashToken(first), SessionTokenService.HashToken(second));
    }
}
