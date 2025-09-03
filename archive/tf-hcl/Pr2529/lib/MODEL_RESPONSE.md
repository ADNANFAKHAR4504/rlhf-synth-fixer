I'll create a comprehensive Terraform configuration that meets all your requirements. Here's the complete solution organized into multiple `.tf` files:

## 1. Provider and Variables Configuration

**`providers.tf`**
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

provider "aws" {
  region = var.aws_region
}
```

**`variables.tf`**
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0abcdef1234567890"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for read-only access"
  type        = string
  default     = "my-production-bucket"
}

variable "route53_zone_name" {
  description = "Route 53 hosted zone name"
  type        = string
  default     = "example.com"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name"
  type        = string
  default     = "my-key-pair"
}

# Common tags
variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Department  = "IT"
  }
}
```

## 2. Data Sources

**`data.tf`**
```hcl
# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Get Route 53 hosted zone
data "aws_route53_zone" "main" {
  name         = var.route53_zone_name
  private_zone = false
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}
```

## 3. KMS Key for RDS Encryption

**`kms.tf`**
```hcl
resource "aws_kms_key" "rds_encryption" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7
  
  tags = merge(var.common_tags, {
    Name = "rds-encryption-key"
  })
}

resource "aws_kms_alias" "rds_encryption" {
  name          = "alias/rds-encryption"
  target_key_id = aws_kms_key.rds_encryption.key_id
}
```

## 4. VPC Configuration

**`vpc.tf`**
```hcl
# VPC 1
resource "aws_vpc" "vpc1" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "vpc-1"
  })
}

# VPC 2
resource "aws_vpc" "vpc2" {
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "vpc-2"
  })
}

# Internet Gateways
resource "aws_internet_gateway" "igw1" {
  vpc_id = aws_vpc.vpc1.id

  tags = merge(var.common_tags, {
    Name = "igw-vpc1"
  })
}

resource "aws_internet_gateway" "igw2" {
  vpc_id = aws_vpc.vpc2.id

  tags = merge(var.common_tags, {
    Name = "igw-vpc2"
  })
}

# VPC Peering Connection
resource "aws_vpc_peering_connection" "peer" {
  peer_vpc_id = aws_vpc.vpc2.id
  vpc_id      = aws_vpc.vpc1.id
  auto_accept = true

  tags = merge(var.common_tags, {
    Name = "vpc1-to-vpc2-peering"
  })
}
```

## 5. Subnets Configuration

**`subnets.tf`**
```hcl
# VPC 1 Subnets
resource "aws_subnet" "vpc1_public" {
  vpc_id                  = aws_vpc.vpc1.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "vpc1-public-subnet"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc1_private" {
  vpc_id            = aws_vpc.vpc1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(var.common_tags, {
    Name = "vpc1-private-subnet"
    Type = "Private"
  })
}

# VPC 2 Subnets
resource "aws_subnet" "vpc2_public" {
  vpc_id                  = aws_vpc.vpc2.id
  cidr_block              = "10.1.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = merge(var.common_tags, {
    Name = "vpc2-public-subnet"
    Type = "Public"
  })
}

resource "aws_subnet" "vpc2_private" {
  vpc_id            = aws_vpc.vpc2.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = merge(var.common_tags, {
    Name = "vpc2-private-subnet"
    Type = "Private"
  })
}

# RDS Subnet Group
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "rds-subnet-group"
  subnet_ids = [aws_subnet.vpc1_private.id, aws_subnet.vpc2_private.id]

  tags = merge(var.common_tags, {
    Name = "rds-subnet-group"
  })
}
```

## 6. Route Tables

