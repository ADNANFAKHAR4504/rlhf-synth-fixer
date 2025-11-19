# Hub-and-Spoke Network Architecture - Terraform Implementation

This implementation creates a hub-and-spoke network architecture using AWS Transit Gateway with Terraform HCL.

## Architecture Overview

- 1 Hub VPC with NAT Gateway for centralized internet egress
- 3 Spoke VPCs (production, staging, development)
- AWS Transit Gateway as the central routing hub
- Transit Gateway Route Tables for hub-spoke communication
- Security Groups and Network ACLs for network segmentation

## File: provider.tf

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

  default_tags {
    tags = {
      Project     = "hub-spoke-network"
      ManagedBy   = "terraform"
      Environment = var.environment_suffix
    }
  }
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for unique resource naming across deployments"
  type        = string
  default     = "dev"

  validation {
    condition     = length(var.environment_suffix) > 0 && length(var.environment_suffix) <= 10
    error_message = "Environment suffix must be between 1 and 10 characters"
  }
}

variable "hub_vpc_cidr" {
  description = "CIDR block for hub VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "spoke_vpc_cidrs" {
  description = "CIDR blocks for spoke VPCs"
  type        = map(string)
  default = {
    production  = "10.1.0.0/16"
    staging     = "10.2.0.0/16"
    development = "10.3.0.0/16"
  }
}

variable "transit_gateway_asn" {
  description = "BGP ASN for Transit Gateway"
  type        = number
  default     = 64512
}

variable "enable_dns_support" {
  description = "Enable DNS support on Transit Gateway"
  type        = bool
  default     = true
}

variable "enable_vpn_ecmp_support" {
  description = "Enable VPN ECMP support on Transit Gateway"
  type        = bool
  default     = true
}
```

## File: main.tf

```hcl
# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

###########################################
# Transit Gateway
###########################################

resource "aws_ec2_transit_gateway" "main" {
  description                     = "Hub-and-spoke transit gateway for ${var.environment_suffix}"
  amazon_side_asn                 = var.transit_gateway_asn
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
  dns_support                     = var.enable_dns_support ? "enable" : "disable"
  vpn_ecmp_support                = var.enable_vpn_ecmp_support ? "enable" : "disable"

  tags = {
    Name = "tgw-hub-spoke-${var.environment_suffix}"
  }
}

# Transit Gateway Route Table for Hub
resource "aws_ec2_transit_gateway_route_table" "hub" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = {
    Name = "tgw-rt-hub-${var.environment_suffix}"
  }
}

# Transit Gateway Route Table for Spokes
resource "aws_ec2_transit_gateway_route_table" "spokes" {
  transit_gateway_id = aws_ec2_transit_gateway.main.id

  tags = {
    Name = "tgw-rt-spokes-${var.environment_suffix}"
  }
}

###########################################
# Hub VPC
###########################################

resource "aws_vpc" "hub" {
  cidr_block           = var.hub_vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "vpc-hub-${var.environment_suffix}"
    Type = "hub"
  }
}

# Hub VPC Public Subnets (for NAT Gateway)
resource "aws_subnet" "hub_public" {
  count                   = 2
  vpc_id                  = aws_vpc.hub.id
  cidr_block              = cidrsubnet(var.hub_vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "subnet-hub-public-${count.index + 1}-${var.environment_suffix}"
    Type = "public"
  }
}

# Hub VPC Private Subnets (for Transit Gateway attachment)
resource "aws_subnet" "hub_private" {
  count             = 2
  vpc_id            = aws_vpc.hub.id
  cidr_block        = cidrsubnet(var.hub_vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "subnet-hub-private-${count.index + 1}-${var.environment_suffix}"
    Type = "private"
  }
}

# Internet Gateway for Hub VPC
resource "aws_internet_gateway" "hub" {
  vpc_id = aws_vpc.hub.id

  tags = {
    Name = "igw-hub-${var.environment_suffix}"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "eip-nat-hub-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.hub]
}

# NAT Gateway in Hub VPC
resource "aws_nat_gateway" "hub" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.hub_public[0].id

  tags = {
    Name = "nat-hub-${var.environment_suffix}"
  }

  depends_on = [aws_internet_gateway.hub]
}

# Route Table for Hub Public Subnets
resource "aws_route_table" "hub_public" {
  vpc_id = aws_vpc.hub.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.hub.id
  }

  tags = {
    Name = "rt-hub-public-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "hub_public" {
  count          = length(aws_subnet.hub_public)
  subnet_id      = aws_subnet.hub_public[count.index].id
  route_table_id = aws_route_table.hub_public.id
}

