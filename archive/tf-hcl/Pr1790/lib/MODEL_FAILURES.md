# Model Failures: Common Issues in Terraform Infrastructure Implementation

## Security Group Failures

### 1. Overly Permissive Access
**Failure**: Allowing unrestricted inbound access (0.0.0.0/0)
```hcl
# FAILURE EXAMPLE
ingress {
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]  # Too permissive
}
```

### 2. Missing IP Restrictions
**Failure**: Not implementing required IP-based access controls
```hcl
# FAILURE EXAMPLE
ingress {
  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]  # Should be restricted to specific IP ranges
}
```

## Resource Tagging Failures

### 3. Missing Environment Tags
**Failure**: Not tagging resources with Environment = Production
```hcl
# FAILURE EXAMPLE
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  # Missing tags
}
```

### 4. Inconsistent Tagging
**Failure**: Using different tag values across resources
```hcl
# FAILURE EXAMPLE
resource "aws_vpc" "main" {
  tags = { Environment = "Production" }
}
resource "aws_subnet" "public" {
  tags = { Environment = "prod" }  # Inconsistent
}
```

## Network Architecture Failures

### 5. Incorrect Subnet Count
**Failure**: Not creating required 3 public and 1 private subnet structure
```hcl
# FAILURE EXAMPLE
resource "aws_subnet" "public" {
  count = 1  # Should be 3
}
```

### 6. Missing Route Table Configuration
**Failure**: Not properly configuring route tables for public subnets
```hcl
# FAILURE EXAMPLE
# Missing route table association
resource "aws_subnet" "public" {
  # No route table association
}
```

## AWS Best Practices Failures

### 7. Missing DNS Configuration
**Failure**: Not enabling DNS support in VPC
```hcl
# FAILURE EXAMPLE
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  # Missing enable_dns_hostnames and enable_dns_support
}
```

### 8. No Availability Zone Distribution
**Failure**: Not distributing subnets across multiple availability zones
```hcl
# FAILURE EXAMPLE
resource "aws_subnet" "public" {
  count             = 3
  availability_zone = "us-east-1a"  # All subnets in same AZ
}
```

## Terraform Best Practices Failures

### 9. Missing Variable Definitions
**Failure**: Hardcoding values instead of using variables
```hcl
# FAILURE EXAMPLE
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"  # Hardcoded instead of variable
}
```

### 10. No Output Definitions
**Failure**: Not providing outputs for resource IDs
```hcl
# FAILURE EXAMPLE
# Missing output blocks for vpc_id, subnet_ids, etc.
```

## QA Pipeline Compliance Failures

### 11. Missing Environment Suffix
**Failure**: Not including environment_suffix in resource names for deployment isolation
```hcl
# FAILURE EXAMPLE
resource "aws_vpc" "main" {
  tags = {
    Name = "production-vpc"  # Should be "production-vpc-${var.environment_suffix}"
  }
}
```

**Fix**: Add environment_suffix variable and use it in all resource names:
```hcl
variable "environment_suffix" {
  description = "Environment suffix for resource names to avoid conflicts"
  type        = string
  default     = "dev"
}

resource "aws_vpc" "main" {
  tags = {
    Name = "production-vpc-${var.environment_suffix}"
  }
}
```
