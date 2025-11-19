# CloudWatch Logs Observability Infrastructure - Production Deployment Issues

## Error Category: Critical - KMS Key Policy Configuration

---

## 1. KMS Key Missing Encryption Context for CloudWatch Logs

### Description
CloudWatch Logs failed to create encrypted log groups with error: `AccessDeniedException: The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:ap-southeast-1:044454600151:log-group:/aws/lambda/payment-api-dev'`

All three log groups (payment-api, fraud-detection, notification-service) failed during `terraform apply` despite the KMS key existing and having a policy statement for the CloudWatch Logs service principal.

### Root Cause
The KMS key policy was missing the required encryption context condition that AWS CloudWatch Logs now mandates. AWS CloudWatch Logs uses `kms:EncryptionContext:aws:logs:arn` as a security enhancement to ensure KMS keys can only be used with specific log group ARNs. The original policy allowed the CloudWatch Logs service principal but did not include the encryption context condition, causing AWS to reject the key usage during log group creation.

### Impact
- Security: Without encryption context, KMS keys could potentially be used by unauthorized log groups across accounts
- Operational: Complete deployment failure - zero log groups created, blocking all Lambda function logging
- Compliance: Financial services compliance requirements for encrypted logs could not be met
- Cost: Wasted infrastructure provisioning time and delayed production deployment

### Fix Applied

```hcl
resource "aws_kms_key" "cloudwatch_logs" {
  description             = "KMS key for CloudWatch Logs encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 7

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
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

Key Changes:
1. Added Condition block with kms:EncryptionContext:aws:logs:arn requiring log group ARN in encryption context
2. Changed service principal from logs.amazonaws.com to logs.region.amazonaws.com for regional scoping
3. Added kms:CreateGrant and kms:DescribeKey permissions required by CloudWatch Logs for encrypted log groups

### Prevention Strategy
1. Always include encryption context conditions in KMS key policies when used with AWS services that support it (CloudWatch Logs, S3, DynamoDB)
2. Use regional service principals (logs.region.amazonaws.com) instead of global ones for better security boundaries
3. Validate KMS key policies against AWS service-specific requirements documented in official AWS documentation
4. Include all required KMS permissions: Decrypt, GenerateDataKey, CreateGrant, DescribeKey for CloudWatch Logs integration
5. Test KMS key policies in non-production environments before production deployment
6. Implement automated policy validation in CI/CD pipelines using tools like AWS IAM Policy Validator or OPA

---

## Error Category: Configuration - Resource Dependency Management

---

## 2. Missing KMS Key Reference in Log Group Configuration

### Description
After fixing the KMS key policy, the Terraform configuration still referenced log groups without the kms_key_id attribute, causing unencrypted log group creation.

### Root Cause
The CloudWatch Log Group resources were missing the kms_key_id parameter, which tells CloudWatch Logs which KMS key to use for encryption. Without this parameter, AWS creates log groups with default server-side encryption instead of customer-managed KMS encryption.

### Impact
- Security: Log data would be encrypted with AWS-managed keys instead of customer-managed keys, reducing control over key rotation and access policies
- Compliance: Financial services regulations typically require customer-managed encryption keys for audit trail logs
- Operational: Inconsistent encryption standards across infrastructure

### Fix Applied

```hcl
resource "aws_cloudwatch_log_group" "payment_api" {
  name              = "/aws/lambda/payment-api-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]
}

resource "aws_cloudwatch_log_group" "fraud_detection" {
  name              = "/aws/lambda/fraud-detection-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]
}

