#!/bin/bash
set -euo pipefail

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

log "Starting EMR bootstrap action"

# Ensure Python 3 is available
if ! command -v python3 >/dev/null 2>&1; then
  log "Installing Python 3 and pip via yum"
  sudo yum install -y python3 python3-pip || {
    log "ERROR: Failed to install Python 3"
    exit 1
  }
fi

# Verify Python 3 is working
python3 --version || {
  log "ERROR: Python 3 is not working correctly"
  exit 1
}

# Check Python and pip versions
PYTHON_VERSION=$(python3 --version 2>&1 || echo "unknown")
log "Python version: ${PYTHON_VERSION}"

# Upgrade pip with retry logic
log "Upgrading pip to the latest available version"
for i in {1..3}; do
  if sudo python3 -m pip install --upgrade pip --no-warn-script-location 2>&1; then
    log "Successfully upgraded pip"
    break
  fi
  if [ $i -eq 3 ]; then
    log "WARNING: Failed to upgrade pip after 3 attempts, continuing with existing pip"
  else
    log "Retrying pip upgrade (attempt $i of 3)..."
    sleep 5
  fi
done

# Check current pip version
PIP_VERSION=$(python3 -m pip --version 2>&1 || echo "unknown")
log "pip version: ${PIP_VERSION}"

REQUIRED_PACKAGES=(
  "numpy==1.24.3"
  "pandas==2.0.3"
  "pyarrow==12.0.1"
)

# Install packages with retry logic and better error handling
log "Installing analytics Python packages: ${REQUIRED_PACKAGES[*]}"
for i in {1..3}; do
  if sudo python3 -m pip install --upgrade --no-warn-script-location "${REQUIRED_PACKAGES[@]}" 2>&1; then
    log "Successfully installed all packages"
    break
  fi
  if [ $i -eq 3 ]; then
    log "ERROR: Failed to install required packages after 3 attempts"
    log "Attempting to install packages individually to identify the problematic package..."
    for pkg in "${REQUIRED_PACKAGES[@]}"; do
      log "Installing $pkg individually..."
      if ! sudo python3 -m pip install --upgrade --no-warn-script-location "$pkg" 2>&1; then
        log "ERROR: Failed to install $pkg"
        # Try without version pinning as fallback
        PKG_NAME=$(echo "$pkg" | cut -d'=' -f1)
        log "Attempting to install $PKG_NAME without version constraint..."
        if ! sudo python3 -m pip install --upgrade --no-warn-script-location "$PKG_NAME" 2>&1; then
          log "ERROR: Failed to install $PKG_NAME even without version constraint"
          exit 1
        fi
      fi
    done
  else
    log "Retrying package installation (attempt $i of 3)..."
    sleep 10
  fi
done

# Verify installed packages
log "Verifying installed package versions"
python3 <<'PYTHON'
import sys
try:
    import numpy
    print(f"NumPy version: {numpy.__version__}")
except ImportError as e:
    print(f"ERROR: Failed to import numpy: {e}", file=sys.stderr)
    sys.exit(1)

try:
    import pandas
    print(f"Pandas version: {pandas.__version__}")
except ImportError as e:
    print(f"ERROR: Failed to import pandas: {e}", file=sys.stderr)
    sys.exit(1)

try:
    import pyarrow
    print(f"PyArrow version: {pyarrow.__version__}")
except ImportError as e:
    print(f"ERROR: Failed to import pyarrow: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON

if [ $? -ne 0 ]; then
  log "ERROR: Package verification failed"
  exit 1
fi

# Configure Spark environment
SPARK_ENV="/etc/spark/conf/spark-env.sh"
if [ -f "$SPARK_ENV" ]; then
  log "Configuring Spark to use system Python at ${SPARK_ENV}"
  if ! grep -q "PYSPARK_PYTHON" "$SPARK_ENV"; then
    sudo tee -a "$SPARK_ENV" >/dev/null <<'EOF'
export PYSPARK_PYTHON=/usr/bin/python3
export PYSPARK_DRIVER_PYTHON=/usr/bin/python3
EOF
  else
    log "Spark Python configuration already exists, skipping"
  fi
else
  log "WARNING: Spark environment file not found at ${SPARK_ENV}, skipping configuration"
fi

log "Bootstrap actions completed successfully"
exit 0