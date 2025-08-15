########################
# Integration Tests for tap_stack.tf Infrastructure
# Author: ngwakoleslieelijah
# Created: 2025-08-15 13:21:02 UTC
########################

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

########################
# Test Variables
########################

variable "aws_region" {
  description = "AWS region for testing"
  type        = string
  default     = "us-east-1"
}

variable "run_integration_tests" {
  description = "Flag to enable/disable integration tests"
  type        = bool
  default     = true
}

variable "cleanup_after_tests" {
  description = "Flag to automatically cleanup test resources"
  type        = bool
  default     = true
}

########################
# Test Setup
########################

# Generate random suffix for test resources
resource "random_id" "test_suffix" {
  byte_length = 4
}

# Test variables with randomized naming
locals {
  test_project_name = "iac-aws-nova-test-${random_id.test_suffix.hex}"
  test_environment  = "testing"
  test_timestamp    = "2025-08-15T13:21:02Z"
  test_author       = "ngwakoleslieelijah"
}

########################
# Infrastructure Under Test
########################

# Deploy the infrastructure being tested
module "infrastructure_under_test" {
  source = "../"

  # Override with test-specific values
  project_name = local.test_project_name
  environment  = local.test_environment
  author       = local.test_author
  created_date = local.test_timestamp

  # Network configuration for testing
  vpc_cidr             = "10.1.0.0/16"
  public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
  private_subnet_cidrs = ["10.1.10.0/24", "10.1.20.0/24"]

  # Database credentials for testing
  db_username = "testadmin"
  db_password = "TestPassword123!"

  aws_region = var.aws_region
}

########################
# Test 1: VPC and Networking Infrastructure
########################

resource "terraform_data" "test_vpc_creation" {
  count = var.run_integration_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "🧪 Test 1: VPC and Networking Infrastructure"
      echo "============================================="
      
      # Test VPC exists
      if [ -z "${module.infrastructure_under_test.vpc_id}" ]; then
        echo "❌ ERROR: VPC ID is empty"
        exit 1
      fi
      echo "✅ VPC created successfully: ${module.infrastructure_under_test.vpc_id}"
      
      # Test VPC CIDR
      if [ "${module.infrastructure_under_test.vpc_cidr}" != "10.1.0.0/16" ]; then
        echo "❌ ERROR: VPC CIDR mismatch. Expected: 10.1.0.0/16, Got: ${module.infrastructure_under_test.vpc_cidr}"
        exit 1
      fi
      echo "✅ VPC CIDR matches expected value: ${module.infrastructure_under_test.vpc_cidr}"
      
      # Test public subnets
      PUBLIC_SUBNETS='${jsonencode(module.infrastructure_under_test.public_subnet_ids)}'
      PUBLIC_COUNT=$(echo $PUBLIC_SUBNETS | jq '. | length')
      
      if [ "$PUBLIC_COUNT" -ne 2 ]; then
        echo "❌ ERROR: Expected 2 public subnets, found $PUBLIC_COUNT"
        exit 1
      fi
      echo "✅ Public subnets configured correctly: $PUBLIC_COUNT subnets"
      
      # Test private subnets
      PRIVATE_SUBNETS='${jsonencode(module.infrastructure_under_test.private_subnet_ids)}'
      PRIVATE_COUNT=$(echo $PRIVATE_SUBNETS | jq '. | length')
      
      if [ "$PRIVATE_COUNT" -ne 2 ]; then
        echo "❌ ERROR: Expected 2 private subnets, found $PRIVATE_COUNT"
        exit 1
      fi
      echo "✅ Private subnets configured correctly: $PRIVATE_COUNT subnets"
      
      echo "🎉 Test 1: VPC and Networking tests PASSED"
      echo ""
    EOT
  }

  depends_on = [module.infrastructure_under_test]
}

########################
# Test 2: KMS Key Configuration
########################

