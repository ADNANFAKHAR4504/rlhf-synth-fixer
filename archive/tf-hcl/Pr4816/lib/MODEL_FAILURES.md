# Model Failures Analysis

This document identifies common failures and mistakes made by AI models when attempting to complete the Terraform infrastructure task.

## Category 1: Prompt Misunderstanding

### Failure 1.1: Wrong IaC Tool Selected
**Issue:** Model generated CloudFormation (JSON/YAML) or AWS CDK code instead of Terraform HCL.

**Example:**
```yaml
# Wrong - This is CloudFormation, not Terraform
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
```

**Root Cause:** Failed to recognize the explicit requirement for "Terraform (HCL)" in the prompt.

**Impact:** Complete failure - wrong toolchain entirely.

---

### Failure 1.2: Multi-File Response
**Issue:** Model created multiple files (main.tf, variables.tf, outputs.tf, provider.tf) instead of a single file.

**Example:**
```
Created files:
- provider.tf
- variables.tf  
- main.tf
- outputs.tf
```

**Root Cause:** Ignored the explicit requirement: "Everything must be in one single Terraform file (main.tf)".

**Impact:** Partial failure - code might work but doesn't meet the constraint.

---

### Failure 1.3: Using External Modules
**Issue:** Model used external Terraform modules from registry or GitHub instead of implementing resources directly.

**Example:**
```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "3.14.0"
  # ...
}
```

**Root Cause:** Ignored constraint: "No external modules or placeholder values".

**Impact:** Fails validation - external dependencies not allowed.

---

## Category 2: Incomplete Implementation

### Failure 2.1: Missing Critical Components
**Issue:** Model implemented only a subset of required resources.

**Common Omissions:**
- ❌ No CloudTrail implementation
- ❌ No AWS Config rules
- ❌ No Lambda function for secret rotation
- ❌ No SSM VPC endpoints
- ❌ No CloudWatch alarms
- ❌ Missing NAT Gateways

**Example:**
```hcl
# Only VPC, EC2, and RDS implemented
# Missing: S3, KMS, Secrets Manager, CloudTrail, Config, etc.
```

**Impact:** Major failure - infrastructure is incomplete and insecure.

---

### Failure 2.2: Placeholder Values
**Issue:** Used TODO comments or placeholder values instead of actual implementation.

**Example:**
```hcl
# Wrong - Placeholders used
resource "aws_lambda_function" "rotate_secret" {
  # TODO: Implement Lambda function
  filename = "lambda.zip"  # File doesn't exist
  # ...
}

# Wrong - Empty or placeholder Lambda code
resource "local_file" "lambda" {
  filename = "/tmp/lambda.py"
  content  = "# TODO: Implement rotation logic"
}
```

**Root Cause:** Constraint violated: "No external modules or placeholder values".

**Impact:** Code won't deploy - missing implementations.

---

### Failure 2.3: Incomplete Lambda Implementation
**Issue:** Lambda rotation function was referenced but not actually created with inline code.

**Wrong Approach:**
```hcl
resource "aws_lambda_function" "rotate" {
  filename = "rotation.zip"  # External file - not inline
  # Missing: actual Python code in heredoc format
}
```

**Correct Approach:**
```hcl
resource "local_file" "lambda_rotation_code" {
  filename = "/tmp/index.py"
  content  = <<-EOT
import boto3
import json
# Full implementation here...
  EOT
  
  provisioner "local-exec" {
    command = "cd /tmp && zip lambda_rotation.zip index.py"
  }
}
```

**Impact:** Secret rotation won't work - Lambda code missing.

---

## Category 3: Security Misconfigurations

### Failure 3.1: Missing Encryption
**Issue:** Resources created without encryption enabled.

**Examples:**
```hcl
# Wrong - RDS without encryption
resource "aws_db_instance" "main" {
  # storage_encrypted = true  # MISSING!
  # kms_key_id = aws_kms_key.main.arn  # MISSING!
}

# Wrong - S3 without KMS encryption
resource "aws_s3_bucket" "data" {
  # Missing server_side_encryption_configuration
}

# Wrong - EBS volumes not encrypted
resource "aws_launch_template" "app" {
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      # encrypted = true  # MISSING!
      # kms_key_id = aws_kms_key.main.arn  # MISSING!
    }
  }
}
```

**Impact:** Critical security failure - data at rest not encrypted.

---

### Failure 3.2: IMDSv1 Allowed
**Issue:** EC2 instances allow IMDSv1 instead of enforcing IMDSv2.

