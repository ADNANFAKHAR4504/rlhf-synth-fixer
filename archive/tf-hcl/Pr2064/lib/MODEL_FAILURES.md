# Model Failures for SecureCorp AWS Infrastructure Setup

## Prompt Analysis Issues

### 1. **Ambiguous Requirements**
- **Issue**: The prompt doesn't specify which specific AWS services need VPC endpoints
- **Impact**: Model might create unnecessary endpoints or miss critical ones
- **Expected**: Should specify services like S3, RDS, CloudTrail, KMS, etc.

### 2. **Missing Environment Context**
- **Issue**: No clear indication of which environment (dev/staging/prod) to implement
- **Impact**: Model might create resources for all environments or none
- **Expected**: Should specify target environment or create environment-specific variables

### 3. **Vague IAM Requirements**
- **Issue**: "broader access but still restricted" is too subjective
- **Impact**: Model might create overly permissive or overly restrictive policies
- **Expected**: Should specify exact permissions needed for each role

## Expected Terraform Implementation Issues

### 1. **Resource Naming Convention**
```hcl
# ❌ Potential Failure: Inconsistent naming
resource "aws_s3_bucket" "logs" {
  bucket = "securecorp-logs"  # Missing environment prefix
}

# ✅ Expected: Proper naming convention
resource "aws_s3_bucket" "logs" {
  bucket = "securecorp-${var.environment}-logs-${random_string.suffix.result}"
}
```

### 2. **KMS Key Management**
```hcl
# ❌ Potential Failure: Using default AWS keys
resource "aws_s3_bucket" "data" {
  bucket = var.bucket_name
  # Missing encryption configuration
}

# ✅ Expected: Customer-managed KMS keys
resource "aws_kms_key" "s3_encryption" {
  description = "KMS key for S3 bucket encryption"
  policy = data.aws_iam_policy_document.kms_policy.json
}

resource "aws_s3_bucket" "data" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption.arn
      sse_algorithm     = "aws:kms"
    }
  }
}
```

### 3. **VPC Endpoint Configuration**
```hcl
# ❌ Potential Failure: Missing VPC endpoints
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  # No VPC endpoints defined
}

# ✅ Expected: Comprehensive VPC endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
}

resource "aws_vpc_endpoint" "kms" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.kms"
  vpc_endpoint_type = "Interface"
  subnet_ids        = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoints.id]
}
```

### 4. **IAM Role Permissions**
```hcl
# ❌ Potential Failure: Overly permissive policies
resource "aws_iam_role_policy" "dev_role" {
  name = "dev_policy"
  role = aws_iam_role.dev_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "s3:*"  # Too broad
        Resource = "*"
      }
    ]
  })
}

# ✅ Expected: Least privilege principle
resource "aws_iam_role_policy" "dev_role" {
  name = "dev_policy"
  role = aws_iam_role.dev_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::securecorp-${var.environment}-dev-*",
          "arn:aws:s3:::securecorp-${var.environment}-dev-*/*"
        ]
        Condition = {
          StringEquals = {
            "aws:RequestTag/Environment" = var.environment
          }
        }
      }
    ]
  })
}
```

### 5. **CloudTrail Configuration**
```hcl
# ❌ Potential Failure: Basic CloudTrail setup
resource "aws_cloudtrail" "main" {
  name           = "securecorp-trail"
  s3_bucket_name = aws_s3_bucket.logs.bucket
  # Missing important configurations
}

# ✅ Expected: Comprehensive CloudTrail
resource "aws_cloudtrail" "main" {
  name                          = "securecorp-${var.environment}-trail"
  s3_bucket_name                = aws_s3_bucket.logs.bucket
  include_global_services_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  
  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::"]
    }
  }
  
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch_role.arn
}
```

### 6. **Security Group Configuration**
```hcl
# ❌ Potential Failure: Open security groups
resource "aws_security_group" "private" {
  name        = "private-sg"
  description = "Private subnet security group"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]  # Too permissive
  }
}

# ✅ Expected: Restrictive security groups
resource "aws_security_group" "private" {
  name        = "securecorp-${var.environment}-private-sg"
  description = "Private subnet security group"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "HTTPS from ALB"
  }
  
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS to internet"
  }
}
```

## Common Model Mistakes

### 1. **Missing Variables**
- Not defining environment variable
- No region variable (hardcoded us-east-1)
- Missing tags variable for consistent resource tagging

### 2. **Incomplete Resource Dependencies**
- Creating resources without proper depends_on
- Missing data sources for existing resources
- Not handling resource creation order properly

### 3. **Security Misconfigurations**
- Public S3 buckets
- Overly permissive IAM policies
- Missing encryption configurations
- Insecure security group rules

### 4. **Compliance Gaps**
- No log retention policies
- Missing CloudWatch alarms
- No backup strategies
- Incomplete audit trails

### 5. **Scalability Issues**
- Hardcoded values instead of variables
- No support for multiple environments
- Missing auto-scaling configurations
- No disaster recovery considerations

## Expected Output Structure

The model should generate a single `tap_stack.tf` file containing:

1. **Provider Configuration**
2. **Variables Section**
3. **Data Sources**
4. **VPC and Networking**
5. **KMS Keys**
6. **S3 Buckets with Encryption**
7. **IAM Roles and Policies**
8. **CloudTrail Configuration**
9. **CloudWatch Setup**
10. **VPC Endpoints**
11. **Security Groups**
12. **Outputs**

## Validation Checklist

- [ ] All resources follow naming convention
- [ ] KMS encryption enabled on all storage
- [ ] VPC endpoints configured for AWS services
- [ ] IAM policies follow least privilege
- [ ] CloudTrail captures all API calls
- [ ] Security groups are restrictive
- [ ] No hardcoded values
- [ ] Proper resource dependencies
- [ ] Environment variables used
- [ ] Tags applied consistently