# Model Failures and Fixes

This document outlines the issues found in the MODEL_RESPONSE and the corrections made to reach the IDEAL_RESPONSE.

## Issue 1: Checkstyle Violation - Method Too Long

**Problem**: The `defineInfrastructure` method was 351 lines, exceeding the 200-line limit enforced by checkstyle.

**Fix**: Refactored the monolithic method into 15 focused helper methods, each handling a specific infrastructure component.

**Impact**: Code is now maintainable, testable, and follows best practices for method length.

## Issue 2: Lambda Dependencies Not Installed

**Problem**: Lambda package.json existed but dependencies weren't installed, causing runtime failures.

**Fix**: Added `npm install` step in the Lambda directory before deployment to ensure all AWS SDK dependencies are available.

**Impact**: Lambda function can now execute successfully with required dependencies.

## Issue 3: Pulumi Output Type Handling

**Problem**: Original code used simple `.apply()` but didn't properly handle Output types with Either for IAM policies.

**Fix**: Updated to use `Either.ofLeft()` for IAM policy outputs and proper Output.all() for multiple resource dependencies.

**Impact**: Resources are created in correct order with proper dependency management, preventing deployment failures.

## Issue 4: Integration Test AWS SDK Compatibility

**Problem**: AWS SDK v2 uses typed enums for SQS attributes, not strings. Tests used string literals causing compilation errors.

**Fix**: Updated integration tests to use `QueueAttributeName` enums and `attributesAsStrings()` method.

**Impact**: Tests compile and execute correctly against deployed infrastructure.

## Issue 5: CloudWatch Log Group Naming Convention

**Problem**: Integration test assumed default Lambda log group naming pattern (`/aws/lambda/function-name`), but Pulumi creates custom-named log groups.

**Fix**: Updated test to match Pulumi's actual log group name pattern (`order-validator-logs-xxx`).

**Impact**: All integration tests pass successfully, validating actual deployed resources.

## Summary of Changes

1. **Code Quality**: Refactored for checkstyle compliance and maintainability
2. **Dependencies**: Ensured Lambda dependencies are properly installed
3. **Type Safety**: Fixed Pulumi Output type handling for proper resource ordering
4. **Test Accuracy**: Aligned tests with actual AWS SDK v2 API and resource configuration
5. **Deployment**: Verified all resources deploy and function correctly in us-west-1

All changes maintain the original functional requirements while improving code quality, maintainability, and test coverage.