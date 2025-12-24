bucket         = "terraform-state-payment-prod"
key            = "payment/prod/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks-payment-prod"
