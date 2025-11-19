# Primary region provider (us-east-1)
provider "aws" {
  alias  = "primary"
  region = "us-east-1"

  default_tags {
    tags = {
      Environment = "DR"
      Region      = "primary"
      CostCenter  = "payments"
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary region provider (us-west-2)
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"

  default_tags {
    tags = {
      Environment = "DR"
      Region      = "secondary"
      CostCenter  = "payments"
      ManagedBy   = "Terraform"
    }
  }
}

# Primary region VPC module
module "vpc_primary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  region_name        = "primary"
  vpc_cidr           = "10.0.0.0/16"
  private_subnets = [
    "10.0.1.0/24",
    "10.0.2.0/24",
    "10.0.3.0/24"
  ]
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# Secondary region VPC module
module "vpc_secondary" {
  source = "./modules/vpc"

  providers = {
    aws = aws.secondary
  }

  environment_suffix = var.environment_suffix
  region_name        = "secondary"
  vpc_cidr           = "10.1.0.0/16"
  private_subnets = [
    "10.1.1.0/24",
    "10.1.2.0/24",
    "10.1.3.0/24"
  ]
  availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

# VPC Peering Connection
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider = aws.primary

  vpc_id      = module.vpc_primary.vpc_id
  peer_vpc_id = module.vpc_secondary.vpc_id
  peer_region = "us-west-2"
  auto_accept = false

  tags = {
    Name = "dr-payment-vpc-peering-${var.environment_suffix}"
  }
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider = aws.secondary

  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = {
    Name = "dr-payment-vpc-peering-accepter-${var.environment_suffix}"
  }
}

# Aurora Global Database
module "aurora_global" {
  source = "./modules/aurora-global"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  environment_suffix        = var.environment_suffix
  global_cluster_identifier = "payment-dr-global-cluster-${var.environment_suffix}"
  engine                    = "aurora-postgresql"
  engine_version            = "13.7"
  database_name             = "payments"
  master_username           = var.master_username
  master_password           = var.master_password

  # Primary cluster configuration
  primary_cluster_identifier = "payment-primary-cluster-${var.environment_suffix}"
  primary_instance_class     = "db.r5.large"
  primary_instance_count     = 2
  primary_subnet_ids         = module.vpc_primary.private_subnet_ids
  primary_security_group_id  = module.vpc_primary.aurora_security_group_id

  # Secondary cluster configuration
  secondary_cluster_identifier = "payment-secondary-cluster-${var.environment_suffix}"
  secondary_instance_class     = "db.r5.large"
  secondary_instance_count     = 1
  secondary_subnet_ids         = module.vpc_secondary.private_subnet_ids
  secondary_security_group_id  = module.vpc_secondary.aurora_security_group_id

  backup_retention_period = 7
  preferred_backup_window = "03:00-04:00"
}

# DynamoDB Global Table
module "dynamodb_global" {
  source = "./modules/dynamodb-global"

  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }

  environment_suffix = var.environment_suffix
  table_name         = "payment-sessions-${var.environment_suffix}"
  billing_mode       = "PAY_PER_REQUEST"
  hash_key           = "session_id"

  attributes = [
    {
      name = "session_id"
      type = "S"
    }
  ]

  replica_regions = ["us-east-1", "us-west-2"]
}

# IAM role for Lambda
module "lambda_iam_role" {
  source = "./modules/iam-lambda-role"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  role_name          = "payment-processor-lambda-role-${var.environment_suffix}"
  dynamodb_table_arn = module.dynamodb_global.table_arn
  aurora_cluster_arns = [
    module.aurora_global.primary_cluster_arn,
    module.aurora_global.secondary_cluster_arn
  ]
}

# Lambda functions in primary region
module "lambda_primary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  function_name      = "payment-webhook-processor-primary-${var.environment_suffix}"
  handler            = "index.handler"
  runtime            = "nodejs18.x"
  memory_size        = 1024
  timeout            = 30

  source_path = "${path.module}/lambda/payment-processor"

  subnet_ids         = module.vpc_primary.private_subnet_ids
  security_group_ids = [module.vpc_primary.lambda_security_group_id]
  iam_role_arn       = module.lambda_iam_role.role_arn

  environment_variables = {
    AURORA_ENDPOINT     = module.aurora_global.primary_cluster_endpoint
    DYNAMODB_TABLE_NAME = module.dynamodb_global.table_name
    AWS_REGION          = "us-east-1"
  }
}

# Lambda functions in secondary region
module "lambda_secondary" {
  source = "./modules/lambda"

  providers = {
    aws = aws.secondary
  }

  environment_suffix = var.environment_suffix
  function_name      = "payment-webhook-processor-secondary-${var.environment_suffix}"
  handler            = "index.handler"
  runtime            = "nodejs18.x"
  memory_size        = 1024
  timeout            = 30

  source_path = "${path.module}/lambda/payment-processor"

  subnet_ids         = module.vpc_secondary.private_subnet_ids
  security_group_ids = [module.vpc_secondary.lambda_security_group_id]
  iam_role_arn       = module.lambda_iam_role.role_arn

  environment_variables = {
    AURORA_ENDPOINT     = module.aurora_global.secondary_cluster_endpoint
    DYNAMODB_TABLE_NAME = module.dynamodb_global.table_name
    AWS_REGION          = "us-west-2"
  }
}

# Route 53 Health Checks and Failover
module "route53_failover" {
  source = "./modules/route53"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  domain_name        = "payments-${var.environment_suffix}.example.com"

  primary_endpoint   = module.lambda_primary.function_url
  secondary_endpoint = module.lambda_secondary.function_url

  health_check_interval = 30
  health_check_timeout  = 10
  failure_threshold     = 3
}

# CloudWatch Alarms for primary Aurora cluster
module "cloudwatch_primary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.primary
  }

  environment_suffix = var.environment_suffix
  cluster_identifier = module.aurora_global.primary_cluster_id
  alarm_prefix       = "dr-payment-primary-${var.environment_suffix}"
  region_name        = "primary"

  sns_topic_name  = "dr-payment-alerts-primary-${var.environment_suffix}"
  email_endpoints = var.alert_email_addresses
}

# CloudWatch Alarms for secondary Aurora cluster
module "cloudwatch_secondary" {
  source = "./modules/cloudwatch"

  providers = {
    aws = aws.secondary
  }

  environment_suffix = var.environment_suffix
  cluster_identifier = module.aurora_global.secondary_cluster_id
  alarm_prefix       = "dr-payment-secondary-${var.environment_suffix}"
  region_name        = "secondary"

  sns_topic_name  = "dr-payment-alerts-secondary-${var.environment_suffix}"
  email_endpoints = var.alert_email_addresses
}
