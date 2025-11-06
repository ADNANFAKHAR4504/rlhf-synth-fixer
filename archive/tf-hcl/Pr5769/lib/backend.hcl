bucket         = "iac-test-terraform-state-synth-101000822"
key            = "synth-101000822/terraform.tfstate"
region         = "us-east-1"
encrypt        = true
dynamodb_table = "terraform-state-lock"
