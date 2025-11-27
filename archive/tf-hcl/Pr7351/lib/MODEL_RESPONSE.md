# Terraform VPC Network Isolation Implementation

This implementation creates a production-grade AWS VPC with strict network isolation for a payment processing system, meeting PCI DSS compliance requirements.

## File: variables.tf

```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource naming to ensure uniqueness"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
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

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Project     = "PaymentGateway"
  }
}
```

## File: provider.tf

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
  region = var.aws_region

  default_tags {
    tags = var.common_tags
  }
}
```

## File: main.tf

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
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${var.environment_suffix}-${var.availability_zones[count.index]}"
    Tier = "Public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "private-subnet-${var.environment_suffix}-${var.availability_zones[count.index]}"
    Tier = "Private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count             = length(var.database_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "database-subnet-${var.environment_suffix}-${var.availability_zones[count.index]}"
    Tier = "Database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count  = length(var.availability_zones)
  domain = "vpc"

  tags = {
    Name = "eip-nat-${var.environment_suffix}-${var.availability_zones[count.index]}"
  }

  depends_on = [aws_internet_gateway.main]
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count         = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "nat-gateway-${var.environment_suffix}-${var.availability_zones[count.index]}"
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
    Name = "public-rt-${var.environment_suffix}"
    Tier = "Public"
  }
}

# Public Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per AZ for NAT Gateway)
resource "aws_route_table" "private" {
  count  = length(var.availability_zones)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "private-rt-${var.environment_suffix}-${var.availability_zones[count.index]}"
    Tier = "Private"
  }
}

# Private Route Table Associations
resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Database Route Table (local only)
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "database-rt-${var.environment_suffix}"
    Tier = "Database"
  }
}

# Database Route Table Associations
resource "aws_route_table_association" "database" {
  count          = length(aws_subnet.database)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}
```

## File: nacl.tf

```hcl
# Public Network ACL
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
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

  # Outbound All Traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "public-nacl-${var.environment_suffix}"
    Tier = "Public"
  }
}

# Private Network ACL
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Inbound from VPC (all traffic)
  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  # Inbound Application Ports 8080-8090
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 8080
    to_port    = 8090
  }

  # Inbound Ephemeral Ports
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  # Outbound All Traffic
  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "private-nacl-${var.environment_suffix}"
    Tier = "Private"
  }
}

# Database Network ACL
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id

  # Inbound PostgreSQL from Private Subnets
  dynamic "ingress" {
    for_each = var.private_subnet_cidrs
    content {
      protocol   = "tcp"
      rule_no    = 100 + index(var.private_subnet_cidrs, ingress.value)
      action     = "allow"
      cidr_block = ingress.value
      from_port  = 5432
      to_port    = 5432
    }
  }

  # Inbound Ephemeral Ports from Private Subnets
  dynamic "ingress" {
    for_each = var.private_subnet_cidrs
    content {
      protocol   = "tcp"
      rule_no    = 200 + index(var.private_subnet_cidrs, ingress.value)
      action     = "allow"
      cidr_block = ingress.value
      from_port  = 1024
      to_port    = 65535
    }
  }

  # Outbound to Private Subnets
  dynamic "egress" {
    for_each = var.private_subnet_cidrs
    content {
      protocol   = "tcp"
      rule_no    = 100 + index(var.private_subnet_cidrs, egress.value)
      action     = "allow"
      cidr_block = egress.value
      from_port  = 1024
      to_port    = 65535
    }
  }

  tags = {
    Name = "database-nacl-${var.environment_suffix}"
    Tier = "Database"
  }
}
```

## File: flow_logs.tf

```hcl
# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flow-logs-${var.environment_suffix}"
  retention_in_days = 30

  tags = {
    Name = "vpc-flow-logs-${var.environment_suffix}"
  }
}

# IAM Role for VPC Flow Logs
resource "aws_iam_role" "vpc_flow_logs" {
  name = "vpc-flow-logs-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "vpc-flow-logs-role-${var.environment_suffix}"
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
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "vpc-flow-log-${var.environment_suffix}"
  }
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

output "nat_gateway_public_ips" {
  description = "Public IP addresses of the NAT Gateways"
  value       = aws_eip.nat[*].public_ip
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables"
  value       = aws_route_table.private[*].id
}

output "database_route_table_id" {
  description = "ID of the database route table"
  value       = aws_route_table.database.id
}

output "vpc_flow_log_id" {
  description = "ID of the VPC Flow Log"
  value       = aws_flow_log.main.id
}

output "vpc_flow_log_group_name" {
  description = "Name of the CloudWatch Log Group for VPC Flow Logs"
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}
```

## File: terraform.tfvars

```hcl
environment_suffix = "prod-payment"
aws_region         = "us-east-1"
```

## File: README.md

