#!/bin/bash
set -euo pipefail
# Purpose: Run Great Expectations data quality checks on a BigQuery dataset.
# Usage: run-data-quality-tests.sh <bigquery_dataset> <environment>

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <bigquery_dataset> <environment>" >&2
  exit 1
fi

BIGQUERY_DATASET="$1"
ENVIRONMENT="$2"

echo "[run-data-quality-tests] Running Great Expectations on dataset='${BIGQUERY_DATASET}', env='${ENVIRONMENT}'"
# TODO: great_expectations checkpoint run <checkpoint_name> --vars '{"bq_dataset": "..."}'
