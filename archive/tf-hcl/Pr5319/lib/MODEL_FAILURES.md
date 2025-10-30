# Model Failures: Common Mistakes in Multi-Region AWS Infrastructure

## Overview

This document catalogs common mistakes, oversights, and anti-patterns that AI models (and developers) frequently make when implementing multi-region secure AWS infrastructure. These failures represent violations of security best practices, compliance requirements, or architectural principles.

---

## 1. Encryption Failures

### ❌ Missing KMS Key Rotation
**Mistake**: Creating KMS keys without enabling automatic rotation.
```terraform
resource "aws_kms_key" "bad" {
  description             = "KMS key"
  deletion_window_in_days = 30
  # enable_key_rotation = true  # MISSING!
}
```
**Impact**: Keys remain static, increasing risk if compromised.
**Fix**: Always set `enable_key_rotation = true`.

### ❌ Using Default Encryption
**Mistake**: Not specifying KMS keys for S3 or EBS encryption, relying on AWS managed keys.
```terraform
resource "aws_s3_bucket_server_side_encryption_configuration" "bad" {
  bucket = aws_s3_bucket.example.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"  # Should use aws:kms
    }
  }
}
```
**Impact**: Loss of granular control over encryption keys and access policies.
**Fix**: Use customer-managed KMS keys with proper key policies.

### ❌ Unencrypted EBS Volumes
**Mistake**: Launch templates without encrypted root volumes.
```terraform
resource "aws_launch_template" "bad" {
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 20
      # encrypted = true  # MISSING!
    }
  }
}
```
**Impact**: Data at rest is not encrypted, violating compliance requirements.
**Fix**: Always set `encrypted = true` and specify KMS key.

---

## 2. IAM Security Failures

### ❌ Overly Permissive IAM Policies
**Mistake**: Using wildcard permissions instead of least privilege.
```terraform
resource "aws_iam_role_policy" "bad" {
  policy = jsonencode({
    Statement = [{
      Effect   = "Allow"
      Action   = "*"          # TOO BROAD!
      Resource = "*"          # TOO BROAD!
    }]
  })
}
```
**Impact**: Violates least privilege principle, increases blast radius.
**Fix**: Grant only necessary permissions for specific resources.

### ❌ Missing MFA Enforcement
**Mistake**: Not requiring MFA for console or sensitive operations.
```terraform
# NO MFA POLICY EXISTS - BAD!
```
**Impact**: Accounts vulnerable to credential theft.
**Fix**: Implement MFA enforcement policy as shown in ideal response.

### ❌ Weak Password Policy
**Mistake**: Not configuring IAM password policy or using weak requirements.
```terraform
resource "aws_iam_account_password_policy" "bad" {
  minimum_password_length = 8  # TOO SHORT!
  require_symbols         = false  # WEAK!
}
```
**Impact**: Weak passwords increase risk of unauthorized access.
**Fix**: Enforce minimum 14 characters with complexity requirements.

---

## 3. Network Security Failures

### ❌ Overly Open Security Groups
**Mistake**: Allowing unrestricted access from 0.0.0.0/0 on all ports.
```terraform
resource "aws_security_group" "bad" {
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # WIDE OPEN!
  }
}
```
**Impact**: Exposes all services to the internet.
**Fix**: Restrict to specific ports and source IPs/security groups.

### ❌ Missing Private Subnets
**Mistake**: Placing application instances in public subnets.
```terraform
resource "aws_instance" "bad" {
  subnet_id                   = aws_subnet.public.id  # WRONG!
  associate_public_ip_address = true
}
```
**Impact**: Direct internet exposure of application servers.
**Fix**: Use private subnets with NAT Gateway for outbound access.

### ❌ No VPC Endpoints for S3
**Mistake**: S3 traffic going over internet instead of VPC endpoint.
```terraform
# aws_vpc_endpoint for S3 MISSING!
```
**Impact**: Data transfer costs, potential security risks, slower performance.
**Fix**: Create VPC endpoints for S3 and attach to route tables.

