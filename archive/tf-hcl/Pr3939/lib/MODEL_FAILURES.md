# Model Failures and Resolutions

This document chronicles all errors encountered during the implementation of the production-grade AWS infrastructure stack and their resolutions.

---

## Error 1: S3 Bucket Lifecycle Configuration - Missing Filter/Prefix

### Error Message
```
Warning: Invalid Attribute Combination

  with aws_s3_bucket_lifecycle_configuration.logging,
  on tap_stack.tf line 628, in resource "aws_s3_bucket_lifecycle_configuration" "logging":
 628: resource "aws_s3_bucket_lifecycle_configuration" "logging" {

No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required

This will be an error in a future version of the provider
```

### Root Cause
The AWS Terraform provider requires that lifecycle configuration rules must specify either a `filter` block or a `prefix` attribute to determine which objects the rule applies to.

### Resolution
Added an empty `filter {}` block to the lifecycle configuration rule:

```hcl
resource "aws_s3_bucket_lifecycle_configuration" "logging" {
  bucket = aws_s3_bucket.logging.id

  rule {
    id     = "archive-old-logs"
    status = "Enabled"

    filter {}  # Added empty filter to apply rule to all objects

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    # ... rest of configuration
  }
}
```

**File**: `tap_stack.tf` line 816

---

## Error 2: VPC Flow Logs - Invalid Attribute Name

### Error Message
```
Error: Unsupported argument

  on tap_stack.tf line 174, in resource "aws_flow_log" "vpc_flow_logs":
 174:   log_destination_arn  = aws_s3_bucket.logging.arn

An argument named "log_destination_arn" is not expected here.
```

### Root Cause
The attribute name was incorrect. The AWS provider expects `log_destination` (not `log_destination_arn`) when using S3 as the destination.

### Resolution
Changed the attribute name from `log_destination_arn` to `log_destination`:

```hcl
resource "aws_flow_log" "vpc_flow_logs" {
  log_destination      = aws_s3_bucket.logging.arn  # Changed from log_destination_arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  # ...
}
```

**File**: `tap_stack.tf` line 303

---

## Error 3: VPC Flow Logs - IAM Role Not Applicable for S3 Delivery

### Error Message
```
Error: creating Flow Log (vpc-04712c04e28d93eae): operation error EC2: CreateFlowLogs, 
https response error StatusCode: 400, RequestID: 8a5f638b-918d-4473-a010-0b7479edd950, 
api error InvalidParameter: DeliverLogsPermissionArn is not applicable for s3 delivery

  with aws_flow_log.vpc_flow_logs,
  on tap_stack.tf line 172, in resource "aws_flow_log" "vpc_flow_logs":
 172: resource "aws_flow_log" "vpc_flow_logs" {
```

### Root Cause
When VPC Flow Logs deliver to S3, an IAM role is not required. The `iam_role_arn` parameter is only applicable for CloudWatch Logs destinations.

### Resolution
Removed the `iam_role_arn` parameter from the VPC Flow Log resource:

```hcl
resource "aws_flow_log" "vpc_flow_logs" {
  log_destination      = aws_s3_bucket.logging.arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id
  # iam_role_arn removed - not needed for S3 destinations

  destination_options {
    file_format        = "parquet"
    per_hour_partition = true
  }
}
```

**File**: `tap_stack.tf` line 302-316

---

## Error 4: Auto Scaling Group - Timeout Waiting for Capacity

### Error Message
```
Error: waiting for Auto Scaling Group (nova-app-asg-prd) capacity satisfied: timeout while 
waiting for state to become 'ok' (last state: 'want at least 2 healthy instance(s) in Auto 
Scaling Group, have 0', timeout: 10m0s)

  with aws_autoscaling_group.app_servers,
  on tap_stack.tf line 551, in resource "aws_autoscaling_group" "app_servers":
 551: resource "aws_autoscaling_group" "app_servers" {
```

### Root Cause
EC2 instances were failing to launch due to a KMS key permission issue. The EBS encryption key policy didn't explicitly allow the EC2 service to use it.

### Resolution
1. Added EC2 service principal to the EBS KMS key policy:

