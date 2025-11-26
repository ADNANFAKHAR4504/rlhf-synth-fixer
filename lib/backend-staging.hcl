bucket         = "payment-processing-terraform-state-staging"
key            = "staging/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "payment-processing-terraform-locks-staging"