# Route Table for Hub Private Subnets
resource "aws_route_table" "hub_private" {
  vpc_id = aws_vpc.hub.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.hub.id
  }

  tags = {
    Name = "rt-hub-private-${var.environment_suffix}"
  }
}

resource "aws_route_table_association" "hub_private" {
  count          = length(aws_subnet.hub_private)
  subnet_id      = aws_subnet.hub_private[count.index].id
  route_table_id = aws_route_table.hub_private.id
}

# Transit Gateway Attachment for Hub VPC
resource "aws_ec2_transit_gateway_vpc_attachment" "hub" {
  subnet_ids         = aws_subnet.hub_private[*].id
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = aws_vpc.hub.id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = {
    Name = "tgw-attach-hub-${var.environment_suffix}"
  }
}

# Associate Hub VPC attachment with Hub route table
resource "aws_ec2_transit_gateway_route_table_association" "hub" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Propagate Hub routes to Spokes route table
resource "aws_ec2_transit_gateway_route_table_propagation" "hub_to_spokes" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spokes.id
}

###########################################
# Spoke VPCs
###########################################

resource "aws_vpc" "spokes" {
  for_each = var.spoke_vpc_cidrs

  cidr_block           = each.value
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "vpc-spoke-${each.key}-${var.environment_suffix}"
    Type        = "spoke"
    Environment = each.key
  }
}

# Spoke VPC Private Subnets
resource "aws_subnet" "spokes_private" {
  for_each = {
    for pair in flatten([
      for env, cidr in var.spoke_vpc_cidrs : [
        for az in range(2) : {
          key = "${env}-${az}"
          env = env
          az  = az
        }
      ]
    ]) : pair.key => pair
  }

  vpc_id            = aws_vpc.spokes[each.value.env].id
  cidr_block        = cidrsubnet(var.spoke_vpc_cidrs[each.value.env], 8, each.value.az)
  availability_zone = data.aws_availability_zones.available.names[each.value.az]

  tags = {
    Name        = "subnet-spoke-${each.value.env}-${each.value.az + 1}-${var.environment_suffix}"
    Type        = "private"
    Environment = each.value.env
  }
}

# Transit Gateway Attachments for Spoke VPCs
resource "aws_ec2_transit_gateway_vpc_attachment" "spokes" {
  for_each = var.spoke_vpc_cidrs

  subnet_ids = [
    for key, subnet in aws_subnet.spokes_private :
    subnet.id if startswith(key, "${each.key}-")
  ]
  transit_gateway_id = aws_ec2_transit_gateway.main.id
  vpc_id             = aws_vpc.spokes[each.key].id

  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false

  tags = {
    Name        = "tgw-attach-spoke-${each.key}-${var.environment_suffix}"
    Environment = each.key
  }
}

# Associate Spoke VPC attachments with Spokes route table
resource "aws_ec2_transit_gateway_route_table_association" "spokes" {
  for_each = var.spoke_vpc_cidrs

  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.spokes[each.key].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spokes.id
}

# Propagate Spoke routes to Hub route table
resource "aws_ec2_transit_gateway_route_table_propagation" "spokes_to_hub" {
  for_each = var.spoke_vpc_cidrs

  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.spokes[each.key].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.hub.id
}

# Default route in Spokes route table pointing to Hub
resource "aws_ec2_transit_gateway_route" "spokes_default" {
  destination_cidr_block         = "0.0.0.0/0"
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.hub.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.spokes.id
}

# Route Tables for Spoke VPCs
resource "aws_route_table" "spokes" {
  for_each = var.spoke_vpc_cidrs

  vpc_id = aws_vpc.spokes[each.key].id

  tags = {
    Name        = "rt-spoke-${each.key}-${var.environment_suffix}"
    Environment = each.key
  }
}

# Add routes to Transit Gateway in Spoke route tables
resource "aws_route" "spokes_to_tgw" {
  for_each = var.spoke_vpc_cidrs

  route_table_id         = aws_route_table.spokes[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.spokes]
}

# Associate subnets with route tables
resource "aws_route_table_association" "spokes" {
  for_each = aws_subnet.spokes_private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.spokes[split("-", each.key)[0]].id
}

# Add routes from Hub private subnets to spoke VPCs through Transit Gateway
resource "aws_route" "hub_to_spokes" {
  for_each = var.spoke_vpc_cidrs

  route_table_id         = aws_route_table.hub_private.id
  destination_cidr_block = each.value
  transit_gateway_id     = aws_ec2_transit_gateway.main.id

  depends_on = [aws_ec2_transit_gateway_vpc_attachment.hub]
}

