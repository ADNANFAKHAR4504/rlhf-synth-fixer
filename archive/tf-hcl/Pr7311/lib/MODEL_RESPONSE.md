# Production-Grade AWS VPC Infrastructure for Payment Processing

This solution implements a secure, highly available VPC infrastructure with strict network isolation for a payment processing system using Terraform.

## Architecture Overview

- VPC with CIDR 10.0.0.0/16 supporting 4000+ hosts
- 9 subnets across 3 availability zones (public, private, database tiers)
- 3 NAT Gateways for high availability
- Network ACLs enforcing tier-specific port restrictions
- VPC Flow Logs to CloudWatch for compliance monitoring
- All resources tagged for Environment=Production and Project=PaymentGateway

## File: lib/main.tf

```hcl
# Main VPC Configuration
resource "aws_vpc" "payment_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "payment-vpc-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "payment_igw" {
  vpc_id = aws_vpc.payment_vpc.id

  tags = {
    Name        = "payment-igw-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 3
  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name        = "public-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier        = "Public"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "private-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier        = "Private"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = 3
  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = "10.0.${count.index + 21}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "database-subnet-${count.index + 1}-${var.environment_suffix}"
    Tier        = "Database"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = 3
  domain = "vpc"

  tags = {
    Name        = "nat-eip-${count.index + 1}-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }

  depends_on = [aws_internet_gateway.payment_igw]
}

# NAT Gateways
resource "aws_nat_gateway" "nat" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "nat-gateway-${count.index + 1}-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }

  depends_on = [aws_internet_gateway.payment_igw]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.payment_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.payment_igw.id
  }

  tags = {
    Name        = "public-rt-${var.environment_suffix}"
    Tier        = "Public"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 3
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ for NAT Gateway redundancy)
resource "aws_route_table" "private" {
  count  = 3
  vpc_id = aws_vpc.payment_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }

  tags = {
    Name        = "private-rt-${count.index + 1}-${var.environment_suffix}"
    Tier        = "Private"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = 3
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Table (local only, no internet)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.payment_vpc.id

  tags = {
    Name        = "database-rt-${var.environment_suffix}"
    Tier        = "Database"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Database Route Table Associations
resource "aws_route_table_association" "database" {
  count          = 3
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
```

## File: lib/nacl.tf

```hcl
# Network ACL for Public Subnets
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.payment_vpc.id
  subnet_ids = aws_subnet.public[*].id

  # Inbound HTTP
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  # Inbound HTTPS
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  # Inbound Ephemeral Ports (for return traffic)
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound All
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name        = "public-nacl-${var.environment_suffix}"
    Tier        = "Public"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Network ACL for Private Subnets
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.payment_vpc.id
  subnet_ids = aws_subnet.private[*].id

  # Inbound from VPC on application ports
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "10.0.0.0/16"
    from_port  = 8080
    to_port    = 8090
  }

  # Inbound Ephemeral Ports (for return traffic)
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound All
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name        = "private-nacl-${var.environment_suffix}"
    Tier        = "Private"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# Network ACL for Database Subnets
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.payment_vpc.id
  subnet_ids = aws_subnet.database[*].id

  # Inbound PostgreSQL from Private Subnets only
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "10.0.11.0/24"
    from_port  = 5432
    to_port    = 5432
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "10.0.12.0/24"
    from_port  = 5432
    to_port    = 5432
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "10.0.13.0/24"
    from_port  = 5432
    to_port    = 5432
  }

  # Inbound Ephemeral Ports (for return traffic from private subnets)
  ingress {
    protocol   = "tcp"
    rule_no    = 130
    action     = "allow"
    cidr_block = "10.0.0.0/16"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound to Private Subnets
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "10.0.0.0/16"
    from_port  = 1024
    to_port    = 65535
  }

  tags = {
    Name        = "database-nacl-${var.environment_suffix}"
    Tier        = "Database"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}
```

## File: lib/flow-logs.tf

```hcl
# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name        = "vpc-flow-logs-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "vpc-flow-logs-role-${var.environment_suffix}"

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
    Name        = "vpc-flow-logs-role-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}

# IAM Policy for VPC Flow Logs
resource "aws_iam_role_policy" "vpc_flow_logs" {
  name = "vpc-flow-logs-policy-${var.environment_suffix}"
  role = aws_iam_role.vpc_flow_logs.id

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
        Effect = "Allow"
        Resource = "*"
      }
    ]
  })
}

# VPC Flow Logs
resource "aws_flow_log" "payment_vpc" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.payment_vpc.id

  tags = {
    Name        = "vpc-flow-log-${var.environment_suffix}"
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}
```

## File: lib/outputs.tf

