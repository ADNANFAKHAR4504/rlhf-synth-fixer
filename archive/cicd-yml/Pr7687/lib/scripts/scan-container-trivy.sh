#!/bin/bash
set -euo pipefail

IMAGE_URI="$1"

trivy image --exit-code 1 --severity CRITICAL "${IMAGE_URI}"

