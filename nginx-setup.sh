#!/bin/bash

set -e

# Hardcoded repo path
REPO_PATH="/home/bruno/solviz"

NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
NGINX_CONF="$REPO_PATH/nginx/semantic.bet"
STATIC_SOURCE="$REPO_PATH/charts"
STATIC_TARGET="/var/www/semantic.bet"

echo "Setting up Nginx site for semantic.bet..."

# Symlink Nginx config
if [ ! -L "$NGINX_AVAILABLE/semantic.bet" ]; then
    sudo ln -s "$NGINX_CONF" "$NGINX_AVAILABLE/semantic.bet"
    echo "Linked config to sites-available."
fi

if [ ! -L "$NGINX_ENABLED/semantic.bet" ]; then
    sudo ln -s "$NGINX_AVAILABLE/semantic.bet" "$NGINX_ENABLED/semantic.bet"
    echo "Linked config to sites-enabled."
fi

# Symlink static content
if [ ! -L "$STATIC_TARGET" ]; then
    sudo ln -s "$STATIC_SOURCE" "$STATIC_TARGET"
    echo "Linked static content to /var/www/semantic.bet."
fi

# Fix permissions
sudo chmod -R o+r "$STATIC_SOURCE"
sudo chmod o+x "$REPO_PATH" "$STATIC_SOURCE"

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
echo "Nginx reloaded and ready."
