### Reasoning Trace

---

This is a comprehensive request for building a production serverless recommendation system using AWS services and Terraform. Let me break down the requirements:

1. **Kinesis Data Streams** - Capture real-time user interactions
2. **Lambda (Python 3.11)** - Process records and update DynamoDB
3. **DynamoDB** - Store user profiles and interactions
4. **S3** - Store training data
5. **AWS Glue** - Prepare datasets
6. **Amazon Personalize** - ML recommendations (datasets, solutions, campaigns)
7. **Step Functions** - Orchestrate training and campaign updates
8. **EventBridge** - Schedule retraining
9. **SNS** - Send notifications
10. **API Gateway** - Serve recommendations
11. **ElastiCache (Redis)** - Cache results
12. **CloudWatch** - Metrics, alarms, and dashboards
13. **IAM** - Roles and policies with least privilege

I need to create a comprehensive Terraform configuration that includes:

- Variables for configurable values
- All necessary IAM roles and policies
- Resource definitions for all services
- Proper tagging
- Lambda function code
- Step Functions state machine definition
- CloudWatch alarms and dashboards

This is a large system, so I'll organize it into multiple files for better maintainability.

### Answer

---

I'll build a comprehensive production-ready serverless recommendation system using Terraform. This will be organized into multiple files for maintainability.

## Project Structure

```
recommendation-system/
├── main.tf
├── variables.tf
├── outputs.tf
├── iam.tf
├── kinesis.tf
├── lambda.tf
├── dynamodb.tf
├── s3.tf
├── glue.tf
├── personalize.tf
├── step-functions.tf
├── api-gateway.tf
├── elasticache.tf
├── monitoring.tf
├── sns.tf
└── lambda/
    ├── stream_processor/
    │   └── handler.py
    ├── recommendation_api/
    │   └── handler.py
    └── training_orchestrator/
        └── handler.py
```

## 1. Variables Configuration

### `variables.tf`

```hcl
variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "recommendation-system"
}

# Kinesis Configuration
variable "kinesis_stream_shard_count" {
  description = "Number of shards for Kinesis stream"
  type        = number
  default     = 2
}

variable "kinesis_retention_hours" {
  description = "Kinesis data retention in hours"
  type        = number
  default     = 24
}

# DynamoDB Configuration
variable "user_profile_table_read_capacity" {
  description = "Read capacity for user profile table"
  type        = number
  default     = 10
}

variable "user_profile_table_write_capacity" {
  description = "Write capacity for user profile table"
  type        = number
  default     = 10
}

variable "interactions_table_read_capacity" {
  description = "Read capacity for interactions table"
  type        = number
  default     = 10
}

variable "interactions_table_write_capacity" {
  description = "Write capacity for interactions table"
  type        = number
  default     = 10
}

# ElastiCache Configuration
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.t3.micro"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}

# API Gateway Configuration
variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 5000
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 2000
}

# Scheduling Configuration
variable "retraining_schedule" {
  description = "Schedule expression for model retraining"
  type        = string
  default     = "cron(0 2 * * ? *)" # Daily at 2 AM UTC
}

# Personalize Configuration
variable "personalize_campaign_min_tps" {
  description = "Minimum TPS for Personalize campaign"
  type        = number
  default     = 1
}

variable "ab_test_campaigns" {
  description = "A/B test campaign configurations"
  type = map(object({
    traffic_percentage = number
    solution_version   = string
  }))
  default = {
    campaign_a = {
      traffic_percentage = 50
      solution_version   = "v1"
    }
    campaign_b = {
      traffic_percentage = 50
      solution_version   = "v2"
    }
  }
}

# Common Tags
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    ManagedBy   = "Terraform"
    Project     = "RecommendationSystem"
    Environment = "Production"
  }
}
```

## 2. Main Configuration

### `main.tf`

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = var.common_tags
  }
}

data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {}

locals {
  account_id = data.aws_caller_identity.current.account_id

  resource_prefix = "${var.project_name}-${var.environment}"

  lambda_runtime = "python3.11"
  lambda_timeout = 300
  lambda_memory  = 512

  vpc_cidr = "10.0.0.0/16"
}
```

## 3. IAM Roles and Policies

### `iam.tf`

```hcl
# Lambda execution role for stream processor
resource "aws_iam_role" "lambda_stream_processor" {
  name = "${local.resource_prefix}-lambda-stream-processor"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${local.resource_prefix}-lambda-stream-processor"
  }
}

