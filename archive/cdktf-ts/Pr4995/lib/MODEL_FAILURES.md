# Model Failures Analysis

## Overview

This document details the infrastructure code issues identified during the QA validation process and the fixes required to make the manufacturing data pipeline deployment-ready.

## Critical Issues Fixed

### 1. KMS Key Reference Format (7 locations)

**Issue**: The model used KMS key ID instead of ARN in multiple AWS services that require ARN format.

**Locations**:
- Secrets Manager (db-secret)
- Secrets Manager (api-secret)
- S3 bucket encryption
- RDS Aurora cluster encryption
- ElastiCache Redis encryption
- EFS file system encryption
- Kinesis stream encryption

**Error Message**:
```
Error: "kms_key_id" (665b6d11-3b39-44d4-9f84-68e51012bf76) is an invalid ARN: arn: invalid prefix
```

**Root Cause**: The kmsKey.id property returns the key ID (UUID format), not the ARN. AWS services requiring encryption keys need the full ARN format.

**Fix Applied**:
- Added kmsKeyArn property to SecurityModule exports
- Updated all encryption references to use kmsKeyArn instead of kmsKeyId
- Modified interface in DataStorageModule to accept both kmsKeyId and kmsKeyArn

**Code Changes**:
```typescript
// Before (INCORRECT)
kmsKeyId: kmsKey.id  // Returns UUID only

// After (CORRECT)
kmsKeyId: kmsKey.arn  // Returns full ARN
```

### 2. ElastiCache Encryption Configuration

**Issue**: ElastiCache Redis cluster specified KMS key but did not enable at-rest encryption.

**Error Message**:
```
Error: creating ElastiCache Replication Group: InvalidParameterCombination:
Please enable encryption at rest to use Customer Managed CMK
```

**Root Cause**: AWS ElastiCache requires atRestEncryptionEnabled to be explicitly set to use a custom KMS key.

**Fix Applied**:
```typescript
// Added missing property
atRestEncryptionEnabled: 'yes',  // ElastiCache requires string 'yes' not boolean
kmsKeyId: kmsKeyArn,
```

### 3. S3 Lifecycle Policy Filter Format

**Issue**: S3 bucket lifecycle configuration used incorrect filter format.

**Root Cause**: CDKTF expects lifecycle filter as an array, not an object.

**Fix Applied**:
```typescript
// Before (INCORRECT)
filter: {
  prefix: '',
},

// After (CORRECT)
filter: [
  {
    prefix: '',
  },
],
```

### 4. API Gateway Integration Missing Backend

**Issue**: API Gateway V2 integration configured with placeholder URI instead of valid AWS service.

**Error Message**:
```
Error: creating API Gateway v2 Integration: BadRequestException:
For VpcLink VPC_LINK, integration uri should be a valid ELB listener ARN
or a valid Cloud Map service ARN.
```

**Root Cause**: The model created an API Gateway with VPC Link integration pointing to "http://example.com".

**Fix Applied**:
- Removed invalid integration and route configuration
- Added comment explaining integration would be configured once ECS service has a load balancer

### 5. Terraform Backend Configuration

**Issue**: Used unsupported backend parameter use_lockfile.

**Fix Applied**: Removed the unsupported parameter.

### 6. Code Quality Issues

**Issue**: 65 ESLint errors including formatting and unused variables.

**Fix Applied**:
- Ran ESLint --fix to auto-resolve formatting (61 errors)
- Removed unused variable declarations (4 errors)

## Architecture Improvements Needed

### 1. ECS Service Load Balancer

**Current State**: ECS Fargate service has no load balancer configured.

**Recommendation**: Add Application Load Balancer for API Gateway integration.

### 2. Blue-Green Deployment Configuration

**Gap**: The current configuration supports rolling deployments, not true blue-green with CodeDeploy.

### 3. ECS Task Definition

**Current State**: Uses nginx:latest placeholder image.

**Recommendation**: Replace with actual data processing application image.

## Conclusion

The model-generated infrastructure had several critical configuration errors:

1. Format errors (KMS ARN vs ID) 
2. Missing required parameters (ElastiCache encryption flag)
3. Invalid placeholder values (API Gateway integration)
4. CDKTF type mismatches (S3 filter format)

After applying all fixes, the infrastructure code passes linting, build, and synthesis checks.