```hcl
resource "aws_kms_key" "ebs_encryption" {
  # ...
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = { AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow EC2 to use the key"  # Added this statement
        Effect = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
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

2. Enhanced the user data script with better error handling and Apache installation for health checks:

```bash
#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting user data script at $(date)"

# Update system
yum update -y

# Install CloudWatch agent
wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm || echo "CloudWatch agent installation failed, continuing..."

# Install SSM agent
yum install -y amazon-ssm-agent || echo "SSM agent installation failed, continuing..."
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent || echo "SSM agent start failed, continuing..."

# Install and start Apache for health checks
yum install -y httpd
systemctl enable httpd
systemctl start httpd

# Create health check endpoint
cat > /var/www/html/health.html << 'HEALTH_EOF'
<!DOCTYPE html>
<html>
<head><title>Health Check</title></head>
<body><h1>Instance is healthy</h1></body>
</html>
HEALTH_EOF

echo "Instance setup completed successfully at $(date)"
```

3. Increased health check grace period and wait timeout:

```hcl
resource "aws_autoscaling_group" "app_servers" {
  # ...
  health_check_grace_period = 600  # Increased to 600 seconds
  wait_for_capacity_timeout = "15m"  # Added 15 minute timeout
}
```

**Files**: 
- `tap_stack.tf` lines 125-164 (KMS key policy)
- `tap_stack.tf` lines 643-692 (user data script)
- `tap_stack.tf` line 718 (health check grace period)

---

## Error 5: CloudTrail - Insufficient S3 Bucket Policy

### Error Message
```
Error: creating CloudTrail Trail (nova-trail-prd): operation error CloudTrail: CreateTrail, 
https response error StatusCode: 400, RequestID: 0fbcfe2b-3384-4b3c-b591-444b03fb0249, 
InsufficientS3BucketPolicyException: Incorrect S3 bucket policy is detected for bucket: 
nova-logs-prd-137285103215

  with aws_cloudtrail.main,
  on tap_stack.tf line 777, in resource "aws_cloudtrail" "main":
 777: resource "aws_cloudtrail" "main" {
```

### Root Cause
The S3 bucket policy didn't grant the necessary permissions for CloudTrail to write logs. CloudTrail requires specific permissions including `GetBucketAcl` and `PutObject` with proper conditions.

### Resolution
Added comprehensive CloudTrail permissions to the S3 bucket policy:

```hcl
resource "aws_s3_bucket_policy" "logging" {
  bucket = aws_s3_bucket.logging.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.logging.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailLogDelivery"
        Effect = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action   = "s3:GetBucketAcl"
        Resource = "${aws_s3_bucket.logging.arn}"
        Condition = {
          StringEquals = {
            "AWS:SourceArn"     = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.cloudtrail_name}"
            "AWS:SourceAccount" = "${data.aws_caller_identity.current.account_id}"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailLogDeliveryWrite"
        Effect = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logging.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn"     = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/${local.cloudtrail_name}"
            "AWS:SourceAccount" = "${data.aws_caller_identity.current.account_id}"
            "s3:x-amz-acl"      = "bucket-owner-full-control"
          }
        }
      }
      # ... additional statements for Config and CloudFront
    ]
  })
}
```

Also added CloudTrail encryption permissions to the S3 KMS key:

```hcl
{
  "Sid"    : "AllowCloudTrailEncrypt",
  "Effect" : "Allow",
  "Principal" : { "Service" : "cloudtrail.amazonaws.com" },
  "Action" : [
    "kms:GenerateDataKey*",
    "kms:DescribeKey"
  ],
  "Resource" : "*",
  "Condition" : {
    "StringLike" : {
      "kms:EncryptionContext:aws:cloudtrail:arn" : "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
    }
  }
}
```

**Files**: 
- `tap_stack.tf` lines 835-954 (S3 bucket policy)
- `tap_stack.tf` lines 222-253 (KMS key policy)

---

## Error 6: AWS Config - Invalid IAM Policy ARN

### Error Message
```
Error: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/ConfigRole) to IAM Role 
(nova-config-recorder-role-prd): operation error IAM: AttachRolePolicy, https response error 
StatusCode: 404, RequestID: 1d67d582-c6c6-4ba3-87fc-ad570200356e, NoSuchEntity: Policy 
arn:aws:iam::aws:policy/service-role/ConfigRole does not exist or is not attachable.

  with aws_iam_role_policy_attachment.config_recorder,
  on tap_stack.tf line 866, in resource "aws_iam_role_policy_attachment" "config_recorder":
 866: resource "aws_iam_role_policy_attachment" "config_recorder" {
```

### Root Cause
The managed policy ARN was incorrect. The correct AWS managed policy for Config is `AWS_ConfigRole` (with underscore), not `ConfigRole`.

### Resolution
Corrected the policy ARN:

```hcl
resource "aws_iam_role_policy_attachment" "config_recorder" {
  role       = aws_iam_role.config_recorder.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"  # Changed from ConfigRole
}
```

**File**: `tap_stack.tf` line 1117

---

## Error 7: AWS Config Delivery Channel - Insufficient Delivery Policy

### Error Message
```
Error: putting ConfigService Delivery Channel (nova-config-delivery-prd): operation error 
Config Service: PutDeliveryChannel, https response error StatusCode: 400, RequestID: 
8ab3db1d-9e10-40ff-a7f8-bc90d07f204d, InsufficientDeliveryPolicyException: Insufficient 
delivery policy to s3 bucket: nova-logs-prd-137285103215, unable to write to bucket, 
provided s3 key prefix is 'null', provided kms key is 'null'.

  with aws_config_delivery_channel.main,
  on tap_stack.tf line 883, in resource "aws_config_delivery_channel" "main":
 883: resource "aws_config_delivery_channel" "main" {
```

### Root Cause
The Config delivery channel was missing the S3 key prefix and KMS key ARN. Additionally, the S3 bucket policy didn't have proper permissions for AWS Config.

### Resolution
1. Added S3 key prefix to the delivery channel (KMS key temporarily commented out):

```hcl
resource "aws_config_delivery_channel" "main" {
  name           = "${var.project_prefix}-config-delivery-prd"
  s3_bucket_name = aws_s3_bucket.logging.bucket
  s3_key_prefix  = "config"  # Added prefix
  # s3_kms_key_arn = aws_kms_key.s3_encryption.arn  # Temporarily disabled

  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }

  depends_on = [aws_s3_bucket_policy.logging]  # Added dependency
}
```

2. Added AWS Config permissions to the S3 bucket policy:

```hcl
{
  Sid    = "AWSConfigBucketPermissionsCheck"
  Effect = "Allow"
  Principal = { Service = "config.amazonaws.com" }
  Action   = "s3:GetBucketAcl"
  Resource = aws_s3_bucket.logging.arn
},
{
  Sid    = "AWSConfigBucketExistenceCheck"
  Effect = "Allow"
  Principal = { Service = "config.amazonaws.com" }
  Action   = "s3:ListBucket"
  Resource = aws_s3_bucket.logging.arn
},
{
  Sid    = "AWSConfigBucketWrite"
  Effect = "Allow"
  Principal = { Service = "config.amazonaws.com" }
  Action   = "s3:PutObject"
  Resource = "${aws_s3_bucket.logging.arn}/config/AWSLogs/${data.aws_caller_identity.current.account_id}/Config/*"
  Condition = {
    StringEquals = {
      "s3:x-amz-acl" = "bucket-owner-full-control"
    }
  }
}
```

3. Added AWS Config encryption permissions to the KMS key:

```hcl
{
  "Sid"    : "AllowConfigEncrypt",
  "Effect" : "Allow",
  "Principal" : { "Service" : "config.amazonaws.com" },
  "Action" : [
    "kms:GenerateDataKey*",
    "kms:Encrypt",
    "kms:DescribeKey"
  ],
  "Resource" : "*",
  "Condition" : {
    "StringEquals" : {
      "kms:CallerAccount" : "${data.aws_caller_identity.current.account_id}",
      "kms:ViaService"    : "s3.${var.aws_region}.amazonaws.com"
    }
  }
}
```

**Files**: 
- `tap_stack.tf` lines 1132-1148 (delivery channel)
- `tap_stack.tf` lines 892-923 (S3 bucket policy)
- `tap_stack.tf` lines 254-271 (KMS key policy)

---

## Error 8: CloudWatch Logs - KMS Key Access Denied

### Error Message
```
Error: creating CloudWatch Logs Log Group (/aws/cloudtrail/nova-trail-prd): operation error 
CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400, RequestID: 
1a056695-0667-4439-b00c-7f4e5ae8f401, api error AccessDeniedException: The specified KMS key 
does not exist or is not allowed to be used with Arn 
'arn:aws:logs:us-east-1:137285103215:log-group:/aws/cloudtrail/nova-trail-prd'

  with aws_cloudwatch_log_group.cloudtrail,
  on tap_stack.tf line 1010, in resource "aws_cloudwatch_log_group" "cloudtrail":
1010: resource "aws_cloudwatch_log_group" "cloudtrail" {
```

### Root Cause
The S3 KMS key policy didn't include permissions for the CloudWatch Logs service to use the key for encrypting log groups.

### Resolution
Added CloudWatch Logs service permissions to the S3 KMS key policy:

```hcl
resource "aws_kms_key" "s3_encryption" {
  # ...
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # ... other statements
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = { Service = "logs.${var.aws_region}.amazonaws.com" }
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })
}
```

**File**: `tap_stack.tf` lines 189-209

---

## Error 9: CloudFront Distribution - S3 Bucket ACL Access Not Enabled

### Error Message
```
Error: creating CloudFront Distribution: operation error CloudFront: CreateDistributionWithTags, 
https response error StatusCode: 400, RequestID: b29da211-c28b-4eac-b08c-366f1419c192, 
InvalidArgument: The S3 bucket that you specified for CloudFront logs does not enable ACL 
access: nova-logs-prd-137285103215.s3.amazonaws.com

  with aws_cloudfront_distribution.main,
  on tap_stack.tf line 1117, in resource "aws_cloudfront_distribution" "main":
