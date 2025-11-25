# staging.tfvars - Staging Environment Configuration for eu-west-1
# Usage: terraform workspace select eu-west-1 && terraform apply -var-file="staging.tfvars"

# ================================
# REGION CONFIGURATION
# ================================

aws_region         = "eu-west-1"
environment_suffix = "staging"

# ================================
# TAGGING CONFIGURATION
# ================================

repository    = "iac-test-automations"
commit_author = "terraform"
pr_number     = "staging"
team          = "trading-platform"
