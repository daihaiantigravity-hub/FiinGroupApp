using FiinGroupApp.Api.Auth;
using Xunit;

namespace FiinGroupApp.Api.Tests;

public sealed class PasswordHashingTests
{
    [Fact]
    public void Hashes_are_not_plaintext_and_verify_only_original_password()
    {
        var hasher = new Pbkdf2PasswordHasher();
        var encoded = hasher.Hash("correct horse battery staple");
        Assert.NotEqual("correct horse battery staple", encoded);
        Assert.True(hasher.Verify("correct horse battery staple", encoded));
        Assert.False(hasher.Verify("wrong password", encoded));
    }
}