###########################################
# Security Groups
###########################################

# Hub VPC Security Group
resource "aws_security_group" "hub" {
  name        = "sg-hub-${var.environment_suffix}"
  description = "Security group for hub VPC"
  vpc_id      = aws_vpc.hub.id

  ingress {
    description = "Allow all traffic from spoke VPCs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [for cidr in var.spoke_vpc_cidrs : cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "sg-hub-${var.environment_suffix}"
  }
}

# Spoke VPC Security Groups
resource "aws_security_group" "spokes" {
  for_each = var.spoke_vpc_cidrs

  name        = "sg-spoke-${each.key}-${var.environment_suffix}"
  description = "Security group for spoke VPC ${each.key}"
  vpc_id      = aws_vpc.spokes[each.key].id

  ingress {
    description = "Allow traffic from hub VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.hub_vpc_cidr]
  }

  ingress {
    description = "Allow traffic from other spoke VPCs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [for cidr in var.spoke_vpc_cidrs : cidr]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "sg-spoke-${each.key}-${var.environment_suffix}"
    Environment = each.key
  }
}

###########################################
# Network ACLs
###########################################

# Hub VPC Network ACL
resource "aws_network_acl" "hub" {
  vpc_id     = aws_vpc.hub.id
  subnet_ids = concat(aws_subnet.hub_public[*].id, aws_subnet.hub_private[*].id)

  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "nacl-hub-${var.environment_suffix}"
  }
}

# Spoke VPC Network ACLs
resource "aws_network_acl" "spokes" {
  for_each = var.spoke_vpc_cidrs

  vpc_id = aws_vpc.spokes[each.key].id
  subnet_ids = [
    for key, subnet in aws_subnet.spokes_private :
    subnet.id if startswith(key, "${each.key}-")
  ]

  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name        = "nacl-spoke-${each.key}-${var.environment_suffix}"
    Environment = each.key
  }
}
```

## File: outputs.tf

```hcl
output "transit_gateway_id" {
  description = "ID of the Transit Gateway"
  value       = aws_ec2_transit_gateway.main.id
}

output "transit_gateway_arn" {
  description = "ARN of the Transit Gateway"
  value       = aws_ec2_transit_gateway.main.arn
}

output "hub_vpc_id" {
  description = "ID of the hub VPC"
  value       = aws_vpc.hub.id
}

output "hub_vpc_cidr" {
  description = "CIDR block of the hub VPC"
  value       = aws_vpc.hub.cidr_block
}

output "spoke_vpc_ids" {
  description = "IDs of spoke VPCs"
  value       = { for k, v in aws_vpc.spokes : k => v.id }
}

output "spoke_vpc_cidrs" {
  description = "CIDR blocks of spoke VPCs"
  value       = { for k, v in aws_vpc.spokes : k => v.cidr_block }
}

output "hub_route_table_id" {
  description = "ID of the Transit Gateway route table for hub"
  value       = aws_ec2_transit_gateway_route_table.hub.id
}

output "spokes_route_table_id" {
  description = "ID of the Transit Gateway route table for spokes"
  value       = aws_ec2_transit_gateway_route_table.spokes.id
}

output "nat_gateway_id" {
  description = "ID of the NAT Gateway in hub VPC"
  value       = aws_nat_gateway.hub.id
}

output "nat_gateway_public_ip" {
  description = "Public IP address of the NAT Gateway"
  value       = aws_eip.nat.public_ip
}

output "hub_security_group_id" {
  description = "ID of the hub VPC security group"
  value       = aws_security_group.hub.id
}

output "spoke_security_group_ids" {
  description = "IDs of spoke VPC security groups"
  value       = { for k, v in aws_security_group.spokes : k => v.id }
}

output "hub_tgw_attachment_id" {
  description = "ID of the Transit Gateway attachment for hub VPC"
  value       = aws_ec2_transit_gateway_vpc_attachment.hub.id
}

output "spoke_tgw_attachment_ids" {
  description = "IDs of Transit Gateway attachments for spoke VPCs"
  value       = { for k, v in aws_ec2_transit_gateway_vpc_attachment.spokes : k => v.id }
}
```

## File: README.md

```markdown
# Hub-and-Spoke Network Architecture with AWS Transit Gateway

This Terraform configuration deploys a hub-and-spoke network topology using AWS Transit Gateway.

## Architecture