**`route_tables.tf`**
```hcl
# VPC 1 Route Tables
resource "aws_route_table" "vpc1_public" {
  vpc_id = aws_vpc.vpc1.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw1.id
  }

  route {
    cidr_block                = aws_vpc.vpc2.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  }

  tags = merge(var.common_tags, {
    Name = "vpc1-public-rt"
  })
}

resource "aws_route_table" "vpc1_private" {
  vpc_id = aws_vpc.vpc1.id

  route {
    cidr_block           = "0.0.0.0/0"
    nat_gateway_id       = aws_nat_gateway.vpc1_nat.id
  }

  route {
    cidr_block                = aws_vpc.vpc2.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  }

  tags = merge(var.common_tags, {
    Name = "vpc1-private-rt"
  })
}

# VPC 2 Route Tables
resource "aws_route_table" "vpc2_public" {
  vpc_id = aws_vpc.vpc2.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw2.id
  }

  route {
    cidr_block                = aws_vpc.vpc1.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  }

  tags = merge(var.common_tags, {
    Name = "vpc2-public-rt"
  })
}

resource "aws_route_table" "vpc2_private" {
  vpc_id = aws_vpc.vpc2.id

  route {
    cidr_block           = "0.0.0.0/0"
    nat_gateway_id       = aws_nat_gateway.vpc2_nat.id
  }

  route {
    cidr_block                = aws_vpc.vpc1.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
  }

  tags = merge(var.common_tags, {
    Name = "vpc2-private-rt"
  })
}

# Route Table Associations
resource "aws_route_table_association" "vpc1_public" {
  subnet_id      = aws_subnet.vpc1_public.id
  route_table_id = aws_route_table.vpc1_public.id
}

resource "aws_route_table_association" "vpc1_private" {
  subnet_id      = aws_subnet.vpc1_private.id
  route_table_id = aws_route_table.vpc1_private.id
}

resource "aws_route_table_association" "vpc2_public" {
  subnet_id      = aws_subnet.vpc2_public.id
  route_table_id = aws_route_table.vpc2_public.id
}

resource "aws_route_table_association" "vpc2_private" {
  subnet_id      = aws_subnet.vpc2_private.id
  route_table_id = aws_route_table.vpc2_private.id
}
```

## 7. NAT Gateways

**`nat_gateways.tf`**
```hcl
# Elastic IPs for NAT Gateways
resource "aws_eip" "vpc1_nat" {
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "vpc1-nat-eip"
  })
}

resource "aws_eip" "vpc2_nat" {
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "vpc2-nat-eip"
  })
}

# NAT Gateways
resource "aws_nat_gateway" "vpc1_nat" {
  allocation_id = aws_eip.vpc1_nat.id
  subnet_id     = aws_subnet.vpc1_public.id

  tags = merge(var.common_tags, {
    Name = "vpc1-nat-gateway"
  })

  depends_on = [aws_internet_gateway.igw1]
}

resource "aws_nat_gateway" "vpc2_nat" {
  allocation_id = aws_eip.vpc2_nat.id
  subnet_id     = aws_subnet.vpc2_public.id

  tags = merge(var.common_tags, {
    Name = "vpc2-nat-gateway"
  })

  depends_on = [aws_internet_gateway.igw2]
}
```

## 8. Security Groups

**`security_groups.tf`**
```hcl
# Security Group for EC2 instances in VPC 1
resource "aws_security_group" "vpc1_ec2_sg" {
  name        = "vpc1-ec2-security-group"
  description = "Security group for EC2 instances in VPC 1"
  vpc_id      = aws_vpc.vpc1.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.vpc1_public.cidr_block]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.vpc1_public.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-sg"
  })
}

# Security Group for EC2 instances in VPC 2
resource "aws_security_group" "vpc2_ec2_sg" {
  name        = "vpc2-ec2-security-group"
  description = "Security group for EC2 instances in VPC 2"
  vpc_id      = aws_vpc.vpc2.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.vpc2_public.cidr_block]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [aws_subnet.vpc2_public.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-sg"
  })
}

# Security Group for RDS
resource "aws_security_group" "rds_sg" {
  name        = "rds-security-group"
  description = "Security group for RDS instances"
  vpc_id      = aws_vpc.vpc1.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.vpc1_ec2_sg.id, aws_security_group.vpc2_ec2_sg.id]
  }

  tags = merge(var.common_tags, {
    Name = "rds-sg"
  })
}
```

