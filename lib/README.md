# AWS Config Compliance Monitoring Solution

This Pulumi TypeScript project implements a comprehensive AWS Config-based compliance monitoring system.

## Architecture

The solution includes:

1. **AWS Config Setup**
   - Configuration recorder tracking EC2, RDS, and S3 resources
   - S3 bucket for configuration history with encryption
   - Delivery channel with 24-hour snapshot intervals

2. **Managed Compliance Rules**
   - `encrypted-volumes`: Verifies EC2 volumes are encrypted
   - `rds-encryption-enabled`: Verifies RDS encryption
   - `s3-bucket-ssl-requests-only`: Enforces SSL on S3 buckets

3. **Custom Compliance Rule**
   - Lambda function validating EC2 instance tags
   - Checks for required tags: Environment, Owner, CostCenter
   - Uses AWS SDK v3 with Node.js 18.x runtime

4. **Notifications**
   - SNS topic for compliance change notifications
   - Encrypted with AWS managed KMS key

## Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Node.js 18.x or later
- TypeScript

## Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <your-suffix>
pulumi config set aws:region us-east-1
```

## Deployment

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy
pulumi up
```

## Outputs

After deployment, the following outputs are available:

- `configRecorderName`: Name of the AWS Config recorder
- `configBucketArn`: ARN of the S3 bucket storing configuration history
- `complianceTopicArn`: ARN of the SNS topic for compliance notifications
- `tagCheckerLambdaArn`: ARN of the custom tag checker Lambda function

## Testing

Run unit tests:

```bash
npm test
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be destroyable without manual intervention.

## Resource Naming

All resources include the `environmentSuffix` configuration value in their names for uniqueness and proper resource isolation.

## Tags

All resources are tagged with:
- `Department`: Compliance
- `Purpose`: Audit

## Security

- S3 bucket uses AES256 encryption
- SNS topic uses AWS managed KMS key
- IAM roles follow least privilege principle
- Lambda function has CloudWatch Logs enabled
