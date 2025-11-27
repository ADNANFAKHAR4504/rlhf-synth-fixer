### Reasoning Trace
---

This is a comprehensive request for building a payment processing VPC infrastructure in AWS using Terraform. Let me break down the requirements:

1. **VPC Foundation**: VPC with CIDR 10.0.0.0/16, 6 subnets across 3 tiers (public, private app, private database)
2. **NAT Instance**: T3.micro EC2 instance for private subnet internet access
3. **Transit Gateway**: For corporate data center connectivity
4. **Network ACLs**: Custom NACLs with specific deny/allow rules
5. **VPC Flow Logs**: To S3 with proper IAM roles
6. **IAM Roles and Policies**: For NAT instance and Flow Logs
7. **Route Tables**: Three distinct route tables for different tiers
8. **Resource Tagging**: Consistent tagging strategy
9. **Provider Configuration**: Terraform 1.5+, AWS provider ~> 5.0
10. **Resource Naming**: Pattern {resource-type}-{purpose}-{environment}
11. **Data Source Restrictions**: Only specific data sources allowed
12. **File Organization**: lib/provider.tf and lib/main.tf
13. **Cleanup Configuration**: force_destroy and termination settings
14. **Integration Testing Outputs**: 35-40 outputs minimum

Let me create these two files with all the required configurations.
### Answer 
---

I'll create a comprehensive payment processing VPC infrastructure with PCI DSS compliance requirements. This solution includes strict network segmentation, secure connectivity, and monitoring capabilities.

## lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
  
  default_tags {
    tags = {
      Environment = "Production"
      Project     = "PaymentPlatform"
    }
  }
}

variable "environment" {
  description = "Environment designation for resource naming"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones for subnet deployment"
  type        = list(string)
  default     = ["eu-central-1a", "eu-central-1b", "eu-central-1c"]
}
```

## lib/main.tf

```hcl
# Data Sources
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "nat" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "description"
    values = ["*NAT*"]
  }
}

# VPC
resource "aws_vpc" "vpc_payment_prod" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "vpc-payment-${var.environment}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw_payment_prod" {
  vpc_id = aws_vpc.vpc_payment_prod.id
  
  tags = {
    Name = "igw-payment-${var.environment}"
  }
}

# Public Subnets
resource "aws_subnet" "subnet_public_1_prod" {
  vpc_id                  = aws_vpc.vpc_payment_prod.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = var.availability_zones[0]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "subnet-public-1-${var.environment}"
    Tier = "public"
  }
}

resource "aws_subnet" "subnet_public_2_prod" {
  vpc_id                  = aws_vpc.vpc_payment_prod.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = var.availability_zones[1]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "subnet-public-2-${var.environment}"
    Tier = "public"
  }
}

# Private Application Subnets
resource "aws_subnet" "subnet_private_app_1_prod" {
  vpc_id            = aws_vpc.vpc_payment_prod.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = var.availability_zones[0]
  
  tags = {
    Name = "subnet-private-app-1-${var.environment}"
    Tier = "private-application"
  }
}

resource "aws_subnet" "subnet_private_app_2_prod" {
  vpc_id            = aws_vpc.vpc_payment_prod.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = var.availability_zones[1]
  
  tags = {
    Name = "subnet-private-app-2-${var.environment}"
    Tier = "private-application"
  }
}

# Private Database Subnets
resource "aws_subnet" "subnet_private_db_1_prod" {
  vpc_id            = aws_vpc.vpc_payment_prod.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = var.availability_zones[0]
  
  tags = {
    Name = "subnet-private-db-1-${var.environment}"
    Tier = "private-database"
  }
}

resource "aws_subnet" "subnet_private_db_2_prod" {
  vpc_id            = aws_vpc.vpc_payment_prod.id
  cidr_block        = "10.0.22.0/24"
  availability_zone = var.availability_zones[1]
  
  tags = {
    Name = "subnet-private-db-2-${var.environment}"
    Tier = "private-database"
  }
}

# NAT Instance Security Group
resource "aws_security_group" "sg_nat_prod" {
  name        = "sg-nat-${var.environment}"
  description = "Security group for NAT instance"
  vpc_id      = aws_vpc.vpc_payment_prod.id
  
  ingress {
    description = "Allow traffic from private app subnet 1"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.11.0/24"]
  }
  
  ingress {
    description = "Allow traffic from private app subnet 2"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.12.0/24"]
  }
  
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "sg-nat-${var.environment}"
  }
}

