## Issues Fixed from Initial Model Response

### 1. Aurora Engine Version Update
**Problem:** Initial implementation used PostgreSQL 14.6 which may not be available in all regions.

**Fix:** Updated to Aurora PostgreSQL 15.8 which is currently supported in both us-east-1 and us-west-2 regions.

### 2. Deletion Protection
**Problem:** RDS clusters were created without explicit deletion protection setting, which could lead to accidental deletion.

**Fix:** Added `deletionProtection: false` explicitly to both primary and DR clusters to meet requirements.

### 3. Multi-Region Stack Deployment
**Problem:** Initial model response had a single stack structure that wasn't properly configured for multi-region deployment.

**Fix:** Refactored to support conditional resource creation based on `isPrimary` flag, allowing the same stack class to be instantiated for both primary and DR regions with appropriate configuration differences.

### 4. Cross-Region References
**Problem:** Stack outputs and references between primary and DR stacks weren't properly configured for cross-region deployment.

**Fix:** Added `crossRegionReferences: true` to stack props and properly exported/imported values like `globalClusterIdentifier`, `vpcId`, `vpcCidr`, `kmsKeyArn`, `snapshotBucketArn`, and `secretArn`.

### 5. DR Cluster Credential Handling
**Problem:** Initial implementation tried to create credentials for the DR cluster, but Aurora Global Database secondary clusters cannot specify credentials - they inherit from the primary.

**Fix:** Changed DR cluster creation to use `CfnDBCluster` directly instead of `DatabaseCluster` construct, and removed credential specification. Also created `CfnDBClusterParameterGroup` and `CfnDBInstance` resources for proper DR cluster setup.

### 6. Lambda Environment Variables
**Problem:** Lambda functions in DR region couldn't access primary region's database secret ARN.

**Fix:** Added `primarySecretArn` to stack props and passed it from primary to DR stack. Updated Lambda environment variables and IAM policies to grant cross-region access to the primary secret.

### 7. CloudWatch Alarm Dimensions
**Problem:** Alarms for DR region were trying to reference cluster identifier using the wrong property.

**Fix:** Updated alarm dimensions to use `cfnDRCluster?.ref` for DR cluster identifier instead of `dbCluster.clusterIdentifier`.

### 8. Construct ID Uniqueness
**Problem:** Duplicate construct IDs for `CfnOutput` resources caused synthesis errors.

**Fix:** Renamed output construct IDs to include region prefix (e.g., `ClusterEndpointOutput-${regionPrefix}`) to ensure uniqueness.

### 9. Lambda Runtime Environment Variable
**Problem:** Attempted to set `AWS_REGION` environment variable which is reserved by Lambda runtime.

**Fix:** Removed `AWS_REGION` from Lambda environment variables as it's automatically provided by the runtime.

### 10. VPC CIDR Block Configuration
**Problem:** Both regions would have used the same CIDR block causing conflicts.

**Fix:** Configured different CIDR blocks - 10.0.0.0/16 for primary region and 10.1.0.0/16 for DR region.

### 11. Stack Entry Point
**Problem:** Initial model response used `main.ts` but the requirement specified `bin/tap.ts` as the entry point.

**Fix:** Created `bin/tap.ts` with proper multi-region stack instantiation and cross-region dependencies.

### 12. Stack Name Consistency
**Problem:** Stack naming needed to maintain `TapStack` as the base name with environment suffix.

**Fix:** Used `TapStack${environmentSuffix}` as the base stack name pattern for both primary and DR stacks.
