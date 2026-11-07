#!/usr/bin/env bash

# ==============================================================================
# AWS EC2 Free Tier (t2.micro) One-Click Automated Setup Script
# Configures 2GB Swap Memory, Installs Docker & Docker Compose, and Starts App
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo " Starting Automated AWS EC2 Environment Setup"
echo "=========================================================="

# 1. Configure 2GB Swapfile (Prevents t2.micro 1GB RAM Out-Of-Memory Crashes)
if [ ! -f /swapfile ]; then
    echo "[1/4] Allocating 2GB swap space for memory stability..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap configured successfully."
else
    echo "[1/4] Swap space already present. Skipping."
fi

# 2. Update System Packages and Install Docker & Compose
echo "[2/4] Installing Docker, Docker Compose, and Git..."
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose-v2 git curl ufw

# 3. Configure Docker Service and Permissions
echo "[3/4] Enabling Docker daemon to start on system boot..."
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER" || true

# 4. Configure Firewall (UFW)
echo "[4/4] Opening required ports in local firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP / Frontend
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # Backend API
sudo ufw allow 5173/tcp  # Vite Client Port
sudo ufw --force enable

echo "=========================================================="
echo " AWS EC2 Environment Configuration Completed!"
echo " Log out and log back in, or run 'newgrp docker' to use docker without sudo."
echo " To run the application:"
echo "   docker compose up -d --build"
echo "=========================================================="

