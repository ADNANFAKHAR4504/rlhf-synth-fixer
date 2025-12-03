# MODEL_FAILURES - Training Material

This document outlines the intentional issues present in the MODEL_RESPONSE for training purposes.

## Critical Issues (Score: 10/10)

### 1. Missing environmentSuffix in Resource Names (CRITICAL)
**Severity**: CRITICAL - Deployment Blocker
**Location**: All resources in tap_stack.py
**Issue**: Resource names do not include the required environmentSuffix parameter
**Impact**:
- Cannot deploy multiple environments
- Resource naming conflicts
- Violates the explicit requirement in PROMPT.md
**Examples**:
- VPC: `"ProductCatalogVPC"` should be `f"ProductCatalogVPC-{environment_suffix}"`
- Kinesis Stream: `"inventory-updates-stream"` should be `f"inventory-updates-{environment_suffix}"`
- S3 Bucket: `"product-inventory-archive"` should be `f"product-inventory-archive-{environment_suffix}"`
- All other resources similarly affected

### 2. RETAIN Policy on S3 Bucket (CRITICAL)
**Severity**: CRITICAL - Deployment Requirement Violation
**Location**: lib/tap_stack.py, line 36
**Issue**: `removal_policy=RemovalPolicy.RETAIN`
**Impact**:
- Bucket cannot be automatically deleted
- Violates explicit "all resources must be destroyable" requirement
- Will block stack destruction
**Fix**: Change to `RemovalPolicy.DESTROY` and add `auto_delete_objects=True`

### 3. RDS Deletion Protection Enabled (CRITICAL)
**Severity**: CRITICAL - Deployment Requirement Violation
**Location**: lib/tap_stack.py, line 82
**Issue**: `deletion_protection=True`
**Impact**:
- Database cannot be deleted
- Violates destroyability requirement
- Blocks stack cleanup
**Fix**: Set `deletion_protection=False`

### 4. RDS Snapshot Policy (CRITICAL)
**Severity**: CRITICAL - Deployment Requirement Violation
**Location**: lib/tap_stack.py, line 83
**Issue**: `removal_policy=RemovalPolicy.SNAPSHOT`
**Impact**:
- Creates snapshot on deletion (not truly destroyable)
- Violates destroyability requirement
**Fix**: Change to `RemovalPolicy.DESTROY`

### 5. RDS Backup Retention (HIGH)
**Severity**: HIGH
**Location**: lib/tap_stack.py, line 81
**Issue**: `backup_retention=Duration.days(7)`
**Impact**:
- Creates backup snapshots that persist
- Not fully destroyable
**Fix**: Set `backup_retention=Duration.days(0)`

### 6. ElastiCache Snapshot Retention (HIGH)
**Severity**: HIGH
**Location**: lib/tap_stack.py, line 105
**Issue**: `snapshot_retention_limit=5`
**Impact**:
- Creates snapshots that persist after deletion
- Violates destroyability requirement
**Fix**: Set `snapshot_retention_limit=0`

### 7. CloudWatch Log Group RETAIN Policy (MEDIUM)
**Severity**: MEDIUM
**Location**: lib/tap_stack.py, line 152
**Issue**: `removal_policy=RemovalPolicy.RETAIN`
**Impact**:
- Log group persists after stack deletion
**Fix**: Change to `RemovalPolicy.DESTROY`

### 8. Inline Lambda Code (HIGH)
**Severity**: HIGH - Production Readiness
**Location**: lib/tap_stack.py, lines 123-131
**Issue**: Lambda code defined inline instead of separate file
**Impact**:
- No proper error handling
- Not testable
- Not maintainable
**Fix**: Use `lambda_.Code.from_asset("lib/lambda")`

### 9. Missing IAM Permissions (HIGH)
**Severity**: HIGH
**Location**: lib/tap_stack.py, lines 109-117
**Issue**: Lambda role missing critical permissions
**Impact**:
- Cannot read from Kinesis stream
- Cannot access Secrets Manager
- Cannot connect to VPC resources
**Missing Permissions**:
- Kinesis read permissions
- Secrets Manager GetSecretValue
- VPC execution role (AWSLambdaVPCAccessExecutionRole)
- EC2 network interface permissions