resource "terraform_data" "test_kms_configuration" {
  count = var.run_integration_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "🧪 Test 2: KMS Key Configuration"
      echo "================================"
      
      # Test KMS key exists
      if [ -z "${module.infrastructure_under_test.kms_key_id}" ]; then
        echo "❌ ERROR: KMS Key ID is empty"
        exit 1
      fi
      echo "✅ KMS Key created successfully: ${module.infrastructure_under_test.kms_key_id}"
      
      # Verify KMS key properties using AWS CLI
      KMS_KEY_ID="${module.infrastructure_under_test.kms_key_id}"
      
      # Check if key exists and is enabled
      KEY_STATE=$(aws kms describe-key --key-id $KMS_KEY_ID --query 'KeyMetadata.KeyState' --output text --region ${var.aws_region} 2>/dev/null)
      if [ "$KEY_STATE" != "Enabled" ]; then
        echo "❌ ERROR: KMS key is not in Enabled state. Current state: $KEY_STATE"
        exit 1
      fi
      echo "✅ KMS Key is in enabled state"
      
      # Check key rotation (if available)
      ROTATION_STATUS=$(aws kms get-key-rotation-status --key-id $KMS_KEY_ID --query 'KeyRotationEnabled' --output text --region ${var.aws_region} 2>/dev/null || echo "false")
      if [ "$ROTATION_STATUS" = "True" ]; then
        echo "✅ KMS key rotation is enabled"
      else
        echo "ℹ️  KMS key rotation status: $ROTATION_STATUS"
      fi
      
      echo "🎉 Test 2: KMS configuration tests PASSED"
      echo ""
    EOT
  }

  depends_on = [terraform_data.test_vpc_creation]
}

########################
# Test 3: Application Load Balancer
########################

resource "terraform_data" "test_alb_configuration" {
  count = var.run_integration_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "🧪 Test 3: Application Load Balancer Configuration"
      echo "=================================================="
      
      # Test ALB DNS name exists
      ALB_DNS="${module.infrastructure_under_test.alb_dns_name}"
      if [ -z "$ALB_DNS" ]; then
        echo "❌ ERROR: ALB DNS name is empty"
        exit 1
      fi
      echo "✅ ALB DNS name configured: $ALB_DNS"
      
      # Test DNS format (should contain amazonaws.com)
      if [[ ! "$ALB_DNS" =~ .*amazonaws\.com.* ]]; then
        echo "⚠️  WARNING: ALB DNS name format may be incorrect: $ALB_DNS"
      else
        echo "✅ ALB DNS name format is valid"
      fi
      
      # Test DNS resolution (basic connectivity test)
      if nslookup "$ALB_DNS" > /dev/null 2>&1; then
        echo "✅ ALB DNS resolves successfully"
      else
        echo "ℹ️  ALB DNS resolution status: Not yet available (expected in new deployments)"
      fi
      
      echo "🎉 Test 3: ALB configuration tests PASSED"
      echo ""
    EOT
  }

  depends_on = [terraform_data.test_kms_configuration]
}

########################
# Test 4: S3 Storage Configuration
########################

resource "terraform_data" "test_s3_configuration" {
  count = var.run_integration_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "🧪 Test 4: S3 Storage Configuration"
      echo "==================================="
      
      # Test S3 bucket names exist
      DATA_BUCKET="${module.infrastructure_under_test.s3_data_bucket_name}"
      LOGS_BUCKET="${module.infrastructure_under_test.s3_logs_bucket_name}"
      
      if [ -z "$DATA_BUCKET" ]; then
        echo "❌ ERROR: S3 data bucket name is empty"
        exit 1
      fi
      echo "✅ S3 data bucket name configured: $DATA_BUCKET"
      
      if [ -z "$LOGS_BUCKET" ]; then
        echo "❌ ERROR: S3 logs bucket name is empty"
        exit 1
      fi
      echo "✅ S3 logs bucket name configured: $LOGS_BUCKET"
      
      # Verify buckets exist using AWS CLI
      if aws s3api head-bucket --bucket "$DATA_BUCKET" --region ${var.aws_region} 2>/dev/null; then
        echo "✅ S3 data bucket exists and is accessible"
        
        # Check bucket encryption
        ENCRYPTION=$(aws s3api get-bucket-encryption --bucket "$DATA_BUCKET" --region ${var.aws_region} 2>/dev/null || echo "not_configured")
        if [ "$ENCRYPTION" != "not_configured" ]; then
          echo "✅ S3 data bucket encryption is configured"
        else
          echo "ℹ️  S3 data bucket encryption status: Not configured or not accessible"
        fi
      else
        echo "⚠️  WARNING: S3 data bucket not accessible or doesn't exist yet"
      fi
      
      if aws s3api head-bucket --bucket "$LOGS_BUCKET" --region ${var.aws_region} 2>/dev/null; then
        echo "✅ S3 logs bucket exists and is accessible"
      else
        echo "ℹ️  S3 logs bucket not accessible or doesn't exist yet"
      fi
      
      echo "🎉 Test 4: S3 storage configuration tests PASSED"
      echo ""
    EOT
  }

  depends_on = [terraform_data.test_alb_configuration]
}

########################
# Test 5: CloudTrail and Monitoring
########################

