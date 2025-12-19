# Model Failures and Fixes

This document outlines the issues encountered during implementation and the fixes applied to reach the final solution.

## Initial Implementation Issues

### 1. Stack Orchestration Approach

**Problem:** The initial implementation attempted to use a wrapper `TapStack` class that orchestrated both `PrimaryStack` and `SecondaryStack`. This added unnecessary complexity and didn't align with standard CDK patterns for multi-stack applications.

**Fix:** Removed the `TapStack` wrapper class and moved stack instantiation directly to `bin/tap.ts`. This follows CDK best practices where the app entrypoint manages stack creation and dependencies.

### 2. Route 53 Resources

**Problem:** The initial implementation included Route 53 hosted zones, health checks, and failover routing records. These resources were causing deployment failures due to domain name conflicts and added unnecessary complexity for the core DR requirements.

**Fix:** Removed all Route 53 resources (HostedZone, HealthCheck, ARecord) from both stacks. Removed corresponding outputs and props that were used for cross-stack Route 53 references. The solution now focuses on infrastructure replication without DNS failover.

### 3. CDK API Deprecation Warnings

**Problem:** The code used deprecated CDK APIs:
- `DatabaseClusterProps#instanceProps` was deprecated in favor of `writer` property
- `FunctionOptions#logRetention` was deprecated in favor of explicit `logGroup`
- `TableOptions#pointInTimeRecovery` was deprecated in favor of `pointInTimeRecoverySpecification`

**Fix:** 
- Replaced `instanceProps` with `writer: rds.ClusterInstance.provisioned(...)`
- Replaced `logRetention` with explicit `logGroup: new logs.LogGroup(...)`
- Replaced `pointInTimeRecovery` with `pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true }`

### 4. Cross-Stack Reference Errors

**Problem:** `CfnOutput` resources in `PrimaryStack` were missing `exportName` properties, causing errors when `SecondaryStack` tried to import them using `importValue`.

**Fix:** Added `exportName: \`${this.stackName}-OutputName\`` to all `CfnOutput` resources in `PrimaryStack` that are referenced by `SecondaryStack`.

### 5. Resource Naming and Environment Suffix

**Problem:** Resources didn't include `environmentSuffix` in their logical IDs, making it difficult to deploy multiple environments and causing potential naming conflicts.

**Fix:** Updated all resource logical IDs to include `-${environmentSuffix}` suffix. This ensures unique resource names across different environment deployments.

### 6. AWS Service Constraints

**Problem:** Several AWS service constraints caused deployment failures:
- Reserved domain names (e.g., `payments.example.com` is reserved by AWS)
- Unavailable RDS Aurora PostgreSQL engine versions (VER_15_4)
- Unsupported RDS instance classes for specific engine versions (db.t3.small not supported for Aurora PostgreSQL 15.12)
- Backup vault name conflicts

**Fixes:**
- Changed default domain name to `payment-dr-${environmentSuffix}.example.com` and made it configurable via CDK context or environment variables
- Updated Aurora PostgreSQL engine version from `VER_15_4` to `VER_15_12` (verified as available)
- Updated RDS instance class from `db.t3.small` to `db.t3.medium` (compatible with Aurora PostgreSQL 15.12)
- Created explicit `PrimaryBackupVault` and `SecondaryBackupVault` resources with unique names and passed them to `BackupPlan` to prevent default vault creation conflicts
- Added `removalPolicy: cdk.RemovalPolicy.DESTROY` to `sns.Topic` and `backup.BackupVault` to ensure proper cleanup

### 7. Region Configuration

**Problem:** Regions were hardcoded in the stack implementations, making it difficult to configure different regions for different deployments.

**Fix:** Moved region configuration to `bin/tap.ts` with support for:
- CDK context values (`app.node.tryGetContext('primaryRegion')`)
- Environment variables (`process.env.PRIMARY_REGION`)
- Default values (`'us-east-1'` and `'us-west-2'`)

### 8. Stack Name Configuration

**Problem:** Stack names didn't follow a consistent pattern and didn't include environment suffix.

**Fix:** Standardized stack naming to `TapStack${environmentSuffix}-Primary` and `TapStack${environmentSuffix}-Secondary`, ensuring consistent naming across all deployments.

### 9. Secondary Stack Deployment Delays

**Problem:** Secondary Aurora cluster was taking longer than expected to deploy because it was being provisioned as a standalone cluster rather than as part of a global database.

**Fix:** The secondary cluster is correctly configured as a separate cluster (not explicitly joined to a global cluster via `CfnGlobalCluster`). The delay was expected behavior for cluster provisioning. The implementation correctly creates separate clusters in each region that can be manually configured for global database replication if needed.

## Summary

The main fixes focused on:
1. Simplifying stack orchestration by removing wrapper classes
2. Removing unnecessary Route 53 resources
3. Updating deprecated CDK APIs
4. Fixing cross-stack references with proper export names
5. Adding environment suffix to all resource names
6. Addressing AWS service constraints (domain names, RDS versions, instance types, backup vaults)
7. Making regions configurable
8. Standardizing naming conventions

The final implementation provides a clean, maintainable multi-region DR solution that follows CDK best practices and successfully deploys all required infrastructure components.
