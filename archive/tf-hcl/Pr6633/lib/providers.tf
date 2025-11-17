# Primary provider for ap-southeast-1
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = merge(
      var.default_tags,
      {
        Environment       = terraform.workspace
        EnvironmentSuffix = var.environment_suffix
        ManagedBy         = "Terraform"
        Workspace         = terraform.workspace
      }
    )
  }
}

# Alias for us-east-1
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = merge(
      var.default_tags,
      {
        Environment       = terraform.workspace
        EnvironmentSuffix = var.environment_suffix
        ManagedBy         = "Terraform"
        Workspace         = terraform.workspace
      }
    )
  }
}

# Alias for us-west-2
provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"

  default_tags {
    tags = merge(
      var.default_tags,
      {
        Environment       = terraform.workspace
        EnvironmentSuffix = var.environment_suffix
        ManagedBy         = "Terraform"
        Workspace         = terraform.workspace
      }
    )
  }
}