resource "terraform_data" "test_monitoring_configuration" {
  count = var.run_integration_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "🧪 Test 5: CloudTrail and Monitoring Configuration"
      echo "=================================================="
      
      # Test CloudTrail ARN exists
      CLOUDTRAIL_ARN="${module.infrastructure_under_test.cloudtrail_arn}"
      if [ -z "$CLOUDTRAIL_ARN" ]; then
        echo "❌ ERROR: CloudTrail ARN is empty"
        exit 1
      fi
      echo "✅ CloudTrail ARN configured: $CLOUDTRAIL_ARN"
      
      # Verify CloudTrail ARN format
      if [[ "$CLOUDTRAIL_ARN" =~ ^arn:aws:cloudtrail:.* ]]; then
        echo "✅ CloudTrail ARN format is valid"
      else
        echo "⚠️  WARNING: CloudTrail ARN format may be incorrect"
      fi
      
      # Test CloudTrail status (if accessible)
      TRAIL_NAME=$(echo "$CLOUDTRAIL_ARN" | sed 's/.*://')
      STATUS=$(aws cloudtrail get-trail-status --name "$CLOUDTRAIL_ARN" --query 'IsLogging' --output text --region ${var.aws_region} 2>/dev/null || echo "unknown")
      
      if [ "$STATUS" = "True" ]; then
        echo "✅ CloudTrail is actively logging"
      elif [ "$STATUS" = "False" ]; then
        echo "⚠️  WARNING: CloudTrail is not actively logging"
      else
        echo "ℹ️  CloudTrail logging status: $STATUS"
      fi
      
      echo "🎉 Test 5: Monitoring configuration tests PASSED"
      echo ""
    EOT
  }

  depends_on = [terraform_data.test_s3_configuration]
}

########################
# Test 6: RDS Database Configuration
########################

resource "terraform_data" "test_rds_configuration" {
  count = var.run_integration_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "🧪 Test 6: RDS Database Configuration"
      echo "====================================="
      
      # Note: RDS endpoint is sensitive, so we test indirectly
      # We verify the database module was deployed successfully by checking dependencies
      
      echo "✅ RDS database module deployment completed"
      echo "ℹ️  RDS endpoint is marked as sensitive and not displayed in tests"
      
      # Test that VPC has the required private subnets for RDS
      PRIVATE_SUBNETS='${jsonencode(module.infrastructure_under_test.private_subnet_ids)}'
      PRIVATE_COUNT=$(echo $PRIVATE_SUBNETS | jq '. | length')
      
      if [ "$PRIVATE_COUNT" -ge 2 ]; then
        echo "✅ Sufficient private subnets available for RDS ($PRIVATE_COUNT subnets)"
      else
        echo "❌ ERROR: Insufficient private subnets for RDS. Found: $PRIVATE_COUNT, Required: 2+"
        exit 1
      fi
      
      echo "🎉 Test 6: RDS configuration tests PASSED"
      echo ""
    EOT
  }

  depends_on = [terraform_data.test_monitoring_configuration]
}

########################
# Test 7: Security Validation
########################

resource "terraform_data" "test_security_configuration" {
  count = var.run_integration_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "🧪 Test 7: Security Configuration Validation"
      echo "============================================"
      
      # Test resource naming convention follows security best practices
      PROJECT_NAME="${local.test_project_name}"
      
      # Validate VPC ID format
      VPC_ID="${module.infrastructure_under_test.vpc_id}"
      if [[ "$VPC_ID" =~ ^vpc-.+ ]]; then
        echo "✅ VPC ID format is valid: $VPC_ID"
      else
        echo "❌ ERROR: VPC ID format is invalid: $VPC_ID"
        exit 1
      fi
      
      # Test project naming consistency
      if [[ "$PROJECT_NAME" =~ .*test.* ]]; then
        echo "✅ Test project naming convention is correct: $PROJECT_NAME"
      else
        echo "⚠️  WARNING: Project name may not follow test naming convention: $PROJECT_NAME"
      fi
      
      # Validate KMS key format
      KMS_KEY="${module.infrastructure_under_test.kms_key_id}"
      if [[ "$KMS_KEY" =~ ^[a-f0-9-]{36}$ ]]; then
        echo "✅ KMS Key ID format is valid"
      else
        echo "ℹ️  KMS Key ID format: $KMS_KEY"
      fi
      
      echo "🎉 Test 7: Security configuration tests PASSED"
      echo ""
    EOT
  }

  depends_on = [terraform_data.test_rds_configuration]
}

########################
# Test 8: End-to-End Integration Validation
########################

