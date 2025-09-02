# MODEL FAILURES - Stack Deployment Issues

This file tracks the differences between the MODEL_RESPONSE.md files and the actual deployed stack, along with deployment failures and their resolutions.

## Current Deployment Issue

**Error**: `The DB subnet group doesn't meet Availability Zone (AZ) coverage requirement. Current AZ coverage: us-east-1d. Add subnets to cover at least 2 AZs.`

**Affected Resources**: 
- TapDBSubnetGroup (RDS Database Subnet Group)

**Root Cause**: RDS requires subnets in at least 2 different Availability Zones, but with `MaxAzs: 1`, we only have subnets in one AZ. The VPC subnet creation issue has been resolved.

## Attempted Fixes

### Fix 1: Reduce MaxAzs from 3 to 2
- **Status**: ❌ FAILED - Same error persists
- **Description**: Reduced VPC MaxAzs from 3 to 2 to limit subnet creation
- **Result**: Error still occurs, indicating deeper issue with CDK subnet configuration

### Fix 2: Remove CloudTrail and CloudWatch Logs
- **Status**: ✅ IMPLEMENTED - Removed to avoid circular dependencies
- **Description**: Removed CloudTrail and CloudWatch Log Groups to simplify stack
- **Result**: Reduced complexity but didn't resolve VPC subnet issue

## Current Stack State

The stack is currently failing at the VPC subnet creation phase. The issue appears to be with CDK's internal subnet configuration logic rather than the explicit configuration we've set.

## Next Steps Required

1. **Investigate VPC Configuration**: Need to examine CDK's VPC construct behavior
2. **Alternative VPC Approach**: Consider using explicit subnet definitions instead of CDK's automatic subnet creation
3. **Test with Minimal VPC**: Create a minimal VPC configuration to isolate the issue

## Stack Modifications Made

- ✅ Reduced MaxAzs to 2
- ✅ Removed CloudTrail dependencies  
- ✅ Removed CloudWatch Log Groups
- ✅ Added KMS key policies
- ✅ Added unique S3 bucket naming
- ❌ VPC subnet creation still failing

## Required Action

The VPC subnet creation issue needs to be resolved before the stack can deploy successfully. This appears to be a CDK construct-level issue that requires a different approach to VPC configuration.
