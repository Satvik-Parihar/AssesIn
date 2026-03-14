#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/www/assessin"
RELEASES_DIR="$APP_ROOT/releases"
SHARED_DIR="$APP_ROOT/shared"
CURRENT_LINK="$APP_ROOT/current"

SOURCE_ARCHIVE="/tmp/assessin-source.tgz"
API_ARCHIVE="/tmp/assessin-api.tgz"
WEB_ARCHIVE="/tmp/assessin-web.tgz"

TIMESTAMP="$(date -u +%Y%m%d%H%M%S)"
RELEASE_DIR="$RELEASES_DIR/$TIMESTAMP"

for required in "$SOURCE_ARCHIVE" "$API_ARCHIVE" "$WEB_ARCHIVE"; do
	if [[ ! -f "$required" ]]; then
		echo "Missing required file: $required"
		exit 1
	fi
done

sudo mkdir -p "$RELEASES_DIR" "$SHARED_DIR" "$SHARED_DIR/env" "$SHARED_DIR/node_modules" "$SHARED_DIR/logs"
sudo mkdir -p "$RELEASE_DIR"
sudo chown -R ubuntu:ubuntu "$APP_ROOT"

mkdir -p "$RELEASE_DIR/source" "$RELEASE_DIR/.artifacts/api" "$RELEASE_DIR/.artifacts/web"

tar -xzf "$SOURCE_ARCHIVE" -C "$RELEASE_DIR/source"
tar -xzf "$API_ARCHIVE" -C "$RELEASE_DIR/.artifacts/api"
tar -xzf "$WEB_ARCHIVE" -C "$RELEASE_DIR/.artifacts/web"

touch "$SHARED_DIR/env/api.env" "$SHARED_DIR/env/web.env"
mkdir -p "$SHARED_DIR/node_modules/frontend-online-exam"

ln -sfn "$SHARED_DIR/env/api.env" "$RELEASE_DIR/source/backend/OnlineExamAPI/.env"
ln -sfn "$SHARED_DIR/env/web.env" "$RELEASE_DIR/source/frontend/online-exam/.env"
ln -sfn "$SHARED_DIR/node_modules/frontend-online-exam" "$RELEASE_DIR/source/frontend/online-exam/node_modules"

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

sudo tee /etc/systemd/system/assessin-api.service >/dev/null <<'EOF'
[Unit]
Description=AssessIn ASP.NET Core API
After=network.target

[Service]
WorkingDirectory=/var/www/assessin/current/.artifacts/api
ExecStart=/usr/bin/dotnet /var/www/assessin/current/.artifacts/api/OnlineExamAPI.dll
Restart=always
RestartSec=5
KillSignal=SIGINT
SyslogIdentifier=assessin-api
User=ubuntu
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5000
EnvironmentFile=-/var/www/assessin/shared/env/api.env

[Install]
WantedBy=multi-user.target
EOF

if [[ -f /etc/letsencrypt/live/assessin.me/fullchain.pem && -f /etc/letsencrypt/live/assessin.me/privkey.pem ]]; then
  sudo tee /etc/nginx/sites-available/assessin >/dev/null <<'EOF'
server {
	listen 80;
	listen [::]:80;
	server_name assessin.me www.assessin.me;
	return 301 https://$host$request_uri;
}

server {
	listen 443 ssl;
	listen [::]:443 ssl;
	server_name assessin.me www.assessin.me;

	root /var/www/assessin/current/.artifacts/web;
	index index.html;

	ssl_certificate /etc/letsencrypt/live/assessin.me/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/assessin.me/privkey.pem;
	include /etc/letsencrypt/options-ssl-nginx.conf;
	ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

	location /api/ {
		proxy_pass http://127.0.0.1:5000/api/;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection keep-alive;
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}

	location / {
		try_files $uri $uri/ /index.html;
	}
}
EOF

  sudo tee /etc/nginx/conf.d/assessin-deny-ip.conf >/dev/null <<'EOF'
server {
	listen 80 default_server;
	listen [::]:80 default_server;
	server_name _;
	return 444;
}

server {
	listen 443 ssl default_server;
	listen [::]:443 ssl default_server;
	server_name _;
	ssl_certificate /etc/letsencrypt/live/assessin.me/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/assessin.me/privkey.pem;
	include /etc/letsencrypt/options-ssl-nginx.conf;
	ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
	return 444;
}
EOF
else
  sudo tee /etc/nginx/sites-available/assessin >/dev/null <<'EOF'
server {
	listen 80;
	listen [::]:80;
	server_name assessin.me www.assessin.me;

	root /var/www/assessin/current/.artifacts/web;
	index index.html;

	location /api/ {
		proxy_pass http://127.0.0.1:5000/api/;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection keep-alive;
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}

	location / {
		try_files $uri $uri/ /index.html;
	}
}
EOF

  sudo tee /etc/nginx/conf.d/assessin-deny-ip.conf >/dev/null <<'EOF'
server {
	listen 80 default_server;
	listen [::]:80 default_server;
	server_name _;
	return 444;
}
EOF
fi

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sfn /etc/nginx/sites-available/assessin /etc/nginx/sites-enabled/assessin

sudo systemctl daemon-reload
sudo systemctl enable assessin-api
sudo systemctl restart assessin-api
sudo nginx -t
sudo systemctl restart nginx

# Keep only latest 3 releases.
mapfile -t old_releases < <(ls -1dt "$RELEASES_DIR"/* 2>/dev/null | tail -n +4)
if (( ${#old_releases[@]} > 0 )); then
	rm -rf -- "${old_releases[@]}"
fi

rm -f "$SOURCE_ARCHIVE" "$API_ARCHIVE" "$WEB_ARCHIVE"

echo "Deployment successful"
echo "Current release: $RELEASE_DIR"
ls -1dt "$RELEASES_DIR"/* | head -n 5
