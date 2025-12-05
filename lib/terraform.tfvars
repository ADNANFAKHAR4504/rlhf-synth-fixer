# Terraform variables for deployment
environment_suffix = "synthb5i2v1k5"
aws_region         = "us-east-1"
repository         = "synth-b5i2v1k5"
commit_author      = "mayanksethi-turing"
pr_number          = "pending"
team               = "synth"

# CI/CD Pipeline specific variables
dev_account_id          = "123456789012"
staging_account_id      = "234567890123"
prod_account_id         = "345678901234"
cross_account_role_name = "TerraformDeploymentRole"
notification_emails     = []
repository_branch       = "main"
