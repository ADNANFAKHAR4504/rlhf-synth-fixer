#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-local}"

echo "[transcode-test] Running transcoding quality tests for env=${ENVIRONMENT}"

SAMPLE_DIR="tests/videos"
OUTPUT_DIR="/tmp/transcoded"
mkdir -p "${OUTPUT_DIR}"

for input in "${SAMPLE_DIR}"/*.mp4; do
  base=$(basename "${input}" .mp4)
  output="${OUTPUT_DIR}/${base}_transcoded.mp4"
  echo "[transcode-test] Transcoding ${input} -> ${output}"
  ffmpeg -y -i "${input}" -vf scale=1280:-2 -c:v h264 -preset fast -c:a aac "${output}"
done

echo "[transcode-test] Computing VMAF scores"
for output in "${OUTPUT_DIR}"/*_transcoded.mp4; do
  ref="${SAMPLE_DIR}/$(basename "${output/_transcoded/}")"
  echo "[transcode-test] VMAF for ${output} vs ${ref}"
  ffmpeg -i "${ref}" -i "${output}" -lavfi libvmaf="log_fmt=json:log_path=/tmp/vmaf.json" -f null - || true
  score=$(jq '.frames[].metrics.vmaf' /tmp/vmaf.json | awk '{sum+=$1; n++} END { if (n>0) print sum/n; else print 0 }')
  echo "VMAF score=${score}"
  if (( $(echo "${score} < 90" | bc -l) )); then
    echo "VMAF score below 90 threshold"
    exit 1
  fi
done

echo "[transcode-test] All VMAF scores >= 90"
