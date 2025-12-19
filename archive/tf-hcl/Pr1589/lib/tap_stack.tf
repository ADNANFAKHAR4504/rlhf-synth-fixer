# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
}

# Locals
locals {
  common_tags = merge({
    Project     = var.project_name
    Environment = var.environment_name
    ManagedBy   = "Terraform"
  }, var.tags)

  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  public_subnets = {
    for i, az in local.azs : az => {
      cidr = cidrsubnet("10.0.0.0/16", 8, i)
      az   = az
    }
  }

  private_subnets = {
    for i, az in local.azs : az => {
      cidr = cidrsubnet("10.0.0.0/16", 8, i + 10)
      az   = az
    }
  }
}

# S3 Module
module "s3" {
  source             = "./modules/s3"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  common_tags        = local.common_tags
}

# Network Module
module "network" {
  source             = "./modules/network"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  common_tags        = local.common_tags
  azs                = local.azs
}

# IAM Module
module "iam" {
  source                   = "./modules/iam"
  project_name             = var.project_name
  environment_suffix       = var.environment_suffix
  common_tags              = local.common_tags
  enable_vpc_flow_logs     = var.enable_vpc_flow_logs
  cloudtrail_log_group_arn = module.logging.cloudtrail_log_group_arn
}

# Logging Module (includes CloudTrail and VPC Flow Logs)
module "logging" {
  source               = "./modules/logging"
  project_name         = var.project_name
  environment_suffix   = var.environment_suffix
  common_tags          = local.common_tags
  enable_vpc_flow_logs = var.enable_vpc_flow_logs
  enable_cloudtrail    = var.enable_cloudtrail
  aws_region           = var.aws_region
  logging_bucket_name  = module.s3.logging_bucket_name
  logging_bucket_id    = module.s3.logging_bucket_id
  logging_bucket_arn   = module.s3.logging_bucket_arn
  cloudtrail_role_arn  = module.iam.cloudtrail_role_arn
  vpc_id               = module.network.vpc_id
  vpc_flow_role_arn    = module.iam.vpc_flow_role_arn
}

# Compute Module
module "compute" {
  source                    = "./modules/compute"
  project_name              = var.project_name
  environment_suffix        = var.environment_suffix
  common_tags               = local.common_tags
  vpc_id                    = module.network.vpc_id
  private_subnet_ids        = module.network.private_subnet_ids
  instance_type             = var.instance_type
  allowed_ssh_cidrs         = var.allowed_ssh_cidrs
  ec2_instance_profile_name = module.iam.ec2_instance_profile_name
  ami_id                    = data.aws_ssm_parameter.al2023_ami.value
}

# Alerts Module (SNS Topic and Subscriptions)
module "alerts" {
  source             = "./modules/alerts"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  notification_email = var.notification_email
  common_tags        = local.common_tags
}

# Monitoring Module (CloudWatch Alarms and Metric Filters)
module "monitoring" {
  source                    = "./modules/monitoring"
  project_name              = var.project_name
  environment_name          = var.environment_name
  environment_suffix        = var.environment_suffix
  cloudtrail_log_group_name = module.logging.cloudtrail_log_group_name
  sns_topic_arn             = module.alerts.sns_topic_arn
  common_tags               = local.common_tags
}

# Lambda Module (Auto-remediation)
module "lambda" {
  source             = "./modules/lambda"
  project_name       = var.project_name
  environment_suffix = var.environment_suffix
  common_tags        = local.common_tags
  lambda_role_arn    = module.iam.lambda_role_arn
}

# Outputs
output "vpc_id" {
  value = module.network.vpc_id
}

output "public_subnet_ids" {
  value = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.network.private_subnet_ids
}

output "nat_gateway_ids" {
  value = module.network.nat_gateway_ids
}

output "asg_name" {
  value = module.compute.asg_name
}

output "data_bucket_name" {
  value = module.s3.data_bucket_name
}

output "logging_bucket_name" {
  value = module.s3.logging_bucket_name
}

output "cloudtrail_name" {
  value = module.logging.cloudtrail_name
}

output "cloudtrail_log_group_arn" {
  value = module.logging.cloudtrail_log_group_arn
}

output "vpc_flow_log_group_arn" {
  value = module.logging.vpc_flow_log_group_arn
}

output "sns_topic_arn" {
  value = module.alerts.sns_topic_arn
}

output "lambda_function_name" {
  value = module.lambda.lambda_function_name
}

output "lambda_function_arn" {
  value = module.lambda.lambda_function_arn
}