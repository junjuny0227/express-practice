# Deployment

## GSM SV connection

```bash
ssh ubuntu@ssh.gsmsv.site -p 21114
```

## Docker Compose deploy

The GSM SV HTTP forwarding shown in the dashboard is:

```txt
ssh.gsmsv.site:22114 -> VM internal :80
```

This project maps VM internal `80` to the container's Express port `3000`.

```bash
docker compose up -d --build
```

After deployment, open:

```txt
http://ssh.gsmsv.site:22114
```

## GitHub Actions secrets

Set these in GitHub repository settings:

```txt
SSH_PRIVATE_KEY=<private key for ubuntu user>
DEPLOY_PATH=/home/ubuntu/express-practice
```

The workflow already uses the screenshot values:

```txt
SSH_HOST=ssh.gsmsv.site
SSH_PORT=21114
SSH_USERNAME=ubuntu
```

The value in `SSH_PRIVATE_KEY` must be an SSH private key, not the VM password.
