#!/bin/bash

set -e

# Hardcoded paths
REPO_PATH="/home/bruno/solviz"
NGINX_AVAILABLE="/etc/nginx/sites-available/semantic.bet"
NGINX_ENABLED="/etc/nginx/sites-enabled/semantic.bet"
STATIC_TARGET="/var/www/semantic.bet"

echo "Cleaning up symlinks for semantic.bet..."

# Remove symlink from sites-enabled
if [ -L "$NGINX_ENABLED" ]; then
    sudo rm "$NGINX_ENABLED"
    echo "Removed sites-enabled symlink."
fi

# Remove symlink from sites-available
if [ -L "$NGINX_AVAILABLE" ]; then
    sudo rm "$NGINX_AVAILABLE"
    echo "Removed sites-available symlink."
fi

# Remove static content symlink
if [ -L "$STATIC_TARGET" ]; then
    sudo rm "$STATIC_TARGET"
    echo "Removed static content symlink."
fi

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx
echo "Nginx reloaded after cleanup."
