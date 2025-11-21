bucket         = "terraform-state-payment-dev"
key            = "payment/dev/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-locks-payment-dev"
