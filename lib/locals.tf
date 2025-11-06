locals {
  # Environment-specific naming
  name_prefix = "${var.project_name}-${var.environment_suffix}"

  # Availability zones
  azs = data.aws_availability_zones.available.names

  # Common tags
  common_tags = {
    Environment       = var.environment_suffix
    ManagedBy         = "terraform"
    Project           = var.project_name
    Workspace         = terraform.workspace
    EnvironmentSuffix = var.environment_suffix
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}
