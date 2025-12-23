# Model Failures and Issues Documentation

## Issues Identified During Terraform Configuration and Deployment

### **Issue 1 — Invalid PostgreSQL Version**

**Error:**

```hcl
InvalidParameterCombination: Cannot find version 15.4 for postgres
```

**Root Cause:** PostgreSQL 15.4 is not available in the selected AWS region (us-east-1).
AWS RDS only supports specific minor versions of PostgreSQL, and 15.4 may not be among the
supported versions.

**Location:** `lib/modules/rds/main.tf` line 33

**Current Configuration:**

```hcl
resource "aws_db_instance" "main" {
  identifier     = "${var.environment}-db"
  engine         = "postgres"
  engine_version = "15.4"
  ...
}
```

**Fix:** Update `engine_version` to a supported version like **15.7** or **15.8** (check
available versions with `aws rds describe-db-engine-versions --engine postgres
--query 'DBEngineVersions[*].EngineVersion'`)

**Recommended Change:**

```hcl
engine_version = "15.7"  # or latest supported 15.x version
```

---

### **Issue 2 — S3 Lifecycle Configuration Warning**

**Warning:**

```hcl
Warning: Invalid Attribute Combination
No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required
```

**Root Cause:** AWS S3 lifecycle rules require either a `filter` or `prefix` attribute to be
specified. Without it, the lifecycle rule doesn't know which objects to apply to.

**Location:** `lib/modules/s3/main.tf` lines 40-60

**Current Configuration:**

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = var.environment == "prod" ? 90 : 30
    }
  }

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = var.environment == "prod" ? 60 : 30
      storage_class = "STANDARD_IA"
    }
  }
}
```

**Fix:** Add a `filter` block to each rule to specify that it applies to all objects.

**Recommended Change:**

```hcl
rule {
  id     = "expire-old-versions"
  status = "Enabled"

  filter {
    prefix = ""  # Apply to all objects
  }

  noncurrent_version_expiration {
    noncurrent_days = var.environment == "prod" ? 90 : 30
  }
}

rule {
  id     = "transition-to-ia"
  status = "Enabled"

  filter {
    prefix = ""  # Apply to all objects
  }

  transition {
    days          = var.environment == "prod" ? 60 : 30
    storage_class = "STANDARD_IA"
  }
}
```

---

### **Issue 3 — Hardcoded Database Passwords in tfvars Files**

**Security Issue:** Database passwords were initially stored in plain text in the `.tfvars`
files, which is a critical security risk if these files are committed to version control.

**Location:**

- `lib/dev.tfvars` line 20
- `lib/staging.tfvars` line 20
- `lib/prod.tfvars` line 20

**Root Cause:** Sensitive values should never be stored in version control or configuration
files.

**Fix Applied:** Implemented AWS Secrets Manager with automatic secret generation using Terraform's `random_password` resource.

**Implementation:**

```hcl
# Generate secure random password
resource "random_password" "db_password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Create AWS Secrets Manager secret
resource "aws_secretsmanager_secret" "db_password" {
  name        = "payment-app/${var.environment}/db-password"
  description = "Database password for ${var.environment} environment"
  tags        = local.common_tags
}

# Store the password in the secret
resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    password = random_password.db_password.result
  })
}

# Use the password in RDS module
module "rds" {
  ...
  db_password = random_password.db_password.result
  ...
}
```

### **Issue 5 — ALB S3 Access Denied for Logs**

**Error:**

```hcl
Error: modifying ELBv2 Load Balancer: InvalidConfigurationRequest: 
Access Denied for bucket: alb-logs-xxx. Please check S3 bucket permission
```

**Root Cause:** ALB requires specific S3 bucket permissions to write access logs. Without proper
bucket policy allowing the ELB service account, ALB cannot write logs.

**Location:** `lib/modules/alb/main.tf`

**Fix Applied:** Created S3 bucket with proper bucket policy for ALB logging.

**Implementation:**

```hclhcl
# S3 Bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.environment}-alb-logs"
}

