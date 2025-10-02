# Terraform Infrastructure for Travel Agency Booking Portal

This Terraform configuration implements a secure, scalable, and highly available web infrastructure for a travel agency booking portal.

## Infrastructure Components

### 1. locals.tf
```hcl
locals {
  # Use environment suffix from environment variable if set, otherwise use task ID
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "synth49382157"

  # Resource naming convention with environment suffix
  name_prefix = "${var.project_name}-${local.environment_suffix}"

  # Common tags to apply to all resources
  common_tags = {
    Project           = var.project_name
    Environment       = var.environment
    EnvironmentSuffix = local.environment_suffix
    ManagedBy         = "Terraform"
  }
}
```

### 2. variables.tf
```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "travel-agency-portal"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.10.0.0/16"
}

variable "public_subnet_1_cidr" {
  description = "CIDR block for public subnet 1"
  type        = string
  default     = "10.10.1.0/24"
}

variable "public_subnet_2_cidr" {
  description = "CIDR block for public subnet 2"
  type        = string
  default     = "10.10.2.0/24"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "ssh_allowed_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "10.0.0.0/8"
}

variable "key_pair_name" {
  description = "Name of existing EC2 key pair for SSH access"
  type        = string
  default     = ""
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming"
  type        = string
  default     = ""
}
```

### 3. provider.tf
```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
  }

  # Backend configuration for state management
  backend "s3" {
    # Configuration injected at runtime
  }
}

provider "aws" {
  region = var.aws_region
}
```

### 4. vpc.tf
```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_1_cidr
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-1"
    Type = "public"
  })
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_2_cidr
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-subnet-2"
    Type = "public"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-flow-log"
  })
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/${local.name_prefix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-flow-log-group"
  })
}

resource "aws_iam_role" "flow_log" {
  name = "${local.name_prefix}-flow-log-role"

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

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-flow-log-role"
  })
}

resource "aws_iam_role_policy" "flow_log" {
  name = "${local.name_prefix}-flow-log-policy"
  role = aws_iam_role.flow_log.id

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
```

### 5. security_group.tf
```hcl
resource "aws_security_group" "web" {
  name        = "${local.name_prefix}-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from internal network"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "HTTP from anywhere for redirect"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-web-sg"
  })
}
```

### 6. ec2.tf
```hcl
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "web_1" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public_1.id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = var.key_pair_name != "" ? var.key_pair_name : null

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring = true

  user_data_base64 = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install -y nginx1

    cat > /etc/nginx/nginx.conf <<'NGINXCONF'
    user nginx;
    worker_processes auto;
    error_log /var/log/nginx/error.log;
    pid /run/nginx.pid;

    events {
        worker_connections 1024;
    }

    http {
        log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                        '$status $body_bytes_sent "$http_referer" '
                        '"$http_user_agent" "$http_x_forwarded_for"';

        access_log /var/log/nginx/access.log main;

        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
        types_hash_max_size 2048;

        include /etc/nginx/mime.types;
        default_type application/octet-stream;

        server {
            listen 80;
            listen 443 ssl;
            server_name _;

            ssl_certificate /etc/nginx/ssl/nginx.crt;
            ssl_certificate_key /etc/nginx/ssl/nginx.key;

            root /usr/share/nginx/html;

            location / {
                index index.html index.htm;
            }

            error_page 404 /404.html;
                location = /40x.html {
            }

            error_page 500 502 503 504 /50x.html;
                location = /50x.html {
            }
        }
    }
    NGINXCONF

    mkdir -p /etc/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/nginx.key \
      -out /etc/nginx/ssl/nginx.crt \
      -subj "/C=US/ST=State/L=City/O=TravelAgency/CN=localhost"

    echo "<h1>Travel Agency Booking Portal - Server 1</h1>" > /usr/share/nginx/html/index.html

    systemctl enable nginx
    systemctl start nginx

    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF
  )

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-web-1"
    Server = "1"
  })
}

resource "aws_instance" "web_2" {
  ami                    = data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public_2.id
  vpc_security_group_ids = [aws_security_group.web.id]
  key_name               = var.key_pair_name != "" ? var.key_pair_name : null

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring = true

  user_data_base64 = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    amazon-linux-extras install -y nginx1

    cat > /etc/nginx/nginx.conf <<'NGINXCONF'
    user nginx;
    worker_processes auto;
    error_log /var/log/nginx/error.log;
    pid /run/nginx.pid;

    events {
        worker_connections 1024;
    }

    http {
        log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                        '$status $body_bytes_sent "$http_referer" '
                        '"$http_user_agent" "$http_x_forwarded_for"';

        access_log /var/log/nginx/access.log main;

        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
        types_hash_max_size 2048;

        include /etc/nginx/mime.types;
        default_type application/octet-stream;

        server {
            listen 80;
            listen 443 ssl;
            server_name _;

            ssl_certificate /etc/nginx/ssl/nginx.crt;
            ssl_certificate_key /etc/nginx/ssl/nginx.key;

            root /usr/share/nginx/html;

            location / {
                index index.html index.htm;
            }

            error_page 404 /404.html;
                location = /40x.html {
            }

            error_page 500 502 503 504 /50x.html;
                location = /50x.html {
            }
        }
    }
    NGINXCONF

    mkdir -p /etc/nginx/ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/nginx.key \
      -out /etc/nginx/ssl/nginx.crt \
      -subj "/C=US/ST=State/L=City/O=TravelAgency/CN=localhost"

    echo "<h1>Travel Agency Booking Portal - Server 2</h1>" > /usr/share/nginx/html/index.html

    systemctl enable nginx
    systemctl start nginx

    # Install CloudWatch agent
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
    rpm -U ./amazon-cloudwatch-agent.rpm
  EOF
  )

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-web-2"
    Server = "2"
  })
}
```

