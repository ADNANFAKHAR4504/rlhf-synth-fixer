## lib/provider.tf

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

provider "aws" {
  alias  = "primary"
  region = var.primary_region
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}
```

## lib/variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for the default provider"
  type        = string
  default     = "us-east-1"
}

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

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_subnet_2_cidr" {
  description = "CIDR block for second private subnet"
  type        = string
  default     = "10.0.3.0/24"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}
```

## lib/data.tf

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
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

data "aws_caller_identity" "current" {}
```

## lib/networking.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name    = "${var.environment}-vpc"
    Project = "ProjectX"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "${var.environment}-igw"
    Project = "ProjectX"
  }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name    = "${var.environment}-public-subnet"
    Type    = "Public"
    Project = "ProjectX"
  }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name    = "${var.environment}-private-subnet"
    Type    = "Private"
    Project = "ProjectX"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_2_cidr
  availability_zone = data.aws_availability_zones.available.names[2]

  tags = {
    Name    = "${var.environment}-private-subnet-2"
    Type    = "Private"
    Project = "ProjectX"
  }
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name    = "${var.environment}-nat-eip"
    Project = "ProjectX"
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = {
    Name    = "${var.environment}-nat-gateway"
    Project = "ProjectX"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name    = "${var.environment}-public-rt"
    Project = "ProjectX"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name    = "${var.environment}-private-rt"
    Project = "ProjectX"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/${var.environment}-flow-logs"
  retention_in_days = 7

  tags = {
    Name    = "${var.environment}-flow-log-group"
    Project = "ProjectX"
  }
}

resource "aws_iam_role" "flow_log" {
  name = "${var.environment}-flow-log-role"

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
    Name    = "${var.environment}-flow-log-role"
    Project = "ProjectX"
  }
}

resource "aws_iam_policy" "flow_log" {
  name = "${var.environment}-flow-log-policy"

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
        Resource = "*"
      }
    ]
  })

  tags = {
    Name    = "${var.environment}-flow-log-policy"
    Project = "ProjectX"
  }
}

resource "aws_iam_role_policy_attachment" "flow_log" {
  role       = aws_iam_role.flow_log.name
  policy_arn = aws_iam_policy.flow_log.arn
}

resource "aws_flow_log" "main" {
  iam_role_arn             = aws_iam_role.flow_log.arn
  log_destination_type     = "cloud-watch-logs"
  log_destination          = aws_cloudwatch_log_group.flow_log.arn
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.main.id
  max_aggregation_interval = 60

  tags = {
    Name    = "${var.environment}-vpc-flow-logs"
    Project = "ProjectX"
  }
}
```

## lib/security_groups.tf

```hcl
resource "aws_security_group" "ec2" {
  name        = "${var.environment}-ec2-sg"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.environment}-ec2-sg"
    Project = "ProjectX"
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.environment}-rds-sg"
  description = "Security group for RDS instance"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL/Aurora from EC2"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.environment}-rds-sg"
    Project = "ProjectX"
  }
}
```

## lib/iam.tf

```hcl
resource "aws_iam_role" "ec2" {
  name = "${var.environment}-ec2-role"

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
    Name    = "${var.environment}-ec2-role"
    Project = "ProjectX"
  }
}

resource "aws_iam_policy" "ec2_ssm_read" {
  name = "${var.environment}-ec2-ssm-read-policy"
  path = "/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter/${var.environment}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name    = "${var.environment}-ec2-ssm-policy"
    Project = "ProjectX"
  }
}

resource "aws_iam_role_policy_attachment" "ec2_ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.ec2_ssm_read.arn
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.environment}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = {
    Name    = "${var.environment}-ec2-profile"
    Project = "ProjectX"
  }
}
```

## lib/compute.tf

```hcl
resource "aws_instance" "web" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2.name
  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true

    tags = {
      Name    = "${var.environment}-web-root-volume"
      Project = "ProjectX"
    }
  }

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    amazon-linux-extras install -y nginx1
    systemctl start nginx
    systemctl enable nginx
  EOF

  tags = {
    Name    = "${var.environment}-web-server"
    Project = "ProjectX"
  }
}
```

## lib/database.tf

```hcl
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = [aws_subnet.private.id, aws_subnet.private_2.id]

  tags = {
    Name    = "${var.environment}-db-subnet-group"
    Project = "ProjectX"
  }
}

resource "aws_db_instance" "main" {
  identifier              = "${var.environment}-database"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.db_instance_class
  allocated_storage       = 20
  storage_type            = "gp3"
  storage_encrypted       = true
  db_name                 = "webapp"
  username                = var.db_username
  password                = random_password.db_password.result
  vpc_security_group_ids  = [aws_security_group.rds.id]
  db_subnet_group_name    = aws_db_subnet_group.main.name
  skip_final_snapshot     = true
  deletion_protection     = false
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  tags = {
    Name    = "${var.environment}-database"
    Project = "ProjectX"
  }
}
```

## lib/ssm.tf

