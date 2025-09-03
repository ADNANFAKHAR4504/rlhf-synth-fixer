# IDEAL_RESPONSE.md

This document provides a comprehensive overview of the Terraform infrastructure code in the `/lib` directory. Each `.tf` file is described, and key code snippets are included for reference. This guide is intended to help users understand the structure, purpose, and configuration of each component in the stack.

---

---
## cloudwatch.tf

Defines CloudWatch log groups for EC2 instances in each VPC, using the environment suffix for uniqueness.

```hcl
resource "aws_cloudwatch_log_group" "vpc1_ec2_logs" {
  name              = "/aws/ec2/vpc1-${var.environment}"
  retention_in_days = 30
  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-logs-${var.environment}"
  })
}

resource "aws_cloudwatch_log_group" "vpc2_ec2_logs" {
  name              = "/aws/ec2/vpc2-${var.environment}"
  retention_in_days = 30
  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-logs-${var.environment}"
  })
}
```

---

## data.tf

Contains data sources for AWS resources, such as Route 53 hosted zones, used for lookups and references.

```hcl
data "aws_route53_zone" "main" {
  count        = var.create_route53_records ? 1 : 0
  name         = var.route53_zone_name
  private_zone = false
}
```

---

## ec2.tf

Defines EC2 instances for each VPC, referencing the appropriate subnets, security groups, and key pair.

```hcl
resource "aws_instance" "vpc1_ec2" {
  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.vpc1_private.id
  key_name      = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.vpc1_ec2_sg.id]
  user_data     = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = aws_cloudwatch_log_group.vpc1_ec2_logs.name
  }))
  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-instance-${var.environment}"
  })
}

resource "aws_instance" "vpc2_ec2" {
  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = aws_subnet.vpc2_private.id
  key_name      = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.vpc2_ec2_sg.id]
  user_data     = base64encode(templatefile("${path.module}/user_data.sh", {
    log_group_name = aws_cloudwatch_log_group.vpc2_ec2_logs.name
  }))
  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-instance-${var.environment}"
  })
}
```

---

## iam.tf

Manages IAM roles, policies, and instance profiles for EC2 instances, using environment suffixes for uniqueness.

```hcl
resource "aws_iam_role" "ec2_role" {
  name = "ec2-s3-readonly-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
  tags = var.common_tags
}

resource "aws_iam_policy" "s3_readonly_policy" {
  name        = "s3-readonly-policy-${var.environment}"
  description = "Policy for read-only access to specific S3 bucket (${var.environment})"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:ListBucket"]
      Resource = [
        "arn:aws:s3:::${var.s3_bucket_name}",
        "arn:aws:s3:::${var.s3_bucket_name}/*"
      ]
    }]
  })
  tags = var.common_tags
}

resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name        = "cloudwatch-logs-policy-${var.environment}"
  description = "Policy for CloudWatch Logs access (${var.environment})"
  policy      = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
      Resource = "*"
    }]
  })
  tags = var.common_tags
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-instance-profile-${var.environment}"
  role = aws_iam_role.ec2_role.name
  tags = var.common_tags
}
```

---

## kms.tf

Creates a KMS key and alias for RDS encryption, with environment-specific naming.

```hcl
resource "aws_kms_key" "rds_encryption" {
  description             = "KMS key for RDS encryption (${var.environment})"
  deletion_window_in_days = 7
  tags = merge(var.common_tags, {
    Name = "rds-encryption-key-${var.environment}"
  })
}

resource "aws_kms_alias" "rds_encryption" {
  name          = "alias/rds-encryption-${var.environment}"
  target_key_id = aws_kms_key.rds_encryption.key_id
}
```

---

## nat_gateways.tf

Manages Elastic IPs and NAT gateways for each VPC, ensuring unique naming.

```hcl
resource "aws_eip" "vpc1_nat" {
  domain = "vpc"
  tags = merge(var.common_tags, {
    Name = "vpc1-nat-eip-${var.environment}"
  })
}

resource "aws_eip" "vpc2_nat" {
  domain = "vpc"
  tags = merge(var.common_tags, {
    Name = "vpc2-nat-eip-${var.environment}"
  })
}

resource "aws_nat_gateway" "vpc1_nat" {
  allocation_id = aws_eip.vpc1_nat.id
  subnet_id     = aws_subnet.vpc1_public.id
  tags = merge(var.common_tags, {
    Name = "vpc1-nat-gateway-${var.environment}"
  })
  depends_on = [aws_internet_gateway.igw1]
}

resource "aws_nat_gateway" "vpc2_nat" {
  allocation_id = aws_eip.vpc2_nat.id
  subnet_id     = aws_subnet.vpc2_public.id
  tags = merge(var.common_tags, {
    Name = "vpc2-nat-gateway-${var.environment}"
  })
  depends_on = [aws_internet_gateway.igw2]
}
```

