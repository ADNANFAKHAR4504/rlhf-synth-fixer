# Development Environment Configuration
# Deploy with: terraform apply -var-file="dev.tfvars"

environment         = "dev"
cost_center         = "FINTECH-001"
data_classification = "confidential"

# Container Configuration
# PLACEHOLDER: Replace with actual ECR image URL
container_image = "123456789012.dkr.ecr.eu-west-1.amazonaws.com/payment-processor:dev-latest"

# Lambda Configuration  
# PLACEHOLDER: Replace with actual Lambda package path
lambda_source_path = "./lambda.zip"

# Metadata for resource tagging
repository    = "iac-test-automations"
commit_author = "development-team"
pr_number     = "dev-branch"
team          = "payment-infrastructure"

# SSL Certificate Configuration
# PLACEHOLDER: Replace with actual certificate ARN or leave empty to create new
acm_certificate_arn = ""
domain_name         = "dev.payment-api.example.com"