I'll create a comprehensive Terraform configuration that meets all your security requirements. This will be a multi-file setup using best practices for organization and security.

## Main Configuration Files

### 1. Provider and Backend Configuration (`providers.tf`)

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider
provider "aws" {
  alias  = "primary"
  region = var.primary_region
  
  default_tags {
    tags = {
      Environment = "secure-env"
      ManagedBy   = "terraform"
      Project     = "secure-infrastructure"
    }
  }
}

# Secondary region provider
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  
  default_tags {
    tags = {
      Environment = "secure-env"
      ManagedBy   = "terraform"
      Project     = "secure-infrastructure"
    }
  }
}
```

### 2. Variables (`variables.tf`)

```hcl
variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "allowed_ssh_cidr" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # Restrict this in production
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "secure-env"
}
```

### 3. KMS Configuration (`kms.tf`)

```hcl
# KMS Key for primary region
resource "aws_kms_key" "secure_env_primary" {
  provider                = aws.primary
  description             = "secure-env KMS key for primary region"
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
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "secure-env-kms-primary"
  }
}

resource "aws_kms_alias" "secure_env_primary" {
  provider      = aws.primary
  name          = "alias/secure-env-primary"
  target_key_id = aws_kms_key.secure_env_primary.key_id
}

# KMS Key for secondary region
resource "aws_kms_key" "secure_env_secondary" {
  provider                = aws.secondary
  description             = "secure-env KMS key for secondary region"
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
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "secure-env-kms-secondary"
  }
}

resource "aws_kms_alias" "secure_env_secondary" {
  provider      = aws.secondary
  name          = "alias/secure-env-secondary"
  target_key_id = aws_kms_key.secure_env_secondary.key_id
}

data "aws_caller_identity" "current" {}
```

### 4. VPC Module (`modules/vpc/main.tf`)

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.name_prefix}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name_prefix}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = false  # Explicit control over public IPs

  tags = {
    Name = "${var.name_prefix}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.name_prefix}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name = "${var.name_prefix}-nat-eip-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.name_prefix}-nat-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.name_prefix}-public-rt"
  }
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "${var.name_prefix}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = var.flow_log_role_arn
  log_destination = var.flow_log_destination_arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}
```

### 5. VPC Module Variables (`modules/vpc/variables.tf`)

```hcl
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "flow_log_role_arn" {
  description = "IAM role ARN for VPC flow logs"
  type        = string
}

variable "flow_log_destination_arn" {
  description = "CloudWatch log group ARN for VPC flow logs"
  type        = string
}
```

### 6. VPC Module Outputs (`modules/vpc/outputs.tf`)

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}
```

### 7. IAM Roles and Policies (`iam.tf`)

```hcl
# CloudWatch Logs for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs_primary" {
  provider          = aws.primary
  name              = "/aws/vpc/secure-env-primary-flow-logs"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.secure_env_primary.arn

  tags = {
    Name = "secure-env-vpc-flow-logs-primary"
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_secondary" {
  provider          = aws.secondary
  name              = "/aws/vpc/secure-env-secondary-flow-logs"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.secure_env_secondary.arn

  tags = {
    Name = "secure-env-vpc-flow-logs-secondary"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_log" {
  name = "secure-env-vpc-flow-log-role"

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
    Name = "secure-env-vpc-flow-log-role"
  }
}

resource "aws_iam_role_policy" "vpc_flow_log" {
  name = "secure-env-vpc-flow-log-policy"
  role = aws_iam_role.vpc_flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          aws_cloudwatch_log_group.vpc_flow_logs_primary.arn,
          aws_cloudwatch_log_group.vpc_flow_logs_secondary.arn,
          "${aws_cloudwatch_log_group.vpc_flow_logs_primary.arn}:*",
          "${aws_cloudwatch_log_group.vpc_flow_logs_secondary.arn}:*"
        ]
      }
    ]
  })
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "secure-env-lambda-role"

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
    Name = "secure-env-lambda-role"
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "secure-env-lambda-policy"
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

# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "secure-env-ec2-role"

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
    Name = "secure-env-ec2-role"
  }
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "secure-env-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "secure-env-ec2-profile"
  role = aws_iam_role.ec2_role.name
}
```

### 8. Security Groups (`security_groups.tf`)

```hcl
# Security Group for Public EC2 instances (bastion hosts)
resource "aws_security_group" "secure_env_public_ec2_primary" {
  provider    = aws.primary
  name        = "secure-env-public-ec2-sg-primary"
  description = "Security group for public EC2 instances in primary region"
  vpc_id      = module.vpc_primary.vpc_id

  ingress {
    description = "SSH from allowed CIDRs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "secure-env-public-ec2-sg-primary"
  }
}

resource "aws_security_group" "secure_env_public_ec2_secondary" {
  provider    = aws.secondary
  name        = "secure-env-public-ec2-sg-secondary"
  description = "Security group for public EC2 instances in secondary region"
  vpc_id      = module.vpc_secondary.vpc_id

  ingress {
    description = "SSH from allowed CIDRs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidr
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "secure-env-public-ec2-sg-secondary"
  }
}

# Security Group for Private EC2 instances
resource "aws_security_group" "secure_env_private_ec2_primary" {
  provider    = aws.primary
  name        = "secure-env-private-ec2-sg-primary"
  description = "Security group for private EC2 instances in primary region"
  vpc_id      = module.vpc_primary.vpc_id

  ingress {
    description     = "SSH from public EC2 instances"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.secure_env_public_ec2_primary.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "secure-env-private-ec2-sg-primary"
  }
}

resource "aws_security_group" "secure_env_private_ec2_secondary" {
  provider    = aws.secondary
  name        = "secure-env-private-ec2-sg-secondary"
  description = "Security group for private EC2 instances in secondary region"
  vpc_id      = module.vpc_secondary.vpc_id

  ingress {
    description     = "SSH from public EC2 instances"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.secure_env_public_ec2_secondary.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "secure-env-private-ec2-sg-secondary"
  }
}

# Security Group for Lambda functions
resource "aws_security_group" "secure_env_lambda_primary" {
  provider    = aws.primary
  name        = "secure-env-lambda-sg-primary"
  description = "Security group for Lambda functions in primary region"
  vpc_id      = module.vpc_primary.vpc_id

  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "secure-env-lambda-sg-primary"
  }
}

resource "aws_security_group" "secure_env_lambda_secondary" {
  provider    = aws.secondary
  name        = "secure-env-lambda-sg-secondary"
  description = "Security group for Lambda functions in secondary region"
  vpc_id      = module.vpc_secondary.vpc_id

  egress {
    description = "HTTPS outbound"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "secure-env-lambda-sg-secondary"
  }
}
```

### 9. EC2 Instances (`ec2.tf`)

```hcl
# Data source for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_primary" {
  provider    = aws.primary
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

data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
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

# Key Pairs
resource "aws_key_pair" "secure_env_primary" {
  provider   = aws.primary
  key_name   = "secure-env-key-primary"
  public_key = file("~/.ssh/id_rsa.pub")  # Update path as needed

  tags = {
    Name = "secure-env-key-primary"
  }
}

resource "aws_key_pair" "secure_env_secondary" {
  provider   = aws.secondary
  key_name   = "secure-env-key-secondary"
  public_key = file("~/.ssh/id_rsa.pub")  # Update path as needed

  tags = {
    Name = "secure-env-key-secondary"
  }
}

# Public EC2 instance (bastion) in primary region
resource "aws_instance" "secure_env_bastion_primary" {
  provider                    = aws.primary
  ami                         = data.aws_ami.amazon_linux_primary.id
  instance_type               = "t3.micro"
  key_name                    = aws_key_pair.secure_env_primary.key_name
  subnet_id                   = module.vpc_primary.public_subnet_ids[0]
  vpc_security_group_ids      = [aws_security_group.secure_env_public_ec2_primary.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.secure_env_primary.arn
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = "/aws/ec2/secure-env-bastion-primary"
    region         = var.primary_region
  }))

  tags = {
    Name = "secure-env-bastion-primary"
    Type = "Bastion"
  }
}