# Bucket policy allowing ALB to write logs
resource "aws_s3_bucket_policy" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  policy = jsonencode({
    Statement = [
      {
        Principal = { Service = "elasticloadbalancing.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.alb_logs.arn}/*"
      },
      {
        Principal = { AWS = "arn:aws:iam::${elb_account_id}:root" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

# ALB with logging enabled
resource "aws_lb" "main" {
  ...
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }
}
```

### **Issue 6 — KMS Encryption for RDS and EBS**

**Issue:** RDS and EBS volumes need proper KMS encryption with appropriate key policies for
service access.

**Root Cause:** Without KMS keys and proper policies, services like RDS, EC2, CloudWatch Logs
cannot encrypt/decrypt data.

**Location:** `lib/kms.tf`, `lib/modules/rds/main.tf`, `lib/modules/asg/main.tf`

**Fix Applied:** Created dedicated KMS keys for RDS and EBS with proper service policies.

**Implementation:**

```hcl
# KMS Key for RDS
resource "aws_kms_key" "rds" {
  description         = "KMS key for RDS encryption"
  enable_key_rotation = true
}

# KMS Policy allowing RDS and CloudWatch Logs
resource "aws_kms_key_policy" "rds" {
  policy = jsonencode({
    Statement = [
      {
        Principal = { Service = "rds.amazonaws.com" }
        Action    = ["kms:Decrypt", "kms:CreateGrant"]
      },
      {
        Principal = { Service = "logs.amazonaws.com" }
        Action    = ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey*"]
      }
    ]
  })
}

# KMS Key for EBS
resource "aws_kms_key" "ebs" {
  description         = "KMS key for EBS encryption"
  enable_key_rotation = true
}

# RDS with KMS encryption
resource "aws_db_instance" "main" {
  ...
  storage_encrypted = true
  kms_key_id        = var.kms_key_id
}

# EC2 Launch Template with encrypted EBS
resource "aws_launch_template" "main" {
  block_device_mappings {
    ebs {
      encrypted  = true
      kms_key_id = var.kms_key_id
    }
  }
}
```

### **Issue 7 — AutoScaling Unable to Launch Encrypted EBS Volumes**

**Error:**

```hcl
Instance failed to launch
Cause: One or more of the attached Amazon EBS volumes are encrypted with an inaccessible AWS KMS key.

Resolution:
- Ensure that the KMS keys are in the enabled state.
- Ensure that you have the following permissions to decrypt and encrypt volumes:
  "kms:CreateGrant"
  "kms:Decrypt"
  "kms:DescribeKey"
  "kms:GenerateDataKeyWithoutPlainText"
  "kms:ReEncrypt"
- If the instance was launched by another AWS service (like Auto Scaling), ensure 
  that the KMS key policies grant that service access to the KMS key.
```

**Root Cause:** When Auto Scaling launches instances with encrypted EBS volumes, it uses the
**AWS service-linked role** `AWSServiceRoleForAutoScaling` to create the volumes. The KMS key
policy must explicitly grant this role (and the AutoScaling service) the required permissions,
especially `kms:CreateGrant`.

**Location:** `lib/kms.tf` - EBS KMS key policy

**Issue Details:**

- AutoScaling service acts independently from EC2 instance profiles
- The service-linked role needs `kms:CreateGrant` to create encrypted volumes
- Without proper KMS key policy, AutoScaling cannot create encrypted EBS volumes
- This blocks instance launches entirely, causing ASG health checks to fail

**Fix Applied:** Enhanced EBS KMS key policy to grant AutoScaling service and service-linked role the necessary permissions.

**Implementation:**

```hcl
# KMS Key Policy for EBS
resource "aws_kms_key_policy" "ebs" {
  key_id = aws_kms_key.ebs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${account_id}:root" }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow EC2 to use the key"
        Effect = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action = [
          "kms:Decrypt", "kms:DescribeKey", "kms:Encrypt",
          "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:CreateGrant"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Auto Scaling to use the key"
        Effect = "Allow"
        Principal = { Service = "autoscaling.amazonaws.com" }
        Action = [
          "kms:Decrypt", "kms:DescribeKey", "kms:Encrypt",
          "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:CreateGrant"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ec2.${region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow service-linked role for Auto Scaling"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${account_id}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling"
        }
        Action = [
          "kms:Decrypt", "kms:DescribeKey", "kms:Encrypt",
          "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:CreateGrant"
        ]
        Resource = "*"
      }
    ]
  })
}
```
