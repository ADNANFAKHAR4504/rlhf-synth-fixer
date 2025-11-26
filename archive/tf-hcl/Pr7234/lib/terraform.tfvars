# terraform.tfvars - Default Configuration
# This file is automatically loaded by Terraform

# ================================
# DEFAULT REGION CONFIGURATION
# ================================

aws_region         = "us-east-1"
environment_suffix = "dev"

# ================================
# TAGGING CONFIGURATION
# ================================

repository    = "iac-test-automations"
commit_author = "terraform"
pr_number     = "default"
team          = "trading-platform"