```hcl
# VPC Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.payment_vpc.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.payment_vpc.cidr_block
}

# Internet Gateway
output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.payment_igw.id
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
  value       = aws_nat_gateway.nat[*].id
}

output "nat_gateway_eips" {
  description = "Elastic IPs of NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

# Route Table Outputs
output "public_route_table_id" {
  description = "ID of public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of private route tables"
  value       = aws_route_table.private[*].id
}

output "database_route_table_id" {
  description = "ID of database route table"
  value       = aws_route_table.database.id
}

# Network ACL Outputs
output "public_nacl_id" {
  description = "ID of public network ACL"
  value       = aws_network_acl.public.id
}

output "private_nacl_id" {
  description = "ID of private network ACL"
  value       = aws_network_acl.private.id
}

output "database_nacl_id" {
  description = "ID of database network ACL"
  value       = aws_network_acl.database.id
}

# Flow Logs Outputs
output "flow_logs_log_group" {
  description = "CloudWatch Log Group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}

output "flow_logs_iam_role_arn" {
  description = "IAM Role ARN for VPC Flow Logs"
  value       = aws_iam_role.vpc_flow_logs.arn
}
```

## File: lib/README.md

```markdown
# AWS VPC Infrastructure for Payment Processing

Production-grade AWS VPC infrastructure with strict network isolation for payment processing systems, built with Terraform.

## Architecture

This infrastructure implements a three-tier network architecture across three availability zones:

- **Public Tier**: Load balancers and bastion hosts (10.0.1-3.0/24)
- **Private Tier**: Application servers (10.0.11-13.0/24)
- **Database Tier**: Database instances with no internet access (10.0.21-23.0/24)

## Features

- VPC with 10.0.0.0/16 CIDR supporting 4000+ hosts
- 9 subnets across 3 availability zones
- High availability NAT Gateways in each public subnet
- Network ACLs enforcing tier-specific port restrictions
- VPC Flow Logs with 30-day retention in CloudWatch
- Comprehensive tagging for compliance and cost tracking

## Prerequisites

- Terraform 1.5+
- AWS CLI configured with appropriate credentials
- AWS provider 5.x

## Deployment

1. Initialize Terraform:
```bash
terraform init
```

2. Review the plan:
```bash
terraform plan -var="environment_suffix=production"
```

3. Apply the configuration:
```bash
terraform apply -var="environment_suffix=production"
```

## Variables

- `aws_region`: AWS region for deployment (default: us-east-1)
- `environment_suffix`: Environment suffix for resource naming (default: dev)
- `repository`: Repository name for tagging
- `commit_author`: Commit author for tagging
- `pr_number`: PR number for tagging
- `team`: Team name for tagging

## Outputs

The module exports the following outputs:

- VPC ID and CIDR block
- Subnet IDs for all tiers
- NAT Gateway IDs and Elastic IPs
- Route table IDs
- Network ACL IDs
- Flow Logs configuration

## Network Design

### Public Subnets
- CIDR: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- Internet access via Internet Gateway
- Allowed inbound: HTTP (80), HTTPS (443)

### Private Subnets
- CIDR: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- Internet access via NAT Gateways (one per AZ)
- Allowed inbound: Application ports (8080-8090)

### Database Subnets
- CIDR: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
- No internet access
- Allowed inbound: PostgreSQL (5432) from private subnets only

## Security

- Network ACLs implement explicit deny-by-default rules
- Database tier completely isolated from internet
- VPC Flow Logs capture all network traffic for audit
- All resources tagged with Environment=Production and Project=PaymentGateway

## Compliance

This infrastructure is designed to support PCI DSS compliance requirements:
- Network segmentation between tiers
- Audit logging via VPC Flow Logs
- No direct internet access to database tier
- High availability across multiple zones

## Cost Considerations

Major cost drivers:
- NAT Gateways: ~$0.045/hour per gateway (~$97/month × 3)
- Data transfer through NAT Gateways: $0.045/GB
- VPC Flow Logs storage: Based on CloudWatch Logs pricing

## Cleanup

To destroy all resources:
```bash
terraform destroy -var="environment_suffix=production"
```

All resources are fully destroyable with no retention policies.
```

## Deployment Instructions

1. Ensure you have Terraform 1.5+ installed
2. Configure AWS credentials with appropriate permissions
3. Initialize the Terraform working directory:
   ```bash
   terraform init
   ```
4. Review the execution plan:
   ```bash
   terraform plan -var="environment_suffix=test"
   ```
5. Deploy the infrastructure:
   ```bash
   terraform apply -var="environment_suffix=test"
   ```

## Testing

After deployment, verify:
- VPC and subnets are created in correct AZs
- NAT Gateways are operational in all public subnets
- Route tables are properly associated
- Network ACLs have correct rules
- VPC Flow Logs are streaming to CloudWatch

## Security Considerations

- Database subnets have no route to Internet Gateway
- Private subnets use NAT Gateways for outbound internet access
- Network ACLs provide stateless traffic filtering at subnet level
- All traffic is logged via VPC Flow Logs for audit compliance
- PCI DSS network segmentation requirements are met

## Cost Optimization Notes

The current design prioritizes high availability and security. For cost optimization:
- Consider reducing NAT Gateways to 1 if HA is not critical
- Implement VPC endpoints for S3/DynamoDB to reduce NAT Gateway data transfer
- Monitor Flow Logs volume and adjust retention as needed
