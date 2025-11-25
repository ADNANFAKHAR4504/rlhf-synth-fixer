# Model Failures Documentation

This document tracks all errors encountered and fixes applied during the Terraform deployment process.

---

## **Issue 1 — Duplicate Variable Declaration**

**Error:**
```
Error: Duplicate variable declaration

  on variables.tf line 3:
   3: variable "aws_region" {

A variable named "aws_region" was already declared at tapstack.tf:37,1-22. 
Variable names must be unique within a module.
```

**Root Cause:** The `aws_region` variable was declared in both `tapstack.tf` and `variables.tf`, causing a conflict during Terraform initialization.

**Fix:** Removed the duplicate `aws_region` variable declaration from `variables.tf` since it was already properly defined in `tapstack.tf` with appropriate defaults and description.

---

## **Issue 2 — Invalid SageMaker Data Source**

**Error:**
```
Error: Invalid data source

  on tapstack.tf line 362, in data "aws_sagemaker_endpoint" "fraud_model":
  362: data "aws_sagemaker_endpoint" "fraud_model" {

The provider hashicorp/aws does not support data source "aws_sagemaker_endpoint".
```

**Root Cause:** The AWS provider does not have a `aws_sagemaker_endpoint` data source. SageMaker endpoints cannot be queried as data sources in the current AWS provider version.

**Fix:** 
1. Removed the invalid data source declaration
2. Updated the IAM policy to construct the SageMaker endpoint ARN directly using the variable:
   ```hcl
   Resource = "arn:aws:sagemaker:${var.aws_region}:${data.aws_caller_identity.current.account_id}:endpoint/${var.fraud_model_endpoint_name}"
   ```
3. Added a comment noting that the SageMaker endpoint should be created separately and its name passed via the `fraud_model_endpoint_name` variable

---

## **Issue 3 — Missing S3 Lifecycle Filter**

**Error:**
```
Warning: Invalid Attribute Combination

  with aws_s3_bucket_lifecycle_configuration.evidence,
  on tapstack.tf line 703, in resource "aws_s3_bucket_lifecycle_configuration" "evidence":
 703: resource "aws_s3_bucket_lifecycle_configuration" "evidence" {

No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required

This will be an error in a future version of the provider
```

**Root Cause:** AWS provider version 5.x requires S3 lifecycle configuration rules to have either a `filter` block or a `prefix` attribute. The lifecycle rules were missing this required attribute.

**Fix:** Added empty `filter` blocks to both S3 lifecycle configurations:
- `aws_s3_bucket_lifecycle_configuration.evidence`
- `aws_s3_bucket_lifecycle_configuration.athena_results`

```hcl
filter {
  prefix = ""
}
```

This applies the lifecycle rule to all objects in the bucket (empty prefix matches everything).

---

## **Issue 4 — Redis Automatic Failover Configuration**

**Error:**
```
Error: "num_cache_clusters": must be at least 2 if automatic_failover_enabled is true

  with aws_elasticache_replication_group.redis,
  on tapstack.tf line 793, in resource "aws_elasticache_replication_group" "redis":
 793: resource "aws_elasticache_replication_group" "redis" {
```

**Root Cause:** ElastiCache Redis automatic failover requires at least 2 cache clusters for high availability. The dev environment was configured with only 1 node but had `automatic_failover_enabled = true`.

**Fix:** Added conditional logic to automatically disable failover when there's only 1 node:
```hcl
# Automatic failover requires at least 2 nodes
automatic_failover_enabled = var.redis_num_cache_clusters >= 2 ? var.redis_automatic_failover_enabled : false
multi_az_enabled           = var.redis_num_cache_clusters >= 2 ? var.redis_automatic_failover_enabled : false
```

This allows dev environments to run with a single node while staging/prod can use multi-AZ failover.

---

## **Issue 5 — Missing KMS Key Policy**

**Error:** While not causing an immediate Terraform error, the Aurora KMS key lacked a proper key policy, which would cause runtime errors when RDS tries to use the key for encryption operations.

**Root Cause:** Custom KMS keys require explicit policies to grant permissions to AWS services (like RDS) and the account root user. Without these policies, services cannot use the key even if they have IAM permissions.

**Fix:** Added comprehensive KMS key policy for the Aurora encryption key with three key statements:

1. **Enable IAM User Permissions** - Grants root account full access to manage the key
2. **Allow RDS to use the key** - Grants RDS service permissions for encryption operations:
   - `kms:Decrypt`
   - `kms:DescribeKey`
   - `kms:CreateGrant`
   - `kms:GenerateDataKey`
   - `kms:GenerateDataKeyWithoutPlaintext`
   - `kms:ReEncrypt*`
3. **Allow CloudWatch Logs** - Grants CloudWatch Logs permissions to encrypt log data

Also enabled automatic key rotation for security best practices:
```hcl
enable_key_rotation = true
```

**Note:** Kinesis and SNS use AWS-managed keys (`alias/aws/kinesis` and `alias/aws/sns`) which don't require custom policies.

---

## Summary

All identified issues have been resolved:
- ✅ Removed duplicate variable declarations
- ✅ Fixed invalid SageMaker data source reference
- ✅ Added required filter blocks to S3 lifecycle configurations
- ✅ Fixed Redis automatic failover configuration for single-node environments
- ✅ Added comprehensive KMS key policy with proper service permissions

The Terraform configuration now successfully validates with all three environment files:
- `terraform plan -var-file=dev.tfvars` ✓
- `terraform plan -var-file=staging.tfvars` ✓
- `terraform plan -var-file=prod.tfvars` ✓

No errors or warnings are present in any environment configuration.