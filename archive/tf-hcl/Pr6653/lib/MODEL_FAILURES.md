# MODEL_FAILURES.md

This document tracks critical configuration errors identified and resolved in the Terraform VPC infrastructure deployment.

***

## Critical Errors

### Error 1: VPC Flow Logs Unsupported Argument

**Description:**
Terraform plan failed with error "Unsupported argument" at line 544 in the `aws_flow_log` resource. The error indicated that `log_destination_arn` is not a valid attribute name for VPC Flow Logs configuration.

**Root Cause:**
The AWS Terraform provider uses `log_destination` as the attribute name when configuring VPC Flow Logs with CloudWatch Logs as the destination type, not `log_destination_arn`. This is a provider schema constraint that differs from AWS API naming conventions.

**Impact:**
- **Operational**: Complete deployment failure preventing infrastructure creation
- **Security**: VPC Flow Logs unavailable, preventing security monitoring and network traffic analysis
- **Compliance**: PCI DSS Requirement 10.3.1 violation (failure to log network traffic for audit trails)

**Fix Applied:**
```hcl
# BEFORE (Line 544)
resource "aws_flow_log" "main" {
  iam_role_arn             = aws_iam_role.vpc_flow_logs.arn
  log_destination_type     = "cloud-watch-logs"
  log_destination_arn      = aws_cloudwatch_log_group.vpc_flow_logs.arn  # INCORRECT
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.main.id
  max_aggregation_interval = 60
}

# AFTER (Fixed)
resource "aws_flow_log" "main" {
  iam_role_arn             = aws_iam_role.vpc_flow_logs.arn
  log_destination_type     = "cloud-watch-logs"
  log_destination          = aws_cloudwatch_log_group.vpc_flow_logs.arn  # CORRECT
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.main.id
  max_aggregation_interval = 60

  tags = {
    Name = "flow-log-vpc-${var.environment}"
  }

  depends_on = [
    aws_iam_role.vpc_flow_logs,
    aws_iam_role_policy_attachment.vpc_flow_logs,
    aws_cloudwatch_log_group.vpc_flow_logs,
    aws_kms_key.cloudwatch_logs
  ]
}
```

**Prevention Strategy:**
- Validate Terraform provider documentation before using AWS service-specific attributes
- Use `terraform validate` during development to catch schema errors early
- Reference official Terraform Registry documentation for aws_flow_log resource schema
- Implement automated testing in CI/CD pipeline to validate resource configurations

***

### Error 2: Security Group Naming Constraint

**Description:**
Multiple security groups failed creation with error "invalid value for name (cannot begin with sg-)" at lines 817, 848, 879, and 910. All four security group tiers (public, private, database, management) were affected.

**Root Cause:**
AWS reserves the `sg-` prefix for auto-generated security group identifiers. User-defined security group names cannot start with this reserved prefix, as documented in AWS EC2 security group naming constraints.

**Impact:**
- **Operational**: Deployment blocked for all four security group tiers preventing network isolation
- **Security**: Network access controls unavailable, leaving resources unprotected
- **Compliance**: PCI DSS Requirement 1.2.1 violation (failure to restrict connections between untrusted networks and cardholder data environment)

**Fix Applied:**
```hcl
# Public Security Group (Line 817)
# BEFORE
resource "aws_security_group" "public" {
  name        = "sg-public-${var.environment}"  # INCORRECT
  description = "Security group for public-facing ALBs"
  vpc_id      = aws_vpc.main.id
}

# AFTER (Fixed)
resource "aws_security_group" "public" {
  name        = "public-${var.environment}"  # CORRECT
  description = "Security group for public-facing ALBs"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-public-${var.environment}"  # Tags CAN use sg- prefix
  }
}

# Private Security Group (Line 848)
resource "aws_security_group" "private" {
  name        = "private-${var.environment}"  # Changed from "sg-private-${var.environment}"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-private-${var.environment}"
  }
}

# Database Security Group (Line 879)
resource "aws_security_group" "database" {
  name        = "database-${var.environment}"  # Changed from "sg-database-${var.environment}"
  description = "Security group for database instances"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-database-${var.environment}"
  }
}

# Management Security Group (Line 910)
resource "aws_security_group" "management" {
  name        = "management-${var.environment}"  # Changed from "sg-management-${var.environment}"
  description = "Security group for bastion and management tools"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-management-${var.environment}"
  }
}
```

