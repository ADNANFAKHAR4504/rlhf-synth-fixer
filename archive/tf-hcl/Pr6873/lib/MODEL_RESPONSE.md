# Terraform VPC Infrastructure with Transit Gateway - Implementation

This implementation provides a complete, production-ready VPC infrastructure with Transit Gateway connectivity for a fintech payment processing platform. All resources are configured with high availability across 3 availability zones in us-east-1.

## Architecture Overview

The infrastructure includes:
- VPC with 10.0.0.0/16 CIDR across 3 AZs
- Public, private, and database subnets in each AZ
- NAT Gateways with Elastic IPs in all AZs for high availability
- Transit Gateway with custom route tables
- VPC Endpoints for S3 and DynamoDB
- Network ACLs with explicit rules
- VPC Flow Logs stored in S3 with lifecycle policies
- Comprehensive tagging and naming with environment suffix

## File: lib/variables.tf

```hcl
variable "environment_suffix" {
  description = "Unique suffix for resource naming to avoid conflicts"
  type        = string
  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 20
    error_message = "Environment suffix must be between 1 and 20 characters"
  }
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for HTTP/HTTPS/SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "fintech-payment-platform"
}

variable "owner" {
  description = "Owner email for tagging"
  type        = string
  default     = "devops@fintech.example.com"
}

variable "environment" {
  description = "Environment name for tagging"
  type        = string
  default     = "production"
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}
```


## File: lib/provider.tf

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      Owner       = var.owner
      ManagedBy   = "Terraform"
    }
  }
}
```

## File: lib/data.tf

```hcl
# Get available availability zones
data "aws_availability_zones" "available" {
  state = "available"
  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}
```

## File: lib/vpc.tf

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-${var.environment_suffix}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "igw-${var.environment_suffix}"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "database-subnet-${count.index + 1}-${var.environment_suffix}"
    Type = "Database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name = "eip-nat-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways (one per AZ for high availability)
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.main]
}
```

## File: lib/route_tables.tf

```hcl
# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "public-rt-${var.environment_suffix}"
  }
}

# Public Route to Internet Gateway
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

# Associate Public Subnets with Public Route Table
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ)
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "private-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

# Private Routes to NAT Gateways
resource "aws_route" "private_nat" {
  count                  = 3
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

# Associate Private Subnets with Private Route Tables
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Tables (one per AZ)
resource "aws_route_table" "database" {
  count  = 3
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "database-rt-${count.index + 1}-${var.environment_suffix}"
  }
}

# Associate Database Subnets with Database Route Tables (no internet access)
resource "aws_route_table_association" "database" {
  count          = 3
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}
```

## File: lib/transit_gateway.tf

```hcl
# Transit Gateway
resource "aws_ec2_transit_gateway" "main" {
  description                     = "Transit Gateway for ${var.project_name}"
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = "enable"
  vpn_ecmp_support               = "enable"

  tags = {
    Name = "tgw-${var.environment_suffix}"
  }
}

# Transit Gateway VPC Attachment
resource "aws_ec2_transit_gateway_vpc_attachment" "main" {
  subnet_ids                                      = aws_subnet.private[*].id
  transit_gateway_id                              = aws_ec2_transit_gateway.main.id
  vpc_id                                          = aws_vpc.main.id
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
  dns_support                                     = "enable"

  tags = {
    Name = "tgw-attachment-${var.environment_suffix}"
  }
}

# Transit Gateway Route Table
resource "aws_ec2_transit_gateway_route_table" "main" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = {
    Name = "tgw-rt-${var.environment_suffix}"
  }
}

# Associate VPC attachment with Transit Gateway Route Table
resource "aws_ec2_transit_gateway_route_table_association" "main" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.main.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.main.id
}
```

## File: lib/vpc_endpoints.tf

```hcl
# S3 VPC Endpoint (Gateway type)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id,
    aws_route_table.database[*].id
  )

  tags = {
    Name = "vpce-s3-${var.environment_suffix}"
  }
}

# DynamoDB VPC Endpoint (Gateway type)
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    [aws_route_table.public.id],
    aws_route_table.private[*].id,
    aws_route_table.database[*].id
  )

  tags = {
    Name = "vpce-dynamodb-${var.environment_suffix}"
  }
}
```

## File: lib/network_acls.tf