---

## outputs.tf

Exports key resource IDs, IPs, endpoints, and guidance for use in integration tests and other modules.

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
  value       = aws_vpc_peering_connection.main.id
}

output "vpc1_ec2_private_ip" {
  description = "Private IP of EC2 instance in VPC 1"
  value       = aws_instance.vpc1_ec2.private_ip
}

output "vpc2_ec2_private_ip" {
  description = "Private IP of EC2 instance in VPC 2"
  value       = aws_instance.vpc2_ec2.private_ip
}

output "vpc1_ec2_public_ip" {
  description = "Public IP of EC2 instance in VPC 1"
  value       = aws_eip.vpc1_ec2_eip.public_ip
}

output "vpc2_ec2_public_ip" {
  description = "Public IP of EC2 instance in VPC 2"
  value       = aws_eip.vpc2_ec2_eip.public_ip
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "route53_records" {
  description = "Route 53 DNS records"
  value = var.create_route53_records ? {
    vpc1_app = aws_route53_record.vpc1_ec2[0].fqdn
    vpc2_app = aws_route53_record.vpc2_ec2[0].fqdn
  } : {}
}

output "key_pair_name" {
  description = "EC2 Key Pair name in use"
  value       = var.key_pair_name
}

output "vpc1_nat_gateway_id" {
  description = "ID of NAT Gateway in VPC 1"
  value       = aws_nat_gateway.vpc1_nat.id
}

output "vpc2_nat_gateway_id" {
  description = "ID of NAT Gateway in VPC 2"
  value       = aws_nat_gateway.vpc2_nat.id
}

output "key_pair_guidance" {
  description = "Guidance for EC2 key pair usage"
  value       = "Ensure the key pair '${var.key_pair_name}' exists in AWS before deploying EC2 instances."
}
```

---

## provider.tf

Declares the AWS provider and backend configuration for Terraform state management.

```hcl
provider "aws" {
  region = var.aws_region
}

terraform {
  backend "s3" {
    bucket = "iac-rlhf-tf-states"
    key    = "prs/${var.environment}/terraform.tfstate"
    region = var.aws_region
    encrypt = true
  }
}
```

---

## rds.tf

Defines the RDS subnet group and main database instance, using KMS encryption and environment-specific naming.

```hcl
resource "aws_db_subnet_group" "main" {
  name       = "rds-subnet-group-${var.environment}"
  subnet_ids = [aws_subnet.vpc1_private.id, aws_subnet.vpc1_private2.id]
  tags = merge(var.common_tags, {
    Name = "rds-subnet-group-${var.environment}"
  })
}

resource "aws_db_instance" "main" {
  identifier             = "main-database"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp2"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds_encryption.arn
  engine                 = "mysql"
  engine_version         = "8.0"
  username               = "admin"
  password               = var.rds_master_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  tags = merge(var.common_tags, {
    Name = "main-database"
  })
}
```

---

## route_tables.tf

Manages route tables and associations for public and private subnets in each VPC.

```hcl
resource "aws_route_table" "vpc1_public" {
  vpc_id = aws_vpc.vpc1.id
  tags = merge(var.common_tags, {
    Name = "vpc1-public-rt-${var.environment}"
  })
}

resource "aws_route_table" "vpc1_private" {
  vpc_id = aws_vpc.vpc1.id
  tags = merge(var.common_tags, {
    Name = "vpc1-private-rt-${var.environment}"
  })
}

resource "aws_route_table" "vpc2_public" {
  vpc_id = aws_vpc.vpc2.id
  tags = merge(var.common_tags, {
    Name = "vpc2-public-rt-${var.environment}"
  })
}

resource "aws_route_table" "vpc2_private" {
  vpc_id = aws_vpc.vpc2.id
  tags = merge(var.common_tags, {
    Name = "vpc2-private-rt-${var.environment}"
  })
}
```

---

## route53.tf

Optionally creates Route 53 DNS records for EC2 instances, using the environment suffix.

```hcl
resource "aws_route53_record" "vpc1_ec2" {
  count    = var.create_route53_records ? 1 : 0
  zone_id  = data.aws_route53_zone.main[0].zone_id
  name     = "vpc1-app-${var.environment}.${var.route53_zone_name}"
  type     = "A"
  ttl      = 300
  records  = [aws_eip.vpc1_ec2_eip.public_ip]
  depends_on = [aws_eip_association.vpc1_ec2_eip_assoc]
}

resource "aws_route53_record" "vpc2_ec2" {
  count    = var.create_route53_records ? 1 : 0
  zone_id  = data.aws_route53_zone.main[0].zone_id
  name     = "vpc2-app-${var.environment}.${var.route53_zone_name}"
  type     = "A"
  ttl      = 300
  records  = [aws_eip.vpc2_ec2_eip.public_ip]
  depends_on = [aws_eip_association.vpc2_ec2_eip_assoc]
}
```

---

## security_groups.tf

Defines security groups for EC2 and RDS instances, restricting access to necessary ports.

```hcl
resource "aws_security_group" "vpc1_ec2_sg" {
  name        = "vpc1-ec2-security-group-${var.environment}"
  description = "Security group for EC2 instances in VPC 1 (${var.environment})"
  vpc_id      = aws_vpc.vpc1.id
  tags = merge(var.common_tags, {
    Name = "vpc1-ec2-sg-${var.environment}"
  })
  # ...ingress/egress rules...
}

resource "aws_security_group" "vpc2_ec2_sg" {
  name        = "vpc2-ec2-security-group-${var.environment}"
  description = "Security group for EC2 instances in VPC 2 (${var.environment})"
  vpc_id      = aws_vpc.vpc2.id
  tags = merge(var.common_tags, {
    Name = "vpc2-ec2-sg-${var.environment}"
  })
  # ...ingress/egress rules...
}

resource "aws_security_group" "rds_sg" {
  name        = "rds-security-group-${var.environment}"
  description = "Security group for RDS instances (${var.environment})"
  vpc_id      = aws_vpc.vpc1.id
  tags = merge(var.common_tags, {
    Name = "rds-sg-${var.environment}"
  })
  # ...ingress/egress rules...
}
```

---

## subnets.tf

Creates public and private subnets for each VPC, with environment-specific naming.

```hcl
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
  vpc_id                  = aws_vpc.vpc1.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = false
  tags = merge(var.common_tags, {
    Name = "vpc1-private-subnet"
    Type = "Private"
  })
}

