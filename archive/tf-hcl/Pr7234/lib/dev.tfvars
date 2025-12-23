# dev.tfvars - Development Environment Configuration for us-east-1
# Usage: terraform workspace select us-east-1 && terraform apply -var-file="dev.tfvars"

# ================================
# REGION CONFIGURATION
# ================================

aws_region         = "us-east-1"
environment_suffix = "dev"

# ================================
# TAGGING CONFIGURATION
# ================================

repository    = "iac-test-automations"
commit_author = "terraform"
pr_number     = "dev"
team          = "trading-platform"