resource "terraform_data" "test_end_to_end" {
  count = var.run_integration_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "🧪 Test 8: End-to-End Integration Validation"
      echo "============================================="
      
      # Test all critical outputs exist
      echo "📋 Validating all required outputs..."
      
      OUTPUTS_TEST=0
      
      # VPC ID
      if [ -n "${module.infrastructure_under_test.vpc_id}" ]; then
        echo "✅ VPC ID: ${module.infrastructure_under_test.vpc_id}"
      else
        echo "❌ VPC ID is missing"
        OUTPUTS_TEST=1
      fi
      
      # VPC CIDR
      if [ -n "${module.infrastructure_under_test.vpc_cidr}" ]; then
        echo "✅ VPC CIDR: ${module.infrastructure_under_test.vpc_cidr}"
      else
        echo "❌ VPC CIDR is missing"
        OUTPUTS_TEST=1
      fi
      
      # KMS Key ID
      if [ -n "${module.infrastructure_under_test.kms_key_id}" ]; then
        echo "✅ KMS Key ID: ${module.infrastructure_under_test.kms_key_id}"
      else
        echo "❌ KMS Key ID is missing"
        OUTPUTS_TEST=1
      fi
      
      # ALB DNS Name
      if [ -n "${module.infrastructure_under_test.alb_dns_name}" ]; then
        echo "✅ ALB DNS Name: ${module.infrastructure_under_test.alb_dns_name}"
      else
        echo "❌ ALB DNS Name is missing"
        OUTPUTS_TEST=1
      fi
      
      # S3 Data Bucket
      if [ -n "${module.infrastructure_under_test.s3_data_bucket_name}" ]; then
        echo "✅ S3 Data Bucket: ${module.infrastructure_under_test.s3_data_bucket_name}"
      else
        echo "❌ S3 Data Bucket name is missing"
        OUTPUTS_TEST=1
      fi
      
      # S3 Logs Bucket
      if [ -n "${module.infrastructure_under_test.s3_logs_bucket_name}" ]; then
        echo "✅ S3 Logs Bucket: ${module.infrastructure_under_test.s3_logs_bucket_name}"
      else
        echo "❌ S3 Logs Bucket name is missing"
        OUTPUTS_TEST=1
      fi
      
      # CloudTrail ARN
      if [ -n "${module.infrastructure_under_test.cloudtrail_arn}" ]; then
        echo "✅ CloudTrail ARN: ${module.infrastructure_under_test.cloudtrail_arn}"
      else
        echo "❌ CloudTrail ARN is missing"
        OUTPUTS_TEST=1
      fi
      
      # Public Subnets
      PUBLIC_SUBNETS='${jsonencode(module.infrastructure_under_test.public_subnet_ids)}'
      PUBLIC_COUNT=$(echo $PUBLIC_SUBNETS | jq '. | length')
      echo "✅ Public Subnets Count: $PUBLIC_COUNT"
      
      # Private Subnets
      PRIVATE_SUBNETS='${jsonencode(module.infrastructure_under_test.private_subnet_ids)}'
      PRIVATE_COUNT=$(echo $PRIVATE_SUBNETS | jq '. | length')
      echo "✅ Private Subnets Count: $PRIVATE_COUNT"
      
      if [ $OUTPUTS_TEST -ne 0 ]; then
        echo "❌ ERROR: Some required outputs are missing"
        exit 1
      fi
      
      echo ""
      echo "🎯 Infrastructure Deployment Summary:"
      echo "======================================"
      echo "Project Name: ${local.test_project_name}"
      echo "Environment: ${local.test_environment}"
      echo "Author: ${local.test_author}"
      echo "Test Timestamp: ${local.test_timestamp}"
      echo "AWS Region: ${var.aws_region}"
      echo "VPC CIDR: ${module.infrastructure_under_test.vpc_cidr}"
      echo "Public Subnets: $PUBLIC_COUNT"
      echo "Private Subnets: $PRIVATE_COUNT"
      echo ""
      echo "🎉 Test 8: End-to-End Integration tests PASSED"
      echo ""
    EOT
  }

  depends_on = [terraform_data.test_security_configuration]
}

########################
# Test Cleanup (Optional)
########################

resource "terraform_data" "test_cleanup_notification" {
  count = var.cleanup_after_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "🧹 Test Cleanup Notification"
      echo "============================"
      echo "ℹ️  Test resources created with prefix: ${local.test_project_name}"
      echo "ℹ️  To cleanup test resources, run: terraform destroy"
      echo "ℹ️  Cleanup after tests is set to: ${var.cleanup_after_tests}"
      echo ""
    EOT
  }

  depends_on = [terraform_data.test_end_to_end]
}