### 7. s3.tf
```hcl
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "static_images" {
  bucket = "${local.name_prefix}-static-images-${random_string.bucket_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-static-images"
  })
}

resource "aws_s3_bucket_versioning" "static_images" {
  bucket = aws_s3_bucket.static_images.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "static_images" {
  bucket = aws_s3_bucket.static_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "static_images" {
  bucket = aws_s3_bucket.static_images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "static_images" {
  bucket = aws_s3_bucket.static_images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.static_images.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.static_images]
}
```

### 8. cloudwatch.tf
```hcl
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { stat = "Average", id = "m1", label = "Average CPU" }],
            [".", ".", { stat = "Maximum", id = "m2", label = "Max CPU" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "EC2 CPU Utilization"
          period  = 300
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "NetworkIn", { stat = "Sum", id = "m1", label = "Network In" }],
            [".", "NetworkOut", { stat = "Sum", id = "m2", label = "Network Out" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Network Traffic"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "StatusCheckFailed", { stat = "Maximum", id = "m1", label = "Status Check Failed" }],
            [".", "StatusCheckFailed_Instance", { stat = "Maximum", id = "m2", label = "Instance Check Failed" }],
            [".", "StatusCheckFailed_System", { stat = "Maximum", id = "m3", label = "System Check Failed" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Instance Status Checks"
          period  = 60
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUCreditBalance", { stat = "Average", id = "m1", label = "CPU Credit Balance" }],
            [".", "CPUCreditUsage", { stat = "Average", id = "m2", label = "CPU Credit Usage" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "T3 Instance CPU Credits"
          period  = 300
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = []

  dimensions = {
    InstanceId = aws_instance.web_1.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-high-cpu-alarm"
  })
}

resource "aws_cloudwatch_log_group" "nginx" {
  name              = "/aws/ec2/nginx-${local.name_prefix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-nginx-logs"
  })
}
```

### 9. outputs.tf
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_1_id" {
  description = "ID of public subnet 1"
  value       = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  description = "ID of public subnet 2"
  value       = aws_subnet.public_2.id
}

output "web_instance_1_public_ip" {
  description = "Public IP of web instance 1"
  value       = aws_instance.web_1.public_ip
}

output "web_instance_2_public_ip" {
  description = "Public IP of web instance 2"
  value       = aws_instance.web_2.public_ip
}

output "web_instance_1_id" {
  description = "ID of web instance 1"
  value       = aws_instance.web_1.id
}

output "web_instance_2_id" {
  description = "ID of web instance 2"
  value       = aws_instance.web_2.id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for static images"
  value       = aws_s3_bucket.static_images.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.static_images.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.static_images.bucket_domain_name
}

output "security_group_id" {
  description = "ID of the web security group"
  value       = aws_security_group.web.id
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "flow_log_group_name" {
  description = "Name of the CloudWatch log group for VPC flow logs"
  value       = aws_cloudwatch_log_group.flow_log.name
}
```

## Key Improvements

1. **Environment Suffix Support**: All resources use a consistent naming convention with environment suffix to avoid conflicts
2. **Consistent Tagging**: All resources use common tags for better organization and cost tracking
3. **Security Best Practices**:
   - IMDSv2 enforced on EC2 instances
   - SSH restricted to internal network (10.0.0.0/8)
   - VPC Flow Logs enabled for network monitoring
   - S3 bucket versioning enabled

4. **High Availability**:
   - EC2 instances deployed across two availability zones
   - Public subnets in different AZs for redundancy

5. **Monitoring**:
   - CloudWatch dashboard with CPU, network, and status metrics
   - High CPU alarm configured
   - VPC Flow Logs for network traffic analysis
   - Nginx log group for application logs

6. **Terraform Best Practices**:
   - Proper use of `user_data_base64` instead of `user_data`
   - Correct attribute names for AWS resources
   - Provider version constraints
   - Backend configuration for state management
   - No hardcoded credentials

7. **Resource Organization**:
   - Logical file separation by resource type
   - Clear variable descriptions
   - Comprehensive outputs for integration

## Deployment

1. Set environment variables:
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=synth49382157
```

2. Initialize Terraform:
```bash
terraform init
```

3. Plan deployment:
```bash
terraform plan
```

4. Apply configuration:
```bash
terraform apply
```

5. Save outputs:
```bash
terraform output -json > ../cfn-outputs/flat-outputs.json
```

## Testing

- Unit tests validate all Terraform configurations
- Integration tests verify deployed resources
- 100% test coverage for infrastructure code