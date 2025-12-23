terraform {
  backend "s3" {
    bucket         = "terraform-state-multi-env-infra-synth101912358"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks-multi-env-infra-synth101912358"
    encrypt        = true
  }
}
