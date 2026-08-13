# TFS domain login troubleshooting

FiinGroup.Jarvis remains the reference implementation. Jarvis validates the supplied account with `axios-ntlm` against:

```text
{TFS_BASE_URL}/_apis/connectionData?connectOptions=1&lastChangeId=-1&lastChangeId64=-1
```

FiinGroupApp uses the same endpoint and explicitly restricts the .NET credential cache to NTLM.

## Local configuration

Run the target API in a new PowerShell process. Use the same `TFS_BASE_URL` value that is effective in Jarvis; do not copy the Jarvis service-account password into FiinGroupApp.

```powershell
cd D:\DEV\FiinGroupApp
$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:Tfs__Enabled = "true"
$env:Tfs__BaseUrl = "http://192.168.1.40:8080/tfs"
$env:Tfs__TimeoutSeconds = "15"
dotnet run --project backend --launch-profile FiinGroupApp.Api
```

The URL must be the collection/base URL, not the `_apis/connectionData` URL. The API appends that path itself.

In the React login form choose `TFS domain account`. Enter either:

- `username` and `DOMAIN` in the separate fields; or
- `DOMAIN\username` in the username field and leave the Domain field empty.

Do not enter `DOMAIN\username` while also entering a different Domain. The target normalizes the embedded prefix, but the separate values should describe the same account.

## Error codes

The target login response includes a safe `error.code`; it never includes the password or an authorization header.

| Code | Meaning | Check |
| --- | --- | --- |
| `TFS_DISABLED` | Target API has TFS disabled | Set `Tfs__Enabled=true` in the same process that starts .NET |
| `TFS_URL_MISSING` / `TFS_URL_INVALID` | TFS endpoint is missing or malformed | Compare `Tfs__BaseUrl` with Jarvis `TFS_BASE_URL` |
| `TFS_ENDPOINT_NOT_FOUND` | Base URL does not point to the TFS collection | Remove `/_apis/connectionData` from the configured value |
| `TFS_INVALID_CREDENTIALS` | TFS rejected the NTLM handshake | Check username, password, domain and account lockout |
| `TFS_TIMEOUT` / `TFS_UNAVAILABLE` | Target API cannot reach TFS | Check VPN, DNS, proxy, firewall and TLS certificate |

## Restart requirement

After changing `Tfs__*`, stop the existing `FiinGroupApp.Api` process and start it again. Configuration is read when the API starts. A successful build alone does not replace an already-running process.

## Comparison checklist

1. Test the same `TFS_BASE_URL` in Jarvis and `Tfs__BaseUrl` in FiinGroupApp.
2. Test with `DOMAIN\username` once, then with separate `DOMAIN` and `username` fields.
3. Check the HTTP status and `error.code` from `POST /api/v2/auth/login`.
4. If Jarvis returns 401 but target returns `TFS_TIMEOUT` or `TFS_UNAVAILABLE`, the issue is connectivity/NTLM negotiation, not the account password.
