### Reasoning Trace
---

This is a complex multi-region ticketing marketplace system that requires careful planning. Let me break down the requirements:

1. **Files to generate**:
   - provider.tf: AWS providers for multiple regions and backend
   - tap-stack.tf: All AWS resources

2. **Key Components**:
   - API Gateway (45k requests/min)
   - Lambda functions for:
     - DynamoDB distributed locks (12 regions, <50ms)
     - DynamoDB global tables updates
     - ElastiCache Redis updates (234k seats in <3s)
     - Kinesis streaming
     - Overselling detection
   - DynamoDB Global Tables (cross-region replication <2s)
   - ElastiCache Redis clusters
   - Kinesis streams
   - Aurora for analytics
   - EventBridge rules (every 10s)
   - Step Functions for verification (<8s)
   - Timestream for auditing
   - IAM roles and permissions

3. **Architecture Considerations**:
   - Multi-region deployment (primary and secondary)
   - Zero overselling tolerance
   - High performance requirements
   - Distributed locking mechanism
   - Global tables for consistency
   - Event-driven architecture

Let me structure the Terraform code:

**provider.tf**:
- AWS providers for multiple regions (us-east-1 as primary, us-west-2 as secondary)
- S3 backend for state management

**tap-stack.tf**:
- DynamoDB Global Tables
- Lambda functions with proper IAM roles
- API Gateway with Lambda integrations
- ElastiCache Redis clusters
- Kinesis streams
- Aurora clusters
- EventBridge rules
- Step Functions
- Timestream database
- All necessary IAM roles and policies

I need to ensure:
- Proper dependencies between resources
- Correct IAM permissions
- Multi-region resources where needed
- Production-ready configurations (scaling, monitoring, etc.)
### Answer 
---

```hcl
# provider.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "tap-marketplace-terraform-state"
    key            = "global/tap-stack/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tap-marketplace-terraform-locks"
    encrypt        = true
  }
}
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}
provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}
provider "aws" {
  alias  = "eu_west_1"
  region = "eu-west-1"
}
provider "aws" {
  alias  = "ap_southeast_1"
  region = "ap-southeast-1"
}
provider "aws" {
  alias  = "us_east_2"
  region = "us-east-2"
}
provider "aws" {
  alias  = "us_west_1"
  region = "us-west-1"
}
provider "aws" {
  alias  = "eu_central_1"
  region = "eu-central-1"
}
provider "aws" {
  alias  = "ap_northeast_1"
  region = "ap-northeast-1"
}
provider "aws" {
  alias  = "ca_central_1"
  region = "ca-central-1"
}
provider "aws" {
  alias  = "sa_east_1"
  region = "sa-east-1"
}
provider "aws" {
  alias  = "ap_south_1"
  region = "ap-south-1"
}
provider "aws" {
  alias  = "eu_north_1"
  region = "eu-north-1"
}
```