### ❌ Allowing HTTP Instead of HTTPS
**Mistake**: Load balancers or security groups allowing unencrypted HTTP traffic.
```terraform
resource "aws_lb_listener" "bad" {
  port     = "80"       # UNENCRYPTED!
  protocol = "HTTP"     # UNENCRYPTED!
}
```
**Impact**: Data in transit not encrypted, vulnerable to MITM attacks.
**Fix**: Use HTTPS with TLS 1.2+ minimum.

---

## 4. High Availability Failures

### ❌ Single Availability Zone Deployment
**Mistake**: Resources deployed in only one AZ.
```terraform
resource "aws_subnet" "bad" {
  availability_zone = "us-west-1a"  # Only one AZ!
}
```
**Impact**: No redundancy if AZ fails.
**Fix**: Deploy across multiple AZs (minimum 2).

### ❌ Insufficient Auto Scaling Configuration
**Mistake**: ASG with min_size = 1 or no auto scaling policies.
```terraform
resource "aws_autoscaling_group" "bad" {
  min_size         = 1  # NO REDUNDANCY!
  max_size         = 1  # NO SCALING!
  desired_capacity = 1
}
```
**Impact**: Single point of failure, can't handle load spikes.
**Fix**: Set min_size >= 2, implement scaling policies.

### ❌ Missing Health Checks
**Mistake**: No health checks or improper configuration.
```terraform
resource "aws_autoscaling_group" "bad" {
  health_check_type = "EC2"  # Should be ELB for ALB targets!
}
```
**Impact**: Unhealthy instances remain in service.
**Fix**: Use ELB health checks for load balanced applications.

---

## 5. Compliance & Auditing Failures

### ❌ No CloudTrail Logging
**Mistake**: Not enabling CloudTrail or missing multi-region trail.
```terraform
# No aws_cloudtrail resource!
```
**Impact**: No audit trail of API calls, compliance violation.
**Fix**: Enable multi-region CloudTrail with S3 logging.

### ❌ Missing S3 Versioning
**Mistake**: S3 buckets without versioning enabled.
```terraform
# aws_s3_bucket_versioning resource MISSING!
```
**Impact**: No protection against accidental deletion or overwrites.
**Fix**: Enable versioning on all critical S3 buckets.

### ❌ Unencrypted CloudWatch Logs
**Mistake**: Log groups without KMS encryption.
```terraform
resource "aws_cloudwatch_log_group" "bad" {
  name = "/aws/application/logs"
  # kms_key_id MISSING!
}
```
**Impact**: Sensitive log data not encrypted at rest.
**Fix**: Specify KMS key for all log groups.

### ❌ No Log File Validation
**Mistake**: CloudTrail without log file validation.
```terraform
resource "aws_cloudtrail" "bad" {
  enable_log_file_validation = false  # SHOULD BE TRUE!
}
```
**Impact**: Can't verify log integrity, tampering undetectable.
**Fix**: Always enable log file validation.

---

## 6. S3 Security Failures

### ❌ Missing Bucket Policies
**Mistake**: S3 buckets without policies enforcing encryption and secure transport.
```terraform
# aws_s3_bucket_policy MISSING!
```
**Impact**: Unencrypted uploads allowed, insecure connections permitted.
**Fix**: Implement bucket policies denying unencrypted uploads and insecure transport.

### ❌ Public Access Not Blocked
**Mistake**: Not using S3 public access block settings.
```terraform
# aws_s3_bucket_public_access_block MISSING!
```
**Impact**: Risk of accidental public exposure.
**Fix**: Block all public access unless explicitly required.

### ❌ S3 Bucket Policy Too Permissive
**Mistake**: Allowing access without VPC endpoint restriction.
```terraform
{
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:*"  # NO CONDITIONS!
}
```
**Impact**: S3 accessible from outside VPC.
**Fix**: Add VPC endpoint condition to restrict access.

---

## 7. EC2 & Compute Failures

