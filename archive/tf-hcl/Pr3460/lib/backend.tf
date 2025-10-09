# backend.tf# backend.tf

# Terraform backend configuration for state management# Terraform backend configuration for state management

# Note: Real credentials should never be committed to version control# Note: Real credentials should never be committed to version control

# Using local backend for testing# Using local backend for testing





# Workspaces for managing migration phases
# Create workspaces: terraform workspace new <workspace-name>
# - source: for us-west-1 state import
# - target: for us-west-2 deployment
# - migration: for dual-region validation

# Notes for migration:
# 1. Store us-west-1 state in: serverless-app/us-west-1/terraform.tfstate
# 2. Store us-west-2 state in: serverless-app/us-west-2/terraform.tfstate
# 3. Use separate workspaces or state keys to maintain both region states during migration
# 4. After successful cutover, retire us-west-1 state file
# - target: for us-west-2 deployment
# - migration: for dual-region validation

# Notes for migration:
# 1. Store us-west-1 state in: serverless-app/us-west-1/terraform.tfstate
# 2. Store us-west-2 state in: serverless-app/us-west-2/terraform.tfstate
# 3. Use separate workspaces or state keys to maintain both region states during migration
# 4. After successful cutover, retire us-west-1 state file
