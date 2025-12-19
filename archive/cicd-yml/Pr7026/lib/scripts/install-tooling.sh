#!/usr/bin/env bash
set -euo pipefail

sudo npm install -g yarn
sudo apt-get update
sudo apt-get install -y yamllint shellcheck

curl -sSL https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 -o hadolint
chmod +x hadolint
sudo mv hadolint /usr/local/bin/hadolint

curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
