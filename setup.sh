#!/bin/bash
set -e

echo "1. Checking swap..."
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
else
    echo "Swap already exists."
fi

echo "2. Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt update
    sudo apt install docker.io docker-compose unzip -y
    sudo usermod -aG docker $USER
else
    echo "Docker already installed."
fi

echo "3. Extracting code..."
rm -rf ~/whatsapp-app
mkdir -p ~/whatsapp-app
unzip -o ~/app.zip -d ~/whatsapp-app

cd ~/whatsapp-app
if [ ! -f .env ]; then
    cp .env.example .env
fi

echo "4. Starting Docker Compose..."
sudo docker-compose up -d --build