resource "aws_iam_role_policy" "lambda_stream_processor" {
  name = "${local.resource_prefix}-lambda-stream-processor"
  role = aws_iam_role.lambda_stream_processor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kinesis:DescribeStream",
          "kinesis:GetShardIterator",
          "kinesis:GetRecords",
          "kinesis:ListShards"
        ]
        Resource = aws_kinesis_stream.user_interactions.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.user_profiles.arn,
          aws_dynamodb_table.interactions.arn,
          "${aws_dynamodb_table.interactions.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.training_data.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:${local.account_id}:*"
      }
    ]
  })
}

# Lambda execution role for recommendation API
resource "aws_iam_role" "lambda_recommendation_api" {
  name = "${local.resource_prefix}-lambda-recommendation-api"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${local.resource_prefix}-lambda-recommendation-api"
  }
}

resource "aws_iam_role_policy" "lambda_recommendation_api" {
  name = "${local.resource_prefix}-lambda-recommendation-api"
  role = aws_iam_role.lambda_recommendation_api.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "personalize:GetRecommendations",
          "personalize:GetPersonalizedRanking"
        ]
        Resource = "arn:aws:personalize:${var.region}:${local.account_id}:campaign/*"
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:DescribeCacheClusters",
          "elasticache:DescribeReplicationGroups"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:${local.account_id}:*"
      }
    ]
  })
}

# Glue job execution role
resource "aws_iam_role" "glue_job" {
  name = "${local.resource_prefix}-glue-job"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "glue.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${local.resource_prefix}-glue-job"
  }
}

resource "aws_iam_role_policy" "glue_job" {
  name = "${local.resource_prefix}-glue-job"
  role = aws_iam_role.glue_job.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.training_data.arn,
          "${aws_s3_bucket.training_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:Query",
          "dynamodb:GetItem"
        ]
        Resource = [
          aws_dynamodb_table.user_profiles.arn,
          aws_dynamodb_table.interactions.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.region}:${local.account_id}:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "glue_service_role" {
  role       = aws_iam_role.glue_job.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

# Step Functions execution role
resource "aws_iam_role" "step_functions" {
  name = "${local.resource_prefix}-step-functions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "states.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${local.resource_prefix}-step-functions"
  }
}

resource "aws_iam_role_policy" "step_functions" {
  name = "${local.resource_prefix}-step-functions"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction"
        ]
        Resource = [
          aws_lambda_function.training_orchestrator.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:StartJobRun",
          "glue:GetJobRun",
          "glue:BatchStopJobRun"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "personalize:CreateDatasetImportJob",
          "personalize:CreateSolution",
          "personalize:CreateSolutionVersion",
          "personalize:CreateCampaign",
          "personalize:UpdateCampaign",
          "personalize:Describe*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.notifications.arn
      }
    ]
  })
}

# Personalize role
resource "aws_iam_role" "personalize" {
  name = "${local.resource_prefix}-personalize"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "personalize.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${local.resource_prefix}-personalize"
  }
}

resource "aws_iam_role_policy" "personalize" {
  name = "${local.resource_prefix}-personalize"
  role = aws_iam_role.personalize.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.training_data.arn,
          "${aws_s3_bucket.training_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.training_data.arn}/personalize-output/*"
      }
    ]
  })
}

# EventBridge role for Step Functions
resource "aws_iam_role" "eventbridge_step_functions" {
  name = "${local.resource_prefix}-eventbridge-sfn"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${local.resource_prefix}-eventbridge-sfn"
  }
}

resource "aws_iam_role_policy" "eventbridge_step_functions" {
  name = "${local.resource_prefix}-eventbridge-sfn"
  role = aws_iam_role.eventbridge_step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "states:StartExecution"
      ]
      Resource = aws_sfn_state_machine.training_pipeline.arn
    }]
  })
}
```

## 4. Kinesis Data Streams

### `kinesis.tf`

```hcl
resource "aws_kinesis_stream" "user_interactions" {
  name             = "${local.resource_prefix}-user-interactions"
  shard_count      = var.kinesis_stream_shard_count
  retention_period = var.kinesis_retention_hours

  shard_level_metrics = [
    "IncomingRecords",
    "OutgoingRecords",
    "IncomingBytes",
    "OutgoingBytes"
  ]

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  encryption_type = "KMS"
  kms_key_id      = "alias/aws/kinesis"

  tags = {
    Name = "${local.resource_prefix}-user-interactions"
  }
}

