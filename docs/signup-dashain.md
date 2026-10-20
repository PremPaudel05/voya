# Password accounts and seasonal greeting

The account page now supports name, email, password and confirmation fields. No custom domain or email delivery service is required. Migration `0005_password_accounts.sql` is applied by the account deployment workflow before deploying auth version 4.

Passwords use salted scrypt (N=16384, r=8, p=5). Registration and login require bot verification and have IP/email rate limits. Password-account emails are unverified and never automatically linked to provider accounts. Google remains available; Microsoft and other providers still require their own configured credentials.

Signup displays a private recovery code once. Users must save it before continuing. Password recovery rotates that code and revokes previous sessions. There is no email password-reset service; losing both password and recovery code means the account cannot be recovered through this flow.

The homepage greeting is dismissible, remembers dismissal locally, supports reduced motion and small screens, and expires November 2, 2026 at midnight America/New_York. Adjust `endsAt` in `src/components/DashainGreeting.tsx` for future campaigns.

## Illustration

Final asset: `public/celebrations/dashain-kites.webp`. Optimized from the supplied cartoon after transparent-background cleanup.

Image edit prompt: “Use case: background-extraction. Edit target: supplied Dashain cartoon. Remove ONLY the gray and white checkerboard background, making it actually transparent. Preserve the exact artwork: colorful kites at upper left, their fine strings, the green Devanagari Dashain calligraphy and swing in the center, and the Nepali child holding the kite spool at bottom right. Keep the composition, shapes, lettering and colors faithful; no additions, no reinterpretation, no new text, no border or shadow. Wide landscape transparent PNG with all existing foreground artwork visible, no clipping. Provide the local file path for website integration.”
