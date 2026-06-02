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

1. Push this repository to Git.
2. Create a new Stack in Portainer from that repository.
3. Use `docker-compose.yml`.
4. Set these environment variables in Portainer:
   - `APP_PORT`
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`

## Notes

- The SQLite database is persisted via the named volume `icq_data`.
- Uploaded files and background assets are persisted in the same volume.
- TURN/STUN configuration is currently embedded in `public/app.js`. Adjust it to your target environment if needed.
