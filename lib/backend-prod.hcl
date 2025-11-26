bucket         = "payment-processing-terraform-state-prod"
key            = "prod/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "payment-processing-terraform-locks-prod"
