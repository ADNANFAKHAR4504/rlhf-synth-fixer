########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

locals {
    env = terraform.workspace

    aws_profile = {
        default =  "default"
        staging = "staging"
        production = "prod"
    }

}

