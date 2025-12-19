terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Create KMS keys for encryption
resource "aws_kms_key" "main" {
  description             = "${local.name_prefix} encryption key"
  deletion_window_in_days = local.is_production ? 30 : 7
  enable_key_rotation     = true

  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}"
  target_key_id = aws_kms_key.main.key_id
}

# Networking
module "networking" {
  source = "./modules/networking"

  name_prefix     = local.name_prefix
  vpc_cidr        = "10.0.0.0/16"
  enable_multi_az = local.is_production || var.enable_multi_az
  tags            = local.common_tags
}

# DynamoDB Global Tables
module "dynamodb" {
  source = "./modules/dynamodb"

  name_prefix      = local.name_prefix
  replica_regions  = var.replica_regions
  is_production    = local.is_production
  kms_key_arn      = aws_kms_key.main.arn
  replica_kms_keys = { for region in var.replica_regions : region => aws_kms_key.main.arn }
  tags             = local.common_tags
}

# SNS and SQS
module "sns_sqs" {
  source = "./modules/sns_sqs"

  name_prefix         = local.name_prefix
  microservices_count = local.max_sqs_queues_per_region
  kms_key_id          = aws_kms_key.main.id
  lambda_functions    = module.lambda.cache_updater_arns
  tags                = local.common_tags
}

# Lambda Functions
module "lambda" {
  source = "./modules/lambda"

  name_prefix                      = local.name_prefix
  environment                      = var.environment
  microservices_count              = local.max_sqs_queues_per_region
  business_rules_count             = var.business_rules_count
  subnet_ids                       = module.networking.private_subnet_ids
  security_group_ids               = [module.networking.lambda_sg_id]
  dynamodb_stream_arn              = module.dynamodb.stream_arn
  dynamodb_table_name              = module.dynamodb.table_name
  sns_topic_arn                    = module.sns_sqs.topic_arn
  redis_endpoint                   = module.elasticache.endpoint
  opensearch_endpoint              = module.opensearch.endpoint
  dlq_arn                          = module.sns_sqs.dlq_arns[0]
  validator_package_path           = "${path.module}/lambda/validator.zip"
  cache_updater_package_path       = "${path.module}/lambda/cache_updater.zip"
  consistency_checker_package_path = "${path.module}/lambda/consistency_checker.zip"
  rollback_package_path            = "${path.module}/lambda/rollback.zip"
  sns_alert_topic_arn              = module.sns_sqs.topic_arn
  kms_key_arn                      = aws_kms_key.main.arn
  is_production                    = local.is_production
  tags                             = local.common_tags
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"

  name_prefix        = local.name_prefix
  subnet_ids         = module.networking.private_subnet_ids
  security_group_ids = [module.networking.elasticache_sg_id]
  enable_multi_az    = local.is_production || var.enable_multi_az
  is_production      = local.is_production
  node_type          = local.is_production ? "cache.r7g.xlarge" : "cache.t4g.micro"
  auth_token         = random_password.redis_auth.result
  sns_topic_arn      = module.sns_sqs.topic_arn
  retention_days     = var.retention_days
  kms_key_arn        = aws_kms_key.main.arn
  tags               = local.common_tags
}

# EventBridge and Step Functions
module "eventbridge" {
  source = "./modules/eventbridge"

  name_prefix             = local.name_prefix
  consistency_checker_arn = module.lambda.consistency_checker_arn
  rollback_arn            = module.lambda.rollback_arn
  sns_alert_topic_arn     = aws_sns_topic.alerts.arn
  retention_days          = var.retention_days
  kms_key_arn             = aws_kms_key.main.arn
  tags                    = local.common_tags
}

# OpenSearch for Auditing
module "opensearch" {
  source = "./modules/opensearch"

  name_prefix        = local.name_prefix
  subnet_ids         = module.networking.private_subnet_ids
  security_group_ids = [module.networking.opensearch_sg_id]
  enable_multi_az    = local.is_production || var.enable_multi_az
  is_production      = local.is_production
  instance_type      = local.is_production ? "r6g.large.search" : "t3.small.search"
  instance_count     = local.is_production ? 3 : 1
  volume_size        = local.is_production ? 100 : 10
  kms_key_id         = aws_kms_key.main.id
  kms_key_arn        = aws_kms_key.main.arn
  master_username    = "admin"
  master_password    = random_password.opensearch_master.result
  retention_days     = var.retention_days
  tags               = local.common_tags
}

# Alert SNS Topic
resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-alerts"
  kms_master_key_id = aws_kms_key.main.id

  tags = local.common_tags
}

# Random passwords
resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "random_password" "opensearch_master" {
  length  = 16
  special = true

  lifecycle {
    ignore_changes = [special]
  }
}

# Store secrets in Parameter Store
resource "aws_ssm_parameter" "redis_auth_token" {
  name   = "/${local.name_prefix}/redis/auth-token"
  type   = "SecureString"
  value  = random_password.redis_auth.result
  key_id = aws_kms_key.main.id

  tags = local.common_tags
}

resource "aws_ssm_parameter" "opensearch_password" {
  name   = "/${local.name_prefix}/opensearch/master-password"
  type   = "SecureString"
  value  = random_password.opensearch_master.result
  key_id = aws_kms_key.main.id

  tags = local.common_tags
}