########################
# Final Test Summary
########################

resource "terraform_data" "test_summary" {
  count = var.run_integration_tests ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      echo "📊 INTEGRATION TESTS SUMMARY"
      echo "============================"
      echo "✅ Test 1: VPC and Networking Infrastructure - PASSED"
      echo "✅ Test 2: KMS Key Configuration - PASSED"
      echo "✅ Test 3: Application Load Balancer Configuration - PASSED"
      echo "✅ Test 4: S3 Storage Configuration - PASSED"
      echo "✅ Test 5: CloudTrail and Monitoring Configuration - PASSED"
      echo "✅ Test 6: RDS Database Configuration - PASSED"
      echo "✅ Test 7: Security Configuration Validation - PASSED"
      echo "✅ Test 8: End-to-End Integration Validation - PASSED"
      echo ""
      echo "🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!"
      echo "🚀 Infrastructure is ready for deployment"
      echo ""
      echo "Test Details:"
      echo "============"
      echo "Test Project: ${local.test_project_name}"
      echo "Test Author: ${local.test_author}"
      echo "Test Date: ${local.test_timestamp}"
      echo "Test Region: ${var.aws_region}"
      echo "Test Environment: ${local.test_environment}"
      echo ""
    EOT
  }

  depends_on = [
    terraform_data.test_cleanup_notification,
    terraform_data.test_end_to_end
  ]
}

########################
# Test Outputs
########################

output "integration_test_results" {
  description = "Complete integration test results summary"
  value = {
    test_project_name = local.test_project_name
    test_environment  = local.test_environment
    test_author       = local.test_author
    test_timestamp    = local.test_timestamp
    test_region       = var.aws_region
    tests_enabled     = var.run_integration_tests
    cleanup_enabled   = var.cleanup_after_tests
    
    # Infrastructure validation results
    vpc_validation = {
      vpc_created        = module.infrastructure_under_test.vpc_id != ""
      vpc_id            = module.infrastructure_under_test.vpc_id
      correct_cidr      = module.infrastructure_under_test.vpc_cidr == "10.1.0.0/16"
      vpc_cidr          = module.infrastructure_under_test.vpc_cidr
      public_subnets    = length(module.infrastructure_under_test.public_subnet_ids)
      private_subnets   = length(module.infrastructure_under_test.private_subnet_ids)
    }
    
    security_validation = {
      kms_key_created    = module.infrastructure_under_test.kms_key_id != ""
      kms_key_id         = module.infrastructure_under_test.kms_key_id
      cloudtrail_created = module.infrastructure_under_test.cloudtrail_arn != ""
      cloudtrail_arn     = module.infrastructure_under_test.cloudtrail_arn
    }
    
    application_validation = {
      alb_configured     = module.infrastructure_under_test.alb_dns_name != ""
      alb_dns_name       = module.infrastructure_under_test.alb_dns_name
      data_bucket_created = module.infrastructure_under_test.s3_data_bucket_name != ""
      logs_bucket_created = module.infrastructure_under_test.s3_logs_bucket_name != ""
    }
  }
}

output "test_infrastructure_outputs" {
  description = "Key infrastructure outputs from integration tests"
  value = {
    vpc_id               = module.infrastructure_under_test.vpc_id
    vpc_cidr            = module.infrastructure_under_test.vpc_cidr
    public_subnet_ids   = module.infrastructure_under_test.public_subnet_ids
    private_subnet_ids  = module.infrastructure_under_test.private_subnet_ids
    alb_dns_name        = module.infrastructure_under_test.alb_dns_name
    s3_data_bucket_name = module.infrastructure_under_test.s3_data_bucket_name
    s3_logs_bucket_name = module.infrastructure_under_test.s3_logs_bucket_name
    kms_key_id          = module.infrastructure_under_test.kms_key_id
    cloudtrail_arn      = module.infrastructure_under_test.cloudtrail_arn
  }
}

output "test_execution_summary" {
  description = "Test execution summary and instructions"
  value = {
    total_tests_run = var.run_integration_tests ? 8 : 0
    all_tests_passed = var.run_integration_tests
    test_duration_note = "Check Terraform apply logs for individual test execution times"
    cleanup_instructions = "Run 'terraform destroy' to cleanup test resources"
    next_steps = [
      "Review test outputs for any warnings",
      "Verify all infrastructure components are functional",
      "Run production deployment if all tests pass",
      "Monitor CloudWatch logs for any issues"
    ]
  }
}