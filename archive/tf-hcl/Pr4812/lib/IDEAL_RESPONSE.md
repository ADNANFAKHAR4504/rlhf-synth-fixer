## provider.tf

```terraform
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
```

## tap-stack.tf

```terraform
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "financial-app-vpc-${var.environment_suffix}"
  }
}

resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "financial-app-private-subnet-1-${var.environment_suffix}"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "financial-app-private-subnet-2-${var.environment_suffix}"
  }
}

resource "aws_subnet" "public_subnet_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.101.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "financial-app-public-subnet-1-${var.environment_suffix}"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.102.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "financial-app-public-subnet-2-${var.environment_suffix}"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "financial-app-igw-${var.environment_suffix}"
  }
}

resource "aws_eip" "nat_eip" {
  domain = "vpc"

  tags = {
    Name = "financial-app-nat-eip-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet_1.id

  tags = {
    Name = "financial-app-nat-gw-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "financial-app-public-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "public_rta_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rta_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }

  tags = {
    Name = "financial-app-private-rt-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "private_rta_1" {
  subnet_id      = aws_subnet.private_subnet_1.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_rta_2" {
  subnet_id      = aws_subnet.private_subnet_2.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_security_group" "app_sg" {
  name        = "financial-app-sg-${var.environment_suffix}"
  description = "Security group for financial application"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
    description = "Allow internal VPC traffic"
  }

  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS outbound"
  }

  tags = {
    Name = "financial-app-sg-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"

  tags = {
    Name = "financial-app-s3-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint_route_table_association" "s3_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.s3.id
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.dynamodb"

  tags = {
    Name = "financial-app-dynamodb-endpoint-${var.environment_suffix}"
  }
}

resource "aws_vpc_endpoint_route_table_association" "dynamodb_private" {
  route_table_id  = aws_route_table.private_rt.id
  vpc_endpoint_id = aws_vpc_endpoint.dynamodb.id
}

resource "aws_kms_key" "app_kms_key" {
  description             = "KMS key for financial application"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "financial-app-kms-key-${var.environment_suffix}"
  }
}

resource "aws_kms_alias" "app_kms_alias" {
  name          = "alias/financial-app-key-${var.environment_suffix}"
  target_key_id = aws_kms_key.app_kms_key.key_id
}

resource "aws_cloudwatch_log_group" "flow_log_group" {
  name              = "/aws/vpc/flowlogs/financial-app-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.app_kms_key.arn

  tags = {
    Name = "financial-app-flow-logs-${var.environment_suffix}"
  }
}

resource "aws_iam_role" "flow_log_role" {
  name = "financial-app-flow-log-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "financial-app-flow-log-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "flow_log_policy" {
  name = "financial-app-flow-log-policy-${var.environment_suffix}"
  role = aws_iam_role.flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_flow_log" "vpc_flow_log" {
  log_destination      = aws_cloudwatch_log_group.flow_log_group.arn
  log_destination_type = "cloud-watch-logs"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  iam_role_arn         = aws_iam_role.flow_log_role.arn

  tags = {
    Name = "financial-app-vpc-flow-log-${var.environment_suffix}"
  }
}

resource "aws_sns_topic" "alerts_topic" {
  name              = "financial-app-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.app_kms_key.id

  tags = {
    Name = "financial-app-alerts-${var.environment_suffix}"
  }
}

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/financial-app-monitoring-${var.environment_suffix}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.app_kms_key.arn

  tags = {
    Name = "financial-app-lambda-logs-${var.environment_suffix}"
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda_function.zip"

  source {
    content = <<EOF
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const logEvents = event.logEvents || [];
    const suspiciousEvents = [];
    
    for (const logEvent of logEvents) {
      const message = logEvent.message;
      if (message.includes('REJECT')) {
        suspiciousEvents.push({
          timestamp: logEvent.timestamp,
          message: message
        });
      }
    }
    
    if (suspiciousEvents.length > 0) {
      const snsClient = new SNSClient();
      const command = new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: 'Security Alert: Suspicious Network Activity',
        Message: JSON.stringify(suspiciousEvents, null, 2)
      });
      
      await snsClient.send(command);
      console.log('Alert sent successfully');
    }
    
    return { statusCode: 200, body: 'Success' };
  } catch (error) {
    console.error('Error:', error);
    return { statusCode: 500, body: 'Error processing event' };
  }
};
EOF
    filename = "index.js"
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "financial-app-lambda-role-${var.environment_suffix}"

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

  tags = {
    Name = "financial-app-lambda-role-${var.environment_suffix}"
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "financial-app-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/financial-app-monitoring-${var.environment_suffix}:*"
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
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts_topic.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.app_kms_key.arn
      }
    ]
  })
}

resource "aws_lambda_function" "monitoring_lambda" {
  function_name = "financial-app-monitoring-${var.environment_suffix}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 60
  memory_size   = 256

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      SNS_TOPIC_ARN = aws_sns_topic.alerts_topic.arn
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
    security_group_ids = [aws_security_group.app_sg.id]
  }

  tags = {
    Name = "financial-app-monitoring-${var.environment_suffix}"
  }

  depends_on = [aws_cloudwatch_log_group.lambda_log_group]
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monitoring_lambda.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.flow_log_group.arn}:*"
}

resource "aws_cloudwatch_log_subscription_filter" "flow_log_filter" {
  name            = "financial-app-flow-log-filter-${var.environment_suffix}"
  log_group_name  = aws_cloudwatch_log_group.flow_log_group.name
  filter_pattern  = "[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action=REJECT, flowlogstatus]"
  destination_arn = aws_lambda_function.monitoring_lambda.arn

  depends_on = [aws_lambda_permission.allow_cloudwatch]
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
}

output "security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app_sg.id
}

output "s3_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_endpoint_id" {
  description = "ID of the DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}

output "flow_log_group_name" {
  description = "Name of the VPC flow logs CloudWatch log group"
  value       = aws_cloudwatch_log_group.flow_log_group.name
}

output "lambda_function_name" {
  description = "Name of the monitoring Lambda function"
  value       = aws_lambda_function.monitoring_lambda.function_name
}

output "lambda_function_arn" {
  description = "ARN of the monitoring Lambda function"
  value       = aws_lambda_function.monitoring_lambda.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts_topic.arn
}

output "kms_key_id" {
  description = "ID of the KMS key"
  value       = aws_kms_key.app_kms_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key"
  value       = aws_kms_key.app_kms_key.arn
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway"
  value       = aws_nat_gateway.nat_gw.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.igw.id
}
```