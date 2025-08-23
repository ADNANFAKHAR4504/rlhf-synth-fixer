bucket         = "terraform-state-291686"
key            = "environments/dev/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-locks"
encrypt        = true
kms_key_id     = "alias/terraform-state-key"
