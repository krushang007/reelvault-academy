---
name: cloud-vps-hardening
description: Production VPS, AWS EC2, and Linux server hardening guide. Use when provisioning new cloud servers, configuring Nginx rate limiting, setting up Cloudflare origin protection, implementing ClamAV virus scanning on file uploads, or locking down Linux environments.
---

# Production Cloud & VPS Security Hardening Guide

This skill provides the security architecture, Nginx configurations, and virus quarantine pipelines required to defend cloud servers (AWS EC2, DigitalOcean, Hetzner, Linode) from automated scanners, malware uploads, and resource exhaustion.

---

## 1. The Threat Model for Fresh Cloud Deployments

Within minutes of spinning up an open public IP:
1. **Automated Vulnerability Bots:** Continuously scan for exposed endpoints (`/.env`, `/wp-login.php`, `/.git/config`, phpMyAdmin).
2. **Malicious File Uploads:** Uploaders disguising reverse shells or ELF crypto miners (e.g. XMRig) as `avatar.jpg` or `report.pdf`.
3. **L7 Volumetric Flooding:** Unauthenticated bursts exhausting application thread pools and RAM.

---

## 2. The 3-Tier Production Defense

```
[Internet Traffic]
       │
       ▼
[Layer 1: Cloudflare Edge WAF (Origin Cloaking)]
       │  ── Drops automated bot ASN pools
       │  ── Proxies traffic (Origin IP never exposed)
       ▼
[Layer 2: Nginx Reverse Proxy (Leaky Bucket Limiter)]
       │  ── 10MB shared zone (~160,000 tracked IPs)
       │  ── 10 req/s rate with burst=20 smoothing
       ▼
[Layer 3: Application & Storage Quarantine (ClamAV)]
       │  ── Non-executable temporary upload path
       │  ── Magic byte validation + virus scanning daemon
       ▼
[Clean S3 / Persistent Storage]
```

---

## 3. Host Hardening (Ubuntu / Debian VPS)

### SSH & Firewall Lockdown

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Disable password authentication for SSH
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 3. Configure UFW (Uncomplicated Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable

# 4. Install and enable Fail2Ban
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

---

## 4. Layer 2: Nginx Rate Limiting (`nginx.conf`)

Configure leaky-bucket rate limiting at the reverse proxy to protect application APIs:

```nginx
# /etc/nginx/conf.d/security.conf

# Rate limit zone: 10 megabytes stores ~160,000 active client IPs
limit_req_zone $binary_remote_addr zone=api_rate_limit:10m rate=10r/s;
limit_conn_zone $binary_remote_addr zone=api_conn_limit:10m;

server {
    listen 80;
    server_name api.yourdomain.com;

    # Hide server version banner
    server_tokens off;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /api/ {
        # Allow burst of 20 requests with nodelay for legitimate client spikes
        limit_req zone=api_rate_limit burst=20 nodelay;
        limit_conn api_conn_limit 10;

        # Max upload payload limit
        client_max_body_size 10M;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Layer 3: ClamAV File Upload Quarantine Sandbox

Never save user-uploaded files directly into production storage without scanning:

1. Write upload to an isolated quarantine folder mounted with `noexec` flags (`/tmp/quarantine`).
2. Verify **file magic bytes** (e.g. check for JPEG `FF D8 FF` / PNG `89 50 4E 47`, reject executable ELF/PHP headers).
3. Scan using the `clamd` daemon socket (`127.0.0.1:3310` or local unix socket).
4. **Promotion/Eviction:** Only promote to permanent S3 / object storage if certified clean.

```typescript
// upload-quarantine.ts
import clamd from 'clamdjs';
import fs from 'fs';
import path from 'path';

const scanner = clamd.createScanner('127.0.0.1', 3310);

export async function processQuarantinedUpload(
  tempFilePath: string,
  onCleanUpload: (safePath: string) => Promise<string>
): Promise<{ success: boolean; storageUrl?: string; error?: string }> {
  try {
    // 1. Scan quarantined file with ClamAV daemon
    const scanResult = await scanner.scanFile(tempFilePath);

    // 2. Evaluate scan verdict
    if (clamd.isCleanReply(scanResult)) {
      // Safe: Promote to persistent cloud storage
      const storageUrl = await onCleanUpload(tempFilePath);
      // Clean up temporary quarantine file
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return { success: true, storageUrl };
    } else {
      // Infected: Purge immediately and log security incident
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      console.error(`[SECURITY ALERT] Malicious payload quarantined and destroyed: ${scanResult}`);
      return { success: false, error: 'Malicious payload detected and rejected.' };
    }
  } catch (err: any) {
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    throw new Error(`Security scanner failed: ${err.message}`);
  }
}
```
