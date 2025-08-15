# Terraform Infrastructure Setup for Secure AWS Data Storage

You are tasked with creating a secure AWS infrastructure using Terraform HCL. The focus will be on building a secure data storage environment with AWS services such as S3, IAM, CloudTrail, CloudWatch, and SNS. Below is the high-level requirement that must be addressed:

## Requirements Overview:

### Secure Data Storage:

- **Encryption**: Ensure all data in S3 buckets is encrypted using AES-256 encryption.
- **Access Control**: Limit access to S3 buckets to specific IP address ranges.
- **Logging**: Enable logging for all AWS API calls to CloudTrail.
- **IAM Management**: Use IAM roles instead of hard-coded AWS access keys.
- **Permissions**: Implement least-privilege access policies for IAM roles.
- **Region**: Deploy resources in the AWS region.
- **Versioning**: Enable versioning on all S3 buckets.
- **Alarming**: Set up CloudWatch alarms to monitor IAM permission changes.
- **SNS Notification**: Configure an SNS topic to notify the security team of IAM role changes.

## Constraints & Best Practices:

1. Use **AES-256 encryption** for data stored in S3 buckets.
2. Restrict access to S3 buckets based on specific **IP address ranges**.
3. **Enable CloudTrail** for logging all AWS API calls.
4. Use **IAM roles** for application access instead of AWS access keys.
5. Apply **least-privilege IAM roles**.
6. Deploy all resources in the AWS region.
7. Enable **versioning** for S3 buckets.
8. Create **CloudWatch alarms** for IAM permission changes.
9. Configure an **SNS topic** for IAM role change notifications.

### Non-Negotiables:

- Keep **all Terraform logic in `lib/tap_stack.tf`** (variables, locals, resources, and outputs).
- The `provider.tf` already exists and holds the **AWS provider + S3 backend**.
- **Do not** include the `provider` block in `tap_stack.tf`. It should be in the pre-existing `provider.tf` file.
- **No external modules** should be used. Resources should be built directly in this file.
- Declare the `aws_region` variable in `tap_stack.tf`, and it should be consumed in `provider.tf`.
- Outputs for **CI/CD integration** must be present, but **no secrets** should be emitted.
- Tests will read from `cfn-outputs/all-outputs.json`, and tests **should not** run `terraform init/plan/apply` in the testing stage.

---

## Prompt for Terraform Code Generation:

**Prompt:**

````plaintext
You are a senior cloud infrastructure engineer with expertise in AWS and Terraform HCL. Your task is to create a Terraform-based configuration to set up a secure AWS data storage environment. The solution will include S3 buckets, IAM roles, CloudTrail, CloudWatch, and SNS for notifications. The infrastructure must follow strict security guidelines as listed below:

- **S3 Buckets**:
  - All data in S3 buckets must be encrypted with AES-256 encryption.
  - Access to S3 buckets should only be allowed from specific IP address ranges.
  - Enable versioning on all S3 buckets.
  - Implement CloudTrail for logging all AWS API calls related to S3.

- **IAM Roles**:
  - Use IAM roles for all application access.
  - Apply least-privilege policies to IAM roles, ensuring that only the minimum permissions necessary for the application to function are granted.

- **CloudWatch**:
  - Create CloudWatch alarms to monitor any IAM permission changes.

- **SNS**:
  - Configure an SNS topic to notify the security team whenever there are IAM role changes.


Create a single Terraform file, `lib/tap_stack.tf`, and implement the following:
1. All variable declarations, locals, resources, and outputs.
2. Follow best practices for secure IAM roles, encryption, and minimal privilege.
3. Emit useful outputs for CI/CD integration without exposing secrets.
4. Ensure that no provider block is included in `tap_stack.tf` as it is already defined in `provider.tf`.

Ensure the infrastructure configuration adheres to security constraints and logical checks for a secure and operational setup.

---

**Expected Output:**

```hcl
# terraform version
terraform {
  required_version = ">= 0.14"
}

# Variable declarations
variable "aws_region" {
  description = "The AWS region to deploy resources"
}

# S3 Bucket resource creation
resource "aws_s3_bucket" "secure_storage" {
  bucket = "my-secure-storage-bucket"
  acl    = "private"

  # Encryption using AES-256
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  # Versioning enabled
  versioning {
    enabled = true
  }

  # Restrict access to specific IP ranges
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
  }

  tags = {
    Name = "SecureStorageBucket"
  }
}

# IAM Role with least-privilege permissions
resource "aws_iam_role" "app_role" {
  name = "app-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Effect    = "Allow"
        Sid       = ""
      }
    ]
  })

  # Attach a basic policy for least privilege
  policy {
    name   = "app-policy"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect   = "Allow"
          Action   = ["s3:ListBucket", "s3:GetObject"]
          Resource = ["arn:aws:s3:::my-secure-storage-bucket", "arn:aws:s3:::my-secure-storage-bucket/*"]
        }
      ]
    })
  }
}

# CloudTrail for logging AWS API calls
resource "aws_cloudtrail" "s3_logging" {
  name                          = "s3-cloudtrail-logs"
  s3_bucket_name                = aws_s3_bucket.secure_storage.bucket
  is_logging                    = true
  include_global_service_events = true
  is_multi_region_trail         = true
}

# CloudWatch Alarm for IAM role permissions changes
resource "aws_cloudwatch_metric_alarm" "iam_permission_change_alarm" {
  alarm_name          = "IAMPermissionChangeAlarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMRolePermissionChange"
  namespace           = "AWS/IAM"
  period              = "60"
  statistic           = "SampleCount"
  threshold           = "1"

  alarm_description = "Alarm for any IAM permission changes"
}

# SNS Topic for IAM role change notifications
resource "aws_sns_topic" "iam_role_change_topic" {
  name = "iam-role-change-notifications"
}

resource "aws_sns_topic_subscription" "security_team" {
  protocol = "email"
  endpoint = "security-team@example.com"
  topic_arn = aws_sns_topic.iam_role_change_topic.arn
}

# Outputs
output "s3_bucket_name" {
  value = aws_s3_bucket.secure_storage.bucket
}

output "iam_role_arn" {
  value = aws_iam_role.app_role.arn
}
````