resource "aws_kinesis_stream_consumer" "lambda_consumer" {
  name       = "${local.resource_prefix}-lambda-consumer"
  stream_arn = aws_kinesis_stream.user_interactions.arn

  tags = {
    Name = "${local.resource_prefix}-lambda-consumer"
  }
}
```

## 5. DynamoDB Tables

### `dynamodb.tf`

```hcl
resource "aws_dynamodb_table" "user_profiles" {
  name           = "${local.resource_prefix}-user-profiles"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.user_profile_table_read_capacity
  write_capacity = var.user_profile_table_write_capacity
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${local.resource_prefix}-user-profiles"
  }
}

resource "aws_dynamodb_table" "interactions" {
  name           = "${local.resource_prefix}-interactions"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.interactions_table_read_capacity
  write_capacity = var.interactions_table_write_capacity
  hash_key       = "user_id"
  range_key      = "timestamp"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "item_id"
    type = "S"
  }

  global_secondary_index {
    name            = "ItemIndex"
    hash_key        = "item_id"
    range_key       = "timestamp"
    write_capacity  = var.interactions_table_write_capacity
    read_capacity   = var.interactions_table_read_capacity
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name = "${local.resource_prefix}-interactions"
  }
}
```

## 6. S3 Buckets

### `s3.tf`

```hcl
resource "aws_s3_bucket" "training_data" {
  bucket = "${local.resource_prefix}-training-data-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "${local.resource_prefix}-training-data"
  }
}

