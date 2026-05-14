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

## Troubleshooting SSH_PRIVATE_KEY

If GitHub Actions fails with `Permission denied (publickey,password)`, check these:

1. `SSH_PRIVATE_KEY` contains the private key, including both header and footer:

```txt
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

2. The matching public key is registered on the server:

```bash
cat ~/.ssh/express_practice_deploy.pub
```

Paste that public key into the server's `~/.ssh/authorized_keys`.

3. Server key permissions are correct:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

4. Test the same key from your local machine:

```bash
ssh -i ~/.ssh/express_practice_deploy ubuntu@ssh.gsmsv.site -p 21114
```

If this local command still asks for the VM password, the public key is not registered correctly.
