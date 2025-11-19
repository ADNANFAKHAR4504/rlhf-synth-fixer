# Backend configuration for Terraform state
# Uncomment and configure for production use

# terraform {
#   backend "s3" {
#     bucket         = "your-terraform-state-bucket"
#     key            = "security-foundation/terraform.tfstate"
#     region         = "us-east-1"
#     encrypt        = true
#     kms_key_id     = "alias/terraform-state"
#     dynamodb_table = "terraform-state-lock"
#   }
# }