resource "aws_subnet" "vpc1_private2" {
  vpc_id                  = aws_vpc.vpc1.id
  cidr_block              = "10.0.3.0/24"
  availability_zone       = data.aws_availability_zones.available.names[2]
  map_public_ip_on_launch = false
  tags = merge(var.common_tags, {
    Name = "vpc1-private-subnet-2"
    Type = "Private"
  })
}

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
  vpc_id                  = aws_vpc.vpc2.id
  cidr_block              = "10.1.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = false
  tags = merge(var.common_tags, {
    Name = "vpc2-private-subnet"
    Type = "Private"
  })
}
```

---

## user_data.sh

Shell script used for EC2 instance initialization via the `user_data` field.

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

---

## variables.tf

Declares all input variables used across the stack, including region, AMI, instance type, environment, and sensitive RDS password.

```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0bbc328167dee8f3c"
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

variable "create_route53_records" {
  description = "Whether to create Route 53 DNS records"
  type        = bool
  default     = false
}

variable "key_pair_name" {
  description = "EC2 Key Pair name"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name (used as suffix for resources)"
  type        = string
  default     = "prod"
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Department  = "IT"
  }
}

variable "rds_master_password" {
  description = "Master password for RDS instance"
  type        = string
  sensitive   = true
  default     = ""
}
```

---

## vpc.tf

Defines two VPCs for the environment, with DNS support and environment-specific naming.

```hcl
resource "aws_vpc" "vpc1" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(var.common_tags, {
    Name = "vpc-1"
  })
}

resource "aws_vpc" "vpc2" {
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(var.common_tags, {
    Name = "vpc-2"
  })
}
```

---

## Additional Notes

- All resource names and tags use the `${var.environment}` suffix where uniqueness is required.
- Sensitive data such as RDS passwords are handled securely via variables.
- Outputs are structured for easy integration testing and downstream consumption.
- The stack is modular, with each `.tf` file focused on a specific AWS service or infrastructure component.