resource "aws_cloudwatch_log_group" "notification_service" {
  name              = "/aws/lambda/notification-service-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]
}
```

Key Changes:
1. Added kms_key_id attribute pointing to aws_kms_key.cloudwatch_logs.arn
2. Added explicit depends_on for KMS key and alias to ensure proper resource creation order

### Prevention Strategy
1. Use Terraform modules with built-in validation to ensure encryption attributes are always specified
2. Implement pre-commit hooks using tflint or checkov to detect missing encryption configurations
3. Create organizational Terraform templates with encryption-by-default for all data storage resources
4. Document mandatory encryption requirements in infrastructure-as-code style guides
5. Use AWS Config rules to detect unencrypted CloudWatch Log Groups post-deployment

---

## Error Category: Configuration - CloudWatch Dashboard Widget Schema

---

## 3. Invalid Dashboard Widget Configuration

### Description
The CloudWatch Dashboard resource had an incomplete widget configuration that would fail to render properly in the AWS Console. The dashboard body JSON was missing required widget positioning attributes and proper structure.

### Root Cause
The original dashboard configuration did not include required attributes like x, y, width, and height for widget positioning. CloudWatch Dashboard widgets require explicit positioning in a grid layout system.

### Impact
- Operational: Dashboard would not render correctly, preventing operators from monitoring payment platform metrics
- Cost: Wasted time troubleshooting dashboard display issues in production
- Monitoring: Critical payment processing metrics would not be visible to on-call engineers

### Fix Applied

```hcl
resource "aws_cloudwatch_dashboard" "payment_platform" {
  dashboard_name = "payment-platform-monitoring-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        x = 0
        y = 0
        width = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", "FunctionName", aws_lambda_function.payment_api.function_name]
          ]
          view = "timeSeries"
          stacked = false
          region = data.aws_region.current.name
          title = "Lambda Duration Metrics"
        }
      }
    ]
  })
}
```

Key Changes:
1. Added x, y, width, height attributes for grid positioning (x=0, y=0, width=12, height=6)
2. Simplified widget to use AWS/Lambda namespace metrics instead of custom PaymentPlatform metrics that don't exist yet
3. Added view and stacked properties for proper time series visualization

### Prevention Strategy
1. Use validated CloudWatch Dashboard JSON schemas or Terraform examples from AWS documentation
2. Test dashboard configurations in development environment before production deployment
3. Create reusable Terraform modules for common dashboard patterns with validated widget configurations
4. Implement dashboard-as-code with version control to track and review changes
5. Use AWS CloudFormation/Terraform validation in CI/CD pipelines before deployment

---

## Error Category: Configuration - CloudWatch Log Groups Missing KMS Encryption

---

## 4. CloudWatch Log Groups Created Without KMS Encryption

### Description
The current main.tf file shows CloudWatch Log Groups without the kms_key_id attribute, meaning they are not using customer-managed KMS encryption despite having KMS keys defined in the infrastructure.

### Root Cause
The CloudWatch Log Group resources in the current main.tf (lines 104-132) are missing the kms_key_id parameter. This was identified during unit test creation when comparing the MODEL_RESPONSE.md (which includes kms_key_id) with the actual main.tf file (which does not include it).

### Impact
- Security: Log data is encrypted with AWS-managed keys instead of customer-managed keys
- Compliance: Fails to meet financial services compliance requirements for customer-managed encryption
- Operational: Inconsistent with the intended security posture documented in MODEL_RESPONSE.md
- Cost: Potential compliance violations and audit findings

### Fix Applied

The fix requires adding kms_key_id to all three CloudWatch Log Group resources:

```hcl
resource "aws_cloudwatch_log_group" "payment_api" {
  name              = "/aws/lambda/payment-api-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]
}

resource "aws_cloudwatch_log_group" "fraud_detection" {
  name              = "/aws/lambda/fraud-detection-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]
}

resource "aws_cloudwatch_log_group" "notification_service" {
  name              = "/aws/lambda/notification-service-${var.environment}"
  retention_in_days = 1
  kms_key_id        = aws_kms_key.cloudwatch_logs.arn

  depends_on = [
    aws_kms_key.cloudwatch_logs,
    aws_kms_alias.cloudwatch_logs
  ]
}
```

Key Changes:
1. Added kms_key_id = aws_kms_key.cloudwatch_logs.arn to all three log group resources
2. Maintained existing depends_on blocks to ensure proper resource creation order

### Prevention Strategy
1. Implement automated drift detection between MODEL_RESPONSE.md and actual infrastructure code
2. Use Terraform plan validation in CI/CD to detect missing encryption configurations
3. Create pre-commit hooks using checkov or tfsec to enforce encryption-at-rest policies
4. Establish code review checklists that verify encryption attributes are present
5. Use Terraform modules with encryption enabled by default for all data storage resources
6. Implement AWS Config rules to detect and alert on unencrypted CloudWatch Log Groups

---

## Summary

### Total Errors Tracked: 4
- Critical: 1 (KMS encryption context)
- Configuration: 3 (missing KMS reference in MODEL_RESPONSE, invalid dashboard schema, missing KMS reference in current main.tf)

### Lessons Learned
1. AWS service integrations with KMS now require encryption context conditions for enhanced security
2. Terraform depends_on alone is insufficient without proper resource attribute references
3. CloudWatch Dashboard widgets require complete positioning and property configurations
4. Always validate against current AWS documentation as service requirements evolve
5. Maintain consistency between documentation (MODEL_RESPONSE.md) and actual infrastructure code (main.tf)
6. Implement automated validation to detect configuration drift between intended and actual infrastructure