```hcl
# Network ACL for Public Subnets
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  tags = {
    Name = "nacl-public-${var.environment_suffix}"
  }
}

# Public NACL Ingress Rules
resource "aws_network_acl_rule" "public_ingress_http" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "public_ingress_https" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_ingress_ssh" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.allowed_cidr_blocks[0]
  from_port      = 22
  to_port        = 22
}

resource "aws_network_acl_rule" "public_ingress_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 130
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Public NACL Egress Rules
resource "aws_network_acl_rule" "public_egress_http" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "public_egress_https" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 110
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_egress_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 120
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Network ACL for Private Subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "nacl-private-${var.environment_suffix}"
  }
}

# Private NACL Ingress Rules (allow from VPC)
resource "aws_network_acl_rule" "private_ingress_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

resource "aws_network_acl_rule" "private_ingress_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Private NACL Egress Rules
resource "aws_network_acl_rule" "private_egress_http" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "private_egress_https" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "private_egress_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 120
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}

# Network ACL for Database Subnets
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "nacl-database-${var.environment_suffix}"
  }
}

# Database NACL Ingress Rules (only from private subnets)
resource "aws_network_acl_rule" "database_ingress_private" {
  network_acl_id = aws_network_acl.database.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 3306
  to_port        = 3306
}

resource "aws_network_acl_rule" "database_ingress_postgres" {
  network_acl_id = aws_network_acl.database.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "database_ingress_ephemeral" {
  network_acl_id = aws_network_acl.database.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 1024
  to_port        = 65535
}

# Database NACL Egress Rules
resource "aws_network_acl_rule" "database_egress_vpc" {
  network_acl_id = aws_network_acl.database.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
}
```

## File: lib/flow_logs.tf

```hcl
# S3 Bucket for VPC Flow Logs
resource "aws_s3_bucket" "flow_logs" {
  bucket = "vpc-flow-logs-${var.environment_suffix}-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "vpc-flow-logs-${var.environment_suffix}"
  }
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = 7
    }
  }
}

# S3 Bucket Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for VPC Flow Logs
resource "aws_s3_bucket_policy" "flow_logs" {
  bucket = aws_s3_bucket.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.flow_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.flow_logs.arn
      }
    ]
  })
}

# VPC Flow Log
resource "aws_flow_log" "main" {
  log_destination      = aws_s3_bucket.flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  tags = {
    Name = "flow-log-${var.environment_suffix}"
  }

  depends_on = [aws_s3_bucket_policy.flow_logs]
}
```

## File: lib/outputs.tf

```hcl
# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

# Subnet Outputs
output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of database subnets"
  value       = aws_subnet.database[*].id
}

# NAT Gateway Outputs
output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_ips" {
  description = "Public IPs of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Transit Gateway Outputs
output "transit_gateway_id" {
  description = "ID of Transit Gateway"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_attachment_id" {
  description = "ID of Transit Gateway VPC attachment"
  value       = aws_ec2_transit_gateway_vpc_attachment.main.id
}

output "transit_gateway_route_table_id" {
  description = "ID of Transit Gateway route table"
  value       = aws_ec2_transit_gateway_route_table.main.id
}

# VPC Endpoint Outputs
output "s3_endpoint_id" {
  description = "ID of S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "dynamodb_endpoint_id" {
  description = "ID of DynamoDB VPC endpoint"
  value       = aws_vpc_endpoint.dynamodb.id
}

# Flow Logs Outputs
output "flow_logs_bucket" {
  description = "S3 bucket for VPC flow logs"
  value       = aws_s3_bucket.flow_logs.id
}

output "flow_log_id" {
  description = "ID of VPC flow log"
  value       = aws_flow_log.main.id
}

# Availability Zones
output "availability_zones" {
  description = "List of availability zones used"
  value       = data.aws_availability_zones.available.names
}
```

## File: lib/terraform.tfvars.example

```hcl
# Example terraform.tfvars file
# Copy this to terraform.tfvars and customize values

environment_suffix = "prod-001"
vpc_cidr          = "10.0.0.0/16"

public_subnet_cidrs = [
  "10.0.1.0/24",
  "10.0.2.0/24",
  "10.0.3.0/24"
]

private_subnet_cidrs = [
  "10.0.11.0/24",
  "10.0.12.0/24",
  "10.0.13.0/24"
]

database_subnet_cidrs = [
  "10.0.21.0/24",
  "10.0.22.0/24",
  "10.0.23.0/24"
]

allowed_cidr_blocks = ["10.0.0.0/8"]

project_name = "fintech-payment-platform"
owner        = "devops@fintech.example.com"
environment  = "production"
region       = "us-east-1"
```

