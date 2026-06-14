Deployment checklist — PythonAnywhere / general

1) Pre-deploy local checklist
- Ensure code is committed: `git add . && git commit -m "deploy prep" && git push`
- Set `DEBUG = False` in `myday/settings.py` before public deployment.
- Ensure `ALLOWED_HOSTS` includes your domain. Example: `['localhost','127.0.0.1','.pythonanywhere.com']`.
- Confirm `CSRF_TRUSTED_ORIGINS` contains the https origin, e.g. `['https://mwemasolutions.pythonanywhere.com']`.
- Configure `STATIC_ROOT` (we use `BASE_DIR / 'staticfiles'`) and run `collectstatic`.

2) Commands to run on server (PythonAnywhere)
- Pull latest from git
  - `cd ~/yourrepo && git pull`
- Activate virtualenv
  - `workon your-venv` (or `source /path/to/venv/bin/activate`)
- Install dependencies
  - `pip install -r requirements.txt`
- Run migrations
  - `python manage.py migrate`
- Collect static files
  - `python manage.py collectstatic --noinput`
- Reload the web app from the PythonAnywhere Web tab

3) HTTPS / SSL (fixes "Your connection is not private")
- PythonAnywhere subdomain:
  - For paid accounts: use the web UI to set up Let's Encrypt certificates.
  - For free accounts, PythonAnywhere may not support Let's Encrypt; consider using Cloudflare in front for free SSL.
- Custom domain:
  - Point DNS to PythonAnywhere as documented, then request a Let's Encrypt certificate from the PythonAnywhere "Web" tab.
- After obtaining HTTPS cert, enable the production security settings in `settings.py` (uncomment and enable):
  - `SECURE_SSL_REDIRECT = True`
  - `SESSION_COOKIE_SECURE = True`
  - `CSRF_COOKIE_SECURE = True`
  - `SECURE_HSTS_SECONDS = 31536000` (and related HSTS flags)
- Verify certificate chain from desktop browser: click the padlock → Certificate → view chain. Ensure no missing intermediates.

4) Troubleshooting mobile SSL issues
- Check device date/time is correct.
- Try another device or network to rule out local network interception.
- If only older Android devices fail, the device may not trust Let's Encrypt cross-signed chains; consider using Cloudflare Universal SSL as a workaround.

5) Extra tips
- Keep `SECRET_KEY` secret; don't commit production secret keys. Use environment variables for production secrets.
- Consider using `django-environ` or similar to manage secrets and env-specific settings.
- Add monitoring/logging (Sentry, Papertrail) for production errors.

If you want, I can: (A) add a small management command or script for deploy, (B) wire-up environment variable support for `SECRET_KEY` and `DEBUG`, or (C) walk through the PythonAnywhere web UI steps and screenshots.
