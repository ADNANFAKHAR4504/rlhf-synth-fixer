# Trading Analytics Platform Infrastructure

Production-ready AWS CDK infrastructure for a financial trading analytics platform.

## Architecture Overview

This infrastructure deploys a secure, compliant, and scalable environment for processing real-time market data and providing analytics to institutional clients.

### Components

- **Networking**: VPC with 3 AZs, public/private subnets, VPC endpoints
- **Database**: Aurora Serverless v2 PostgreSQL, DynamoDB tables for sessions and API keys
- **Storage**: S3 buckets for raw data, processed analytics, and archival with lifecycle policies
- **Compute**: Lambda functions on Graviton2 processors for data processing
- **API**: API Gateway REST API with IAM authentication and API key throttling
- **Monitoring**: CloudWatch dashboards, alarms, and log aggregation
- **Compliance**: AWS Config with PCI-DSS compliance rules

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ and npm installed
- AWS CDK 2.x installed: `npm install -g aws-cdk`

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Synthesize CloudFormation Template

```bash
cdk synth
```

### 3. Deploy Infrastructure

```bash
# Deploy with default environment suffix
cdk deploy

# Deploy with custom environment suffix
cdk deploy -c environmentSuffix=prod
```

### 4. Retrieve Outputs

After deployment, the following outputs will be available:

- VPC ID
- Aurora database endpoint
- API Gateway URL
- S3 bucket names for raw data, processed data, and archives

## Configuration

### Environment Suffix

All resources include an environment suffix for uniqueness. Configure it via:

- CDK context: `cdk deploy -c environmentSuffix=your-suffix`
- Default: `dev`

### Region

Target region is configured in `bin/tap.ts` and defaults to the AWS CLI default region (us-east-1).

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- S3 Bucket: `trading-raw-data-dev`
- Lambda Function: `data-processor-dev`
- DynamoDB Table: `user-sessions-dev`

## Security Features

- All data encrypted at rest using KMS customer-managed keys
- IAM roles follow least-privilege principle with regional restrictions
- VPC isolation for compute and database resources
- API Gateway secured with IAM authentication and API keys
- S3 buckets block all public access and enforce SSL
- CloudWatch Logs for audit trails

## Compliance

AWS Config rules monitor PCI-DSS compliance:

- Encryption validation for S3, RDS, CloudWatch Logs
- Access logging for S3 buckets
- VPC flow logs enabled
- RDS automated backups enabled
- DynamoDB point-in-time recovery enabled
- IAM password policy enforcement
- Root account MFA enabled

## Cost Optimization

- Aurora Serverless v2 for automatic scaling
- DynamoDB on-demand billing
- Single NAT Gateway (can be scaled to 3 for HA)
- Lambda on Graviton2 processors for cost efficiency
- S3 lifecycle policies for automatic data tiering
- 30-day log retention

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Cleanup

To destroy all resources:

```bash
cdk destroy
```

**Note**: All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup after testing.

## Support

For issues or questions, refer to the AWS CDK documentation: https://docs.aws.amazon.com/cdk/