# Elastic IP for NAT Instance
resource "aws_eip" "eip_nat_prod" {
  domain = "vpc"
  
  tags = {
    Name = "eip-nat-${var.environment}"
  }
}

# IAM Role for NAT Instance
resource "aws_iam_role" "iam_role_nat_prod" {
  name = "role-nat-instance-${var.environment}"
  
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
    Name = "role-nat-instance-${var.environment}"
  }
}

# Attach SSM policy to NAT role
resource "aws_iam_role_policy_attachment" "nat_ssm_policy" {
  role       = aws_iam_role.iam_role_nat_prod.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Instance Profile for NAT
resource "aws_iam_instance_profile" "profile_nat_prod" {
  name = "profile-nat-instance-${var.environment}"
  role = aws_iam_role.iam_role_nat_prod.name
  
  tags = {
    Name = "profile-nat-instance-${var.environment}"
  }
}

# NAT Instance
resource "aws_instance" "nat_instance_prod" {
  ami                         = data.aws_ami.nat.id
  instance_type               = "t3.micro"
  subnet_id                   = aws_subnet.subnet_public_1_prod.id
  vpc_security_group_ids      = [aws_security_group.sg_nat_prod.id]
  source_dest_check           = false
  iam_instance_profile        = aws_iam_instance_profile.profile_nat_prod.name
  disable_api_termination     = false
  
  user_data = <<-EOF
    #!/bin/bash
    echo 1 > /proc/sys/net/ipv4/ip_forward
    echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
    sysctl -p /etc/sysctl.conf
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    iptables-save > /etc/iptables/rules.v4
  EOF
  
  tags = {
    Name = "nat-instance-${var.environment}"
  }
}

# Associate EIP with NAT Instance
resource "aws_eip_association" "eip_assoc_nat" {
  instance_id   = aws_instance.nat_instance_prod.id
  allocation_id = aws_eip.eip_nat_prod.id
}

# Transit Gateway
resource "aws_ec2_transit_gateway" "tgw_corporate_prod" {
  description                     = "Transit Gateway for corporate connectivity"
  default_route_table_association = "enable"
  default_route_table_propagation = "enable"
  
  tags = {
    Name = "tgw-corporate-${var.environment}"
  }
}

# Transit Gateway VPC Attachment
resource "aws_ec2_transit_gateway_vpc_attachment" "tgw_attachment_prod" {
  subnet_ids         = [
    aws_subnet.subnet_private_app_1_prod.id,
    aws_subnet.subnet_private_app_2_prod.id,
    aws_subnet.subnet_private_db_1_prod.id
  ]
  transit_gateway_id = aws_ec2_transit_gateway.tgw_corporate_prod.id
  vpc_id             = aws_vpc.vpc_payment_prod.id
  
  tags = {
    Name = "tgw-attachment-payment-${var.environment}"
  }
}

# Transit Gateway Route Table
resource "aws_ec2_transit_gateway_route_table" "tgw_rt_prod" {
  transit_gateway_id = aws_ec2_transit_gateway.tgw_corporate_prod.id
  
  tags = {
    Name = "tgw-rt-${var.environment}"
  }
}

# Network ACLs
resource "aws_network_acl" "nacl_public_prod" {
  vpc_id = aws_vpc.vpc_payment_prod.id
  
  tags = {
    Name = "nacl-public-${var.environment}"
  }
}

resource "aws_network_acl" "nacl_private_app_prod" {
  vpc_id = aws_vpc.vpc_payment_prod.id
  
  tags = {
    Name = "nacl-private-app-${var.environment}"
  }
}

resource "aws_network_acl" "nacl_private_db_prod" {
  vpc_id = aws_vpc.vpc_payment_prod.id
  
  tags = {
    Name = "nacl-private-db-${var.environment}"
  }
}

# NACL Rules - Public Tier
resource "aws_network_acl_rule" "nacl_public_inbound_deny_192" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 90
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

resource "aws_network_acl_rule" "nacl_public_inbound_deny_172" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 95
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "nacl_public_inbound_allow_http" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "nacl_public_inbound_allow_https" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 101
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "nacl_public_inbound_allow_ssh_corporate" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.100.0.0/16"
  from_port      = 22
  to_port        = 22
}

resource "aws_network_acl_rule" "nacl_public_inbound_allow_ephemeral" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "nacl_public_outbound_deny_192" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 90
  egress         = true
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