### 10. Lambda Not in VPC (HIGH)
**Severity**: HIGH - Security/Connectivity
**Location**: lib/tap_stack.py, Lambda function definition
**Issue**: Lambda function not deployed in VPC
**Impact**:
- Cannot access RDS database (in private subnet)
- Cannot access ElastiCache Redis (in private subnet)
**Fix**: Add `vpc=vpc`, `vpc_subnets`, and `security_groups` parameters

### 11. No Security Group Rules (HIGH)
**Severity**: HIGH
**Location**: lib/tap_stack.py
**Issue**: Security groups created but no ingress rules defined
**Impact**:
- Lambda cannot connect to database (port 5432)
- Lambda cannot connect to Redis (port 6379)
**Fix**: Add ingress rules allowing Lambda security group access

### 12. Hardcoded Connection Details in Lambda (CRITICAL)
**Severity**: CRITICAL - Security
**Location**: lib/lambda/inventory_processor.py
**Issue**: Database credentials hardcoded
**Details**:
- host='localhost'
- password='password123'
**Impact**:
- Won't work (localhost is wrong)
- Major security vulnerability
- Ignores Secrets Manager

### 13. No Error Handling in Lambda (HIGH)
**Severity**: HIGH
**Location**: lib/lambda/inventory_processor.py
**Issue**: No try-except blocks, no error logging
**Impact**:
- Lambda will fail on any error
- No visibility into failures
- No retry logic

### 14. Missing Lambda Dependencies (CRITICAL)
**Severity**: CRITICAL
**Location**: Lambda function
**Issue**: No Lambda layer or packaged dependencies
**Impact**:
- psycopg2 not available in Lambda runtime
- redis not available in Lambda runtime
- Function will fail immediately
**Fix**: Create Lambda layer with dependencies

### 15. No Event Source Error Configuration (MEDIUM)
**Severity**: MEDIUM
**Location**: lib/tap_stack.py, EventSourceMapping
**Issue**: No retry attempts, bisect_batch_on_error, or DLQ
**Impact**:
- Failed records lost forever
- No retry mechanism
**Fix**: Add error handling configuration

### 16. Missing S3 Lifecycle Expiration (MEDIUM)
**Severity**: MEDIUM - Compliance
**Location**: lib/tap_stack.py, S3 bucket
**Issue**: No expiration policy for 3-year retention
**Impact**:
- Data kept indefinitely (cost and compliance issue)
**Fix**: Add expiration after 1095 days

### 17. No CloudWatch Outputs (LOW)
**Severity**: LOW
**Location**: lib/tap_stack.py
**Issue**: No CfnOutput for resource endpoints
**Impact**:
- Hard to find resource ARNs/endpoints after deployment

### 18. Missing Encryption Configuration (MEDIUM)
**Severity**: MEDIUM - Security
**Location**: Multiple resources
**Issue**: No explicit encryption for Kinesis, no S3 encryption type
**Impact**:
- May not meet security requirements

### 19. No Database Schema Initialization (MEDIUM)
**Severity**: MEDIUM
**Location**: Infrastructure
**Issue**: Database created but no schema/tables defined
**Impact**:
- Lambda will fail when trying to UPDATE products table

### 20. Base64 Encoding Not Handled (HIGH)
**Severity**: HIGH
**Location**: lib/lambda/inventory_processor.py
**Issue**: Kinesis data is base64 encoded but not decoded
**Impact**:
- json.loads() will fail on base64 data

## Summary

Total Issues: 20
- Critical: 5
- High: 9
- Medium: 5
- Low: 1

This implementation demonstrates numerous common mistakes in CDK infrastructure code, particularly around:
1. Resource naming (environmentSuffix)
2. Destroyability (removal policies)
3. IAM permissions
4. VPC networking
5. Lambda configuration
6. Error handling

These issues provide excellent training material for identifying and fixing infrastructure code problems.