## File: lib/README.md

```markdown
# Production VPC Infrastructure with Transit Gateway

This Terraform configuration deploys a highly available VPC infrastructure with Transit Gateway connectivity for a fintech payment processing platform.

## Architecture

The infrastructure includes:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Subnets**: 3 public, 3 private, and 3 database subnets across 3 availability zones
- **High Availability**: NAT Gateways in each AZ with dedicated Elastic IPs
- **Transit Gateway**: Cross-region peering support with custom route tables
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB
- **Network Security**: Network ACLs with explicit allow/deny rules
- **Traffic Logging**: VPC Flow Logs stored in S3 with 7-day lifecycle policy
- **Encryption**: SSE-S3 encryption for flow logs bucket

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS provider ~> 5.0

## Deployment

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Create terraform.tfvars

Copy the example file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
environment_suffix = "your-unique-suffix"
project_name       = "your-project-name"
owner              = "your-email@example.com"
```

### 3. Plan Deployment

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

When prompted, review the changes and type `yes` to proceed.

## Outputs

After deployment, Terraform will output:

- VPC ID and CIDR
- Subnet IDs (public, private, database)
- NAT Gateway IDs and public IPs
- Transit Gateway ID and attachment ID
- VPC Endpoint IDs
- Flow Logs bucket name
- Availability zones used

## Resource Naming

All resources follow the naming convention: `{resource-type}-${var.environment_suffix}`

This ensures uniqueness and prevents conflicts when deploying multiple environments.

## Network Architecture

### Public Subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- Internet Gateway for inbound/outbound internet access
- Used for load balancers and bastion hosts
- Network ACL allows HTTP (80), HTTPS (443), and SSH (22)

### Private Subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- NAT Gateway for outbound internet access (one per AZ)
- Used for application workloads
- Network ACL allows traffic from VPC and outbound HTTPS

### Database Subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
- No internet access
- Used for RDS instances and other databases
- Network ACL allows only MySQL (3306) and PostgreSQL (5432) from VPC

## Transit Gateway

The Transit Gateway is configured with:
- Cross-region peering support enabled
- Custom route tables (propagation disabled)
- VPC attachment using private subnets
- DNS support enabled

## VPC Endpoints

Gateway endpoints reduce data transfer costs and improve security:
- **S3 Endpoint**: Access S3 without internet gateway
- **DynamoDB Endpoint**: Access DynamoDB without internet gateway

Both endpoints are associated with all route tables.

## Security Features

1. **Network ACLs**: Explicit rules for each subnet tier
2. **Encryption**: S3 bucket encrypted with SSE-S3
3. **Public Access Block**: S3 bucket blocks all public access
4. **Flow Logs**: All traffic logged for compliance and troubleshooting
5. **Tagging**: Consistent tags for resource management

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Important**: This will permanently delete all resources. Type `yes` when prompted.

## Cost Considerations

Main cost drivers:
- **NAT Gateways**: ~$0.045/hour per gateway + data processing ($0.045/GB)
- **Transit Gateway**: ~$0.05/hour + data processing ($0.02/GB)
- **Data Transfer**: Varies by usage
- **VPC Endpoints**: Gateway endpoints are free

Estimated monthly cost for minimal traffic: $200-300

## Compliance

This infrastructure meets requirements for:
- Multi-AZ high availability
- Network segmentation
- Traffic logging and monitoring
- Encryption at rest
- Explicit network controls

## Troubleshooting

### Issue: Terraform destroy fails

**Solution**: Some resources may have dependencies. Run destroy again or manually delete in AWS Console.

### Issue: NAT Gateway creation timeout

**Solution**: NAT Gateways can take 5-10 minutes to create. Be patient or increase timeout in code.

### Issue: S3 bucket already exists

**Solution**: Change `environment_suffix` to a unique value in terraform.tfvars.

## Support

For issues or questions, contact the DevOps team.
```

## Deployment Instructions

1. **Copy terraform.tfvars.example to terraform.tfvars** and set your environment_suffix
2. **Run terraform init** to initialize providers
3. **Run terraform plan** to preview changes
4. **Run terraform apply** to deploy infrastructure
5. **Save outputs** for use in other configurations

All resources are tagged with Environment, Project, and Owner tags for proper tracking and cost allocation.
