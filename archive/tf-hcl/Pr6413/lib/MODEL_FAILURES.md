## Zero-Trust Security Architecture for Payment Processing - Deployment Failures

**Project:** PCI-DSS Compliant Zero-Trust Infrastructure  
**Environment:** Development (us-east-1)  
**Deployment Date:** 2025-11-12  
**Total Errors Resolved:** 4

***

## Error 1: VPC Flow Log Configuration - Invalid Argument

**Category:** Configuration Error (Critical)

### Description
Terraform plan failed during VPC Flow Log resource creation with error: "Unsupported argument - An argument named 'log_destination_arn' is not expected here."

### Root Cause
The `aws_flow_log` resource uses `log_destination` as the argument name for S3 destinations, not `log_destination_arn`. The Terraform AWS provider documentation specifies `log_destination` for both S3 and CloudWatch Logs destinations, with the type differentiated by the `log_destination_type` argument.

### Impact Assessment
- **Operational:** High - VPC traffic monitoring completely unavailable
- **Security:** Critical - No audit trail for network traffic, violating PCI-DSS requirement 10.3.4
- **Compliance:** Critical - Missing required network monitoring for financial data processing
- **Cost:** Low - No additional cost impact

### Fix Applied

```hcl
resource "aws_flow_log" "main" {
  log_destination_type = "s3"
  log_destination      = aws_s3_bucket.flow_logs.arn
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  
  tags = {
    Name = "flow-log-vpc-${var.environment}"
  }
  
  depends_on = [
    aws_iam_role.flow_logs,
    aws_iam_role_policy_attachment.flow_logs
  ]
}
```

### Prevention Strategy
1. Always reference current Terraform AWS provider documentation for argument names
2. Validate resource configurations against provider schema before deployment
3. Use `terraform validate` in CI/CD pipeline to catch schema mismatches
4. Maintain provider version pinning to avoid breaking changes

***

## Error 2: Security Group Naming - Reserved Prefix Violation

**Category:** Configuration Error (High)

### Description
Terraform plan failed for all three security groups with error: "invalid value for name_prefix (cannot begin with sg-)". AWS rejected security group creation at lines 628, 669, and 700.

### Root Cause
AWS reserves the `sg-` prefix exclusively for system-generated security group identifiers. User-specified security group names or name prefixes cannot use this reserved prefix, as it conflicts with AWS's internal naming scheme.

### Impact Assessment
- **Operational:** High - Complete infrastructure deployment blocked
- **Security:** High - Network segmentation between application, database, and management tiers not implemented
- **Compliance:** High - Zero-trust network isolation controls not enforced
- **Cost:** Low - No resources created, no cost incurred

### Fix Applied

```hcl
resource "aws_security_group" "app" {
  name_prefix = "app-${var.environment}-"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-app-${var.environment}"
  }
}

resource "aws_security_group" "db" {
  name_prefix = "db-${var.environment}-"
  description = "Security group for database tier"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-db-${var.environment}"
  }
}

resource "aws_security_group" "mgmt" {
  name_prefix = "mgmt-${var.environment}-"
  description = "Security group for management tier"
  vpc_id      = aws_vpc.main.id

  tags = {
    Name = "sg-mgmt-${var.environment}"
  }
}
```

### Prevention Strategy
1. Document AWS naming restrictions in infrastructure coding standards
2. Create reusable Terraform modules with validated naming patterns
3. Implement pre-commit hooks that validate resource naming conventions
4. Use tags for visual identification while keeping resource names compliant

***

## Error 3: CloudWatch Logs KMS Encryption - Access Denied

**Category:** Security Policy Error (Critical)

### Description
CloudWatch Log Group creation failed for all three log groups with error: "AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-east-1:ACCOUNT_ID:log-group:NAME'". Affected log groups: application logs, Lambda logs, and VPC Flow Logs.

### Root Cause
The KMS key policy for logs encryption included an overly restrictive Condition block that validated encryption context during log group creation. CloudWatch Logs service creates log groups without the specific encryption context pattern specified in the condition, causing the permission check to fail.

### Impact Assessment
- **Operational:** Critical - No centralized logging available for troubleshooting
- **Security:** Critical - Audit logs not encrypted at rest, violating PCI-DSS requirement 3.4
- **Compliance:** Critical - Missing required encryption controls for financial data
- **Cost:** Low - No log ingestion costs incurred

### Fix Applied

```hcl
resource "aws_kms_key_policy" "logs_encryption" {
  key_id = aws_kms_key.logs_encryption.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = [
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
          ]
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "logs.amazonaws.com"
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
      },
      {
        Sid    = "Allow VPC Flow Logs to use the key"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
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
      }
    ]
  })
}
```

### Prevention Strategy
1. Avoid complex Condition blocks in KMS key policies unless absolutely required
2. Test KMS key policies with service principals in isolation before integration
3. Reference AWS service-specific KMS key policy examples from official documentation
4. Use CloudFormation/Terraform validation in non-production environment first

***

## Error 4: SNS Topic Policy - Invalid Action Scope

**Category:** Logic Error (High)

### Description
SNS topic policy application failed with error: "InvalidParameter: Policy statement action out of service scope!" during resource creation. Multiple deployment attempts with different policy configurations all failed with the same error.

### Root Cause
The SNS topic policy contained two invalid configurations:
1. Wildcard action `sns:*` is not permitted in SNS resource-based policies (only in IAM policies)
2. Service principal `lambda.amazonaws.com` is not valid for SNS topic policies (Lambda uses identity-based permissions)
3. Service principal `cloudwatch.amazonaws.com` is not valid for SNS topic policies (CloudWatch Alarms publish through EventBridge)

AWS SNS validates topic policy actions against a service-specific allowlist and rejects wildcards or invalid service principals.

### Impact Assessment
- **Operational:** High - No security notifications delivered to response teams
- **Security:** High - Compliance violations and security group changes not monitored
- **Compliance:** Medium - Audit trail gaps for security events
- **Cost:** Low - No SNS message delivery costs

### Fix Applied

```hcl
resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgeToPublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}
```