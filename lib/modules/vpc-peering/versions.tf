terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source                = "hashicorp/aws"
      version               = ">= 5.0"
      configuration_aliases = [aws.us_east_1, aws.eu_west_1, aws.ap_southeast_1]
    }
  }
}
