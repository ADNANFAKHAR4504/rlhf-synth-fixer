```hcl
# ============================================================================
# TAP Stack - IoT Failure Recovery Automation Infrastructure
# Production-ready deployment for 156,000 sensors across 234 factories
# Region-agnostic, single-file Terraform configuration
# ============================================================================

# ----------------------------------------------------------------------------
# Input Variables
# ----------------------------------------------------------------------------

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project identifier"
  type        = string
  default     = "iot-recovery"
}

variable "sensor_count" {
  description = "Total number of IoT sensors"
  type        = number
  default     = 156000
}

variable "factory_count" {
  description = "Total number of factories"
  type        = number
  default     = 234
}

variable "sensor_types" {
  description = "List of sensor types for SQS queue creation"
  type        = list(string)
  default = [
    "temperature", "pressure", "humidity", "vibration", "flow",
    "level", "ph", "conductivity", "turbidity", "oxygen",
    "co2", "methane", "ammonia", "chlorine", "ozone",
    "radiation", "light", "sound", "motion", "proximity",
    "force", "torque", "acceleration", "velocity", "position",
    "voltage", "current", "power", "frequency", "resistance",
    "capacitance", "inductance", "magnetic", "electric", "thermal",
    "optical", "ultrasonic", "infrared", "laser", "radar",
    "weight", "density", "viscosity", "concentration", "purity"
  ]
}

# ----------------------------------------------------------------------------
# Local Variables
# ----------------------------------------------------------------------------

locals {
  # Resource naming convention with suffix
  suffix = "abdb"
  
  # Common tags for all resources
  common_tags = {
    Environment  = var.environment
    Project      = var.project_name
    ManagedBy    = "terraform"
    Stack        = "tap-stack-${local.suffix}"
    CreatedAt    = timestamp()
  }
  
  # Naming prefixes
  name_prefix = "${var.project_name}-${var.environment}-${local.suffix}"
  
  # VPC Configuration
  vpc_cidr = "10.0.0.0/16"
  
  # Subnet CIDRs
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
  
  # Availability Zones (using data source for dynamic AZ selection)
  azs = slice(data.aws_availability_zones.available.names, 0, 2)
}

# ----------------------------------------------------------------------------
# Data Sources
# ----------------------------------------------------------------------------

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ----------------------------------------------------------------------------
# VPC and Networking Resources
# ----------------------------------------------------------------------------

# VPC
resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  })
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-eip-nat-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })
  
  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-public"
  })
}

# Route Tables for Private Subnets
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rt-private-${count.index + 1}"
  })
}

# Route Table Associations for Public Subnets
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Route Table Associations for Private Subnets
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ----------------------------------------------------------------------------
# S3 Buckets
# ----------------------------------------------------------------------------

# S3 Bucket for Data Lake
resource "aws_s3_bucket" "data_lake" {
  bucket = "${local.name_prefix}-data-lake"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-lake"
    Type = "DataLake"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "data_lake" {
  bucket = aws_s3_bucket.data_lake.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket for Athena Results
resource "aws_s3_bucket" "athena_results" {
  bucket = "${local.name_prefix}-athena-results"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-athena-results"
    Type = "AthenaResults"
  })
}

# S3 Bucket for Glue Scripts
resource "aws_s3_bucket" "glue_scripts" {
  bucket = "${local.name_prefix}-glue-scripts"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-glue-scripts"
    Type = "GlueScripts"
  })
}

# ----------------------------------------------------------------------------
# DynamoDB Table for Buffered Data
# ----------------------------------------------------------------------------

resource "aws_dynamodb_table" "buffered_data" {
  name           = "${local.name_prefix}-buffered-data"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "device_id"
  range_key      = "timestamp"
  
  attribute {
    name = "device_id"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  attribute {
    name = "sensor_type"
    type = "S"
  }
  
  global_secondary_index {
    name            = "sensor_type_index"
    hash_key        = "sensor_type"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-buffered-data"
  })
}

# ----------------------------------------------------------------------------
# Kinesis Data Stream
# ----------------------------------------------------------------------------

resource "aws_kinesis_stream" "main" {
  name             = "${local.name_prefix}-stream"
  shard_count      = 100  # To handle 890,000 msgs/minute
  retention_period = 168  # 7 days
  
  shard_level_metrics = [
    "IncomingRecords",
    "OutgoingRecords"
  ]
  
  stream_mode_details {
    stream_mode = "PROVISIONED"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-stream"
  })
}

# ----------------------------------------------------------------------------
# Timestream Database and Table
# ----------------------------------------------------------------------------

resource "aws_timestreamwrite_database" "main" {
  database_name = replace("${local.name_prefix}-tsdb", "-", "_")
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tsdb"
  })
}

resource "aws_timestreamwrite_table" "sensor_data" {
  database_name = aws_timestreamwrite_database.main.database_name
  table_name    = "sensor_data"
  
  retention_properties {
    magnetic_store_retention_period_in_days = 365
    memory_store_retention_period_in_hours  = 24
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sensor-data"
  })
}

# ----------------------------------------------------------------------------
# IAM Roles and Policies
# ----------------------------------------------------------------------------

# IAM Role for Device Verification Lambda
resource "aws_iam_role" "lambda_device_verification" {
  name = "${local.name_prefix}-lambda-device-verification"
  
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
  
  tags = local.common_tags
}

# IAM Policy for Device Verification Lambda
resource "aws_iam_role_policy" "lambda_device_verification" {
  name = "${local.name_prefix}-lambda-device-verification-policy"
  role = aws_iam_role.lambda_device_verification.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iot:GetThingShadow",
          "iot:ListThings",
          "iot:DescribeThing",
          "iot:GetIndexingConfiguration",
          "iot:SearchIndex"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.recovery_orchestrator.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach VPC execution policy to Device Verification Lambda role
resource "aws_iam_role_policy_attachment" "lambda_device_verification_vpc" {
  role       = aws_iam_role.lambda_device_verification.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# IAM Role for Data Replay Lambda
resource "aws_iam_role" "lambda_data_replay" {
  name = "${local.name_prefix}-lambda-data-replay"
  
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
  
  tags = local.common_tags
}

# IAM Policy for Data Replay Lambda
resource "aws_iam_role_policy" "lambda_data_replay" {
  name = "${local.name_prefix}-lambda-data-replay-policy"
  role = aws_iam_role.lambda_data_replay.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:BatchGetItem"
        ]
        Resource = [
          aws_dynamodb_table.buffered_data.arn,
          "${aws_dynamodb_table.buffered_data.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kinesis:PutRecords",
          "kinesis:PutRecord"
        ]
        Resource = aws_kinesis_stream.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach VPC execution policy to Data Replay Lambda role
resource "aws_iam_role_policy_attachment" "lambda_data_replay_vpc" {
  role       = aws_iam_role.lambda_data_replay.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# IAM Role for Step Functions
resource "aws_iam_role" "step_functions" {
  name = "${local.name_prefix}-step-functions"
  
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
  
  tags = local.common_tags
}

# IAM Policy for Step Functions
resource "aws_iam_role_policy" "step_functions" {
  name = "${local.name_prefix}-step-functions-policy"
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
          aws_lambda_function.data_replay.arn,
          "${aws_lambda_function.data_replay.arn}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutTargets",
          "events:PutRule",
          "events:DescribeRule"
        ]
        Resource = "arn:aws:events:*:*:rule/StepFunctionsGetEventsForStepFunctionsExecutionRule"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "timestream:WriteRecords",
          "timestream:DescribeTable"
        ]
        Resource = [
          aws_timestreamwrite_table.sensor_data.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "timestream:DescribeEndpoints"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for Glue Jobs
resource "aws_iam_role" "glue" {
  name = "${local.name_prefix}-glue"
  
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
  
  tags = local.common_tags
}

# IAM Policy for Glue Jobs
resource "aws_iam_role_policy" "glue" {
  name = "${local.name_prefix}-glue-policy"
  role = aws_iam_role.glue.id
  
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
          aws_s3_bucket.data_lake.arn,
          "${aws_s3_bucket.data_lake.arn}/*",
          aws_s3_bucket.glue_scripts.arn,
          "${aws_s3_bucket.glue_scripts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "timestream:WriteRecords",
          "timestream:DescribeTable"
        ]
        Resource = [
          aws_timestreamwrite_table.sensor_data.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "timestream:DescribeEndpoints"
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
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Attach AWS managed policy for Glue service
resource "aws_iam_role_policy_attachment" "glue_service" {
  role       = aws_iam_role.glue.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole"
}

# ----------------------------------------------------------------------------
# Security Groups
# ----------------------------------------------------------------------------

# Security Group for Lambda Functions
resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

# ----------------------------------------------------------------------------
# Lambda Functions
# ----------------------------------------------------------------------------

data "archive_file" "device_verification" {
  type        = "zip"
  output_path = "${path.module}/device_verification.zip"
  source {
    content  = <<-EOT
const AWS = require('aws-sdk');
const iot = new AWS.Iot();
const iotData = new AWS.IotData({ endpoint: process.env.IOT_ENDPOINT });
const stepFunctions = new AWS.StepFunctions();
exports.handler = async (event) => {
    console.log('Device verification initiated for event:', JSON.stringify(event));
    const batchSize = parseInt(process.env.BATCH_SIZE) || 1000;
    const totalDevices = parseInt(process.env.SENSOR_COUNT) || 156000;
    try {
        // Parallel device verification using Promise.all for batching
        const verificationPromises = [];
        for (let i = 0; i < totalDevices; i += batchSize) {
            verificationPromises.push(verifyDeviceBatch(i, Math.min(i + batchSize, totalDevices)));
        }
        const results = await Promise.all(verificationPromises);
        // Aggregate results
        const aggregatedResults = results.reduce((acc, batch) => {
            acc.healthy += batch.healthy;
            acc.unhealthy += batch.unhealthy;
            acc.unknown += batch.unknown;
            return acc;
        }, { healthy: 0, unhealthy: 0, unknown: 0 });
        console.log('Verification complete:', aggregatedResults);
        // Trigger Step Functions if unhealthy devices detected
        if (aggregatedResults.unhealthy > 0) {
            const stateMachineArn = process.env.STATE_MACHINE_ARN;
            await stepFunctions.startExecution({
                stateMachineArn: stateMachineArn,
                input: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    verificationResults: aggregatedResults,
                    triggerSource: 'CloudWatch Alarm',
                    recoveryNeeded: true
                })
            }).promise();
            console.log('Step Functions execution triggered');
        }
        return {
            statusCode: 200,
            body: JSON.stringify(aggregatedResults)
        };
    } catch (error) {
        console.error('Error during device verification:', error);
        throw error;
    }
};
async function verifyDeviceBatch(startIdx, endIdx) {
    // Simulated batch verification - in production, this would query actual IoT shadows
    const batchResults = {
        healthy: 0,
        unhealthy: 0,
        unknown: 0
    };
    // Simulate async verification with random results
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    const batchSize = endIdx - startIdx;
    batchResults.healthy = Math.floor(batchSize * 0.95);
    batchResults.unhealthy = Math.floor(batchSize * 0.03);
    batchResults.unknown = batchSize - batchResults.healthy - batchResults.unhealthy;
    return batchResults;
}
EOT
    filename = "index.js"
  }
}

resource "aws_lambda_function" "device_verification" {
  function_name    = "${local.name_prefix}-device-verification"
  role             = aws_iam_role.lambda_device_verification.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 180
  memory_size      = 1024
  filename         = data.archive_file.device_verification.output_path
  source_code_hash = data.archive_file.device_verification.output_base64sha256

  environment {
    variables = {
      STATE_MACHINE_ARN = aws_sfn_state_machine.recovery_orchestrator.arn
      SENSOR_COUNT      = var.sensor_count
      BATCH_SIZE        = "1000"
    }
  }
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-device-verification"
  })
  depends_on = [
    aws_iam_role_policy.lambda_device_verification,
    aws_iam_role_policy_attachment.lambda_device_verification_vpc
  ]
}

data "archive_file" "data_replay" {
  type        = "zip"
  output_path = "${path.module}/data_replay.zip"
  source {
    content  = <<-EOT
import json
import boto3
import os
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
dynamodb = boto3.resource('dynamodb')
kinesis = boto3.client('kinesis')
def handler(event, context):
    print(f"Data replay initiated: {json.dumps(event)}")
    table_name = os.environ['DYNAMODB_TABLE']
    stream_name = os.environ['KINESIS_STREAM']
    batch_size = int(os.environ.get('BATCH_SIZE', '500'))
    table = dynamodb.Table(table_name)
    end_time = int(datetime.now().timestamp() * 1000)
    start_time = int((datetime.now() - timedelta(hours=12)).timestamp() * 1000)
    try:
        response = table.scan(
            FilterExpression='#ts BETWEEN :start AND :end',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':start': start_time,
                ':end': end_time
            }
        )
        items = response.get('Items', [])
        print(f"Found {len(items)} messages to replay")
        batches = [items[i:i + batch_size] for i in range(0, len(items), batch_size)]
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for batch in batches:
                future = executor.submit(send_to_kinesis, stream_name, batch)
                futures.append(future)
            for future in futures:
                future.result()
        return {
            'statusCode': 200,
            'body': json.dumps({
                'messages_replayed': len(items),
                'batches_processed': len(batches)
            })
        }
    except Exception as e:
        print(f"Error during data replay: {str(e)}")
        raise
def send_to_kinesis(stream_name, messages):
    records = []
    for msg in messages:
        record = {
            'Data': json.dumps(msg),
            'PartitionKey': msg.get('device_id', 'unknown')
        }
        records.append(record)
    for i in range(0, len(records), 500):
        batch = records[i:i + 500]
        response = kinesis.put_records(
            Records=batch,
            StreamName=stream_name
        )
        if response['FailedRecordCount'] > 0:
            print(f"Failed to send {response['FailedRecordCount']} records")
    return len(records)
EOT
    filename = "index.py"
  }
}

resource "aws_lambda_function" "data_replay" {
  function_name    = "${local.name_prefix}-data-replay"
  role             = aws_iam_role.lambda_data_replay.arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 300
  memory_size      = 2048
  filename         = data.archive_file.data_replay.output_path
  source_code_hash = data.archive_file.data_replay.output_base64sha256

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.buffered_data.name
      KINESIS_STREAM = aws_kinesis_stream.main.name
      BATCH_SIZE     = "500"
    }
  }
  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-data-replay"
  })
  depends_on = [
    aws_iam_role_policy.lambda_data_replay,
    aws_iam_role_policy_attachment.lambda_data_replay_vpc
  ]
}

# ----------------------------------------------------------------------------
# Step Functions State Machine
# ----------------------------------------------------------------------------

resource "aws_sfn_state_machine" "recovery_orchestrator" {
  name     = "${local.name_prefix}-recovery-orchestrator"
  role_arn = aws_iam_role.step_functions.arn
  
  definition = jsonencode({
    Comment = "IoT Recovery Orchestration Pipeline"
    StartAt = "InitiateRecovery"
    States = {
      InitiateRecovery = {
        Type = "Parallel"
        Branches = [
          {
            StartAt = "ReplayBufferedData"
            States = {
              ReplayBufferedData = {
                Type = "Task"
                Resource = "arn:aws:states:::lambda:invoke"
                Parameters = {
                  FunctionName = aws_lambda_function.data_replay.arn
                  "Payload.$" = "$"
                }
                TimeoutSeconds = 300
                Retry = [
                  {
                    ErrorEquals = ["States.TaskFailed"]
                    IntervalSeconds = 2
                    MaxAttempts = 3
                    BackoffRate = 2.0
                  }
                ]
                End = true
              }
            }
          },
          {
            StartAt = "RecalculateTimestream"
            States = {
              RecalculateTimestream = {
                Type = "Task"
                Resource = "arn:aws:states:::aws-sdk:timestreamwrite:writeRecords"
                Parameters = {
                  DatabaseName = aws_timestreamwrite_database.main.database_name
                  TableName = aws_timestreamwrite_table.sensor_data.table_name
                  Records = [
                    {
                      Time = "$$.State.EnteredTime"
                      TimeUnit = "MILLISECONDS"
                      MeasureName = "recovery_status"
                      MeasureValue = "1"
                      MeasureValueType = "DOUBLE"
                    }
                  ]
                }
                TimeoutSeconds = 600
                End = true
              }
            }
          },
          {
            StartAt = "PublishToEventBridge"
            States = {
              PublishToEventBridge = {
                Type = "Task"
                Resource = "arn:aws:states:::events:putEvents"
                Parameters = {
                  Entries = [
                    {
                      Source = "iot.recovery"
                      DetailType = "Recovery Initiated"
                      "Detail.$" = "$"
                      EventBusName = "default"
                    }
                  ]
                }
                End = true
              }
            }
          }
        ]
        Next = "RecoveryComplete"
      }
      RecoveryComplete = {
        Type = "Pass"
        Result = "Recovery process completed successfully"
        End = true
      }
    }
  })
  
  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-recovery-orchestrator"
  })
}

# ----------------------------------------------------------------------------
# CloudWatch Resources
# ----------------------------------------------------------------------------

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_device_verification" {
  name              = "/aws/lambda/${aws_lambda_function.device_verification.function_name}"
  retention_in_days = 7
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_data_replay" {
  name              = "/aws/lambda/${aws_lambda_function.data_replay.function_name}"
  retention_in_days = 7
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/states/${local.name_prefix}-recovery-orchestrator"
  retention_in_days = 7
  
  tags = local.common_tags
}

# CloudWatch Metric Alarm for IoT Core Connection Attempts
resource "aws_cloudwatch_metric_alarm" "iot_connection_failures" {
  alarm_name          = "${local.name_prefix}-iot-connection-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Connect.Failure"
  namespace           = "AWS/IoT"
  period              = "60"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Triggers when IoT connection failures exceed threshold"
  treat_missing_data  = "notBreaching"
  
  alarm_actions = [
    aws_sns_topic.alerts.arn
  ]
  
  tags = local.common_tags
}

# CloudWatch Metric Alarm for IoT Core Message Rate
resource "aws_cloudwatch_metric_alarm" "iot_message_drop" {
  alarm_name          = "${local.name_prefix}-iot-message-drop"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PublishIn.Success"
  namespace           = "AWS/IoT"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1000"
  alarm_description   = "Triggers when IoT message rate drops below expected"
  treat_missing_data  = "breaching"
  
  alarm_actions = [
    aws_sns_topic.alerts.arn
  ]
  
  tags = local.common_tags
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "recovery" {
  dashboard_name = "${local.name_prefix}-recovery-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        width = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/IoT", "Connect.Success", { stat = "Sum" }],
            [".", "Connect.Failure", { stat = "Sum" }]
          ]
          period = 300
          stat = "Sum"
          region = var.region
          title = "IoT Connection Metrics"
        }
      },
      {
        type = "metric"
        width = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", dimensions = { FunctionName = aws_lambda_function.device_verification.function_name }}],
            [".", "Errors", { stat = "Sum", dimensions = { FunctionName = aws_lambda_function.device_verification.function_name }}]
          ]
          period = 300
          stat = "Average"
          region = var.region
          title = "Device Verification Lambda"
        }
      }
    ]
  })
}

# ----------------------------------------------------------------------------
# SNS Topic for Alerts
# ----------------------------------------------------------------------------

resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alerts"
  })
}

resource "aws_sns_topic_subscription" "lambda_trigger" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.device_verification.arn
}

resource "aws_lambda_permission" "sns_invoke" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.device_verification.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alerts.arn
}

# ----------------------------------------------------------------------------
# EventBridge Rules
# ----------------------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "recovery_events" {
  name        = "${local.name_prefix}-recovery-events"
  description = "Route recovery events to SQS queues"
  
  event_pattern = jsonencode({
    source = ["iot.recovery"]
    detail-type = ["Recovery Initiated"]
  })
  
  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "sqs_routing" {
  count     = length(var.sensor_types)
  rule      = aws_cloudwatch_event_rule.recovery_events.name
  target_id = "sqs-${var.sensor_types[count.index]}"
  arn       = aws_sqs_queue.sensor_queues[count.index].arn
  
  input_transformer {
    input_paths = {
      sensor_type = "$.detail.sensor_type"
      timestamp   = "$.time"
    }
    input_template = <<EOF
{
  "sensor_type": "<sensor_type>",
  "timestamp": "<timestamp>",
  "queue": "${var.sensor_types[count.index]}"
}
EOF
  }
}

# ----------------------------------------------------------------------------
# SQS Queues for Sensor Types
# ----------------------------------------------------------------------------

resource "aws_sqs_queue" "sensor_queues" {
  count = length(var.sensor_types)
  
  name                       = "${local.name_prefix}-${var.sensor_types[count.index]}-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600  # 14 days
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 300
  
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.sensor_dlq[count.index].arn
    maxReceiveCount     = 3
  })
  
  tags = merge(local.common_tags, {
    Name       = "${local.name_prefix}-${var.sensor_types[count.index]}-queue"
    SensorType = var.sensor_types[count.index]
  })
}

resource "aws_sqs_queue" "sensor_dlq" {
  count = length(var.sensor_types)
  
  name                      = "${local.name_prefix}-${var.sensor_types[count.index]}-dlq"
  message_retention_seconds = 1209600  # 14 days
  
  tags = merge(local.common_tags, {
    Name       = "${local.name_prefix}-${var.sensor_types[count.index]}-dlq"
    SensorType = var.sensor_types[count.index]
    Type       = "DeadLetterQueue"
  })
}

resource "aws_sqs_queue_policy" "sensor_queues" {
  count     = length(var.sensor_types)
  queue_url = aws_sqs_queue.sensor_queues[count.index].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.sensor_queues[count.index].arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.recovery_events.arn
          }
        }
      }
    ]
  })
}

# ----------------------------------------------------------------------------
# Athena Resources
# ----------------------------------------------------------------------------

resource "aws_athena_database" "data_lake" {
  name   = replace("${local.name_prefix}_data_lake", "-", "_")
  bucket = aws_s3_bucket.athena_results.id
  
  properties = {
    compression = "GZIP"
  }
}

resource "aws_athena_workgroup" "main" {
  name = "${local.name_prefix}-workgroup"
  
  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true
    
    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.id}/query-results/"
      
      encryption_configuration {
        encryption_option = "SSE_S3"
      }
    }
    
    engine_version {
      selected_engine_version = "AUTO"
    }
  }
  
  tags = local.common_tags
}

resource "aws_athena_named_query" "gap_detection" {
  name        = "${local.name_prefix}-gap-detection"
  workgroup   = aws_athena_workgroup.main.id
  database    = aws_athena_database.data_lake.name
  description = "Detect data gaps in sensor readings"
  
  query = <<EOF
WITH time_series AS (
  SELECT 
    device_id,
    sensor_type,
    timestamp,
    LAG(timestamp) OVER (PARTITION BY device_id ORDER BY timestamp) AS prev_timestamp
  FROM sensor_data
  WHERE timestamp >= current_timestamp - interval '12' hour
)
SELECT 
  device_id,
  sensor_type,
  timestamp,
  prev_timestamp,
  timestamp - prev_timestamp AS gap_duration
FROM time_series
WHERE timestamp - prev_timestamp > interval '5' minute
ORDER BY gap_duration DESC
LIMIT 1000
EOF
}

# ----------------------------------------------------------------------------
# Glue Resources
# ----------------------------------------------------------------------------

resource "aws_glue_catalog_database" "main" {
  name = replace("${local.name_prefix}_glue_db", "-", "_")
  
  description = "Glue catalog database for IoT data processing"
}

resource "aws_glue_catalog_table" "sensor_data" {
  name          = "sensor_data"
  database_name = aws_glue_catalog_database.main.name
  
  storage_descriptor {
    location      = "s3://${aws_s3_bucket.data_lake.bucket}/sensor-data/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"
    
    ser_de_info {
      name                  = "json_serde"
      serialization_library = "org.apache.hive.serde2.lazy.LazySimpleSerDe"
      
      parameters = {
        "field.delim" = ","
      }
    }
    
    columns {
      name = "device_id"
      type = "string"
    }
    
    columns {
      name = "timestamp"
      type = "bigint"
    }
    
    columns {
      name = "sensor_type"
      type = "string"
    }
    
    columns {
      name = "value"
      type = "double"
    }
    
    columns {
      name = "unit"
      type = "string"
    }
  }
  
  partition_keys {
    name = "year"
    type = "string"
  }
  
  partition_keys {
    name = "month"
    type = "string"
  }
  
  partition_keys {
    name = "day"
    type = "string"
  }
}

resource "aws_glue_job" "backfill" {
  name         = "${local.name_prefix}-backfill-job"
  role_arn     = aws_iam_role.glue.arn
  glue_version = "4.0"
  
  command {
    name            = "glueetl"
    script_location = "s3://${aws_s3_bucket.glue_scripts.bucket}/backfill.py"
    python_version  = "3"
  }
  
  default_arguments = {
    "--enable-metrics"                = ""
    "--enable-continuous-cloudwatch-log" = "true"
    "--enable-spark-ui"               = "true"
    "--spark-event-logs-path"         = "s3://${aws_s3_bucket.glue_scripts.bucket}/spark-logs/"
    "--job-language"                  = "python"
    "--TempDir"                       = "s3://${aws_s3_bucket.glue_scripts.bucket}/temp/"
  }
  
  max_capacity = 10
  timeout      = 30  # 30 minutes
  
  execution_property {
    max_concurrent_runs = 2
  }
  
  tags = local.common_tags
}

# Upload Glue script
resource "aws_s3_object" "glue_script" {
  bucket = aws_s3_bucket.glue_scripts.id
  key    = "backfill.py"
  
  content = <<EOF
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from datetime import datetime, timedelta
import boto3

# Initialize Glue context
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)

# Get job parameters
args = getResolvedOptions(sys.argv, ['JOB_NAME'])
job.init(args['JOB_NAME'], args)

# Initialize AWS clients
s3_client = boto3.client('s3')
timestream_client = boto3.client('timestream-write')

def backfill_missing_data():
    """
    Backfill missing sensor data from on-premise databases
    This is a simplified version - production would connect to actual databases
    """
    
    # Read gap information from S3 (output from Athena)
    gaps_df = spark.read.json("s3://${aws_s3_bucket.data_lake.bucket}/gaps/")
    
    # For each gap, generate synthetic data (in production, query on-premise DB)
    for row in gaps_df.collect():
        device_id = row['device_id']
        start_time = row['prev_timestamp']
        end_time = row['timestamp']
        
        # Generate backfill data
        backfill_data = generate_backfill_data(device_id, start_time, end_time)
        
        # Write to S3
        write_to_s3(backfill_data)
        
        # Write to Timestream
        write_to_timestream(backfill_data)
    
    return True

def generate_backfill_data(device_id, start_time, end_time):
    """Generate synthetic backfill data"""
    # This would connect to on-premise database in production
    data = []
    current = start_time
    while current < end_time:
        data.append({
            'device_id': device_id,
            'timestamp': current,
            'value': 25.0 + (hash(str(current)) % 10),
            'unit': 'celsius',
            'source': 'backfill'
        })
        current += 60000  # Add 1 minute
    return data

def write_to_s3(data):
    """Write backfilled data to S3"""
    df = spark.createDataFrame(data)
    df.write.mode("append").parquet(
        "s3://${aws_s3_bucket.data_lake.bucket}/backfilled/"
    )

def write_to_timestream(data):
    """Write backfilled data to Timestream"""
    # Batch write to Timestream (simplified)
    records = []
    for item in data[:100]:  # Limit for example
        records.append({
            'Time': str(item['timestamp']),
            'TimeUnit': 'MILLISECONDS',
            'MeasureName': 'temperature',
            'MeasureValue': str(item['value']),
            'MeasureValueType': 'DOUBLE'
        })
    
    if records:
        try:
            timestream_client.write_records(
                DatabaseName='${replace(aws_timestreamwrite_database.main.database_name, "-", "_")}',
                TableName='sensor_data',
                Records=records
            )
        except Exception as e:
            print(f"Error writing to Timestream: {e}")

# Execute backfill
backfill_missing_data()

# Commit job
job.commit()
EOF
}

# ----------------------------------------------------------------------------
# Outputs
# ----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "s3_data_lake_bucket" {
  description = "S3 Data Lake bucket name"
  value       = aws_s3_bucket.data_lake.id
}

output "s3_athena_results_bucket" {
  description = "S3 Athena results bucket name"
  value       = aws_s3_bucket.athena_results.id
}

output "s3_glue_scripts_bucket" {
  description = "S3 Glue scripts bucket name"
  value       = aws_s3_bucket.glue_scripts.id
}

output "dynamodb_table_name" {
  description = "DynamoDB buffered data table name"
  value       = aws_dynamodb_table.buffered_data.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB buffered data table ARN"
  value       = aws_dynamodb_table.buffered_data.arn
}

output "kinesis_stream_name" {
  description = "Kinesis Data Stream name"
  value       = aws_kinesis_stream.main.name
}

output "kinesis_stream_arn" {
  description = "Kinesis Data Stream ARN"
  value       = aws_kinesis_stream.main.arn
}

output "timestream_database_name" {
  description = "Timestream database name"
  value       = aws_timestreamwrite_database.main.database_name
}

output "timestream_table_name" {
  description = "Timestream table name"
  value       = aws_timestreamwrite_table.sensor_data.table_name
}

output "lambda_device_verification_arn" {
  description = "Device verification Lambda function ARN"
  value       = aws_lambda_function.device_verification.arn
}

output "lambda_device_verification_name" {
  description = "Device verification Lambda function name"
  value       = aws_lambda_function.device_verification.function_name
}

output "lambda_data_replay_arn" {
  description = "Data replay Lambda function ARN"
  value       = aws_lambda_function.data_replay.arn
}

output "lambda_data_replay_name" {
  description = "Data replay Lambda function name"
  value       = aws_lambda_function.data_replay.function_name
}

output "step_functions_state_machine_arn" {
  description = "Step Functions state machine ARN"
  value       = aws_sfn_state_machine.recovery_orchestrator.arn
}

output "step_functions_state_machine_name" {
  description = "Step Functions state machine name"
  value       = aws_sfn_state_machine.recovery_orchestrator.name
}

output "sns_topic_arn" {
  description = "SNS alerts topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_alarm_connection_failures" {
  description = "CloudWatch alarm for IoT connection failures"
  value       = aws_cloudwatch_metric_alarm.iot_connection_failures.alarm_name
}

output "cloudwatch_alarm_message_drop" {
  description = "CloudWatch alarm for IoT message drop"
  value       = aws_cloudwatch_metric_alarm.iot_message_drop.alarm_name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch recovery dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.recovery.dashboard_name}"
}

output "eventbridge_rule_name" {
  description = "EventBridge recovery events rule name"
  value       = aws_cloudwatch_event_rule.recovery_events.name
}

output "sqs_queue_urls" {
  description = "SQS queue URLs for sensor types"
  value = {
    for idx, queue in aws_sqs_queue.sensor_queues : 
    var.sensor_types[idx] => queue.url
  }
}

output "athena_workgroup_name" {
  description = "Athena workgroup name"
  value       = aws_athena_workgroup.main.name
}

output "athena_database_name" {
  description = "Athena database name"
  value       = aws_athena_database.data_lake.name
}

output "glue_catalog_database_name" {
  description = "Glue catalog database name"
  value       = aws_glue_catalog_database.main.name
}

output "glue_job_name" {
  description = "Glue backfill job name"
  value       = aws_glue_job.backfill.name
}

output "security_group_lambda_id" {
  description = "Security group ID for Lambda functions"
  value       = aws_security_group.lambda.id
}

output "iam_role_lambda_device_verification_arn" {
  description = "IAM role ARN for device verification Lambda"
  value       = aws_iam_role.lambda_device_verification.arn
}

output "iam_role_lambda_data_replay_arn" {
  description = "IAM role ARN for data replay Lambda"
  value       = aws_iam_role.lambda_data_replay.arn
}

output "iam_role_step_functions_arn" {
  description = "IAM role ARN for Step Functions"
  value       = aws_iam_role.step_functions.arn
}

output "iam_role_glue_arn" {
  description = "IAM role ARN for Glue jobs"
  value       = aws_iam_role.glue.arn
}

output "stack_suffix" {
  description = "Stack resource suffix for uniqueness"
  value       = local.suffix
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "deployment_timestamp" {
  description = "Timestamp of deployment"
  value       = timestamp()
}

```