1117: resource "aws_cloudfront_distribution" "main" {
```

### Root Cause
CloudFront requires specific ACL configurations on S3 buckets to write access logs. The logging bucket had `ignore_public_acls = true` which prevented CloudFront from writing logs.

### Resolution
1. Created a separate dedicated S3 bucket for CloudFront logs:

```hcl
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${var.project_prefix}-cloudfront-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name    = "${var.project_prefix}-cloudfront-logs-${data.aws_caller_identity.current.account_id}"
    Purpose = "CloudFront access logs"
  })
}

resource "aws_s3_bucket_ownership_controls" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id
  acl    = "private"

  depends_on = [aws_s3_bucket_ownership_controls.cloudfront_logs]
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = false  # Allow CloudFront log delivery
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}
```

2. Updated CloudFront distribution to use the dedicated logs bucket:

```hcl
resource "aws_cloudfront_distribution" "main" {
  # ...
  logging_config {
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront/"
    include_cookies = false
  }
}
```

3. Added CloudFront permissions to the main logging bucket policy (for completeness):

```hcl
{
  Sid    = "AWSCloudFrontLogs"
  Effect = "Allow"
  Principal = { Service = "cloudfront.amazonaws.com" }
  Action   = "s3:PutObject"
  Resource = "${aws_s3_bucket.logging.arn}/cloudfront/*"
  Condition = {
    StringEquals = {
      "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/*"
    }
  }
},
{
  Sid    = "AWSCloudFrontLogsAcl"
  Effect = "Allow"
  Principal = { Service = "cloudfront.amazonaws.com" }
  Action   = "s3:GetBucketAcl"
  Resource = aws_s3_bucket.logging.arn
  Condition = {
    StringEquals = {
      "AWS:SourceArn" = "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/*"
    }
  }
}
```

**Files**: 
- `tap_stack.tf` lines 957-991 (CloudFront logs bucket)
- `tap_stack.tf` lines 1421-1425 (CloudFront logging config)
- `tap_stack.tf` lines 924-951 (S3 bucket policy)
