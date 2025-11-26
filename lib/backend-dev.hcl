bucket         = "payment-processing-terraform-state-dev"
key            = "dev/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "payment-processing-terraform-locks-dev"
