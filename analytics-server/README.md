# Analytics server

Private Node.js service for opt-in playtest telemetry and replay storage. Data is kept in SQLite (`analytics-data/analytics.sqlite`) with indexes for run date, event type/floor and browser fingerprint.

Requires Node.js 22.5+ for the built-in `node:sqlite` driver (verified with Node.js 24).

```powershell
$env:ANALYTICS_ADMIN_TOKEN = 'choose-a-long-random-token' # optional but recommended
npm.cmd run analytics:server
```

Open `http://localhost:8787`. The game sends data only when the player enables **Anonymous playtest telemetry** in Settings. The default endpoint is `http://localhost:8787`.

The dashboard groups sessions by a pseudonymous browser fingerprint. The client hashes coarse browser/device properties locally and sends only a short SHA-256 digest, never the raw browser properties or IP address. Error messages and stack traces are sent only after the player opts in, so do not expose this data publicly.

Do not expose the SQLite file or dashboard publicly without HTTPS and an admin token.

For a containerized local deployment, copy `.env.example` to `.env`, set the token, then run `docker compose up --build`. Retention cleanup is manual and safe to schedule:

```powershell
$env:ANALYTICS_RETENTION_DAYS = 90
npm.cmd run analytics:prune
```