## 9. IAM Roles and Policies

**`iam.tf`**
```hcl
# IAM Role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = "ec2-s3-readonly-role"

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

  tags = var.common_tags
}

# IAM Policy for S3 read-only access
resource "aws_iam_policy" "s3_readonly_policy" {
  name        = "s3-readonly-policy"
  description = "Policy for read-only access to specific S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })

  tags = var.common_tags
}

# CloudWatch Logs policy
resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name        = "cloudwatch-logs-policy"
  description = "Policy for CloudWatch Logs access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = "*"
      }
    ]
  })

  tags = var.common_tags
}

# Attach policies to role
resource "aws_iam_role_policy_attachment" "s3_readonly_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_readonly_policy.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch_logs_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-instance-profile"
  role = aws_iam_role.ec2_role.name

  tags = var.common_tags
}
```

## 10. CloudWatch Log Groups

**`cloudwatch.tf`**
```hcl
# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "vpc1_ec2_logs" {
  name              = "/aws/ec2/vpc1"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-logs"
  })
}

resource "aws_cloudwatch_log_group" "vpc2_ec2_logs" {
  name              = "/aws/ec2/vpc2"
  retention_in_days = 30

  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-logs"
  })
}
```

## 11. EC2 Instances

**`ec2.tf`**
```hcl
# Elastic IPs for EC2 instances
resource "aws_eip" "vpc1_ec2_eip" {
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-eip"
  })
}

resource "aws_eip" "vpc2_ec2_eip" {
  domain = "vpc"
  
  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-eip"
  })
}

# EC2 Instance in VPC 1
resource "aws_instance" "vpc1_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.vpc1_private.id
  vpc_security_group_ids = [aws_security_group.vpc1_ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = var.key_pair_name

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = aws_cloudwatch_log_group.vpc1_ec2_logs.name
  }))

  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-instance"
  })
}

# EC2 Instance in VPC 2
resource "aws_instance" "vpc2_ec2" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.vpc2_private.id
  vpc_security_group_ids = [aws_security_group.vpc2_ec2_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name
  key_name               = var.key_pair_name

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = aws_cloudwatch_log_group.vpc2_ec2_logs.name
  }))

  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-instance"
  })
}

# Associate Elastic IPs with EC2 instances
resource "aws_eip_association" "vpc1_ec2_eip_assoc" {
  instance_id   = aws_instance.vpc1_ec2.id
  allocation_id = aws_eip.vpc1_ec2_eip.id
}

resource "aws_eip_association" "vpc2_ec2_eip_assoc" {
  instance_id   = aws_instance.vpc2_ec2.id
  allocation_id = aws_eip.vpc2_ec2_eip.id
}
```

## 12. User Data Script

**`user_data.sh`**
```bash
#!/bin/bash
yum update -y
yum install -y awslogs

# Configure CloudWatch Logs agent
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = ${log_group_name}
log_stream_name = {instance_id}/var/log/messages
datetime_format = %b %d %H:%M:%S

[/var/log/secure]
file = /var/log/secure
log_group_name = ${log_group_name}
log_stream_name = {instance_id}/var/log/secure
datetime_format = %b %d %H:%M:%S
EOF

# Start CloudWatch Logs agent
systemctl start awslogsd
systemctl enable awslogsd

# Install and start Apache
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
```

## 13. RDS Instance

**`rds.tf`**
```hcl
resource "aws_db_instance" "main" {
  identifier             = "main-database"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp2"
  storage_encrypted      = true
  kms_key_id            = aws_kms_key.rds_encryption.arn
  
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"
  
  db_name  = "maindb"
  username = "admin"
  password = "changeme123!" # In production, use AWS Secrets Manager
  
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  deletion_protection = false
  
  tags = merge(var.common_tags, {
    Name = "main-database"
  })
}
```

