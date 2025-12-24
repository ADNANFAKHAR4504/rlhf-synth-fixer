bucket         = "terraform-state-payment-staging"
key            = "payment/staging/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks-payment-staging"