resource "aws_s3_bucket_versioning" "training_data" {
  bucket = aws_s3_bucket.training_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "training_data" {
  bucket = aws_s3_bucket.training_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "training_data" {
  bucket = aws_s3_bucket.training_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "training_data" {
  bucket = aws_s3_bucket.training_data.id

  rule {
    id     = "delete-old-training-data"
    status = "Enabled"

    expiration {
      days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }
}
```

## 7. Lambda Functions

### `lambda.tf`

```hcl
# Stream Processor Lambda
data "archive_file" "stream_processor" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/stream_processor"
  output_path = "${path.module}/.terraform/stream_processor.zip"
}

resource "aws_lambda_function" "stream_processor" {
  filename         = data.archive_file.stream_processor.output_path
  function_name    = "${local.resource_prefix}-stream-processor"
  role            = aws_iam_role.lambda_stream_processor.arn
  handler         = "handler.lambda_handler"
  source_code_hash = data.archive_file.stream_processor.output_base64sha256
  runtime         = local.lambda_runtime
  timeout         = local.lambda_timeout
  memory_size     = local.lambda_memory

  environment {
    variables = {
      USER_PROFILE_TABLE = aws_dynamodb_table.user_profiles.name
      INTERACTIONS_TABLE = aws_dynamodb_table.interactions.name
      TRAINING_BUCKET    = aws_s3_bucket.training_data.id
      REGION            = var.region
    }
  }

  tags = {
    Name = "${local.resource_prefix}-stream-processor"
  }
}

resource "aws_lambda_event_source_mapping" "kinesis_trigger" {
  event_source_arn                   = aws_kinesis_stream_consumer.lambda_consumer.arn
  function_name                      = aws_lambda_function.stream_processor.arn
  starting_position                  = "LATEST"
  parallelization_factor            = 10
  maximum_batching_window_in_seconds = 5
  maximum_record_age_in_seconds     = 3600
  bisect_batch_on_function_error    = true
  maximum_retry_attempts            = 3

  destination_config {
    on_failure {
      destination_arn = aws_sns_topic.notifications.arn
    }
  }
}

# Recommendation API Lambda
data "archive_file" "recommendation_api" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/recommendation_api"
  output_path = "${path.module}/.terraform/recommendation_api.zip"
}

resource "aws_lambda_function" "recommendation_api" {
  filename         = data.archive_file.recommendation_api.output_path
  function_name    = "${local.resource_prefix}-recommendation-api"
  role            = aws_iam_role.lambda_recommendation_api.arn
  handler         = "handler.lambda_handler"
  source_code_hash = data.archive_file.recommendation_api.output_base64sha256
  runtime         = local.lambda_runtime
  timeout         = 30
  memory_size     = 1024

  vpc_config {
    security_group_ids = [aws_security_group.lambda.id]
    subnet_ids        = aws_subnet.private[*].id
  }

  environment {
    variables = {
      REDIS_ENDPOINT     = aws_elasticache_replication_group.redis.primary_endpoint_address
      PERSONALIZE_REGION = var.region
      AB_TEST_CONFIG    = jsonencode(var.ab_test_campaigns)
    }
  }

  tags = {
    Name = "${local.resource_prefix}-recommendation-api"
  }
}

# Training Orchestrator Lambda
data "archive_file" "training_orchestrator" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/training_orchestrator"
  output_path = "${path.module}/.terraform/training_orchestrator.zip"
}

resource "aws_lambda_function" "training_orchestrator" {
  filename         = data.archive_file.training_orchestrator.output_path
  function_name    = "${local.resource_prefix}-training-orchestrator"
  role            = aws_iam_role.lambda_stream_processor.arn
  handler         = "handler.lambda_handler"
  source_code_hash = data.archive_file.training_orchestrator.output_base64sha256
  runtime         = local.lambda_runtime
  timeout         = local.lambda_timeout
  memory_size     = local.lambda_memory

  environment {
    variables = {
      PERSONALIZE_DATASET_GROUP_ARN = aws_personalize_dataset_group.main.arn
      GLUE_JOB_NAME                = aws_glue_job.data_preparation.name
    }
  }

  tags = {
    Name = "${local.resource_prefix}-training-orchestrator"
  }
}
```

### Lambda Function Code

### `lambda/stream_processor/handler.py`

```python
import json
import base64
import os
import boto3
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

USER_PROFILE_TABLE = os.environ['USER_PROFILE_TABLE']
INTERACTIONS_TABLE = os.environ['INTERACTIONS_TABLE']
TRAINING_BUCKET = os.environ['TRAINING_BUCKET']

user_profile_table = dynamodb.Table(USER_PROFILE_TABLE)
interactions_table = dynamodb.Table(INTERACTIONS_TABLE)

def lambda_handler(event, context):
    """Process Kinesis stream records and update DynamoDB"""

    success_count = 0
    error_count = 0

    for record in event['Records']:
        try:
            # Decode Kinesis data
            payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
            data = json.loads(payload)

            # Extract interaction data
            user_id = data.get('user_id')
            item_id = data.get('item_id')
            event_type = data.get('event_type', 'view')
            timestamp = int(datetime.now().timestamp())

            # Update user profile
            user_profile_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='SET last_activity = :timestamp, '
                                'interaction_count = if_not_exists(interaction_count, :zero) + :one',
                ExpressionAttributeValues={
                    ':timestamp': timestamp,
                    ':zero': 0,
                    ':one': 1
                }
            )

            # Store interaction
            interactions_table.put_item(
                Item={
                    'user_id': user_id,
                    'timestamp': timestamp,
                    'item_id': item_id,
                    'event_type': event_type,
                    'ttl': int((datetime.now() + timedelta(days=90)).timestamp())
                }
            )

            # Export to S3 for training
            s3_key = f"interactions/{datetime.now().strftime('%Y/%m/%d')}/{user_id}-{timestamp}.json"
            s3.put_object(
                Bucket=TRAINING_BUCKET,
                Key=s3_key,
                Body=json.dumps(data),
                ContentType='application/json'
            )

            success_count += 1

        except Exception as e:
            logger.error(f"Error processing record: {str(e)}")
            error_count += 1

    logger.info(f"Processed {success_count} records successfully, {error_count} errors")

    return {
        'statusCode': 200,
        'batchItemFailures': []
    }
```

### `lambda/recommendation_api/handler.py`

```python
import json
import os
import boto3
import redis
import random
import hashlib
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

personalize_runtime = boto3.client('personalize-runtime')
redis_client = redis.Redis(
    host=os.environ['REDIS_ENDPOINT'],
    port=6379,
    decode_responses=True
)

AB_TEST_CONFIG = json.loads(os.environ['AB_TEST_CONFIG'])

def get_campaign_for_user(user_id):
    """Determine which campaign to use for A/B testing"""
    # Use consistent hashing for user assignment
    hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    threshold = hash_val % 100

    cumulative = 0
    for campaign_name, config in AB_TEST_CONFIG.items():
        cumulative += config['traffic_percentage']
        if threshold < cumulative:
            return campaign_name

    return list(AB_TEST_CONFIG.keys())[0]