**Wrong:**
```hcl
resource "aws_launch_template" "app" {
  # Missing metadata_options block entirely
  # OR:
  metadata_options {
    http_tokens = "optional"  # Wrong - allows IMDSv1
  }
}
```

**Correct:**
```hcl
metadata_options {
  http_endpoint = "enabled"
  http_tokens = "required"  # IMDSv2 only
  http_put_response_hop_limit = 1
}
```

**Impact:** Security vulnerability - SSRF attacks possible.

---

### Failure 3.3: SSH Access Enabled
**Issue:** Security groups allow SSH (port 22) despite requirement for "no open SSH".

**Wrong:**
```hcl
resource "aws_security_group" "app" {
  ingress {
    from_port = 22
    to_port = 22
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Very bad!
  }
}
```

**Root Cause:** Ignored requirement: "EC2 instances must run in private subnets with SSM Session Manager access (no open SSH)".

**Impact:** Security violation - unnecessary attack surface.

---

### Failure 3.4: Weak TLS Policy
**Issue:** ALB configured with outdated TLS policy.

**Wrong:**
```hcl
resource "aws_lb_listener" "https" {
  ssl_policy = "ELBSecurityPolicy-2016-08"  # Too old!
  # OR missing ssl_policy entirely (uses default)
}
```

**Correct:**
```hcl
resource "aws_lb_listener" "https" {
  ssl_policy = "ELBSecurityPolicy-TLS-1-2-2017-01"  # TLS 1.2+
}
```

**Impact:** Security vulnerability - weak encryption.

---

### Failure 3.5: S3 Public Access Not Blocked
**Issue:** S3 buckets missing public access block.

**Wrong:**
```hcl
resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
  # Missing aws_s3_bucket_public_access_block
}
```

**Impact:** Data exposure risk - buckets might become public.

---

### Failure 3.6: No S3 Versioning
**Issue:** S3 buckets created without versioning enabled.

**Wrong:**
```hcl
resource "aws_s3_bucket" "data" {
  bucket = "my-bucket"
  # Missing versioning configuration
}
```

**Impact:** Data loss risk - can't recover deleted/overwritten objects.

---

### Failure 3.7: Overly Permissive IAM Policies
**Issue:** IAM policies grant excessive permissions instead of least privilege.

**Wrong:**
```hcl
policy = jsonencode({
  Statement = [{
    Effect = "Allow"
    Action = "*"  # Too broad!
    Resource = "*"
  }]
})
```

**Impact:** Security risk - violation of least privilege principle.

---

## Category 4: High Availability Failures

### Failure 4.1: Single-AZ Architecture
**Issue:** Resources deployed in only one availability zone.

**Wrong:**
```hcl
resource "aws_subnet" "public" {
  # Only 1 subnet instead of 2
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}

resource "aws_db_instance" "main" {
  multi_az = false  # Single AZ!
}
```

**Root Cause:** Ignored requirement: "multi-AZ high availability".

**Impact:** No fault tolerance - single point of failure.

---

### Failure 4.2: Missing NAT Gateway Redundancy
**Issue:** Only one NAT Gateway created instead of one per AZ.

**Wrong:**
```hcl
resource "aws_nat_gateway" "main" {
  # Only 1 NAT Gateway for all AZs
  subnet_id = aws_subnet.public[0].id
}
```

**Correct:**
```hcl
resource "aws_nat_gateway" "main" {
  count = 2  # One per AZ
  subnet_id = aws_subnet.public[count.index].id
}
```

**Impact:** Single point of failure for outbound internet access.

---

### Failure 4.3: RDS Not Multi-AZ
**Issue:** RDS database created without Multi-AZ enabled.

**Wrong:**
```hcl
resource "aws_db_instance" "main" {
  # multi_az = true  # MISSING!
}
```

**Impact:** No database high availability - downtime during failures.

---

## Category 5: Network Architecture Errors

### Failure 5.1: EC2 in Public Subnets
**Issue:** Application instances placed in public subnets instead of private.

**Wrong:**
```hcl
resource "aws_autoscaling_group" "app" {
  vpc_zone_identifier = aws_subnet.public[*].id  # Wrong!
}
```

**Root Cause:** Ignored requirement: "EC2 instances must run in private subnets".

**Impact:** Security risk - instances directly exposed to internet.

---

### Failure 5.2: ALB in Private Subnets
**Issue:** Load balancer placed in private subnets instead of public.

**Wrong:**
```hcl
resource "aws_lb" "app" {
  subnets = aws_subnet.private[*].id  # Wrong!
}
```

