# provider.tf

```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```


# tap-stack.tf

```hcl
# tap-stack.tf - ML Training Infrastructure for Distributed GPU Workloads

# ===========================
# Variables
# ===========================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "ml-training"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "custom_ami_id" {
  description = "Custom AMI ID for Deep Learning instances (optional)"
  type        = string
  default     = ""
}

variable "fleet_target_capacity" {
  description = "Target capacity for EC2 Fleet"
  type        = number
  default     = 6
}

variable "hyperparams" {
  description = "Model hyperparameters"
  type        = map(string)
  default = {
    learning_rate = "0.001"
    batch_size    = "64"
    epochs        = "100"
  }
}

variable "aws_region" {
  description = "aws region to deploy resources in"
  type        = string
  default     = ""
}

# ===========================
# Data Sources
# ===========================

data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

# Get latest Deep Learning AMI
data "aws_ami" "deep_learning" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["Deep Learning AMI Neuron (Ubuntu 22.04) 20250718*"]
  }
}

# ===========================
# Networking Resources
# ===========================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-igw-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-eip-nat-${var.availability_zones[count.index]}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Subnets for NAT Gateways
resource "aws_subnet" "public" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-public-subnet-${var.availability_zones[count.index]}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-private-subnet-${var.availability_zones[count.index]}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Type        = "private"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.project_name}-nat-${var.availability_zones[count.index]}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.project_name}-public-rt-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Private Route Tables
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "${var.project_name}-private-rt-${var.availability_zones[count.index]}-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = {
    Name        = "${var.project_name}-vpce-s3-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat([aws_route_table.public.id], aws_route_table.private[*].id)

  tags = {
    Name        = "${var.project_name}-vpce-dynamodb-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Security Group for ML Training Instances
resource "aws_security_group" "ml_training" {
  name        = "${var.project_name}-ml-training-sg-${var.environment}"
  description = "Security group for ML training instances"
  vpc_id      = aws_vpc.main.id

  # Allow all internal communication within VPC
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow all internal TCP communication"
  }

  # Allow ICMP for debugging
  ingress {
    from_port   = -1
    to_port     = -1
    protocol    = "icmp"
    cidr_blocks = [var.vpc_cidr]
    description = "Allow ICMP within VPC"
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = {
    Name        = "${var.project_name}-ml-training-sg-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ===========================
# IAM Resources
# ===========================

# IAM Role for EC2 Instances
resource "aws_iam_role" "ml_training_instance" {
  name = "${var.project_name}-ml-training-instance-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-ml-training-instance-role-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Policy for ML Training Instances
resource "aws_iam_role_policy" "ml_training_instance" {
  name = "${var.project_name}-ml-training-instance-policy-${var.environment}"
  role = aws_iam_role.ml_training_instance.id

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
          "${aws_s3_bucket.training_data.arn}/*",
          aws_s3_bucket.model_artifacts.arn,
          "${aws_s3_bucket.model_artifacts.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.experiments.arn,
          "${aws_dynamodb_table.experiments.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/ml/*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:SendCommand",
          "ssm:ListCommandInvocations"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Instance Profile
resource "aws_iam_instance_profile" "ml_training" {
  name = "${var.project_name}-ml-training-instance-profile-${var.environment}"
  role = aws_iam_role.ml_training_instance.name
}

# ===========================
# Storage Resources
# ===========================

# S3 Bucket for Training Data
resource "aws_s3_bucket" "training_data" {
  bucket = "ml-training-data-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "ml-training-data-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "ML Training Data Storage"
  }
}

# S3 Bucket for Model Artifacts
resource "aws_s3_bucket" "model_artifacts" {
  bucket = "ml-model-artifacts-${var.environment}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "ml-model-artifacts-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "ML Model Artifacts Storage"
  }
}

# Bucket Versioning
resource "aws_s3_bucket_versioning" "training_data" {
  bucket = aws_s3_bucket.training_data.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_versioning" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Bucket Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "training_data" {
  bucket = aws_s3_bucket.training_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Block Public Access
resource "aws_s3_bucket_public_access_block" "training_data" {
  bucket = aws_s3_bucket.training_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle Rules
resource "aws_s3_bucket_lifecycle_configuration" "training_data" {
  bucket = aws_s3_bucket.training_data.id

  rule {
    id     = "archive-to-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "model_artifacts" {
  bucket = aws_s3_bucket.model_artifacts.id

  rule {
    id     = "archive-to-glacier"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "GLACIER"
    }
  }
}

# ===========================
# DynamoDB Table
# ===========================

resource "aws_dynamodb_table" "experiments" {
  name         = "${var.project_name}-experiments-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "experiment_id"
  range_key    = "run_id"

  attribute {
    name = "experiment_id"
    type = "S"
  }

  attribute {
    name = "run_id"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-experiments-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "ML Experiment Tracking"
  }
}

# ===========================
# EC2 Fleet Resources
# ===========================

# Launch Template
resource "aws_launch_template" "ml_training" {
  name_prefix = "${var.project_name}-ml-training-"

  image_id      = var.custom_ami_id != "" ? var.custom_ami_id : data.aws_ami.deep_learning.id
  instance_type = "p3.2xlarge"

  iam_instance_profile {
    arn = aws_iam_instance_profile.ml_training.arn
  }

  vpc_security_group_ids = [aws_security_group.ml_training.id]

  instance_initiated_shutdown_behavior = "terminate"

  monitoring {
    enabled = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  user_data = base64encode(local.user_data_script)

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name        = "${var.project_name}-ml-training-instance-${var.environment}"
      Environment = var.environment
      Project     = var.project_name
      Type        = "ml-training"
    }
  }

  tag_specifications {
    resource_type = "volume"

    tags = {
      Name        = "${var.project_name}-ml-training-volume-${var.environment}"
      Environment = var.environment
      Project     = var.project_name
    }
  }

  tags = {
    Name        = "${var.project_name}-ml-training-lt-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# User Data Script (inline for single file requirement)
locals {
  user_data_script = <<-EOF
#!/bin/bash
set -e

# Update and install dependencies
apt-get update
apt-get install -y python3-pip jq

# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb

# Configure CloudWatch Agent for GPU metrics
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOL
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/ml-training/*.log",
            "log_group_name": "${aws_cloudwatch_log_group.training_logs.name}",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 30
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "ML/Training",
    "metrics_collected": {
      "nvidia_gpu": {
        "measurement": [
          {
            "name": "utilization_gpu",
            "rename": "GPU_Utilization_Percent"
          },
          {
            "name": "utilization_memory",
            "rename": "GPU_Memory_Utilization_Percent"
          },
          {
            "name": "temperature_gpu",
            "rename": "GPU_Temperature"
          }
        ],
        "metrics_collection_interval": 60
      },
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_Idle"
          },
          {
            "name": "cpu_usage_iowait",
            "rename": "CPU_IOWait"
          }
        ],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOL

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Install NVIDIA Docker support
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list
apt-get update && apt-get install -y nvidia-docker2
systemctl restart docker

# Create directory for ML logs
mkdir -p /var/log/ml-training

# GPU metrics collection script
cat > /usr/local/bin/gpu_metrics.py <<'SCRIPT'
#!/usr/bin/env python3
import subprocess
import json
import boto3
import time
from datetime import datetime

cloudwatch = boto3.client('cloudwatch', region_name='${data.aws_region.current.name}')
instance_id = subprocess.check_output(['ec2-metadata', '--instance-id']).decode().split(':')[1].strip()

def get_gpu_metrics():
    try:
        result = subprocess.run(['nvidia-smi', '--query-gpu=utilization.gpu,utilization.memory,temperature.gpu', 
                                '--format=csv,noheader,nounits'], capture_output=True, text=True)
        if result.returncode == 0:
            metrics = result.stdout.strip().split(', ')
            return {
                'gpu_util': float(metrics[0]),
                'mem_util': float(metrics[1]),
                'temperature': float(metrics[2])
            }
    except Exception as e:
        print(f"Error getting GPU metrics: {e}")
    return None

def send_metrics(metrics):
    if not metrics:
        return
    
    metric_data = [
        {
            'MetricName': 'GPU_Utilization_Percent',
            'Value': metrics['gpu_util'],
            'Unit': 'Percent',
            'Dimensions': [
                {'Name': 'InstanceId', 'Value': instance_id},
                {'Name': 'Environment', 'Value': '${var.environment}'}
            ]
        },
        {
            'MetricName': 'GPU_Memory_Utilization_Percent',
            'Value': metrics['mem_util'],
            'Unit': 'Percent',
            'Dimensions': [
                {'Name': 'InstanceId', 'Value': instance_id},
                {'Name': 'Environment', 'Value': '${var.environment}'}
            ]
        },
        {
            'MetricName': 'GPU_Temperature',
            'Value': metrics['temperature'],
            'Unit': 'None',
            'Dimensions': [
                {'Name': 'InstanceId', 'Value': instance_id},
                {'Name': 'Environment', 'Value': '${var.environment}'}
            ]
        }
    ]
    
    try:
        cloudwatch.put_metric_data(
            Namespace='ML/Training',
            MetricData=metric_data
        )
        print(f"Metrics sent at {datetime.now()}: {metrics}")
    except Exception as e:
        print(f"Error sending metrics: {e}")

if __name__ == "__main__":
    while True:
        metrics = get_gpu_metrics()
        send_metrics(metrics)
        time.sleep(60)
SCRIPT

chmod +x /usr/local/bin/gpu_metrics.py

# Create systemd service for GPU metrics
cat > /etc/systemd/system/gpu-metrics.service <<EOL
[Unit]
Description=GPU Metrics Collection Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/gpu_metrics.py
Restart=always
RestartSec=10
User=root

[Install]
WantedBy=multi-user.target
EOL

# Enable and start GPU metrics service
systemctl daemon-reload
systemctl enable gpu-metrics.service
systemctl start gpu-metrics.service

echo "ML Training instance setup complete"
EOF
}

# EC2 Fleet
resource "aws_ec2_fleet" "ml_training" {
  replace_unhealthy_instances = true
  terminate_instances         = true

  launch_template_config {
    launch_template_specification {
      launch_template_id = aws_launch_template.ml_training.id
      version            = "$Latest"
    }

    override {
      instance_type     = "p3.2xlarge"
      subnet_id         = aws_subnet.private[0].id
      weighted_capacity = 1
    }

    override {
      instance_type     = "p3.2xlarge"
      subnet_id         = aws_subnet.private[1].id
      weighted_capacity = 1
    }

    override {
      instance_type     = "p3.2xlarge"
      subnet_id         = aws_subnet.private[2].id
      weighted_capacity = 1
    }
  }

  target_capacity_specification {
    total_target_capacity        = var.fleet_target_capacity
    default_target_capacity_type = "spot"
  }

  spot_options {
    allocation_strategy            = "capacity-optimized"
    instance_interruption_behavior = "terminate"
  }

  type = "maintain"

  tags = {
    Name        = "${var.project_name}-ml-training-fleet-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ===========================
# CloudWatch Resources
# ===========================

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "training_logs" {
  name              = "/aws/ml-training/${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "${var.project_name}-training-logs-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# CloudWatch Alarms for Low GPU Utilization
resource "aws_cloudwatch_metric_alarm" "low_gpu_utilization" {
  alarm_name          = "${var.project_name}-low-gpu-utilization-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "GPU_Utilization_Percent"
  namespace           = "ML/Training"
  period              = "300"
  statistic           = "Average"
  threshold           = "20"
  alarm_description   = "This metric monitors GPU utilization"
  treat_missing_data  = "breaching"

  dimensions = {
    Environment = var.environment
  }

  tags = {
    Name        = "${var.project_name}-low-gpu-alarm-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ===========================
# SSM Parameter Store
# ===========================

resource "aws_ssm_parameter" "learning_rate" {
  name  = "/ml/hparams/learning_rate"
  type  = "SecureString"
  value = var.hyperparams["learning_rate"]

  tags = {
    Name        = "ml-learning-rate-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_ssm_parameter" "batch_size" {
  name  = "/ml/hparams/batch_size"
  type  = "SecureString"
  value = var.hyperparams["batch_size"]

  tags = {
    Name        = "ml-batch-size-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_ssm_parameter" "epochs" {
  name  = "/ml/hparams/epochs"
  type  = "SecureString"
  value = var.hyperparams["epochs"]

  tags = {
    Name        = "ml-epochs-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ===========================
# Outputs
# ===========================

output "s3_training_data_bucket" {
  description = "Name of the S3 bucket for training data"
  value       = aws_s3_bucket.training_data.id
}

output "s3_model_artifacts_bucket" {
  description = "Name of the S3 bucket for model artifacts"
  value       = aws_s3_bucket.model_artifacts.id
}

output "dynamodb_experiments_table" {
  description = "Name of the DynamoDB table for experiment tracking"
  value       = aws_dynamodb_table.experiments.name
}

output "ec2_fleet_id" {
  description = "ID of the EC2 Fleet for ML training"
  value       = aws_ec2_fleet.ml_training.id
}

output "iam_role_name" {
  description = "Name of the IAM role for ML training instances"
  value       = aws_iam_role.ml_training_instance.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}
```
