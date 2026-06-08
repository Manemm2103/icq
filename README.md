# DRQ Modern

Container-ready package for Git and Portainer deployment, including an optional built-in `coturn` service for WebRTC calls.

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
- `TURN_PUBLIC_HOST`
- `TURN_REALM`
- `TURN_EXTERNAL_IP`
- `TURN_USERNAME`
- `TURN_CREDENTIAL`

## Optional ioBroker integration variables

- `IOBROKER_API_KEY`
- `IOBROKER_SENDER_USERNAME` default: `ioBroker`

If `IOBROKER_API_KEY` is set, DRQ enables a protected endpoint for adapter-based message delivery from ioBroker.

If you do not want to use environment variables, you can still provide a local `vapidKeys.json`, but that file should not be committed to a public Git repository.

## Local Docker run

```bash
docker compose up -d --build
```

The web app listens on port `3000` inside the container.

## Portainer stack

Use `portainer-stack.yml` when deploying from Git in Portainer.

### Recommended Portainer settings

- Repository URL: your Git URL
- Reference: `refs/heads/main`
- Compose path: `portainer-stack.yml`

### Environment variables

```text
APP_PORT=3000
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
TURN_PUBLIC_HOST=yourdomain.de
TURN_REALM=yourdomain.de
TURN_EXTERNAL_IP=yourIP
TURN_USERNAME=your_turn_username
TURN_CREDENTIAL=your_turn_password
IOBROKER_API_KEY=your_shared_secret
IOBROKER_SENDER_USERNAME=ioBroker
```

### Reverse proxy

If you publish the web app behind Nginx Proxy Manager or another reverse proxy, point the proxy host to:

- target host: the Docker host running this stack
- target port: the value of `APP_PORT`

That proxy only covers the website and API. TURN still needs its own public ports on the Docker host.

### TURN ports

For iPhone/mobile WebRTC reliability, these ports must be reachable from outside:

- `3478/tcp`
- `3478/udp`
- `49160-49200/udp`

If you run a host firewall or upstream NAT, open or forward the same ports there as well.

### Updating in Portainer

1. Push changes to GitHub.
2. Open the stack in Portainer.
3. Redeploy the stack from repository.

## Notes

- The SQLite database is persisted via the named volume `icq_data`.
- Uploaded files and background assets are persisted in the same volume.
- The app now loads TURN/STUN runtime configuration from the server environment.
- The included `coturn` service is meant for direct host port publishing, not normal HTTP reverse proxying.

## ioBroker API

If `IOBROKER_API_KEY` is configured, DRQ accepts status messages on:

- `POST /api/integrations/iobroker/messages`

Headers:

- `x-api-key: <IOBROKER_API_KEY>`

Example payload:

```json
{
  "message": "Waschmaschine fertig",
  "recipients": ["4711", "8159"],
  "title": "Haus",
  "severity": "info",
  "source": "ioBroker"
}
```