**Prevention Strategy:**
- Document AWS reserved naming prefixes in infrastructure standards documentation
- Use descriptive names without service-specific prefixes (public, private, database, management)
- Reserve sg- prefix only for tags where AWS allows it
- Add validation rules in CI/CD pipeline to check for reserved prefixes
- Create naming convention guide for all AWS resources

***

### Error 3: KMS Key Policy Invalid Principal

**Description:**
KMS key creation failed with error "Policy contains a statement with one or more invalid principals" for both CloudWatch Logs and CloudTrail encryption keys at lines 20 and 68.

**Root Cause:**
IAM wildcard principals in the format `arn:aws:iam::ACCOUNT:user/*` are not permitted in KMS key policies. AWS KMS requires explicit user ARNs or uses the account root principal for delegating permissions to IAM users and roles.

**Impact:**
- **Security**: Encryption keys unavailable, preventing encryption at rest for logs and audit trails
- **Compliance**: PCI DSS Requirement 3.4 violation (failure to render cardholder data unreadable through encryption)
- **Cost**: Deployment delays increasing infrastructure provisioning time

**Fix Applied:**
```hcl
# BEFORE
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption - PCI compliance"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs Service"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Deployment User"  # PROBLEMATIC STATEMENT
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/*"  # INVALID WILDCARD
        }
        Action   = "kms:*"
        Resource = "*"
      }
    ]
  })
}

# AFTER (Fixed - Removed wildcard user statement)
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption - PCI compliance"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs Service"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      }
    ]
  })
}
```

**Prevention Strategy:**
- Use account root principal for delegating KMS permissions to IAM principals
- Never use wildcard patterns in IAM user ARNs within KMS key policies
- Always include encryption context conditions to restrict KMS key usage
- Test KMS policies in non-production environments before applying to production
- Reference AWS KMS best practices documentation for policy templates

***

## Configuration Errors

### Error 4: CloudWatch Logs KMS Key Permissions

**Description:**
CloudWatch Log Group creation failed with AccessDeniedException at line 455 indicating "The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:ap-southeast-1:044454600151:log-group:/aws/vpc/flowlogs'".

**Root Cause:**
KMS key policy lacked required CloudWatch Logs service permissions including regional service principal, encryption context condition, and complete action permissions. The service principal must be regional (`logs.REGION.amazonaws.com`) and include encryption context matching the log group ARN pattern.

**Impact:**
- **Security**: VPC Flow Logs unavailable, preventing security event detection and incident response
- **Compliance**: PCI DSS Requirement 10.2 violation (failure to implement automated audit trails)
- **Operational**: Network traffic monitoring disabled, reducing visibility into potential security threats

**Fix Applied:**
```hcl
# BEFORE
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption - PCI compliance"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs Service"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"  # Missing region
        }
        Action = [
          "kms:GenerateDataKey",  # Incomplete actions
          "kms:Decrypt"
        ]
        Resource = "*"  # Missing encryption context condition
      }
    ]
  })
}

# AFTER (Fixed)
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption - PCI compliance"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable Root Account Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs Service"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"  # Added regional principal
        }
        Action = [
          "kms:Encrypt",           # Added
          "kms:Decrypt",
          "kms:ReEncrypt*",        # Added
          "kms:GenerateDataKey*",  # Changed from GenerateDataKey
          "kms:CreateGrant",       # Added
          "kms:DescribeKey"        # Added
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"  # Added encryption context
          }
        }
      }
    ]
  })
}
```

