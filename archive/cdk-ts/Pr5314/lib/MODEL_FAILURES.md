# Model Failures Analysis

## Initial Implementation Issues

### 1. VPC Flow Logs Configuration Problems

**Issue**: The initial implementation attempted to use CloudWatch Logs for VPC Flow Logs, which required complex IAM role setup and log group management.

**Root Cause**: Misunderstanding of the requirement for S3-based logging and the complexity of CloudWatch Logs delivery permissions.

**Fix Applied**: Switched to S3-based VPC Flow Logs with CDK-managed bucket naming to avoid naming conflicts and policy issues.

### 2. S3 Bucket Naming Conflicts

**Issue**: Hardcoded S3 bucket names caused deployment failures due to "bucket policy already exists" errors.

**Root Cause**: Multiple deployment attempts with the same bucket name created conflicts with existing bucket policies.

**Fix Applied**: Removed explicit `bucketName` parameter to allow CDK to generate unique, CloudFormation-managed bucket names automatically.

### 3. Transit Gateway Route Table Management

**Issue**: Initial implementation used default route table associations, which didn't provide the required granular control for Dev-Prod isolation.

**Root Cause**: Misunderstanding of the requirement for separate route tables per environment to enforce traffic restrictions.

**Fix Applied**: Implemented custom route tables with explicit associations and routing rules that prevent direct Dev-Prod communication.

### 4. NAT Instance Auto-Recovery Configuration

**Issue**: The initial implementation didn't properly configure auto-recovery for NAT instances.

**Root Cause**: Missing CloudFormation property configuration for instance termination protection.

**Fix Applied**: Added `DisableApiTermination` property override to enable auto-recovery functionality.

### 5. Network ACL Implementation Gaps

**Issue**: Network ACLs were created but not properly associated with subnets or configured with the required traffic filtering rules.

**Root Cause**: Incomplete understanding of the requirement to explicitly deny Dev-Prod traffic at the network level.

**Fix Applied**: Implemented proper Network ACL entries with explicit deny rules for cross-environment traffic.

### 6. Resource Naming and Tagging Inconsistencies

**Issue**: Resource names and tags didn't consistently include the environment suffix, making it difficult to identify resources across different deployments.

**Root Cause**: Inconsistent application of the environment suffix parameter throughout the stack.

**Fix Applied**: Standardized resource naming with environment suffix and implemented consistent tagging strategy across all resources.

### 7. IAM Role and Permission Management

**Issue**: Initial implementation created unnecessary IAM roles for VPC Flow Logs when using S3 delivery, and didn't properly configure NAT instance permissions.

**Root Cause**: Over-engineering the IAM setup without understanding the specific requirements for each service.

**Fix Applied**: Simplified IAM role structure, removing unnecessary VPC Flow Logs role and focusing on essential NAT instance permissions.

## Key Lessons Learned

1. **S3 vs CloudWatch Logs**: S3-based VPC Flow Logs are simpler to implement and manage than CloudWatch Logs for this use case.

2. **CDK Resource Naming**: Let CDK manage resource naming when possible to avoid conflicts and ensure uniqueness.

3. **Transit Gateway Design**: Custom route tables provide better control over inter-VPC communication than default associations.

4. **Environment Isolation**: Network ACLs and Transit Gateway routing must work together to enforce proper environment isolation.

5. **Resource Lifecycle Management**: Conditional removal policies based on environment are essential for production deployments.