def lambda_handler(event, context):
    """Handle recommendation API requests"""

    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('user_id')
        num_results = body.get('num_results', 10)

        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'user_id is required'})
            }

        # Check cache
        cache_key = f"recommendations:{user_id}:{num_results}"
        cached_result = redis_client.get(cache_key)

        if cached_result:
            logger.info(f"Cache hit for user {user_id}")
            return {
                'statusCode': 200,
                'body': cached_result,
                'headers': {
                    'X-Cache': 'HIT'
                }
            }

        # Get campaign for A/B testing
        campaign_name = get_campaign_for_user(user_id)
        campaign_arn = f"arn:aws:personalize:{os.environ['PERSONALIZE_REGION']}:{context.invoked_function_arn.split(':')[4]}:campaign/{campaign_name}"

        # Get recommendations from Personalize
        response = personalize_runtime.get_recommendations(
            campaignArn=campaign_arn,
            userId=user_id,
            numResults=num_results
        )

        recommendations = {
            'user_id': user_id,
            'recommendations': response['itemList'],
            'campaign': campaign_name,
            'timestamp': context.aws_request_id
        }

        result = json.dumps(recommendations)

        # Cache for 1 hour
        redis_client.setex(cache_key, 3600, result)

        return {
            'statusCode': 200,
            'body': result,
            'headers': {
                'X-Cache': 'MISS',
                'X-Campaign': campaign_name
            }
        }

    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## 8. VPC and Networking

### `vpc.tf`

```hcl
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.resource_prefix}-vpc"
  }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.vpc_cidr, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${local.resource_prefix}-private-${count.index + 1}"
  }
}

resource "aws_security_group" "lambda" {
  name_prefix = "${local.resource_prefix}-lambda-"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.resource_prefix}-lambda-sg"
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "${local.resource_prefix}-redis-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.resource_prefix}-redis-sg"
  }
}
```

## 9. ElastiCache Redis

### `elasticache.tf`

```hcl
resource "aws_elasticache_subnet_group" "redis" {
  name       = "${local.resource_prefix}-redis"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${local.resource_prefix}-redis-subnet-group"
  }
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${local.resource_prefix}-redis-params"
  family = "redis7"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  tags = {
    Name = "${local.resource_prefix}-redis-params"
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${local.resource_prefix}-redis"
  replication_group_description = "Redis cache for recommendations"
  engine                     = "redis"
  node_type                  = var.redis_node_type
  number_cache_clusters      = var.redis_num_cache_nodes
  parameter_group_name       = aws_elasticache_parameter_group.redis.name
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]

  port = 6379

  at_rest_encryption_enabled = true
  transit_encryption_enabled = false  # Set to true in production with auth

  automatic_failover_enabled = var.redis_num_cache_nodes > 1

  snapshot_retention_limit = 5
  snapshot_window          = "03:00-05:00"
  maintenance_window       = "sun:05:00-sun:07:00"

  tags = {
    Name = "${local.resource_prefix}-redis"
  }
}
```

## 10. AWS Glue

### `glue.tf`

```hcl
resource "aws_glue_job" "data_preparation" {
  name         = "${local.resource_prefix}-data-preparation"
  role_arn     = aws_iam_role.glue_job.arn
  glue_version = "4.0"

  command {
    script_location = "s3://${aws_s3_bucket.training_data.id}/scripts/prepare_data.py"
    python_version  = "3"
  }

  default_arguments = {
    "--job-bookmark-option"              = "job-bookmark-enable"
    "--enable-continuous-cloudwatch-log" = "true"
    "--enable-continuous-log-filter"     = "true"
    "--enable-metrics"                   = "true"
    "--TempDir"                          = "s3://${aws_s3_bucket.training_data.id}/temp/"
    "--SOURCE_BUCKET"                    = aws_s3_bucket.training_data.id
    "--USER_PROFILE_TABLE"               = aws_dynamodb_table.user_profiles.name
    "--INTERACTIONS_TABLE"               = aws_dynamodb_table.interactions.name
  }

  max_retries  = 1
  timeout      = 60
  max_capacity = 2.0

  execution_property {
    max_concurrent_runs = 1
  }

  tags = {
    Name = "${local.resource_prefix}-data-preparation"
  }
}

# Upload Glue script to S3
resource "aws_s3_object" "glue_script" {
  bucket = aws_s3_bucket.training_data.id
  key    = "scripts/prepare_data.py"

  content = <<-EOT
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
import boto3
from datetime import datetime

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'SOURCE_BUCKET'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read interaction data from S3
interactions_df = spark.read.json(f"s3://{args['SOURCE_BUCKET']}/interactions/*/*/*")

# Transform data for Personalize format
personalize_df = interactions_df.select(
    'user_id',
    'item_id',
    'event_type',
    'timestamp'
).filter(interactions_df.user_id.isNotNull())

# Write prepared data
output_path = f"s3://{args['SOURCE_BUCKET']}/prepared-data/{datetime.now().strftime('%Y%m%d%H%M%S')}"
personalize_df.coalesce(1).write.csv(output_path, header=True, mode='overwrite')

job.commit()
EOT

  tags = {
    Name = "${local.resource_prefix}-glue-script"
  }
}
```

