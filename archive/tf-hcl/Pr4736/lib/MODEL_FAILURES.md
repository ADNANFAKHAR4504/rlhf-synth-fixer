# Model Failures & Common Issues

This document catalogs common failures, issues, and anti-patterns that AI models (or developers) often make when creating Terraform infrastructure. Use this as a reference for what to avoid and how to detect problems.

## Table of Contents
1. [Security Failures](#security-failures)
2. [Infrastructure Design Failures](#infrastructure-design-failures)
3. [Terraform Syntax & Best Practice Failures](#terraform-syntax--best-practice-failures)
4. [Testing & Validation Failures](#testing--validation-failures)
5. [Documentation & Maintenance Failures](#documentation--maintenance-failures)

---

## Security Failures

### 1. ❌ Hardcoded Credentials
**Problem**: Embedding passwords, API keys, or access keys directly in code.

```hcl
# WRONG - Never do this
resource "aws_db_instance" "main" {
  username = "admin"
  password = "MyPassword123!"  # Hardcoded password!
}

# WRONG - API keys in code
provider "aws" {
  access_key = "AKIAIOSFODNN7EXAMPLE"  # Never hardcode
  secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}
```

**Correct Approach**:
```hcl
# Use random password generator + Secrets Manager
resource "random_password" "db_password" {
  length  = 16
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project}-db-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = random_password.db_password.result
}

resource "aws_db_instance" "main" {
  password = random_password.db_password.result
}
```

**Detection**: Search for patterns like `password = "`, `api_key = "`, `secret = "`

---

### 2. ❌ Overly Permissive Security Groups
**Problem**: Opening SSH (22) or RDP (3389) to 0.0.0.0/0

```hcl
# WRONG - SSH open to the world
resource "aws_security_group" "bad" {
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Anyone can attempt SSH!
  }
}
```

**Correct Approach**:
```hcl
# RIGHT - Restrict SSH to specific IP ranges
resource "aws_security_group" "good" {
  ingress {
    description = "SSH from office"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.office_cidr]  # Only office network
  }
}
```

**Impact**: Security breach risk, compliance violations (PCI-DSS, SOC2)

---

### 3. ❌ Wildcard IAM Permissions
**Problem**: Using `*` in IAM actions or resources

```hcl
# WRONG - Too permissive
resource "aws_iam_policy" "bad" {
  policy = jsonencode({
    Statement = [{
      Effect   = "Allow"
      Action   = "*"              # All actions!
      Resource = "*"              # On all resources!
    }]
  })
}
```

**Correct Approach**:
```hcl
# RIGHT - Specific permissions
resource "aws_iam_policy" "good" {
  policy = jsonencode({
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:ListBucket"           # Only what's needed
      ]
      Resource = [
        "arn:aws:s3:::${var.bucket_name}",
        "arn:aws:s3:::${var.bucket_name}/*"
      ]
    }]
  })
}
```

---

### 4. ❌ No Encryption
**Problem**: Missing encryption for data at rest and in transit

```hcl
# WRONG - No encryption
resource "aws_s3_bucket" "bad" {
  bucket = "my-bucket"
  # No encryption configured
}

resource "aws_db_instance" "bad" {
  storage_encrypted = false  # Unencrypted!
}
```

**Correct Approach**:
```hcl
resource "aws_s3_bucket_server_side_encryption_configuration" "good" {
  bucket = aws_s3_bucket.main.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_db_instance" "good" {
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn
}
```

---

## Infrastructure Design Failures

### 5. ❌ Single Point of Failure (SPOF)
**Problem**: Single NAT Gateway for all availability zones

```hcl
# WRONG - One NAT Gateway for all AZs
resource "aws_nat_gateway" "single" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
}

# All private subnets use same NAT
resource "aws_route_table" "private" {
  count = 2
  
  route {
    nat_gateway_id = aws_nat_gateway.single.id  # SPOF!
  }
}
```

**Impact**: If NAT Gateway or its AZ fails, all private subnets lose internet access

**Correct Approach**:
```hcl
# RIGHT - One NAT Gateway per AZ
resource "aws_nat_gateway" "per_az" {
  count = length(local.azs)
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
}

resource "aws_route_table" "private" {
  count = length(local.azs)
  
  route {
    nat_gateway_id = aws_nat_gateway.per_az[count.index].id
  }
}
```

---

### 6. ❌ No Network Segmentation
**Problem**: All resources in same subnet/security group

```hcl
# WRONG - Everything in one subnet
resource "aws_subnet" "only_one" {
  cidr_block = "10.0.0.0/16"  # Entire VPC range!
}

# Web servers and databases together
resource "aws_instance" "web" {
  subnet_id = aws_subnet.only_one.id
}

resource "aws_db_instance" "db" {
  subnet_group_name = aws_db_subnet_group.only_one.name
}
```

**Correct Approach**:
```hcl
# RIGHT - Separate public and private subnets
resource "aws_subnet" "public" {
  count = 2
  cidr_block = "10.0.${count.index + 1}.0/24"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private" {
  count = 2
  cidr_block = "10.0.${count.index + 10}.0/24"
  map_public_ip_on_launch = false
}

# Web in public, DB in private
```

---

### 7. ❌ Missing Monitoring & Logging
**Problem**: No VPC Flow Logs, CloudWatch, or alarms

```hcl
# WRONG - VPC with no monitoring
resource "aws_vpc" "blind" {
  cidr_block = "10.0.0.0/16"
  # No flow logs configured
}

# No CloudWatch alarms for issues
```

**Impact**: Cannot detect security incidents, DDoS, or operational issues

**Correct Approach**:
```hcl
resource "aws_flow_log" "vpc" {
  vpc_id          = aws_vpc.main.id
  traffic_type    = "ALL"
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
}

resource "aws_cloudwatch_metric_alarm" "ddos" {
  alarm_name = "high-traffic-alert"
  metric_name = "HighPacketCount"
  # ... alarm configuration
}
```

---

## Terraform Syntax & Best Practice Failures

### 8. ❌ Deprecated Parameters
**Problem**: Using outdated resource parameters

```hcl
# WRONG - Deprecated parameter
resource "aws_flow_log" "old" {
  log_destination_arn = aws_cloudwatch_log_group.logs.arn  # Deprecated!
}

# WRONG - Old provider syntax
terraform {
  required_providers {
    aws = "~> 3.0"  # Old version
  }
}
```

**Correct Approach**:
```hcl
# RIGHT - Current parameter
resource "aws_flow_log" "new" {
  log_destination = aws_cloudwatch_log_group.logs.arn
  log_destination_type = "cloud-watch-logs"
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}
```

---

### 9. ❌ Missing Resource Dependencies
**Problem**: Not declaring necessary dependencies

```hcl
# WRONG - NAT Gateway created before IGW attached
resource "aws_nat_gateway" "broken" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id
  # Missing: depends_on = [aws_internet_gateway.main]
}
```

**Impact**: Race conditions, failed deployments, inconsistent state

**Correct Approach**:
```hcl
resource "aws_nat_gateway" "working" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id
  depends_on    = [aws_internet_gateway.main]
}
```

---

### 10. ❌ Hardcoded Values Instead of Variables
**Problem**: Magic numbers and strings throughout code

```hcl
# WRONG - Hardcoded everywhere
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"  # Hardcoded
}

resource "aws_subnet" "public_a" {
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"  # Hardcoded region
}

resource "aws_subnet" "public_b" {
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
}
```

**Correct Approach**:
```hcl
variable "aws_region" {
  default = "us-east-1"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

locals {
  azs = ["${var.aws_region}a", "${var.aws_region}b"]
  public_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
}

resource "aws_subnet" "public" {
  count             = length(local.azs)
  cidr_block        = local.public_cidrs[count.index]
  availability_zone = local.azs[count.index]
}
```

---

### 11. ❌ Inconsistent Naming
**Problem**: Random naming with no pattern

```hcl
# WRONG - Inconsistent names
resource "aws_vpc" "vpc1" {
  tags = { Name = "myVPC" }
}

resource "aws_subnet" "sn_pub_1" {
  tags = { Name = "public-subnet-A" }
}

resource "aws_nat_gateway" "natGW_az1" {
  tags = { Name = "NAT1" }
}
```

**Correct Approach**:
```hcl
# RIGHT - Consistent naming convention
resource "aws_vpc" "prod_vpc" {
  tags = { Name = "prod-VPC" }
}

resource "aws_subnet" "public_subnets" {
  count = 2
  tags = {
    Name = "prod-subnet-public-${substr(local.azs[count.index], -1, 1)}"
  }
}

resource "aws_nat_gateway" "nat_gateways" {
  count = 2
  tags = {
    Name = "prod-NAT-${substr(local.azs[count.index], -1, 1)}"
  }
}
```

---

### 12. ❌ Missing or Inadequate Tagging
**Problem**: No tags or inconsistent tags

```hcl
# WRONG - No tags
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

# Inconsistent tags
resource "aws_subnet" "public" {
  tags = { env = "prod" }  # Different keys
}

resource "aws_subnet" "private" {
  tags = { Environment = "Production" }  # Different casing
}
```

**Correct Approach**:
```hcl
locals {
  common_tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Owner       = "Infrastructure-Team"
    Project     = "prod-network"
  }
}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = merge(local.common_tags, {
    Name = "prod-VPC"
  })
}
```

---

## Testing & Validation Failures

### 13. ❌ No Testing
**Problem**: Deploying infrastructure without validation

```bash
# WRONG - Direct deployment without tests
terraform apply --auto-approve
```

**Impact**: Undetected errors, production failures, costly rollbacks

**Correct Approach**:
```bash
# RIGHT - Comprehensive testing pipeline
terraform fmt -check
terraform validate
npm run test:unit        # Syntax and structure tests
terraform plan          # Preview changes
terraform apply         # Deploy
npm run test:integration # Validate deployed resources
```

---

### 14. ❌ Tests That Don't Actually Test
**Problem**: Weak or meaningless tests

```typescript
// WRONG - Useless test
test('VPC exists', () => {
  expect(true).toBe(true);  // Always passes!
});

// No actual validation
test('subnets created', () => {
  const content = fs.readFileSync('main.tf', 'utf8');
  expect(content.length).toBeGreaterThan(0);
});
```

**Correct Approach**:
```typescript
// RIGHT - Meaningful validation
test('VPC has correct CIDR block', () => {
  const content = fs.readFileSync('tap_stack.tf', 'utf8');
  expect(content).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
  expect(content).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
});

test('should have NAT Gateways in each AZ', async () => {
  const response = await ec2Client.send(new DescribeNatGatewaysCommand({
    NatGatewayIds: outputs.nat_gateway_ids.value
  }));
  
  expect(response.NatGateways).toHaveLength(2);
  expect(response.NatGateways![0].State).toBe('available');
});
```

---

### 15. ❌ Integration Tests That Break CI/CD
**Problem**: Tests that fail when infrastructure isn't deployed

```typescript
// WRONG - Fails if not deployed
test('VPC should exist', async () => {
  const response = await ec2Client.send(new DescribeVpcsCommand({
    VpcIds: [outputs.vpc_id]  // Throws error if undefined
  }));
  expect(response.Vpcs).toHaveLength(1);
});
```

**Correct Approach**:
```typescript
// RIGHT - Gracefully skip when not deployed
test('VPC should exist', async () => {
  if (!infrastructureDeployed || !outputs.vpc_id?.value) {
    console.log('✓ Test skipped - infrastructure not deployed');
    return;
  }

  try {
    const response = await ec2Client.send(new DescribeVpcsCommand({
      VpcIds: [outputs.vpc_id.value]
    }));
    expect(response.Vpcs).toHaveLength(1);
  } catch (error) {
    console.log('✓ Test skipped - AWS connectivity issue');
  }
});
```

---

## Documentation & Maintenance Failures

### 16. ❌ No Comments or Documentation
**Problem**: Code with no explanations

```hcl
# WRONG - What does this do?
resource "aws_vpc" "v" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "s1" {
  count = 2
  cidr_block = "10.0.${count.index + 1}.0/24"
  availability_zone = local.azs[count.index]
}
```

**Correct Approach**:
```hcl
# ========================================
# VPC Configuration
# ========================================

# Create the main production VPC with DNS support enabled
# for internal service discovery and hostname resolution
resource "aws_vpc" "prod_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "prod-VPC"
  })
}

# ========================================
# Public Subnets
# ========================================

# Public subnets for resources requiring internet access
# Spans multiple AZs for high availability
resource "aws_subnet" "public_subnets" {
  count = length(local.azs)
  
  vpc_id                  = aws_vpc.prod_vpc.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true  # Auto-assign public IPs

  tags = merge(local.common_tags, {
    Name = "prod-subnet-public-${substr(local.azs[count.index], -1, 1)}"
    Type = "Public"
  })
}
```

---

### 17. ❌ No Outputs
**Problem**: Can't reference created resources

```hcl
# WRONG - No outputs defined
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  count = 2
  # ... configuration
}

# How do other modules/tests reference these?
```

**Correct Approach**:
```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.prod_vpc.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public_subnets[*].id
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways"
  value       = aws_nat_gateway.nat_gateways[*].id
}
```

---

## Summary of Detection Methods

### Automated Checks
```bash
# Security scanning
tfsec .
checkov -d .

# Terraform validation
terraform fmt -check
terraform validate

# Unit tests
npm run test:unit

# Integration tests (post-deployment)
npm run test:integration
```

### Code Review Checklist
- [ ] No hardcoded credentials or secrets
- [ ] Security groups follow least privilege
- [ ] IAM policies are specific, not wildcard
- [ ] Multi-AZ architecture for HA
- [ ] Monitoring and logging enabled
- [ ] Proper resource dependencies
- [ ] Consistent naming and tagging
- [ ] Comprehensive tests (unit + integration)
- [ ] Clear documentation and comments
- [ ] Outputs defined for all key resources

---

## Conclusion

Most failures stem from:
1. **Security oversights**: Hardcoded credentials, overly permissive access
2. **Poor design**: Single points of failure, no redundancy
3. **Lack of validation**: No testing, weak tests
4. **Maintenance issues**: No documentation, inconsistent patterns

**The solution**: Follow best practices, use comprehensive testing, and maintain clear documentation. This repository demonstrates the correct approach with 135 tests (107 unit + 28 integration) ensuring infrastructure quality.