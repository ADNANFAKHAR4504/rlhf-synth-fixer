# Model Failures in Infrastructure.ts

## Validation Errors Fixed

### 3. Resource Naming Validation Errors ✅ FIXED

**Location:** Multiple resource naming locations
**Issue:** `UnscopedValidationError: Load balancer name: "-alb-dev" must not begin or end with a hyphen`
**Root Cause:** When removing the prefix parameter, empty strings were passed, resulting in names like `-alb-dev` instead of `webapp-alb-dev`
**Error Details:**

- Load balancer name: `-alb-dev` (starts with hyphen)
- Target group name: `-webapp-tg-dev` (starts with hyphen)
- Auto Scaling Group name: `-webapp-asg-dev` (starts with hyphen)
- Launch template name: `-webapp-lt-dev` (starts with hyphen)
  **Fix Applied:**
- Updated all resource naming to use hardcoded `webapp` prefix instead of empty string
- Fixed ALB name: `webapp-alb-${this.environmentSuffix}`
- Fixed target group name: `webapp-tg-${this.environmentSuffix}`
- Fixed ASG name: `webapp-asg-${this.environmentSuffix}`
- Fixed launch template name: `webapp-lt-${this.environmentSuffix}`
  **Impact:** All resources now have valid names that comply with AWS naming conventions

## Runtime Errors Fixed

### 2. ALB Access Logs Configuration Error

**Location:** Line 364 in `createApplicationLoadBalancer` method
**Issue:** `TypeError: Cannot read properties of undefined (reading 'encryptionKey')`
**Root Cause:** The `logAccessLogs` method was being called before the S3 buckets were created, causing a reference to undefined bucket objects
**Error Details:**

- Stack trace showed error in `logAccessLogs` method
- The method was trying to access `encryptionKey` property on undefined bucket objects
- This occurred because ALB creation was happening before S3 bucket creation
  **Fix Applied:**
- Modified `createApplicationLoadBalancer` method to accept `logBucket` parameter
- Reordered resource creation to create S3 buckets before ALBs
- Updated method calls in both primary and secondary region infrastructure methods
  **Impact:** ALB access logs will now be properly configured without runtime errors

## Syntax Errors Fixed

### 1. Invalid Method Call on ApplicationTargetGroup

**Location:** Line 614 in `createAutoScalingGroup` method
**Issue:** Attempted to call `applyRemovalPolicy()` on an `ApplicationTargetGroup` object
**Error:** `Property 'applyRemovalPolicy' does not exist on type 'ApplicationTargetGroup'`
**Root Cause:** The `ApplicationTargetGroup` class in AWS CDK does not have an `applyRemovalPolicy` method. This method is only available on certain CDK constructs that support removal policies.
**Fix Applied:** Removed the invalid `targetGroup.applyRemovalPolicy(this.removalPolicy);` line
**Impact:** Target groups will use default removal behavior (typically destroyed with stack deletion)

## Potential Issues Identified

### 2. Cross-Region Resource Creation Limitation ✅ FIXED

**Location:** Constructor and region-specific methods
**Issue:** CDK stacks are region-specific, but the code attempts to create resources in multiple regions within a single stack
**Problem:** Resources in `secondaryRegion` will actually be created in the same region as the stack, not the intended secondary region
**Root Cause:** Single CDK stack can only deploy to one AWS region, regardless of configuration
**Fix Applied:**

- Refactored to create separate `Infrastructure` stacks for each region
- Updated `TapStack` to instantiate two separate stacks with different `env.region` values
- Simplified `Infrastructure` class to handle single-region deployment
- Removed cross-region replication and global table features (now single-region tables)
- Updated all resource references to use single-region naming
  **Impact:** Now properly creates infrastructure in both `us-east-1` and `us-west-2` regions

### 3. S3 Replication Configuration Timing ✅ RESOLVED

**Location:** `setupS3CrossRegionReplication` method (removed)
**Issue:** The replication configuration is set up before ensuring both buckets exist and are properly configured
**Resolution:** Method removed as part of cross-region architecture fix - no longer needed with separate regional stacks

### 4. Hardcoded Environment Values

**Location:** Line 60-61
**Issue:** Environment is hardcoded as 'Production' regardless of actual environment
**Problem:** All environments will be tagged as 'Production', making it difficult to distinguish between dev/staging/prod
**Recommendation:** Use the `environmentSuffix` or a separate environment parameter

### 5. Missing Error Handling

**Location:** Throughout the file
**Issue:** No error handling for AWS service failures or resource creation issues
**Recommendation:** Add try-catch blocks and proper error handling for critical operations

## Code Quality Observations

### 6. Method Length

**Location:** `createAutoScalingGroup` method (lines 492-616)
**Issue:** Method is quite long (124 lines) and handles multiple responsibilities
**Recommendation:** Break down into smaller, focused methods

### 7. Magic Numbers

**Location:** Various locations (e.g., line 202: '10.1.0.0/16')
**Issue:** Hardcoded values without explanation
**Recommendation:** Extract to named constants with comments explaining the rationale

### 8. Security Considerations

**Location:** Security group configurations
**Issue:** Some security groups allow broad outbound access (`allowAllOutbound: true`)
**Recommendation:** Implement more restrictive outbound rules where possible