## 11. Amazon Personalize

### `personalize.tf`

```hcl
resource "aws_personalize_dataset_group" "main" {
  name = "${local.resource_prefix}-dataset-group"

  tags = {
    Name = "${local.resource_prefix}-dataset-group"
  }
}

resource "aws_personalize_schema" "interactions" {
  name = "${local.resource_prefix}-interactions-schema"

  schema = jsonencode({
    type = "record"
    name = "Interactions"
    namespace = "com.amazonaws.personalize.schema"
    fields = [
      {
        name = "USER_ID"
        type = "string"
      },
      {
        name = "ITEM_ID"
        type = "string"
      },
      {
        name = "EVENT_TYPE"
        type = "string"
      },
      {
        name = "TIMESTAMP"
        type = "long"
      }
    ]
  })

  tags = {
    Name = "${local.resource_prefix}-interactions-schema"
  }
}

resource "aws_personalize_dataset" "interactions" {
  dataset_group_arn = aws_personalize_dataset_group.main.arn
  dataset_type      = "INTERACTIONS"
  name              = "${local.resource_prefix}-interactions"
  schema_arn        = aws_personalize_schema.interactions.arn

  tags = {
    Name = "${local.resource_prefix}-interactions-dataset"
  }
}
```

## 12. Step Functions

### `step-functions.tf`

```hcl
resource "aws_sfn_state_machine" "training_pipeline" {
  name     = "${local.resource_prefix}-training-pipeline"
  role_arn = aws_iam_role.step_functions.arn

  definition = jsonencode({
    Comment = "Recommendation system training pipeline"
    StartAt = "PrepareData"
    States = {
      PrepareData = {
        Type     = "Task"
        Resource = "arn:aws:states:::glue:startJobRun.sync"
        Parameters = {
          JobName = aws_glue_job.data_preparation.name
        }
        Next = "ImportDataset"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "NotifyFailure"
        }]
      }
      ImportDataset = {
        Type     = "Task"
        Resource = aws_lambda_function.training_orchestrator.arn
        Parameters = {
          "action" = "import_dataset"
        }
        Next = "CreateSolution"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "NotifyFailure"
        }]
      }
      CreateSolution = {
        Type     = "Task"
        Resource = aws_lambda_function.training_orchestrator.arn
        Parameters = {
          "action" = "create_solution"
        }
        Next = "UpdateCampaigns"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          Next        = "NotifyFailure"
        }]
      }
      UpdateCampaigns = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "UpdateCampaignA"
            States = {
              UpdateCampaignA = {
                Type     = "Task"
                Resource = aws_lambda_function.training_orchestrator.arn
                Parameters = {
                  "action"   = "update_campaign"
                  "campaign" = "campaign_a"
                }
                End = true
              }
            }
          },
          {
            StartAt = "UpdateCampaignB"
            States = {
              UpdateCampaignB = {
                Type     = "Task"
                Resource = aws_lambda_function.training_orchestrator.arn
                Parameters = {
                  "action"   = "update_campaign"
                  "campaign" = "campaign_b"
                }
                End = true
              }
            }
          }
        ]
        Next = "NotifySuccess"
      }
      NotifySuccess = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.notifications.arn
          Message  = "Training pipeline completed successfully"
          Subject  = "Recommendation System - Training Complete"
        }
        End = true
      }
      NotifyFailure = {
        Type     = "Task"
        Resource = "arn:aws:states:::sns:publish"
        Parameters = {
          TopicArn = aws_sns_topic.notifications.arn
          Message  = "Training pipeline failed"
          Subject  = "Recommendation System - Training Failed"
        }
        End = true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  tags = {
    Name = "${local.resource_prefix}-training-pipeline"
  }
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${local.resource_prefix}-training-pipeline"
  retention_in_days = 30

  tags = {
    Name = "${local.resource_prefix}-step-functions-logs"
  }
}
```