### ❌ Using IMDSv1
**Mistake**: Not enforcing IMDSv2 on EC2 instances.
```terraform
resource "aws_launch_template" "bad" {
  metadata_options {
    http_tokens = "optional"  # Should be "required"!
  }
}
```
**Impact**: Vulnerable to SSRF attacks.
**Fix**: Set `http_tokens = "required"` to enforce IMDSv2.

### ❌ Missing IAM Instance Profile
**Mistake**: EC2 instances without IAM roles.
```terraform
resource "aws_launch_template" "bad" {
  # iam_instance_profile MISSING!
}
```
**Impact**: Can't access AWS services securely, might hardcode credentials.
**Fix**: Always attach IAM instance profile with least privilege role.

### ❌ No User Data Hardening
**Mistake**: Launch templates without basic security hardening.
```terraform
resource "aws_launch_template" "bad" {
  # user_data MISSING!
}
```
**Impact**: Instances launched with default configuration, potential vulnerabilities.
**Fix**: Include user data for updates, monitoring agents, SSH hardening.

---

## 8. Load Balancer Failures

### ❌ Weak TLS Policy
**Mistake**: ALB listener with outdated or weak SSL policy.
```terraform
resource "aws_lb_listener" "bad" {
  protocol   = "HTTPS"
  ssl_policy = "ELBSecurityPolicy-2016-08"  # TOO OLD!
}
```
**Impact**: Vulnerable to TLS attacks, compliance violations.
**Fix**: Use `ELBSecurityPolicy-TLS-1-2-2017-01` or newer.

### ❌ Missing Drop Invalid Headers
**Mistake**: Not dropping invalid header fields.
```terraform
resource "aws_lb" "bad" {
  # drop_invalid_header_fields MISSING or false!
}
```
**Impact**: Potential HTTP desync attacks.
**Fix**: Set `drop_invalid_header_fields = true`.

### ❌ No Target Group Health Checks
**Mistake**: Target groups without proper health check configuration.
```terraform
resource "aws_lb_target_group" "bad" {
  # health_check block MISSING!
}
```
**Impact**: Traffic sent to unhealthy instances.
**Fix**: Configure health checks with appropriate thresholds.

---

## 9. Tagging & Organization Failures

### ❌ Inconsistent or Missing Tags
**Mistake**: Resources without proper tags for cost allocation and management.
```terraform
resource "aws_vpc" "bad" {
  # tags MISSING!
}
```
**Impact**: Difficult to track costs, ownership, and compliance.
**Fix**: Use consistent tagging strategy with common_tags.

### ❌ No Environment or Project Tags
**Mistake**: Not tagging resources with environment or project identifiers.
```terraform
resource "aws_instance" "bad" {
  tags = {
    Name = "instance"  # ONLY NAME, NO CONTEXT!
  }
}
```
**Impact**: Can't differentiate between environments, no cost center tracking.
**Fix**: Include Environment, Project, ManagedBy, CostCenter tags.

---

## 10. Multi-Region Failures

### ❌ Forgetting Provider Aliases
**Mistake**: Not using provider aliases for multi-region deployments.
```terraform
resource "aws_vpc" "east" {
  # provider = aws.us_east_1  # MISSING!
}
```
**Impact**: All resources created in default region only.
**Fix**: Use provider aliases and specify for each resource.

### ❌ Inconsistent Region Configuration
**Mistake**: Different resource configurations across regions.
```terraform
resource "aws_autoscaling_group" "west" {
  min_size = 2
}
resource "aws_autoscaling_group" "east" {
  min_size = 1  # INCONSISTENT!
}
```
**Impact**: Unbalanced capacity, operational complexity.
**Fix**: Use consistent configurations or variables for both regions.

### ❌ Missing Cross-Region Dependencies
**Mistake**: Not accounting for cross-region resource dependencies.
```terraform
# Using west region S3 bucket from east without proper configuration
```
**Impact**: Access failures, replication issues.
**Fix**: Configure cross-region access properly with appropriate policies.

---

## 11. Monitoring & Logging Failures