resource "aws_network_acl_rule" "nacl_public_outbound_deny_172" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 95
  egress         = true
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "nacl_public_outbound_allow_http" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "nacl_public_outbound_allow_https" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 101
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "nacl_public_outbound_allow_ephemeral" {
  network_acl_id = aws_network_acl.nacl_public_prod.id
  rule_number    = 120
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# NACL Rules - Private Application Tier
resource "aws_network_acl_rule" "nacl_app_inbound_deny_192" {
  network_acl_id = aws_network_acl.nacl_private_app_prod.id
  rule_number    = 90
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

resource "aws_network_acl_rule" "nacl_app_inbound_deny_172" {
  network_acl_id = aws_network_acl.nacl_private_app_prod.id
  rule_number    = 95
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "nacl_app_inbound_allow_vpc" {
  network_acl_id = aws_network_acl.nacl_private_app_prod.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

resource "aws_network_acl_rule" "nacl_app_inbound_allow_ephemeral" {
  network_acl_id = aws_network_acl.nacl_private_app_prod.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "nacl_app_outbound_deny_192" {
  network_acl_id = aws_network_acl.nacl_private_app_prod.id
  rule_number    = 90
  egress         = true
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

resource "aws_network_acl_rule" "nacl_app_outbound_deny_172" {
  network_acl_id = aws_network_acl.nacl_private_app_prod.id
  rule_number    = 95
  egress         = true
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "nacl_app_outbound_allow_all" {
  network_acl_id = aws_network_acl.nacl_private_app_prod.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
}

# NACL Rules - Private Database Tier
resource "aws_network_acl_rule" "nacl_db_inbound_deny_192" {
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
  rule_number    = 90
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

resource "aws_network_acl_rule" "nacl_db_inbound_deny_172" {
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
  rule_number    = 95
  egress         = false
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "nacl_db_inbound_allow_app_mysql" {
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.11.0/24"
  from_port      = 3306
  to_port        = 3306
}

resource "aws_network_acl_rule" "nacl_db_inbound_allow_app2_mysql" {
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
  rule_number    = 101
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.12.0/24"
  from_port      = 3306
  to_port        = 3306
}

resource "aws_network_acl_rule" "nacl_db_inbound_allow_app_postgres" {
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
  rule_number    = 102
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.11.0/24"
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "nacl_db_inbound_allow_app2_postgres" {
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
  rule_number    = 103
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.12.0/24"
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "nacl_db_outbound_deny_192" {
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
  rule_number    = 90
  egress         = true
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "192.168.0.0/16"
}

resource "aws_network_acl_rule" "nacl_db_outbound_deny_172" {
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
  rule_number    = 95
  egress         = true
  protocol       = "-1"
  rule_action    = "deny"
  cidr_block     = "172.16.0.0/12"
}

resource "aws_network_acl_rule" "nacl_db_outbound_allow_ephemeral" {
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
  rule_number    = 120
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "10.0.0.0/16"
  from_port      = 1024
  to_port        = 65535
}

# Associate NACLs with Subnets
resource "aws_network_acl_association" "nacl_assoc_public_1" {
  subnet_id      = aws_subnet.subnet_public_1_prod.id
  network_acl_id = aws_network_acl.nacl_public_prod.id
}

resource "aws_network_acl_association" "nacl_assoc_public_2" {
  subnet_id      = aws_subnet.subnet_public_2_prod.id
  network_acl_id = aws_network_acl.nacl_public_prod.id
}

resource "aws_network_acl_association" "nacl_assoc_private_app_1" {
  subnet_id      = aws_subnet.subnet_private_app_1_prod.id
  network_acl_id = aws_network_acl.nacl_private_app_prod.id
}

resource "aws_network_acl_association" "nacl_assoc_private_app_2" {
  subnet_id      = aws_subnet.subnet_private_app_2_prod.id
  network_acl_id = aws_network_acl.nacl_private_app_prod.id
}

resource "aws_network_acl_association" "nacl_assoc_private_db_1" {
  subnet_id      = aws_subnet.subnet_private_db_1_prod.id
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
}

resource "aws_network_acl_association" "nacl_assoc_private_db_2" {
  subnet_id      = aws_subnet.subnet_private_db_2_prod.id
  network_acl_id = aws_network_acl.nacl_private_db_prod.id
}

# Route Tables
resource "aws_route_table" "rt_public_prod" {
  vpc_id = aws_vpc.vpc_payment_prod.id
  
  tags = {
    Name = "rt-public-${var.environment}"
  }
}

resource "aws_route_table" "rt_private_app_prod" {
  vpc_id = aws_vpc.vpc_payment_prod.id
  
  tags = {
    Name = "rt-private-app-${var.environment}"
  }
}

resource "aws_route_table" "rt_private_db_prod" {
  vpc_id = aws_vpc.vpc_payment_prod.id
  
  tags = {
    Name = "rt-private-db-${var.environment}"
  }
}

# Routes - Public Route Table
resource "aws_route" "route_public_internet" {
  route_table_id         = aws_route_table.rt_public_prod.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw_payment_prod.id
}

resource "aws_route" "route_public_corporate" {
  route_table_id         = aws_route_table.rt_public_prod.id
  destination_cidr_block = "10.100.0.0/16"
  transit_gateway_id     = aws_ec2_transit_gateway.tgw_corporate_prod.id
  
  depends_on = [aws_ec2_transit_gateway_vpc_attachment.tgw_attachment_prod]
}

# Routes - Private Application Route Table
resource "aws_route" "route_private_app_internet" {
  route_table_id         = aws_route_table.rt_private_app_prod.id
  destination_cidr_block = "0.0.0.0/0"
  network_interface_id   = aws_instance.nat_instance_prod.primary_network_interface_id
  
  depends_on = [aws_instance.nat_instance_prod]
}

resource "aws_route" "route_private_app_corporate" {
  route_table_id         = aws_route_table.rt_private_app_prod.id
  destination_cidr_block = "10.100.0.0/16"
  transit_gateway_id     = aws_ec2_transit_gateway.tgw_corporate_prod.id
  
  depends_on = [aws_ec2_transit_gateway_vpc_attachment.tgw_attachment_prod]
}

# Routes - Private Database Route Table
resource "aws_route" "route_private_db_corporate" {
  route_table_id         = aws_route_table.rt_private_db_prod.id
  destination_cidr_block = "10.100.0.0/16"
  transit_gateway_id     = aws_ec2_transit_gateway.tgw_corporate_prod.id
  
  depends_on = [aws_ec2_transit_gateway_vpc_attachment.tgw_attachment_prod]
}

# Route Table Associations
resource "aws_route_table_association" "rta_public_1" {
  subnet_id      = aws_subnet.subnet_public_1_prod.id
  route_table_id = aws_route_table.rt_public_prod.id
}

resource "aws_route_table_association" "rta_public_2" {
  subnet_id      = aws_subnet.subnet_public_2_prod.id
  route_table_id = aws_route_table.rt_public_prod.id
}

resource "aws_route_table_association" "rta_private_app_1" {
  subnet_id      = aws_subnet.subnet_private_app_1_prod.id
  route_table_id = aws_route_table.rt_private_app_prod.id
}

resource "aws_route_table_association" "rta_private_app_2" {
  subnet_id      = aws_subnet.subnet_private_app_2_prod.id
  route_table_id = aws_route_table.rt_private_app_prod.id
}

resource "aws_route_table_association" "rta_private_db_1" {
  subnet_id      = aws_subnet.subnet_private_db_1_prod.id
  route_table_id = aws_route_table.rt_private_db_prod.id
}

resource "aws_route_table_association" "rta_private_db_2" {
  subnet_id      = aws_subnet.subnet_private_db_2_prod.id
  route_table_id = aws_route_table.rt_private_db_prod.id
}

# S3 Bucket for VPC Flow Logs
resource "aws_s3_bucket" "s3_vpc_flow_logs_prod" {
  bucket        = "s3-vpc-flow-logs-prod-${data.aws_caller_identity.current.account_id}"
  force_destroy = true
  
  tags = {
    Name = "s3-vpc-flow-logs-${var.environment}"
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "s3_flow_logs_encryption" {
  bucket = aws_s3_bucket.s3_vpc_flow_logs_prod.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Policy for VPC Flow Logs
resource "aws_s3_bucket_policy" "s3_flow_logs_policy" {
  bucket = aws_s3_bucket.s3_vpc_flow_logs_prod.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.s3_vpc_flow_logs_prod.arn
      },
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.s3_vpc_flow_logs_prod.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-acl" = "bucket-owner-full-control"
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "iam_role_flow_logs_prod" {
  name = "role-vpc-flow-logs-${var.environment}"
  
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
    Name = "role-vpc-flow-logs-${var.environment}"
  }
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "flow_logs_policy" {
  name = "policy-vpc-flow-logs-${var.environment}"
  role = aws_iam_role.iam_role_flow_logs_prod.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject"
        ]
        Resource = "${aws_s3_bucket.s3_vpc_flow_logs_prod.arn}/*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_logs_prod" {
  iam_role_arn             = aws_iam_role.iam_role_flow_logs_prod.arn
  log_destination_type     = "s3"
  log_destination_arn      = aws_s3_bucket.s3_vpc_flow_logs_prod.arn
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.vpc_payment_prod.id
  max_aggregation_interval = 600
  
  tags = {
    Name = "flow-logs-payment-${var.environment}"
  }
  
  depends_on = [
    aws_iam_role.iam_role_flow_logs_prod,
    aws_s3_bucket.s3_vpc_flow_logs_prod
  ]
}

# Outputs
output "vpc_id" {
  description = "ID of the payment processing VPC"
  value       = aws_vpc.vpc_payment_prod.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the payment processing VPC"
  value       = aws_vpc.vpc_payment_prod.cidr_block
}

output "vpc_arn" {
  description = "ARN of the payment processing VPC"
  value       = aws_vpc.vpc_payment_prod.arn
}

output "public_subnet_ids" {
  description = "List of public subnet IDs for load balancers and bastion hosts"
  value       = [aws_subnet.subnet_public_1_prod.id, aws_subnet.subnet_public_2_prod.id]
}

output "public_subnet_1_id" {
  description = "ID of the first public subnet"
  value       = aws_subnet.subnet_public_1_prod.id
}

output "public_subnet_2_id" {
  description = "ID of the second public subnet"
  value       = aws_subnet.subnet_public_2_prod.id
}

output "public_subnet_1_cidr" {
  description = "CIDR block of the first public subnet"
  value       = aws_subnet.subnet_public_1_prod.cidr_block
}

output "public_subnet_2_cidr" {
  description = "CIDR block of the second public subnet"
  value       = aws_subnet.subnet_public_2_prod.cidr_block
}

output "private_app_subnet_ids" {
  description = "List of private application subnet IDs for compute workloads"
  value       = [aws_subnet.subnet_private_app_1_prod.id, aws_subnet.subnet_private_app_2_prod.id]
}

output "private_app_subnet_1_id" {
  description = "ID of the first private application subnet"
  value       = aws_subnet.subnet_private_app_1_prod.id
}

output "private_app_subnet_2_id" {
  description = "ID of the second private application subnet"
  value       = aws_subnet.subnet_private_app_2_prod.id
}

output "private_app_subnet_1_cidr" {
  description = "CIDR block of the first private application subnet"
  value       = aws_subnet.subnet_private_app_1_prod.cidr_block
}

output "private_app_subnet_2_cidr" {
  description = "CIDR block of the second private application subnet"
  value       = aws_subnet.subnet_private_app_2_prod.cidr_block
}

output "private_db_subnet_ids" {
  description = "List of private database subnet IDs for data storage"
  value       = [aws_subnet.subnet_private_db_1_prod.id, aws_subnet.subnet_private_db_2_prod.id]
}

output "private_db_subnet_1_id" {
  description = "ID of the first private database subnet"
  value       = aws_subnet.subnet_private_db_1_prod.id
}

output "private_db_subnet_2_id" {
  description = "ID of the second private database subnet"
  value       = aws_subnet.subnet_private_db_2_prod.id
}

output "private_db_subnet_1_cidr" {
  description = "CIDR block of the first private database subnet"
  value       = aws_subnet.subnet_private_db_1_prod.cidr_block
}

output "private_db_subnet_2_cidr" {
  description = "CIDR block of the second private database subnet"
  value       = aws_subnet.subnet_private_db_2_prod.cidr_block
}

output "nat_instance_id" {
  description = "ID of the NAT EC2 instance"
  value       = aws_instance.nat_instance_prod.id
}

output "nat_instance_public_ip" {
  description = "Public IP address of the NAT instance"
  value       = aws_eip.eip_nat_prod.public_ip
  sensitive   = true
}

output "nat_instance_network_interface_id" {
  description = "Network interface ID of the NAT instance for routing"
  value       = aws_instance.nat_instance_prod.primary_network_interface_id
}

output "nat_security_group_id" {
  description = "Security group ID for the NAT instance"
  value       = aws_security_group.sg_nat_prod.id
}

output "transit_gateway_id" {
  description = "ID of the Transit Gateway for corporate connectivity"
  value       = aws_ec2_transit_gateway.tgw_corporate_prod.id
}

output "transit_gateway_arn" {
  description = "ARN of the Transit Gateway"
  value       = aws_ec2_transit_gateway.tgw_corporate_prod.arn
}

output "transit_gateway_attachment_id" {
  description = "ID of the Transit Gateway VPC attachment"
  value       = aws_ec2_transit_gateway_vpc_attachment.tgw_attachment_prod.id
}

output "transit_gateway_route_table_id" {
  description = "ID of the Transit Gateway route table"
  value       = aws_ec2_transit_gateway_route_table.tgw_rt_prod.id
}

output "public_route_table_id" {
  description = "Route table ID for public subnets"
  value       = aws_route_table.rt_public_prod.id
}

output "private_app_route_table_id" {
  description = "Route table ID for private application subnets"
  value       = aws_route_table.rt_private_app_prod.id
}

output "private_db_route_table_id" {
  description = "Route table ID for private database subnets"
  value       = aws_route_table.rt_private_db_prod.id
}

output "public_nacl_id" {
  description = "Network ACL ID for public subnets"
  value       = aws_network_acl.nacl_public_prod.id
}

output "private_app_nacl_id" {
  description = "Network ACL ID for private application subnets"
  value       = aws_network_acl.nacl_private_app_prod.id
}

output "private_db_nacl_id" {
  description = "Network ACL ID for private database subnets"
  value       = aws_network_acl.nacl_private_db_prod.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.igw_payment_prod.id
}

output "s3_flow_logs_bucket_name" {
  description = "Name of the S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.s3_vpc_flow_logs_prod.id
}

output "s3_flow_logs_bucket_arn" {
  description = "ARN of the S3 bucket for VPC Flow Logs"
  value       = aws_s3_bucket.s3_vpc_flow_logs_prod.arn
}

output "vpc_flow_logs_id" {
  description = "ID of the VPC Flow Logs configuration"
  value       = aws_flow_log.vpc_flow_logs_prod.id
}

output "flow_logs_iam_role_arn" {
  description = "ARN of the IAM role for VPC Flow Logs"
  value       = aws_iam_role.iam_role_flow_logs_prod.arn
}

output "nat_instance_iam_role_arn" {
  description = "ARN of the IAM role for NAT instance"
  value       = aws_iam_role.iam_role_nat_prod.arn
}

output "nat_instance_profile_arn" {
  description = "ARN of the instance profile for NAT instance"
  value       = aws_iam_instance_profile.profile_nat_prod.arn
}

output "availability_zones_used" {
  description = "List of availability zones used for subnet deployment"
  value       = var.availability_zones
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = data.aws_region.current.name
}

output "account_id" {
  description = "AWS account ID where resources are deployed"
  value       = data.aws_caller_identity.current.account_id
}
```

This comprehensive solution provides:

## Key Features Implemented:

1. **PCI DSS Compliance Architecture**
   - Three-tier network segmentation (public, private application, private database)
   - Complete network isolation with custom NACLs
   - VPC Flow Logs for comprehensive monitoring

2. **High Availability Design**
   - Resources spread across multiple availability zones
   - Transit Gateway with multi-AZ attachment points
   - Redundant subnets in each tier

3. **Security Controls**
   - Custom Network ACLs with explicit deny rules for RFC 1918 ranges
   - Stateless firewall rules for defense-in-depth
   - Security groups with least-privilege access
   - S3 bucket encryption for Flow Logs

4. **NAT Instance Configuration**
   - Cost-effective alternative to NAT Gateway
   - User data script for automatic iptables configuration
   - SSM access for secure management without SSH

5. **Hybrid Connectivity**
   - Transit Gateway for corporate data center connection
   - Route propagation for dynamic routing
   - Proper route table configuration for each tier

6. **Monitoring and Compliance**
   - VPC Flow Logs capturing ALL traffic
   - S3 storage with encryption for log retention
   - IAM roles with least-privilege permissions

7. **Resource Organization**
   - Consistent naming convention
   - Comprehensive tagging strategy
   - 40+ outputs for integration testing

The infrastructure is production-ready, supports PCI DSS compliance requirements, and provides secure, scalable network architecture for payment processing workloads.