## 14. Route 53 DNS Records

**`route53.tf`**
```hcl
# Route 53 DNS records for EC2 instances
resource "aws_route53_record" "vpc1_ec2" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "vpc1-app.${var.route53_zone_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.vpc1_ec2_eip.public_ip]

  depends_on = [aws_eip_association.vpc1_ec2_eip_assoc]
}

resource "aws_route53_record" "vpc2_ec2" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "vpc2-app.${var.route53_zone_name}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.vpc2_ec2_eip.public_ip]

  depends_on = [aws_eip_association.vpc2_ec2_eip_assoc]
}
```

## 15. Outputs

**`outputs.tf`**
```hcl
output "vpc1_id" {
  description = "ID of VPC 1"
  value       = aws_vpc.vpc1.id
}

output "vpc2_id" {
  description = "ID of VPC 2"
  value       = aws_vpc.vpc2.id
}

output "vpc_peering_connection_id" {
  description = "ID of VPC peering connection"
  value       = aws_vpc_peering_connection.peer.id
}

output "vpc1_ec2_private_ip" {
  description = "Private IP of VPC 1 EC2 instance"
  value       = aws_instance.vpc1_ec2.private_ip
}

output "vpc2_ec2_private_ip" {
  description = "Private IP of VPC 2 EC2 instance"
  value       = aws_instance.vpc2_ec2.private_ip
}

output "vpc1_ec2_public_ip" {
  description = "Public IP of VPC 1 EC2 instance"
  value       = aws_eip.vpc1_ec2_eip.public_ip
}

output "vpc2_ec2_public_ip" {
  description = "Public IP of VPC 2 EC2 instance"
  value       = aws_eip.vpc2_ec2_eip.public_ip
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "route53_records" {
  description = "Route 53 DNS records"
  value = {
    vpc1_app = aws_route53_record.vpc1_ec2.fqdn
    vpc2_app = aws_route53_record.vpc2_ec2.fqdn
  }
}
```

## 16. Terraform Configuration File

**`terraform.tfvars.example`**
```hcl
# Copy this file to terraform.tfvars and update the values
aws_region        = "us-west-2"
ami_id           = "ami-0abcdef1234567890"
instance_type    = "t3.micro"
s3_bucket_name   = "my-production-bucket"
route53_zone_name = "example.com"
key_pair_name    = "my-key-pair"
```

## Deployment Instructions

1. **Prerequisites:**
   - Install Terraform (>= 1.0)
   - Configure AWS CLI with appropriate credentials
   - Create an EC2 Key Pair in the us-west-2 region
   - Create a Route 53 hosted zone (if not already exists)
   - Create the S3 bucket referenced in variables

2. **Deployment Steps:**
   ```bash
   # Initialize Terraform
   terraform init
   
   # Copy and customize variables
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your specific values
   
   # Plan the deployment
   terraform plan
   
   # Apply the configuration
   terraform apply
   ```

3. **Verification:**
   - Check VPC peering connection status
   - Verify EC2 instances are running in private subnets
   - Test SSH access from bastion hosts in public subnets
   - Verify CloudWatch logs are being generated
   - Check Route 53 DNS resolution
   - Verify RDS encryption is enabled

## Key Features Implemented

**Two VPCs with secure peering connection**
**Public and private subnets in different AZs**
**EC2 instances with specified AMI in private subnets**
**Security groups with SSH/HTTP access from public subnets**
**IAM roles with S3 read-only access**
**CloudWatch Logs integration**
**Elastic IPs for static addressing**
**RDS encryption with customer-managed CMKs**
**Automatic Route 53 DNS record creation**
**Consistent tagging across all resources**

This Terraform configuration provides a robust, secure, and scalable multi-tier architecture in AWS that meets all your specified requirements.