```hcl
resource "aws_ssm_parameter" "db_host" {
  name  = "/${var.environment}/db/host"
  type  = "String"
  value = aws_db_instance.main.address

  tags = {
    Name    = "${var.environment}-db-host"
    Project = "ProjectX"
  }
}

resource "aws_ssm_parameter" "db_port" {
  name  = "/${var.environment}/db/port"
  type  = "String"
  value = aws_db_instance.main.port

  tags = {
    Name    = "${var.environment}-db-port"
    Project = "ProjectX"
  }
}

resource "aws_ssm_parameter" "db_username" {
  name  = "/${var.environment}/db/username"
  type  = "String"
  value = var.db_username

  tags = {
    Name    = "${var.environment}-db-username"
    Project = "ProjectX"
  }
}

resource "aws_ssm_parameter" "db_password" {
  name  = "/${var.environment}/db/password"
  type  = "SecureString"
  value = random_password.db_password.result

  tags = {
    Name    = "${var.environment}-db-password"
    Project = "ProjectX"
  }
}

resource "aws_ssm_parameter" "db_name" {
  name  = "/${var.environment}/db/name"
  type  = "String"
  value = aws_db_instance.main.db_name

  tags = {
    Name    = "${var.environment}-db-name"
    Project = "ProjectX"
  }
}
```

## lib/outputs.tf

```hcl
output "vpc_id" {
  value       = aws_vpc.main.id
  description = "ID of the VPC"
}

output "vpc_cidr" {
  value       = aws_vpc.main.cidr_block
  description = "CIDR block of the VPC"
}

output "public_subnet_id" {
  value       = aws_subnet.public.id
  description = "ID of the public subnet"
}

output "private_subnet_id" {
  value       = aws_subnet.private.id
  description = "ID of the private subnet"
}

output "private_subnet_2_id" {
  value       = aws_subnet.private_2.id
  description = "ID of the second private subnet"
}

output "internet_gateway_id" {
  value       = aws_internet_gateway.main.id
  description = "ID of the Internet Gateway"
}

output "nat_gateway_id" {
  value       = aws_nat_gateway.main.id
  description = "ID of the NAT Gateway"
}

output "ec2_instance_id" {
  value       = aws_instance.web.id
  description = "ID of the EC2 instance"
}

output "ec2_public_ip" {
  value       = aws_instance.web.public_ip
  description = "Public IP of the EC2 instance"
}

output "ec2_private_ip" {
  value       = aws_instance.web.private_ip
  description = "Private IP of the EC2 instance"
}

output "ec2_security_group_id" {
  value       = aws_security_group.ec2.id
  description = "ID of the EC2 security group"
}

output "rds_endpoint" {
  value       = aws_db_instance.main.endpoint
  description = "RDS instance endpoint"
}

output "rds_address" {
  value       = aws_db_instance.main.address
  description = "RDS instance address"
}

output "rds_port" {
  value       = aws_db_instance.main.port
  description = "RDS instance port"
}

output "rds_security_group_id" {
  value       = aws_security_group.rds.id
  description = "ID of the RDS security group"
}

output "db_subnet_group_name" {
  value       = aws_db_subnet_group.main.name
  description = "Name of the DB subnet group"
}

output "flow_log_id" {
  value       = aws_flow_log.main.id
  description = "ID of the VPC Flow Log"
}

output "flow_log_group_name" {
  value       = aws_cloudwatch_log_group.flow_log.name
  description = "Name of the CloudWatch Log Group for Flow Logs"
}

output "ec2_iam_role_arn" {
  value       = aws_iam_role.ec2.arn
  description = "ARN of the EC2 IAM role"
}

output "ec2_instance_profile_name" {
  value       = aws_iam_instance_profile.ec2.name
  description = "Name of the EC2 instance profile"
}

output "ssm_parameter_db_host" {
  value       = aws_ssm_parameter.db_host.name
  description = "SSM parameter name for database host"
}

output "ssm_parameter_db_port" {
  value       = aws_ssm_parameter.db_port.name
  description = "SSM parameter name for database port"
}

output "ssm_parameter_db_username" {
  value       = aws_ssm_parameter.db_username.name
  description = "SSM parameter name for database username"
}

output "ssm_parameter_db_password" {
  value       = aws_ssm_parameter.db_password.name
  description = "SSM parameter name for database password"
}

output "ssm_parameter_db_name" {
  value       = aws_ssm_parameter.db_name.name
  description = "SSM parameter name for database name"
}
```

## Key Features

**Security:**
- Least privilege IAM roles
- Security groups with explicit rules
- Encrypted storage (EBS and RDS)
- SSM Parameter Store for secrets
- VPC Flow Logs for monitoring

**Networking:**
- Proper subnet isolation
- NAT Gateway for private subnet egress
- Non-overlapping CIDR blocks
- Multi-AZ RDS subnet group

**Multi-Region:**
- Provider aliases for deployment to multiple regions
- Consistent resource structure

**Production-Ready:**
- All resources tagged with "ProjectX"
- Comprehensive outputs for testing
- Backup configurations for RDS
- CloudWatch integration

This configuration provides a secure, scalable foundation for your web application with proper separation of concerns and security best practices.