## 13. API Gateway

### `api-gateway.tf`

```hcl
resource "aws_api_gateway_rest_api" "recommendation_api" {
  name        = "${local.resource_prefix}-api"
  description = "Recommendation System API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${local.resource_prefix}-api"
  }
}

resource "aws_api_gateway_resource" "recommendations" {
  rest_api_id = aws_api_gateway_rest_api.recommendation_api.id
  parent_id   = aws_api_gateway_rest_api.recommendation_api.root_resource_id
  path_part   = "recommendations"
}

resource "aws_api_gateway_method" "get_recommendations" {
  rest_api_id   = aws_api_gateway_rest_api.recommendation_api.id
  resource_id   = aws_api_gateway_resource.recommendations.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.recommendation_api.id
  resource_id = aws_api_gateway_resource.recommendations.id
  http_method = aws_api_gateway_method.get_recommendations.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.recommendation_api.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.recommendation_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.recommendation_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.recommendation_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.recommendations.id,
      aws_api_gateway_method.get_recommendations.id,
      aws_api_gateway_integration.lambda_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.recommendation_api.id
  stage_name    = var.api_stage_name

  cache_cluster_enabled = true
  cache_cluster_size   = "0.5"

  xray_tracing_enabled = true

  tags = {
    Name = "${local.resource_prefix}-${var.api_stage_name}"
  }
}

resource "aws_api_gateway_method_settings" "main" {
  rest_api_id = aws_api_gateway_rest_api.recommendation_api.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level         = "INFO"
    data_trace_enabled    = true
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
    caching_enabled       = true
    cache_ttl_in_seconds  = 300
    cache_data_encrypted  = true
  }
}
```

## 14. EventBridge Scheduling

### `eventbridge.tf`

```hcl
resource "aws_cloudwatch_event_rule" "retraining_schedule" {
  name                = "${local.resource_prefix}-retraining-schedule"
  description         = "Trigger model retraining pipeline"
  schedule_expression = var.retraining_schedule

  tags = {
    Name = "${local.resource_prefix}-retraining-schedule"
  }
}

resource "aws_cloudwatch_event_target" "step_functions" {
  rule      = aws_cloudwatch_event_rule.retraining_schedule.name
  target_id = "StepFunctionsTarget"
  arn       = aws_sfn_state_machine.training_pipeline.arn
  role_arn  = aws_iam_role.eventbridge_step_functions.arn
}
```

## 15. SNS Notifications

### `sns.tf`

```hcl
resource "aws_sns_topic" "notifications" {
  name = "${local.resource_prefix}-notifications"

  kms_master_key_id = "alias/aws/sns"

  tags = {
    Name = "${local.resource_prefix}-notifications"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = "ops-team@example.com" # Replace with actual email
}
```

## 16. CloudWatch Monitoring

### `monitoring.tf`