# Public EC2 instance (bastion) in secondary region
resource "aws_instance" "secure_env_bastion_secondary" {
  provider                    = aws.secondary
  ami                         = data.aws_ami.amazon_linux_secondary.id
  instance_type               = "t3.micro"
  key_name                    = aws_key_pair.secure_env_secondary.key_name
  subnet_id                   = module.vpc_secondary.public_subnet_ids[0]
  vpc_security_group_ids      = [aws_security_group.secure_env_public_ec2_secondary.id]
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.secure_env_secondary.arn
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = "/aws/ec2/secure-env-bastion-secondary"
    region         = var.secondary_region
  }))

  tags = {
    Name = "secure-env-bastion-secondary"
    Type = "Bastion"
  }
}

# Private EC2 instances
resource "aws_instance" "secure_env_private_primary" {
  provider               = aws.primary
  ami                    = data.aws_ami.amazon_linux_primary.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.secure_env_primary.key_name
  subnet_id              = module.vpc_primary.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.secure_env_private_ec2_primary.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.secure_env_primary.arn
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = "/aws/ec2/secure-env-private-primary"
    region         = var.primary_region
  }))

  tags = {
    Name = "secure-env-private-primary"
    Type = "Private"
  }
}

resource "aws_instance" "secure_env_private_secondary" {
  provider               = aws.secondary
  ami                    = data.aws_ami.amazon_linux_secondary.id
  instance_type          = "t3.micro"
  key_name               = aws_key_pair.secure_env_secondary.key_name
  subnet_id              = module.vpc_secondary.private_subnet_ids[0]
  vpc_security_group_ids = [aws_security_group.secure_env_private_ec2_secondary.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20
    encrypted             = true
    kms_key_id            = aws_kms_key.secure_env_secondary.arn
    delete_on_termination = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = "/aws/ec2/secure-env-private-secondary"
    region         = var.secondary_region
  }))

  tags = {
    Name = "secure-env-private-secondary"
    Type = "Private"
  }
}
```

### 10. User Data Script (`user_data.sh`)

```bash
#!/bin/bash
yum update -y
yum install -y awslogs

# Configure CloudWatch agent
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = ${log_group_name}
log_stream_name = {instance_id}/messages
datetime_format = %b %d %H:%M:%S

[/var/log/secure]
file = /var/log/secure
log_group_name = ${log_group_name}
log_stream_name = {instance_id}/secure
datetime_format = %b %d %H:%M:%S
EOF

# Configure region
sed -i 's/region = us-east-1/region = ${region}/' /etc/awslogs/awscli.conf

# Start and enable CloudWatch logs
systemctl start awslogsd
systemctl enable awslogsd

# Install CloudWatch agent for metrics
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Basic security hardening
systemctl disable postfix
systemctl stop postfix
```

### 11. Lambda Functions (`lambda.tf`)

```hcl
# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda_logs_primary" {
  provider          = aws.primary
  name              = "/aws/lambda/secure-env-function-primary"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.secure_env_primary.arn

  tags = {
    Name = "secure-env-lambda-logs-primary"
  }
}

resource "aws_cloudwatch_log_group" "lambda_logs_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/secure-env-function-secondary"
  retention_in_days = 14
  kms_key_id        = aws_kms_key.secure_env_secondary.arn

  tags = {
    Name = "secure-env-lambda-logs-secondary"
  }
}

# Lambda function code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"
  source {
    content = <<EOF
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info('Lambda function invoked')
    logger.info(f'Event: {json.dumps(event)}')
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from secure-env Lambda function!',
            'event': event
        })
    }
EOF
    filename = "lambda_function.py"
  }
}

# Lambda function in primary region
resource "aws_lambda_function" "secure_env_primary" {
  provider         = aws.primary
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "secure-env-function-primary"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda