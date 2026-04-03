# Security Policy

## About Voya

Voya is an open-source AI-powered travel guide built with React, TypeScript, and Vite. We take the security of this project seriously and appreciate responsible disclosure of any vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

Only the latest release on the `main` branch is actively supported with security patches.

## Reporting a Vulnerability

If you discover a security vulnerability in Voya, please report it responsibly:

1. **Do NOT open a public GitHub issue.** Security issues must be reported privately.
2. Email **[prempaudel05@gmail.com](mailto:prempaudel05@gmail.com)** with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Any potential impact or severity assessment
3. You will receive an acknowledgment within **48 hours**.
4. A fix will be prioritized and released as soon as possible, typically within **7 days** for critical issues.

## Scope

The following areas are in scope for security reports:

- API endpoints (`/api/*`)
- Server-side code (`server/`, `api/`)
- Client-side data handling and injection vulnerabilities
- Dependency vulnerabilities in production packages
- Authentication or authorization flaws (if applicable)

The following are **out of scope**:

- Denial-of-service (DoS) attacks against hosted instances
- Social engineering attacks
- Issues in third-party services (e.g., Vercel infrastructure)
- Vulnerabilities in development-only dependencies

## Security Best Practices

This project follows these security practices:

- Input validation and sanitization on all API endpoints
- No secrets or API keys committed to the repository
- Dependencies are regularly audited with `npm audit`
- CORS is configured to restrict cross-origin access

## License

This project is licensed under the [MIT License](LICENSE). See the LICENSE file for full details.

## Acknowledgments

We appreciate the security research community. Responsible reporters will be credited in release notes (with permission).