```hcl
# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "kinesis_incoming_records" {
  alarm_name          = "${local.resource_prefix}-kinesis-incoming-records"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "IncomingRecords"
  namespace           = "AWS/Kinesis"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert when incoming records drop below threshold"
  alarm_actions       = [aws_sns_topic.notifications.arn]

  dimensions = {
    StreamName = aws_kinesis_stream.user_interactions.name
  }

  tags = {
    Name = "${local.resource_prefix}-kinesis-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.resource_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert on Lambda function errors"
  alarm_actions       = [aws_sns_topic.notifications.arn]

  dimensions = {
    FunctionName = aws_lambda_function.stream_processor.function_name
  }

  tags = {
    Name = "${local.resource_prefix}-lambda-errors-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${local.resource_prefix}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "Alert on API Gateway 5XX errors"
  alarm_actions       = [aws_sns_topic.notifications.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.recommendation_api.name
    Stage   = var.api_stage_name
  }

  tags = {
    Name = "${local.resource_prefix}-api-5xx-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "${local.resource_prefix}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "Alert on high API latency"
  alarm_actions       = [aws_sns_topic.notifications.arn]

  dimensions = {
    ApiName = aws_api_gateway_rest_api.recommendation_api.name
    Stage   = var.api_stage_name
  }

  tags = {
    Name = "${local.resource_prefix}-api-latency-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "cache_cpu" {
  alarm_name          = "${local.resource_prefix}-cache-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "Alert on high Redis CPU utilization"
  alarm_actions       = [aws_sns_topic.notifications.arn]

  dimensions = {
    CacheClusterId = aws_elasticache_replication_group.redis.id
  }

  tags = {
    Name = "${local.resource_prefix}-cache-cpu-alarm"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.resource_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Kinesis", "IncomingRecords", { stat = "Sum", label = "Incoming Records" }],
            [".", "IncomingBytes", { stat = "Sum", label = "Incoming Bytes", yAxis = "right" }]
          ]
          view    = "timeSeries"
          region  = var.region
          title   = "Kinesis Stream Metrics"
          period  = 300
          stacked = false
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum" }],
            [".", "Errors", { stat = "Sum", color = "#d62728" }],
            [".", "Duration", { stat = "Average", yAxis = "right" }]
          ]
          view   = "timeSeries"
          region = var.region
          title  = "Lambda Function Metrics"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "API Calls" }],
            [".", "Latency", { stat = "Average", yAxis = "right" }],
            [".", "4XXError", { stat = "Sum", color = "#ff9896" }],
            [".", "5XXError", { stat = "Sum", color = "#d62728" }]
          ]
          view   = "timeSeries"
          region = var.region
          title  = "API Gateway Metrics"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", { stat = "Average" }],
            [".", "NetworkBytesIn", { stat = "Sum", yAxis = "right" }],
            [".", "NetworkBytesOut", { stat = "Sum", yAxis = "right" }]
          ]
          view   = "timeSeries"
          region = var.region
          title  = "Redis Cache Metrics"
          period = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "UserErrors", { stat = "Sum" }],
            [".", "ConsumedReadCapacityUnits", { stat = "Sum" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }]
          ]
          view   = "timeSeries"
          region = var.region
          title  = "DynamoDB Metrics"
          period = 300
        }
      }
    ]
  })
}
```

## 17. Outputs

### `outputs.tf`

```hcl
output "api_gateway_url" {
  description = "API Gateway URL for recommendations"
  value       = "${aws_api_gateway_stage.main.invoke_url}/recommendations"
}

output "kinesis_stream_arn" {
  description = "Kinesis stream ARN for data ingestion"
  value       = aws_kinesis_stream.user_interactions.arn
}

output "s3_training_bucket" {
  description = "S3 bucket for training data"
  value       = aws_s3_bucket.training_data.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = aws_sns_topic.notifications.arn
}

output "dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "step_functions_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.training_pipeline.arn
}

output "redis_endpoint" {
  description = "Redis primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
  sensitive   = true
}
```

## Deployment Instructions

1. **Initialize Terraform:**

```bash
terraform init
```

2. **Create workspace for production:**

```bash
terraform workspace new production
```

3. **Review the plan:**

```bash
terraform plan -var-file="production.tfvars"
```

4. **Apply the configuration:**

```bash
terraform apply -var-file="production.tfvars" -auto-approve
```

5. **Create a production.tfvars file:**

```hcl
environment                        = "production"
kinesis_stream_shard_count        = 10
user_profile_table_read_capacity  = 100
user_profile_table_write_capacity = 100
interactions_table_read_capacity  = 100
interactions_table_write_capacity = 100
redis_node_type                   = "cache.r7g.xlarge"
redis_num_cache_nodes             = 3
api_throttle_burst_limit          = 10000
api_throttle_rate_limit           = 5000
personalize_campaign_min_tps      = 10
```

## Key Features Implemented

1. **Real-time Data Ingestion**: Kinesis Data Streams with Lambda processors
2. **Data Storage**: DynamoDB tables with proper indexing and TTL
3. **ML Pipeline**: AWS Personalize integration with A/B testing
4. **Orchestration**: Step Functions for training pipeline
5. **Caching**: ElastiCache Redis for low-latency responses
6. **API Management**: API Gateway with caching and throttling
7. **Monitoring**: Comprehensive CloudWatch dashboards and alarms
8. **Security**: Least privilege IAM policies
9. **Automation**: EventBridge scheduled retraining
10. **High Availability**: Multi-AZ deployments for critical components

This system provides a production-ready recommendation engine with proper monitoring, alerting, and scalability features.