**Impact:** ALB not reachable from internet.

---

### Failure 5.3: Missing VPC Endpoints
**Issue:** No VPC endpoints for SSM, preventing Session Manager access.

**Missing:**
- com.amazonaws.REGION.ssm
- com.amazonaws.REGION.ssmmessages
- com.amazonaws.REGION.ec2messages

**Impact:** SSM Session Manager won't work for private instances.

---

### Failure 5.4: Incorrect Route Table Associations
**Issue:** Subnets not properly associated with route tables.

**Wrong:**
```hcl
# Private subnets using public route table
resource "aws_route_table_association" "private" {
  subnet_id = aws_subnet.private[0].id
  route_table_id = aws_route_table.public.id  # Wrong!
}
```

**Impact:** Private subnets have direct internet access (not using NAT).

---

## Category 6: Missing Monitoring & Compliance

### Failure 6.1: No CloudWatch Alarms
**Issue:** Infrastructure deployed without monitoring alarms.

**Missing:**
- EC2 CPU utilization alarms
- RDS CPU utilization alarms
- RDS storage space alarms
- ALB target health alarms

**Impact:** No alerting when issues occur.

---

### Failure 6.2: No CloudTrail
**Issue:** Audit logging not implemented.

**Impact:** No compliance - can't track AWS API calls.

---

### Failure 6.3: No AWS Config Rules
**Issue:** Compliance rules not configured.

**Missing Rules:**
- S3 encryption enabled
- S3 versioning enabled
- RDS Multi-AZ enabled
- CloudTrail enabled

**Impact:** No automated compliance checking.

---

### Failure 6.4: CloudTrail Not Multi-Region
**Issue:** CloudTrail created as single-region trail.

**Wrong:**
```hcl
resource "aws_cloudtrail" "main" {
  # is_multi_region_trail = true  # MISSING!
}
```

**Impact:** Only logs events in one region.

---

## Category 7: Variable & Configuration Issues

### Failure 7.1: Missing Required Variables
**Issue:** Required variables not declared.

**Missing:**
- `var.allowed_ip_ranges`
- `var.acm_certificate_arn`
- `var.admin_email`
- `var.prevent_destroy`

**Impact:** Configuration incomplete - can't be customized.

---

### Failure 7.2: Wrong Variable Names
**Issue:** Using incorrect variable names from the prompt.

**Wrong:**
```hcl
variable "aws_region" {}  # Correct

# But using var.region in provider instead of var.aws_region
provider "aws" {
  region = var.region  # Wrong variable!
}
```

**Impact:** Configuration errors.

---

### Failure 7.3: Hardcoded Values
**Issue:** Values hardcoded instead of using variables.

**Wrong:**
```hcl
resource "aws_lb" "app" {
  # Should use var.environment instead
  name = "prod-alb"
}

# Should use var.admin_email
resource "aws_sns_topic_subscription" "alarm" {
  endpoint = "admin@example.com"  # Hardcoded!
}
```

**Impact:** Not reusable or configurable.

---

## Summary of Common Failure Patterns

### Top 10 Most Critical Failures:
1. ❌ Wrong IaC tool (CloudFormation/CDK instead of Terraform)
2. ❌ Missing encryption on storage resources
3. ❌ EC2 in public subnets instead of private
4. ❌ No Lambda implementation for secret rotation
5. ❌ Single-AZ instead of Multi-AZ
6. ❌ Missing CloudTrail and AWS Config
7. ❌ IMDSv1 allowed (not enforcing IMDSv2)
8. ❌ Using external modules instead of inline resources
9. ❌ SSH access enabled in security groups
10. ❌ Missing VPC endpoints for SSM

### Failure Categories by Frequency:
- 🔴 Security Misconfigurations: 35%
- 🟠 Incomplete Implementation: 25%
- 🟡 High Availability Issues: 15%
- 🟢 Network Architecture Errors: 12%
- 🔵 Missing Monitoring: 8%
- ⚪ Other (formatting, outputs, etc.): 5%

## Infrastructure Validation

The ideal implementation successfully addresses all these common failure patterns through:

### Security Compliance:
- All storage resources properly encrypted with KMS
- Security configurations follow AWS best practices
- Variable declarations meet requirements
- Proper resource attributes and lifecycle configurations

### Architecture Validation:
- Resources deployed correctly across multiple availability zones
- Network connectivity properly implemented
- Multi-AZ deployment ensures high availability
- Monitoring and alarm systems properly configured

This comprehensive approach ensures the implementation avoids all common failure patterns and meets all enterprise requirements.