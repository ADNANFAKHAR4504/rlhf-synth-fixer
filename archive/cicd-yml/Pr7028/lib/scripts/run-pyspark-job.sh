#!/bin/bash
set -euo pipefail
# Purpose: Submit PySpark jobs to Dataproc and write to BigQuery with encryption.
# Usage: run-pyspark-job.sh <region> <bigquery_dataset> <environment>

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <region> <bigquery_dataset> <environment>" >&2
  exit 1
fi

REGION="$1"
BIGQUERY_DATASET="$2"
ENVIRONMENT="$3"

echo "[run-pyspark-job] Running PySpark job in region='${REGION}', dataset='${BIGQUERY_DATASET}', env='${ENVIRONMENT}'"
# TODO: gcloud dataproc jobs submit pyspark ... with appropriate args.
