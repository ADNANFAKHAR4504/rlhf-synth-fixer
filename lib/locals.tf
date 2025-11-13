data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "region-name"
    values = [var.aws_region]
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}-${var.environment_suffix}"

  common_tags = {
    Project           = var.project_name
    Environment       = var.environment
    EnvironmentSuffix = var.environment_suffix
    ManagedBy         = "terraform"
    Stack             = "ecommerce-${var.environment}-${var.environment_suffix}"
  }

  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)

  vpc_cidr = "10.0.0.0/16"

  public_subnet_cidrs = [
    for index in range(3) : cidrsubnet(local.vpc_cidr, 8, index)
  ]

  private_subnet_cidrs = [
    for index in range(3) : cidrsubnet(local.vpc_cidr, 8, index + 10)
  ]

  container_name = "${local.name_prefix}-app"
  container_port = 3000

  log_group_name = "/ecs/${local.name_prefix}"

  fqdn = var.enable_route53 && var.route53_record_name != "" && var.route53_hosted_zone_name != "" ? var.route53_record_name : ""

  ssm_parameter_names = [
    for key in keys(var.ssm_parameters) : "/${local.name_prefix}/${key}"
  ]
}