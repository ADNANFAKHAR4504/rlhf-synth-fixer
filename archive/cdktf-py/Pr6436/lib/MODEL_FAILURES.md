# Model Failures Analysis - Task h1w06e

## Critical Failures Identified

### 1. Same Region for VPC Peering (SEVERITY: CRITICAL)
**Issue**: Both source and target VPCs were in the same region (us-east-1)
**Impact**: VPC peering between VPCs in same region is possible but doesn't demonstrate multi-region migration
**Expected**: VPCs in different regions (us-east-1 and eu-west-1)
**Error**: "VPC peering in same region doesn't support cross-region replication scenario"

### 2. Pre-existing VPC Dependency (SEVERITY: HIGH)
**Issue**: Used data sources to import existing VPC instead of creating from scratch
**Code Example**:
```python
data "aws_vpc" "existing" {
  id = "vpc-xxxxx"
}
```
**Impact**: Infrastructure not reproducible, depends on external resources
**Expected**: Create all VPC resources from scratch
**Error**: "VPC data source requires existing infrastructure"

### 3. Lambda Placeholder Zip File (SEVERITY: HIGH)
**Issue**: Referenced non-existent lambda_function.zip file
**Code Example**:
```python
filename="lambda_function.zip",
source_code_hash="${filebase64sha256(\"lambda_function.zip\")}"
```
**Impact**: Lambda function cannot be deployed
**Expected**: Either inline code or actual zip file created during build
**Error**: "FileNotFoundError: lambda_function.zip not found"

### 4. ACM Certificate Dependency (SEVERITY: MEDIUM)
**Issue**: API Gateway configured with custom domain requiring ACM certificate
**Code Example**:
```python
domain_name = "api.example.com"
certificate_arn = "arn:aws:acm:..."
```
**Impact**: Deployment fails without valid certificate and domain
**Expected**: Simple HTTP API without custom domain
**Error**: "ACM certificate validation required"

### 5. Missing Environment Suffix (SEVERITY: MEDIUM)
**Issue**: Some resources didn't include environment_suffix in naming
**Impact**: Potential naming conflicts in deployments
**Expected**: All resources include suffix for uniqueness
**Error**: "Resource name conflict in test environment"

### 6. Incorrect CIDR Ranges (SEVERITY: LOW)
**Issue**: Overlapping CIDR ranges for multi-region VPCs
**Expected**: Non-overlapping CIDRs (10.0.0.0/16 and 10.1.0.0/16)
**Error**: "VPC peering route conflicts with local CIDR"

## Security and Compliance Failures

### 7. Missing Explicit Deny in IAM Policies (SEVERITY: MEDIUM)
**Issue**: IAM policies lacked explicit deny statements
**Impact**: Fails subject_labels requirement for least-privilege
**Expected**: Explicit denies for destructive operations
**Fix Applied**: Added deny for DeleteBucket, DeleteTable, DeleteItem

### 8. Missing Resource Tags (SEVERITY: LOW)
**Issue**: Not all resources had required tags: Environment, Region, MigrationBatch
**Impact**: Fails compliance requirements
**Expected**: All resources properly tagged
**Fix Applied**: Added common_tags to all resources

### 9. CloudWatch Log Retention Not Set (SEVERITY: LOW)
**Issue**: Log groups without retention_in_days parameter
**Impact**: Fails subject_labels requirement (30 days retention)
**Expected**: retention_in_days=30 for all log groups
**Fix Applied**: Set 30-day retention for all CloudWatch log groups

### 10. DynamoDB PITR Not Enabled (SEVERITY: MEDIUM)
**Issue**: point_in_time_recovery not configured
**Impact**: Fails subject_labels requirement
**Expected**: PITR enabled for disaster recovery
**Fix Applied**: Added point_in_time_recovery configuration

## Platform and Language Issues

### 11. Wrong Platform Syntax (SEVERITY: CRITICAL)
**Issue**: Used Terraform HCL syntax instead of CDKTF Python
**Impact**: Code won't execute in CDKTF environment
**Expected**: Python class-based CDKTF constructs
**Example Error**:
```
resource "aws_vpc" "main" {  # Wrong - HCL syntax
  cidr_block = "10.0.0.0/16"
}

# Correct - CDKTF Python
Vpc(self, "main", cidr_block="10.0.0.0/16")
```

### 12. Incorrect Import Statements (SEVERITY: HIGH)
**Issue**: Wrong module imports for CDKTF
**Expected**: from cdktf_cdktf_provider_aws.vpc import Vpc
**Error**: "ModuleNotFoundError: No module named 'aws_cdk'"

## Fixes Applied

All critical failures have been addressed in the corrected MODEL_RESPONSE.md:

1. Changed target region to eu-west-1
2. Created all VPC infrastructure from scratch
3. Created lambda_function.zip deployment package
4. Removed custom domain from API Gateway
5. Added environment_suffix to all resources
6. Fixed CIDR ranges to non-overlapping
7. Added explicit deny statements to IAM policies
8. Added all required tags to resources
9. Set CloudWatch log retention to 30 days
10. Enabled DynamoDB point-in-time recovery
11. Used correct CDKTF Python syntax throughout
12. Fixed all import statements

## Validation Checklist

- [x] Different regions for source and target (us-east-1 and eu-west-1)
- [x] All VPC infrastructure created from scratch
- [x] Lambda deployment package created
- [x] API Gateway without custom domain
- [x] All resources include environment_suffix
- [x] Non-overlapping CIDR ranges
- [x] IAM policies with explicit denies
- [x] All resources properly tagged
- [x] CloudWatch 30-day retention
- [x] DynamoDB PITR enabled
- [x] CDKTF Python syntax used
- [x] Correct module imports