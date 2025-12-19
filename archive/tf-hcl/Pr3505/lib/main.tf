# Provider configuration is in provider.tf

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.id

  # Use environment suffix if provided, otherwise generate one based on task ID
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : "synth24816359"
  # Shorten the resource prefix to avoid hitting AWS naming limits
  resource_prefix = "wh-${local.env_suffix}"

  common_tags = merge(
    var.tags,
    {
      Terraform         = "true"
      AccountId         = local.account_id
      Region            = local.region
      EnvironmentSuffix = local.env_suffix
    }
  )
}