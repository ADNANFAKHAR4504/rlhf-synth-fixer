# MODEL_RESPONSE Failures - Training Data

This document catalogs the intentional mistakes in MODEL_RESPONSE.md for QA training purposes.

## Failure Categories

### 1. Missing CloudWatch Log Group
**Location**: lib/tap-stack.ts (line 31)
**Issue**: No explicit CloudWatch log group creation
**Impact**: Lambda auto-creates log group without retention policy, leading to:
- Logs retained indefinitely (cost implications)
- No environment-specific retention (requirement #6 violated)
- Non-compliant with 7-day dev/staging, 30-day prod requirement

**Expected**: Explicit LogGroup with retentionInDays parameter

### 2. Inconsistent Resource Naming
**Location**: lib/tap-stack.ts (line 35)
**Issue**: S3 bucket missing environment prefix
**Code**: `rawdata-bucket` instead of `${environmentSuffix}-rawdata-bucket`
**Impact**:
- Violates requirement #1 (environment-prefixed names)
- Violates constraint #6 (consistent naming convention)
- Bucket names would collide across environments

**Expected**: `${environmentSuffix}-rawdata-bucket`

### 3. Missing S3 Public Access Block
**Location**: lib/tap-stack.ts (after bucket creation)
**Issue**: No BucketPublicAccessBlock resource
**Impact**:
- Violates constraint #3 (block public access requirement)
- Security risk - bucket could be made public
- Fails compliance checks

**Expected**: BucketPublicAccessBlock with all blocks enabled

### 4. Hardcoded DynamoDB Capacity
**Location**: lib/tap-stack.ts (lines 60-61)
**Issue**: Fixed readCapacity: 5, writeCapacity: 5 for all environments
**Impact**:
- Violates requirement #3 (environment-appropriate capacity)
- Dev should be 1/1, Staging 5/5, Prod 10/10 or on-demand
- Constraint #4 violated (prod should use PAY_PER_REQUEST)
- Over-provisioned for dev (cost), under-provisioned for prod (performance)

**Expected**: Environment-specific capacity via config method

### 5. Wildcard IAM Permissions
**Location**: lib/tap-stack.ts (lines 95-97)
**Issue**: Using `s3:*`, `dynamodb:*`, `logs:*` with `Resource: "*"`
**Impact**:
- Violates constraint #8 (least-privilege principle)
- Security risk - excessive permissions
- Non-compliant with security best practices
- Lambda can access ANY S3 bucket, ANY DynamoDB table

**Expected**: Specific actions on specific resources:
- S3: GetObject, GetObjectVersion, ListBucket on bucket ARN only
- DynamoDB: PutItem, UpdateItem on table ARN only
- Logs: CreateLogStream, PutLogEvents on log group ARN only

### 6. Hardcoded Lambda Memory
**Location**: lib/tap-stack.ts (line 123)
**Issue**: Fixed memorySize: 1024 for all environments
**Impact**:
- Violates requirement #2 (environment-specific memory)
- Dev should be 512MB, Staging 1024MB, Prod 2048MB
- Over-provisioned for dev (cost), under-provisioned for prod (performance)

**Expected**: Environment-specific memory via config method

### 7. Missing X-Ray Tracing
**Location**: lib/tap-stack.ts (Lambda function)
**Issue**: No tracingConfig property
**Impact**:
- Violates requirement #5 (X-Ray for staging/prod)
- No distributed tracing in higher environments
- Harder to debug performance issues

**Expected**: Conditional tracingConfig based on environment

### 8. Output Naming Missing Environment Prefix
**Location**: lib/tap-stack.ts (lines 194-197)
**Issue**: registerOutputs uses simple names (bucketName, lambdaArn)
**Impact**:
- Violates constraint #9 (outputs must include environment prefix)
- Outputs not distinguishable across environments
- Hard to identify which environment an output belongs to

**Expected**: `${environmentSuffix}-bucketName` format

### 9. Missing Project Tag
**Location**: bin/tap.ts (lines 215-217)
**Issue**: defaultTags only includes Environment, missing Project
**Impact**:
- Violates requirement #9 (Environment AND Project tags)
- Resource attribution incomplete
- Cost tracking by project not possible

**Expected**: Both Environment and Project tags

## Training Objectives

These failures represent common mistakes that LLMs make when generating infrastructure code:

1. **Omitting explicit resource creation** (assuming defaults are sufficient)
2. **Inconsistent naming** (forgetting to apply patterns uniformly)
3. **Missing security configurations** (overlooking security requirements)
4. **Hardcoding values** (not implementing environment-specific logic)
5. **Over-permissive IAM** (using wildcards for convenience)
6. **Missing conditional features** (not implementing environment-based variations)
7. **Incomplete requirements** (partial implementation of specifications)

The QA trainer should detect all 9 failures and provide specific remediation guidance.