# Optimized DynamoDB Table Deployment

This Pulumi TypeScript program deploys an optimized DynamoDB table with comprehensive features for production workloads.

## Features

1. **On-Demand Billing** - Pay-per-request pricing for unpredictable workloads
2. **Point-in-Time Recovery (PITR)** - Continuous backups for data protection
3. **Contributor Insights** - Access pattern analysis
4. **CloudWatch Alarms** - Monitoring for read/write capacity consumption
5. **Proper Tagging** - Environment, Team, and CostCenter tags
6. **Global Secondary Index** - CategoryStatusIndex with attribute projection
7. **Server-Side Encryption** - AWS managed keys
8. **DynamoDB Streams** - NEW_AND_OLD_IMAGES view type
9. **IAM Role** - Least-privilege Lambda read access
10. **Stack Outputs** - Table ARN and Stream ARN exported

## Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS CLI configured with credentials
- AWS account with DynamoDB permissions

## Deployment

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Or use Pulumi config
pulumi config set environmentSuffix dev
```

### Deploy Stack

```bash
pulumi up
```

### Run Tests

```bash
# Unit tests
npm run test:unit

# Integration tests (requires deployed stack)
npm run test:integration

# All tests with coverage
npm run test:coverage
```

## Resource Naming

All resources include the `environmentSuffix` in their names:
- DynamoDB Table: `optimized-table-{environmentSuffix}`
- IAM Role: `lambda-dynamodb-reader-{environmentSuffix}`
- CloudWatch Alarms: `table-read-alarm-{environmentSuffix}`, `table-write-alarm-{environmentSuffix}`

## Cost Optimization

- **On-Demand Billing**: Pay only for actual requests, no provisioned capacity
- **Efficient GSI**: INCLUDE projection type reduces storage costs
- **No deletion protection**: Ensures clean resource destruction
- **Minimal backup retention**: PITR enabled but optimized

## Security

- Server-side encryption with AWS managed keys
- Least-privilege IAM policies for Lambda
- No hardcoded credentials
- Proper role-based access control

## Outputs

The stack exports the following outputs:
- `tableArn`: DynamoDB table ARN
- `streamArn`: DynamoDB stream ARN
- `lambdaRoleArn`: IAM role ARN for Lambda functions
- `tableName`: Table name with environment suffix

## Cleanup

```bash
pulumi destroy
```

All resources are fully destroyable with no retain policies.