- **Hub VPC**: Central VPC with NAT Gateway for internet egress
- **Spoke VPCs**: Three spoke VPCs (production, staging, development)
- **Transit Gateway**: Central routing hub connecting all VPCs
- **Routing**: Spoke VPCs route traffic through hub for internet access
- **Security**: Security Groups and Network ACLs for access control

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPCs, Transit Gateway, and networking resources

## Configuration

### Variables

The configuration supports the following variables:

- `aws_region`: AWS region (default: us-east-1)
- `environment_suffix`: Unique suffix for resource naming (required)
- `hub_vpc_cidr`: CIDR block for hub VPC (default: 10.0.0.0/16)
- `spoke_vpc_cidrs`: Map of spoke VPC CIDR blocks
- `transit_gateway_asn`: BGP ASN for Transit Gateway (default: 64512)

### Example terraform.tfvars

```hcl
aws_region         = "us-east-1"
environment_suffix = "prod"

hub_vpc_cidr = "10.0.0.0/16"

spoke_vpc_cidrs = {
  production  = "10.1.0.0/16"
  staging     = "10.2.0.0/16"
  development = "10.3.0.0/16"
}
```

## Deployment

### Initialize Terraform

```bash
terraform init
```

### Plan the deployment

```bash
terraform plan -var="environment_suffix=dev"
```

### Apply the configuration

```bash
terraform apply -var="environment_suffix=dev"
```

### Destroy the infrastructure

```bash
terraform destroy -var="environment_suffix=dev"
```

## Network Flow

1. **Spoke to Internet**: Traffic routes through Transit Gateway → Hub VPC → NAT Gateway → Internet
2. **Spoke to Spoke**: Traffic routes through Transit Gateway (hub route table facilitates communication)
3. **Hub to Spoke**: Direct routing through Transit Gateway

## Security

- Security Groups allow traffic between hub and spokes
- Network ACLs provide subnet-level filtering
- No direct internet gateways on spoke VPCs (all internet traffic through hub)
- Separate security groups per environment (production, staging, development)

## Outputs

The configuration exports:

- Transit Gateway ID and ARN
- Hub and spoke VPC IDs
- Route table IDs
- NAT Gateway ID and public IP
- Security Group IDs
- Transit Gateway attachment IDs

## Resource Naming

All resources follow the pattern: `{resource-type}-{purpose}-{environment-suffix}`

Examples:
- `vpc-hub-dev`
- `tgw-hub-spoke-prod`
- `sg-spoke-production-staging`

## Cost Optimization

- Single NAT Gateway in hub VPC (can be scaled for HA)
- Transit Gateway charges apply per attachment and data transfer
- Consider using VPC endpoints for AWS services to reduce NAT Gateway costs

## High Availability

For production deployments, consider:
- Multiple NAT Gateways across availability zones
- Transit Gateway attachments in multiple AZs (already configured)
- Application-level redundancy in spoke VPCs

## Troubleshooting

### Transit Gateway attachment not working

Check:
1. Transit Gateway route table associations
2. VPC route tables point to Transit Gateway
3. Security Groups allow traffic
4. Network ACLs allow traffic

### No internet connectivity from spoke VPCs

Check:
1. NAT Gateway is running
2. Hub VPC route table routes to NAT Gateway
3. Transit Gateway default route points to hub VPC
4. Spoke VPC route tables point to Transit Gateway

## License

This configuration is provided as-is for infrastructure deployment purposes.
```

## Deployment Instructions

1. Initialize Terraform:
   ```bash
   terraform init
   ```

2. Validate configuration:
   ```bash
   terraform validate
   ```

3. Plan deployment:
   ```bash
   terraform plan -var="environment_suffix=test01"
   ```

4. Apply configuration:
   ```bash
   terraform apply -var="environment_suffix=test01" -auto-approve
   ```

5. Verify outputs:
   ```bash
   terraform output
   ```

6. Test connectivity between VPCs through Transit Gateway

7. Destroy when done:
   ```bash
   terraform destroy -var="environment_suffix=test01" -auto-approve
   ```

## Key Features

- **environmentSuffix support**: All resources include environment suffix for unique naming
- **Fully destroyable**: No retention policies or prevent_destroy flags
- **Hub-spoke topology**: Centralized routing through Transit Gateway
- **Internet egress**: Spoke VPCs access internet through hub NAT Gateway
- **Network segmentation**: Separate VPCs for production, staging, development
- **Security controls**: Security Groups and Network ACLs configured
- **Best practices**: Variables, outputs, proper tagging, modular structure
