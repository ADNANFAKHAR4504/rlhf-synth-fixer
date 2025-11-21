#!/bin/bash
# Terraform wrapper script that converts ENVIRONMENT_SUFFIX to TF_VAR_environment_suffix
# This allows Terraform to automatically pick up the environment variable

# Export ENVIRONMENT_SUFFIX as TF_VAR_environment_suffix so Terraform can use it
if [ -n "$ENVIRONMENT_SUFFIX" ]; then
  export TF_VAR_environment_suffix="$ENVIRONMENT_SUFFIX"
  echo "Setting TF_VAR_environment_suffix=$ENVIRONMENT_SUFFIX"
fi

# Pass all arguments to terraform
terraform "$@"