### ❌ No CloudWatch Metrics
**Mistake**: ASG without enabled metrics.
```terraform
resource "aws_autoscaling_group" "bad" {
  # enabled_metrics MISSING!
}
```
**Impact**: No visibility into scaling events and capacity.
**Fix**: Enable comprehensive metrics for monitoring.

### ❌ Excessive Log Retention
**Mistake**: Setting log retention to indefinitely or excessively long periods.
```terraform
resource "aws_cloudwatch_log_group" "bad" {
  # retention_in_days MISSING (never expires!)
}
```
**Impact**: Unnecessary storage costs.
**Fix**: Set appropriate retention (e.g., 30, 90, or 365 days).

---

## 12. Resource Naming Failures

### ❌ Non-Descriptive Resource Names
**Mistake**: Generic names without context.
```terraform
resource "aws_vpc" "vpc" {
  tags = {
    Name = "vpc"  # WHICH VPC? WHAT PURPOSE?
  }
}
```
**Impact**: Confusion, operational errors.
**Fix**: Use descriptive names with project, region, and purpose.

### ❌ Hardcoded Values Instead of Variables
**Mistake**: Hardcoding values that should be variables.
```terraform
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"  # HARDCODED!
}
```
**Impact**: Not reusable, difficult to maintain.
**Fix**: Use variables for configurable values.

---

## 13. Cost Optimization Failures

### ❌ Not Using Appropriate Instance Types
**Mistake**: Using expensive instance types for non-critical workloads.
```terraform
resource "aws_launch_template" "bad" {
  instance_type = "m5.24xlarge"  # OVERKILL FOR MOST APPS!
}
```
**Impact**: Unnecessary costs.
**Fix**: Right-size instances based on actual requirements.

### ❌ Not Using GP3 Volumes
**Mistake**: Still using gp2 instead of more cost-effective gp3.
```terraform
ebs {
  volume_type = "gp2"  # OUTDATED!
}
```
**Impact**: Higher costs, lower baseline performance.
**Fix**: Use gp3 volumes for better price/performance.

---

## 14. Terraform Specific Failures

### ❌ Missing Provider Version Constraints
**Mistake**: Not specifying provider version requirements.
```terraform
provider "aws" {
  region = "us-west-1"
  # version constraint MISSING!
}
```
**Impact**: Unexpected behavior with provider updates.
**Fix**: Use `required_providers` block with version constraints.

### ❌ Not Using depends_on Where Needed
**Mistake**: Missing explicit dependencies causing race conditions.
```terraform
resource "aws_cloudtrail" "main" {
  s3_bucket_name = aws_s3_bucket.cloudtrail.id
  # depends_on = [aws_s3_bucket_policy.cloudtrail]  # MISSING!
}
```
**Impact**: Resources created in wrong order, causing failures.
**Fix**: Add explicit `depends_on` for non-implicit dependencies.

### ❌ No Lifecycle Rules
**Mistake**: Missing lifecycle management for production resources.
```terraform
resource "aws_lb" "main" {
  # lifecycle {
  #   prevent_destroy = true
  # }  # MISSING for production!
}
```
**Impact**: Accidental deletion of critical resources.
**Fix**: Add lifecycle rules for production infrastructure.

---

## Summary of Critical Failures

### Security Critical
1. ❌ Missing encryption (KMS, TLS, EBS)
2. ❌ Weak IAM policies and missing MFA
3. ❌ Overly open security groups
4. ❌ Using IMDSv1 instead of IMDSv2
5. ❌ Missing S3 bucket policies

### Availability Critical
1. ❌ Single AZ deployment
2. ❌ Insufficient auto scaling
3. ❌ Missing health checks
4. ❌ No load balancer redundancy

### Compliance Critical
1. ❌ No CloudTrail logging
2. ❌ Missing S3 versioning
3. Unencrypted CloudWatch logs
4. No log file validation
5. Missing audit tags

---

## Conclusion

The ideal response addresses all these common failures with AWS infrastructure best practices, implementing comprehensive security, high availability, and compliance controls across all resources.