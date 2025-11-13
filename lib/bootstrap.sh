#!/bin/bash
set -euo pipefail

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Starting EMR bootstrap action"

if ! command -v python3 >/dev/null 2>&1; then
  log "Installing Python 3 and pip via yum"
  sudo yum install -y python3 python3-pip
fi

log "Upgrading pip to the latest available version"
sudo python3 -m pip install --upgrade pip

REQUIRED_PACKAGES=(
  "numpy==1.24.3"
  "pandas==2.0.3"
  "pyarrow==12.0.1"
)

log "Installing analytics Python packages: ${REQUIRED_PACKAGES[*]}"
sudo python3 -m pip install --upgrade "${REQUIRED_PACKAGES[@]}"

log "Verifying installed package versions"
python3 - <<'PYTHON'
import numpy, pandas, pyarrow
print(f"NumPy version: {numpy.__version__}")
print(f"Pandas version: {pandas.__version__}")
print(f"PyArrow version: {pyarrow.__version__}")
PYTHON

SPARK_ENV="/etc/spark/conf/spark-env.sh"
log "Configuring Spark to use system Python at ${SPARK_ENV}"
sudo tee -a "${SPARK_ENV}" >/dev/null <<'EOF'
export PYSPARK_PYTHON=/usr/bin/python3
export PYSPARK_DRIVER_PYTHON=/usr/bin/python3
EOF

log "Bootstrap actions completed successfully"