**Prevention Strategy:**
- Always use regional service principals for CloudWatch Logs KMS policies
- Include encryption context conditions to restrict key usage to specific log groups
- Add all required KMS actions: Encrypt, Decrypt, ReEncrypt, GenerateDataKey, CreateGrant, DescribeKey
- Test KMS key policies with CloudWatch Logs in isolated environments before production deployment
- Reference AWS official documentation for CloudWatch Logs encryption requirements

***

### Error 5: SNS Topic Policy Invalid Action

**Description:**
SNS topic policy update failed at line 940 with error "Policy statement action out of service scope" when applying the infrastructure configuration.

**Root Cause:**
SNS topic policies only accept lowercase action names (`sns:Publish`, `sns:Subscribe`) but the policy contained uppercase actions (`SNS:*`). AWS IAM policy validation rejects uppercase service prefixes in resource-based policies for SNS.

**Impact:**
- **Operational**: CloudWatch alarms unable to publish notifications to SNS topic
- **Security**: Security alerts not delivered to operations team, delaying incident response
- **Compliance**: PCI DSS Requirement 10.6 violation (failure to review logs and security events daily)

**Fix Applied:**
```hcl
# BEFORE (Line 940)
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"  # INCORRECT uppercase
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "AllowRootAccountToManage"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "SNS:*"  # INVALID uppercase action
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# AFTER (Fixed)
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchToPublish"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"  # Lowercase action only
        Resource = aws_sns_topic.alerts.arn
      }
      # Removed second statement with SNS:* action
    ]
  })
}
```

**Prevention Strategy:**
- Use lowercase service prefixes in all resource-based policies (sns:, s3:, kms:)
- Remove unnecessary wildcard permissions from SNS topic policies
- Rely on root account principal for administrative access instead of explicit policy statements
- Validate IAM policy syntax using `aws iam validate-policy-document` before applying
- Create policy templates with correct action syntax for common AWS services

***

## Prevention Framework

### Automated Validation
1. **Pre-deployment Checks**: Implement `terraform validate` and plan validation in CI/CD pipeline
2. **KMS Policy Testing**: Create test scripts to verify KMS key permissions before deployment
3. **Service Integration Tests**: Validate CloudWatch, SNS, and other service connectivity in staging
4. **Security Compliance Scans**: Automated PCI compliance validation using AWS Config rules

### Code Review Standards
1. **KMS Reference Review**: Mandatory review of all KMS key references and policy statements
2. **Service Attribute Validation**: Cross-reference AWS provider documentation for correct attribute names
3. **Naming Convention Audit**: Verify resource names comply with AWS restrictions
4. **Policy Permission Audit**: Review KMS and SNS policies for completeness and correct syntax

### Deployment Pipeline
1. **Staging Environment Testing**: Test all configurations in non-production environment first
2. **Gradual Rollout**: Deploy infrastructure in phases with validation between each phase
3. **Monitoring Integration**: Implement immediate monitoring for encryption services and log delivery
4. **Rollback Procedures**: Maintain rollback capability for failed deployments with state backup

### Documentation Standards
1. **KMS Usage Guide**: Document correct ARN vs ID usage patterns and policy requirements
2. **Service Integration Matrix**: Reference guide for AWS service-specific requirements
3. **Error Response Playbooks**: Procedures for common deployment failures and their resolutions
4. **Compliance Checklists**: Verify encryption and security requirements for PCI DSS

---

## Summary

These errors highlight critical areas requiring enhanced validation in Terraform infrastructure deployments:

- **Terraform Provider Attributes**: Attribute names differ between AWS API and Terraform provider schema
- **AWS Naming Restrictions**: Reserved prefixes like `sg-` cannot be used in resource names
- **KMS Key Policy Complexity**: Wildcard principals, regional service principals, and encryption context requirements
- **Service-Specific Permissions**: Each AWS service requires specific KMS actions and policy conditions
- **IAM Policy Syntax**: Action names must use lowercase service prefixes in resource-based policies

The fixes implemented ensure PCI DSS compliance (Requirements 1.2.1, 3.4, 10.2, 10.3.1, 10.6), proper encryption at rest, comprehensive network monitoring, and reliable infrastructure deployment for the VPC architecture.