```hcl
# tap-stack.tf
locals {
  app_name = "tap-marketplace"
  regions = [
    "us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1",
    "us-east-2", "us-west-1", "eu-central-1", "ap-northeast-1",
    "ca-central-1", "sa-east-1", "ap-south-1", "eu-north-1"
  ]
  primary_region = "us-east-1"
  secondary_region = "us-west-2"
}
# DynamoDB Global Tables
resource "aws_dynamodb_table" "ticket_inventory" {
  provider = aws.primary
  
  name             = "${local.app_name}-ticket-inventory"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "event_id"
  range_key        = "seat_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "event_id"
    type = "S"
  }
  
  attribute {
    name = "seat_id"
    type = "S"
  }
  
  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    projection_type = "ALL"
  }
  
  attribute {
    name = "status"
    type = "S"
  }
  
  replica {
    region_name = "us-west-2"
  }
  
  replica {
    region_name = "eu-west-1"
  }
  
  replica {
    region_name = "ap-southeast-1"
  }
  
  replica {
    region_name = "us-east-2"
  }
  
  replica {
    region_name = "us-west-1"
  }
  
  replica {
    region_name = "eu-central-1"
  }
  
  replica {
    region_name = "ap-northeast-1"
  }
  
  replica {
    region_name = "ca-central-1"
  }
  
  replica {
    region_name = "sa-east-1"
  }
  
  replica {
    region_name = "ap-south-1"
  }
  
  replica {
    region_name = "eu-north-1"
  }
  
  tags = {
    Name = "${local.app_name}-ticket-inventory"
  }
}
resource "aws_dynamodb_table" "distributed_locks" {
  provider = aws.primary
  
  name             = "${local.app_name}-distributed-locks"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "lock_key"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "lock_key"
    type = "S"
  }
  
  ttl {
    enabled        = true
    attribute_name = "expiry_time"
  }
  
  replica {
    region_name = "us-west-2"
  }
  
  replica {
    region_name = "eu-west-1"
  }
  
  replica {
    region_name = "ap-southeast-1"
  }
  
  replica {
    region_name = "us-east-2"
  }
  
  replica {
    region_name = "us-west-1"
  }
  
  replica {
    region_name = "eu-central-1"
  }
  
  replica {
    region_name = "ap-northeast-1"
  }
  
  replica {
    region_name = "ca-central-1"
  }
  
  replica {
    region_name = "sa-east-1"
  }
  
  replica {
    region_name = "ap-south-1"
  }
  
  replica {
    region_name = "eu-north-1"
  }
  
  tags = {
    Name = "${local.app_name}-distributed-locks"
  }
}
# IAM Roles
resource "aws_iam_role" "lambda_execution_role" {
  provider = aws.primary
  
  name = "${local.app_name}-lambda-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}
resource "aws_iam_role_policy" "lambda_policy" {
  provider = aws.primary
  
  name = "${local.app_name}-lambda-policy"
  role = aws_iam_role.lambda_execution_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:TransactWriteItems",
          "dynamodb:TransactGetItems"
        ]
        Resource = [
          aws_dynamodb_table.ticket_inventory.arn,
          "${aws_dynamodb_table.ticket_inventory.arn}/*",
          aws_dynamodb_table.distributed_locks.arn,
          "${aws_dynamodb_table.distributed_locks.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:*",
          "kinesis:PutRecord",
          "kinesis:PutRecords",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  provider = aws.primary
  
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
# VPC Configuration
resource "aws_vpc" "main" {
  provider = aws.primary
  
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${local.app_name}-vpc"
  }
}
resource "aws_subnet" "private_a" {
  provider = aws.primary
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    Name = "${local.app_name}-private-subnet-a"
  }
}
resource "aws_subnet" "private_b" {
  provider = aws.primary
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = {
    Name = "${local.app_name}-private-subnet-b"
  }
}
resource "aws_security_group" "lambda_sg" {
  provider = aws.primary
  
  name        = "${local.app_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${local.app_name}-lambda-sg"
  }
}
resource "aws_security_group" "redis_sg" {
  provider = aws.primary
  
  name        = "${local.app_name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${local.app_name}-redis-sg"
  }
}
# ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis" {
  provider = aws.primary
  
  name       = "${local.app_name}-redis-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}
resource "aws_elasticache_replication_group" "redis" {
  provider = aws.primary
  
  replication_group_id       = "${local.app_name}-redis"
  description                = "Redis cluster for seat availability"
  engine                     = "redis"
  node_type                  = "cache.r7g.xlarge"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis_sg.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true
  num_cache_clusters         = 3
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Name = "${local.app_name}-redis"
  }
}
# Lambda Functions
resource "aws_lambda_function" "ticket_purchase" {
  provider = aws.primary
  
  filename         = "lambda_functions.zip"
  function_name    = "${local.app_name}-ticket-purchase"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.ticketPurchaseHandler"
  source_code_hash = filebase64sha256("lambda_functions.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 3008
  reserved_concurrent_executions = 2000
  
  environment {
    variables = {
      INVENTORY_TABLE = aws_dynamodb_table.ticket_inventory.name
      LOCKS_TABLE     = aws_dynamodb_table.distributed_locks.name
      REDIS_ENDPOINT  = aws_elasticache_replication_group.redis.primary_endpoint_address
      KINESIS_STREAM  = aws_kinesis_stream.ticket_sales.name
    }
  }
  
  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
  
  tracing_config {
    mode = "Active"
  }
}
resource "aws_lambda_function" "inventory_verifier" {
  provider = aws.primary
  
  filename         = "lambda_functions.zip"
  function_name    = "${local.app_name}-inventory-verifier"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.inventoryVerifierHandler"
  source_code_hash = filebase64sha256("lambda_functions.zip")
  runtime         = "nodejs18.x"
  timeout         = 60
  memory_size     = 1024
  
  environment {
    variables = {
      INVENTORY_TABLE = aws_dynamodb_table.ticket_inventory.name
    }
  }
}
resource "aws_lambda_function" "kinesis_processor" {
  provider = aws.primary
  
  filename         = "lambda_functions.zip"
  function_name    = "${local.app_name}-kinesis-processor"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.kinesisProcessorHandler"
  source_code_hash = filebase64sha256("lambda_functions.zip")
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 512
  
  environment {
    variables = {
      AURORA_ENDPOINT = aws_rds_cluster.analytics.endpoint
    }
  }
}
# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  provider = aws.primary
  
  name        = "${local.app_name}-api"
  description = "Ticketing marketplace API"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}
resource "aws_api_gateway_resource" "tickets" {
  provider = aws.primary
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "tickets"
}
resource "aws_api_gateway_method" "purchase" {
  provider = aws.primary
  
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.tickets.id
  http_method   = "POST"
  authorization = "NONE"
}
resource "aws_api_gateway_integration" "lambda_integration" {
  provider = aws.primary
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.tickets.id
  http_method = aws_api_gateway_method.purchase.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.ticket_purchase.invoke_arn
}
resource "aws_api_gateway_deployment" "main" {
  provider = aws.primary
  
  rest_api_id = aws_api_gateway_rest_api.main.id
  
  triggers = {
    redeployment = sha1(jsonencode({
      resource   = aws_api_gateway_resource.tickets.id
      method     = aws_api_gateway_method.purchase.id
      integration = aws_api_gateway_integration.lambda_integration.id
    }))
  }
  
  lifecycle {
    create_before_destroy = true
  }
}
resource "aws_api_gateway_stage" "prod" {
  provider = aws.primary
  
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "prod"
  
  xray_tracing_enabled = true
}
resource "aws_lambda_permission" "api_gateway" {
  provider = aws.primary
  
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ticket_purchase.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
# Kinesis Stream
resource "aws_kinesis_stream" "ticket_sales" {
  provider = aws.primary
  
  name                = "${local.app_name}-ticket-sales"
  shard_count         = 10
  retention_period    = 24
  encryption_type     = "KMS"
  kms_key_id          = "alias/aws/kinesis"
  
  stream_mode_details {
    stream_mode = "PROVISIONED"
  }
  
  tags = {
    Name = "${local.app_name}-ticket-sales"
  }
}
resource "aws_lambda_event_source_mapping" "kinesis_trigger" {
  provider = aws.primary
  
  event_source_arn  = aws_kinesis_stream.ticket_sales.arn
  function_name     = aws_lambda_function.kinesis_processor.arn
  starting_position = "LATEST"
  parallelization_factor = 10
  maximum_batching_window_in_seconds = 1
}
# Aurora Database
resource "aws_db_subnet_group" "aurora" {
  provider = aws.primary
  
  name       = "${local.app_name}-aurora-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
  
  tags = {
    Name = "${local.app_name}-aurora-subnet-group"
  }
}
resource "aws_security_group" "aurora_sg" {
  provider = aws.primary
  
  name        = "${local.app_name}-aurora-sg"
  description = "Security group for Aurora database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${local.app_name}-aurora-sg"
  }
}
resource "aws_rds_cluster" "analytics" {
  provider = aws.primary
  
  cluster_identifier      = "${local.app_name}-analytics"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "analytics"
  master_username         = "admin"
  master_password         = "ChangeMeInProduction123!"
  db_subnet_group_name    = aws_db_subnet_group.aurora.name
  vpc_security_group_ids  = [aws_security_group.aurora_sg.id]
  storage_encrypted       = true
  
  tags = {
    Name = "${local.app_name}-analytics"
  }
}
resource "aws_rds_cluster_instance" "analytics" {
  provider = aws.primary
  count    = 2
  
  identifier         = "${local.app_name}-analytics-${count.index}"
  cluster_identifier = aws_rds_cluster.analytics.id
  instance_class     = "db.r6g.large"
  engine             = aws_rds_cluster.analytics.engine
  engine_version     = aws_rds_cluster.analytics.engine_version
}
# Step Functions
resource "aws_iam_role" "step_functions_role" {
  provider = aws.primary
  
  name = "${local.app_name}-step-functions-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })
}
resource "aws_iam_role_policy" "step_functions_policy" {
  provider = aws.primary
  
  name = "${local.app_name}-step-functions-policy"
  role = aws_iam_role.step_functions_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "timestream:WriteRecords",
          "timestream:DescribeEndpoints"
        ]
        Resource = "*"
      }
    ]
  })
}
resource "aws_sfn_state_machine" "inventory_verification" {
  provider = aws.primary
  
  name     = "${local.app_name}-inventory-verification"
  role_arn = aws_iam_role.step_functions_role.arn
  
  definition = jsonencode({
    Comment = "Inventory verification workflow"
    StartAt = "VerifyInventory"
    States = {
      VerifyInventory = {
        Type     = "Task"
        Resource = aws_lambda_function.inventory_verifier.arn
        Next     = "CheckForOverselling"
      }
      CheckForOverselling = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.overselling_detected"
            BooleanEquals = true
            Next          = "TriggerCorrections"
          }
        ]
        Default = "AuditResults"
      }
      TriggerCorrections = {
        Type = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.inventory_verifier.arn
          Payload = {
            "action" = "correct_overselling"
            "data.$" = "$"
          }
        }
        Next = "AuditResults"
      }
      AuditResults = {
        Type = "Task"
        Resource = "arn:aws:states:::aws-sdk:timestreamwrite:writeRecords"
        Parameters = {
          DatabaseName = aws_timestreamwrite_database.audit.database_name
          TableName    = aws_timestreamwrite_table.corrections.table_name
          Records = [{
            Time       = "$$.State.EnteredTime"
            TimeUnit   = "MILLISECONDS"
            Dimensions = []
            MeasureName = "audit_record"
            MeasureValue = "$"
            MeasureValueType = "VARCHAR"
          }]
        }
        End = true
      }
    }
  })
}
# EventBridge Rules
resource "aws_iam_role" "eventbridge_role" {
  provider = aws.primary
  
  name = "${local.app_name}-eventbridge-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
}
resource "aws_iam_role_policy" "eventbridge_policy" {
  provider = aws.primary
  
  name = "${local.app_name}-eventbridge-policy"
  role = aws_iam_role.eventbridge_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.inventory_verification.arn
      }
    ]
  })
}
resource "aws_cloudwatch_event_rule" "inventory_check" {
  provider = aws.primary
  
  name                = "${local.app_name}-inventory-check"
  description         = "Trigger inventory verification every 10 seconds"
  schedule_expression = "rate(10 seconds)"
}
resource "aws_cloudwatch_event_target" "step_function" {
  provider = aws.primary
  
  rule      = aws_cloudwatch_event_rule.inventory_check.name
  target_id = "StepFunctionTarget"
  arn       = aws_sfn_state_machine.inventory_verification.arn
  role_arn  = aws_iam_role.eventbridge_role.arn
}
# Timestream Database
resource "aws_timestreamwrite_database" "audit" {
  provider = aws.primary
  
  database_name = "${local.app_name}-audit"
  
  tags = {
    Name = "${local.app_name}-audit"
  }
}
resource "aws_timestreamwrite_table" "corrections" {
  provider = aws.primary
  
  database_name = aws_timestreamwrite_database.audit.database_name
  table_name    = "corrections"
  
  retention_properties {
    magnetic_store_retention_period_in_days = 30
    memory_store_retention_period_in_hours  = 24
  }
  
  tags = {
    Name = "${local.app_name}-corrections"
  }
}
# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  provider = aws.primary
  
  for_each = {
    ticket_purchase    = aws_lambda_function.ticket_purchase.function_name
    inventory_verifier = aws_lambda_function.inventory_verifier.function_name
    kinesis_processor  = aws_lambda_function.kinesis_processor.function_name
  }
  
  name              = "/aws/lambda/${each.value}"
  retention_in_days = 7
}
# Secondary region resources
resource "aws_vpc" "secondary" {
  provider = aws.secondary
  
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${local.app_name}-vpc-secondary"
  }
}
resource "aws_subnet" "secondary_private_a" {
  provider = aws.secondary
  
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.1.0/24"
  availability_zone = "us-west-2a"
  
  tags = {
    Name = "${local.app_name}-private-subnet-a-secondary"
  }
}
resource "aws_subnet" "secondary_private_b" {
  provider = aws.secondary
  
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = "us-west-2b"
  
  tags = {
    Name = "${local.app_name}-private-subnet-b-secondary"
  }
}
resource "aws_elasticache_subnet_group" "redis_secondary" {
  provider = aws.secondary
  
  name       = "${local.app_name}-redis-subnet-group"
  subnet_ids = [aws_subnet.secondary_private_a.id, aws_subnet.secondary_private_b.id]
}
resource "aws_security_group" "redis_sg_secondary" {
  provider = aws.secondary
  
  name        = "${local.app_name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "${local.app_name}-redis-sg"
  }
}
resource "aws_elasticache_replication_group" "redis_secondary" {
  provider = aws.secondary
  
  replication_group_id       = "${local.app_name}-redis"
  description                = "Redis cluster for seat availability"
  engine                     = "redis"
  node_type                  = "cache.r7g.xlarge"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis_secondary.name
  security_group_ids         = [aws_security_group.redis_sg_secondary.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true
  num_cache_clusters         = 3
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Name = "${local.app_name}-redis"
  }
}
```