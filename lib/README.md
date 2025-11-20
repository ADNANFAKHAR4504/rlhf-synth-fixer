# Terraform Configuration

## Required Environment Variables

This Terraform configuration requires the following environment variable to be set:

### `TF_VAR_environment_suffix`

This should be set to match the value of `ENVIRONMENT_SUFFIX` that the deployment scripts use.

**Example:**
```bash
export TF_VAR_environment_suffix="${ENVIRONMENT_SUFFIX}"
```

Or for the bootstrap/deploy scripts, they should export this before running terraform commands:
```bash
export TF_VAR_environment_suffix="${ENVIRONMENT_SUFFIX:-dev}"
```

### Default Value

The `environment_suffix` variable has a default value of `"dev"` as a fallback. However, in CI/CD environments, it's recommended to explicitly set `TF_VAR_environment_suffix` to the appropriate value (e.g., PR number, environment name).

## Alternative: Using -var Flag

If you cannot set the environment variable, you can pass it as a command-line argument:

```bash
terraform plan -var="environment_suffix=${ENVIRONMENT_SUFFIX}"
terraform apply -var="environment_suffix=${ENVIRONMENT_SUFFIX}"
```

## Integration with Scripts

The `scripts/bootstrap.sh` and `scripts/deploy.sh` files should be updated to either:
1. Export `TF_VAR_environment_suffix="${ENVIRONMENT_SUFFIX}"` before calling terraform
2. Or pass `-var="environment_suffix=${ENVIRONMENT_SUFFIX}"` to all terraform commands

Currently, the scripts set `ENVIRONMENT_SUFFIX` but don't convert it to the Terraform format.
