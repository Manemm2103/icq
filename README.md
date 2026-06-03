# ICQ Modern

Container-ready package for Git and Portainer deployment.

## What is persisted

The application stores runtime data in `/app/data`:

- `chat.db`
- uploaded files
- background uploads
- `call-debug.log`

On first start, the app automatically migrates legacy local data from:

- `./chat.db`
- `./public/uploads`
- `./public/backgrounds`

## Required environment variables

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

If you do not want to use environment variables, you can still provide a local `vapidKeys.json`, but that file should not be committed to a public Git repository.

## Local Docker run

```bash
docker compose up -d --build
```

The app listens on port `3000` inside the container.

## Portainer stack

Use `portainer-stack.yml` when deploying from Git in Portainer.

### Recommended Portainer settings

Repository:

- Repository URL: your Git URL
- Reference: `refs/heads/main`
- Compose path: `portainer-stack.yml`

Environment variables:

- `APP_PORT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `TURN_URLS`
- `TURN_USERNAME`
- `TURN_CREDENTIAL`

### Example values

```text
APP_PORT=3000
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
TURN_URLS=turn:your-domain:3478?transport=udp,turn:your-domain:3478?transport=tcp
TURN_USERNAME=your_turn_username
TURN_CREDENTIAL=your_turn_password
```

### Reverse proxy

If you publish the app behind Nginx Proxy Manager or another reverse proxy, point the proxy host to:

- target host: the Docker host running this stack
- target port: the value of `APP_PORT`

### Updating in Portainer

1. Push changes to GitHub.
2. Open the stack in Portainer.
3. Redeploy the stack from repository.

## Notes

- The SQLite database is persisted via the named volume `icq_data`.
- Uploaded files and background assets are persisted in the same volume.
- TURN/STUN configuration is now served at runtime from the server environment.
- For iPhone/mobile reliability, set `TURN_URLS`, `TURN_USERNAME`, and `TURN_CREDENTIAL` on the target server.