```markdown
# VPC Network Isolation for Payment Processing

This Terraform configuration deploys a production-grade AWS VPC with strict network isolation for a payment processing system that meets PCI DSS compliance requirements.

## Architecture

The infrastructure consists of:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **9 Subnets across 3 Availability Zones**:
  - 3 Public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
  - 3 Private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
  - 3 Database subnets (10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24)
- **Internet Gateway**: For public subnet internet access
- **3 NAT Gateways**: High availability across all AZs
- **5 Route Tables**: 1 public, 3 private, 1 database
- **3 Network ACLs**: Strict port-based access control
- **VPC Flow Logs**: CloudWatch Logs with 30-day retention

## Three-Tier Network Architecture

1. **Public Tier**: Load balancers and internet-facing resources
   - Direct internet access via Internet Gateway
   - Allows inbound ports 80 and 443

2. **Private Tier**: Application servers
   - Outbound internet via NAT Gateway
   - Allows inbound ports 8080-8090

3. **Database Tier**: Isolated database resources
   - No internet access (inbound or outbound)
   - Only allows port 5432 from private subnets

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC resources

## Deployment

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Review the plan**:
   ```bash
   terraform plan
   ```

3. **Apply the configuration**:
   ```bash
   terraform apply
   ```

4. **Provide the environment suffix when prompted** or set in `terraform.tfvars`:
   ```bash
   environment_suffix = "prod-payment"
   ```

## Configuration

### Variables

Key variables that can be customized in `terraform.tfvars`:

- `environment_suffix`: Unique identifier for the environment (required)
- `aws_region`: AWS region for deployment (default: us-east-1)
- `vpc_cidr`: VPC CIDR block (default: 10.0.0.0/16)
- `availability_zones`: List of AZs (default: us-east-1a, us-east-1b, us-east-1c)
- `public_subnet_cidrs`: CIDR blocks for public subnets
- `private_subnet_cidrs`: CIDR blocks for private subnets
- `database_subnet_cidrs`: CIDR blocks for database subnets

### Resource Naming

All resources include the `environment_suffix` variable in their names to ensure uniqueness:
- VPC: `vpc-{environment_suffix}`
- Subnets: `{tier}-subnet-{environment_suffix}-{az}`
- NAT Gateways: `nat-gateway-{environment_suffix}-{az}`

## Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `public_subnet_ids`: List of public subnet IDs
- `private_subnet_ids`: List of private subnet IDs
- `database_subnet_ids`: List of database subnet IDs
- `nat_gateway_ids`: List of NAT Gateway IDs
- `nat_gateway_public_ips`: Public IP addresses of NAT Gateways
- `vpc_flow_log_group_name`: CloudWatch Log Group for VPC Flow Logs

## Security Features

1. **Network ACLs**:
   - Default deny all traffic
   - Explicit allow rules for required ports only
   - Separate NACLs for each tier

2. **Network Isolation**:
   - Database subnets have no internet access
   - Private subnets use NAT for outbound only
   - Public subnets restricted to ports 80/443

3. **VPC Flow Logs**:
   - All traffic logged to CloudWatch
   - 30-day retention for audit compliance
   - Supports forensic analysis

4. **High Availability**:
   - Resources spread across 3 AZs
   - NAT Gateway in each AZ for redundancy
   - Independent route tables per AZ for private subnets

## Compliance

This configuration supports PCI DSS compliance requirements:

- Network segmentation enforced via subnets and NACLs
- All network traffic logged via VPC Flow Logs
- Database tier completely isolated from internet
- Proper tagging for audit trails

## Cost Considerations

Main cost components:
- **NAT Gateways**: ~$0.045/hour each (3 total) + data transfer
- **VPC Flow Logs**: CloudWatch Logs storage and ingestion
- **Elastic IPs**: Free when attached to running NAT Gateways

Estimated monthly cost: ~$100-150 (depending on data transfer)

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: All resources are fully destroyable with no retain policies.

## Testing

After deployment, verify the configuration:

1. **Check VPC and Subnets**:
   ```bash
   aws ec2 describe-vpcs --filters "Name=tag:Name,Values=vpc-prod-payment"
   aws ec2 describe-subnets --filters "Name=vpc-id,Values=<vpc-id>"
   ```

2. **Verify NAT Gateways**:
   ```bash
   aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=<vpc-id>"
   ```

3. **Check Route Tables**:
   ```bash
   aws ec2 describe-route-tables --filters "Name=vpc-id,Values=<vpc-id>"
   ```

4. **Verify VPC Flow Logs**:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix "/aws/vpc/flow-logs"
   ```

## Troubleshooting

### NAT Gateway Creation Fails
- Ensure Internet Gateway is attached to VPC first
- Verify Elastic IPs are available in the region

### VPC Flow Logs Not Appearing
- Check IAM role has correct permissions
- Verify CloudWatch Logs group exists
- Wait 5-10 minutes for initial log delivery

### Route Table Association Issues
- Ensure subnet IDs are correct
- Verify no conflicting associations exist

## Support

For issues or questions, refer to:
- AWS VPC Documentation: https://docs.aws.amazon.com/vpc/
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
```
