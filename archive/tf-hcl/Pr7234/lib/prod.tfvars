# prod.tfvars - Production Environment Configuration for ap-southeast-1
# Usage: terraform workspace select ap-southeast-1 && terraform apply -var-file="prod.tfvars"

# ================================
# REGION CONFIGURATION
# ================================

aws_region         = "ap-southeast-1"
environment_suffix = "prod"

# ================================
# TAGGING CONFIGURATION
# ================================

repository    = "iac-test-automations"
commit_author = "terraform"
pr_number     = "prod"
team          = "trading-platform"
