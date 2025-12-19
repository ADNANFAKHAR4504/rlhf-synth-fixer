# Multi-Region Disaster Recovery Solution with Pulumi TypeScript

I'll help you set up a comprehensive disaster recovery infrastructure across us-east-1 and us-west-2 regions using Pulumi with TypeScript.

## Implementation Overview

The solution implements a multi-region DR architecture with the following components:

### 1. Multi-Region Providers

Created separate AWS providers for primary (us-east-1) and secondary (us-west-2) regions to enable multi-region resource deployment.

### 2. DynamoDB Global Table

Implemented a DynamoDB Global Table that automatically replicates data between regions:
- Hash key: `id` (String type)
- Billing mode: PAY_PER_REQUEST (on-demand)
- Enabled DynamoDB Streams for replication
- Configured replica in us-west-2

### 3. S3 Cross-Region Replication

Set up S3 buckets in both regions with cross-region replication:
- Primary bucket in us-east-1
- Secondary bucket in us-west-2
- Versioning enabled on both buckets
- Replication rule configured to replicate all objects
- IAM role with appropriate permissions for replication

### 4. Lambda Functions

Deployed Lambda functions in both regions:
- Simple Node.js 18.x runtime
- DynamoDB write operations to demonstrate regional access
- Function URLs enabled for HTTP access (authType: NONE)
- IAM role with DynamoDB and CloudWatch Logs permissions
- Environment variable for DynamoDB table name

**Note**: Lambdas are deployed without VPC configuration for simplicity.

### 5. IAM Configuration

Created necessary IAM roles and policies:
- Lambda execution role with basic execution permissions
- DynamoDB access policy for Lambda functions
- S3 replication role with cross-region replication permissions
- Lambda URL invoke permissions

## Code Structure

### bin/tap.ts
Entry point that:
- Reads environment suffix from environment variables or config
- Creates the TapStack with appropriate configuration
- Exports stack outputs (Lambda URLs, table name, bucket names)

### lib/tap-stack.ts
Main infrastructure stack that creates:
- AWS providers for both regions
- DynamoDB Global Table
- S3 buckets with replication
- Lambda functions in both regions
- Function URLs for HTTP access
- IAM roles and policies

## Deployment

The infrastructure can be deployed using:

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=synthmfm20

# Configure Pulumi
pulumi config set aws:region us-east-1

# Deploy
pulumi up
```

## Outputs

The stack exports the following outputs:
- `primaryLambdaUrl`: HTTP endpoint for primary region Lambda
- `secondaryLambdaUrl`: HTTP endpoint for secondary region Lambda
- `globalTableName`: Name of the DynamoDB Global Table
- `primaryBucketName`: Name of primary S3 bucket
- `secondaryBucketName`: Name of secondary S3 bucket

## Testing Failover

To test the DR setup:

1. **Test Primary Region**:
   ```bash
   curl $(pulumi stack output primaryLambdaUrl)
   ```

2. **Test Secondary Region**:
   ```bash
   curl $(pulumi stack output secondaryLambdaUrl)
   ```

3. **Verify Data Replication**:
   - Write data via primary Lambda
   - Query DynamoDB in secondary region to confirm replication
   - Upload to primary S3 bucket and verify replication to secondary

## Design Decisions

1. **No VPC Configuration**: Simplified Lambda deployment by removing VPC requirements, avoiding NAT Gateway costs and complexity
2. **No Route 53 Failover**: Omitted Route 53 health checks and failover routing as it requires domain ownership/validation
3. **DynamoDB over Aurora**: Used DynamoDB Global Tables for simpler setup compared to Aurora Global Database
4. **Function URLs**: Used Lambda Function URLs instead of ALB for simpler HTTP access
5. **Public Lambda Access**: AuthType set to NONE for easier testing (should use IAM in production)

## Resource Naming

All resources use the `environmentSuffix` variable for unique naming:
- DynamoDB table: `tap-${environmentSuffix}-global`
- Lambda functions: `tap-${environmentSuffix}-primary` and `tap-${environmentSuffix}-secondary`
- S3 buckets: Include region and environment suffix

## Clean-up

All resources are configured without retention policies and can be destroyed cleanly:

```bash
pulumi destroy
```