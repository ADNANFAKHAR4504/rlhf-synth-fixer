# Secure Secrets Management Infrastructure

Production-ready secrets management system built with Pulumi TypeScript for PCI-DSS compliance.

## Architecture

### Core Components

1. **VPC (3 Private Subnets)**
   - Isolated network across 3 availability zones
   - No public subnets or internet gateway
   - CIDR: 10.0.0.0/16

2. **KMS Customer-Managed Key**
   - Automatic key rotation enabled
   - Restricted access policy
   - Used for all secret encryption

3. **AWS Secrets Manager**
   - Stores RDS credentials
   - 30-day automatic rotation
   - Encrypted with KMS CMK

4. **Lambda Rotation Function**
   - Node.js 18.x with AWS SDK v3
   - Runs in private subnets
   - 60-second timeout
   - Implements 4-step rotation process

5. **VPC Endpoint**
   - Private access to Secrets Manager
   - No NAT gateway required
   - Cost-optimized solution

6. **CloudWatch Logs**
   - Audit logs: 365-day retention
   - Rotation logs: 365-day retention
   - Full compliance tracking

### Security Features

- **Encryption**: KMS CMK for all secrets
- **Network Isolation**: Private subnets only, no internet access
- **IAM Policies**: Least privilege with explicit VPC enforcement
- **Audit Trail**: CloudWatch logs with 1-year retention
- **Compliance Tags**: Environment, CostCenter, Compliance, Owner

## Deployment

### Prerequisites

- Node.js 18+
- Pulumi CLI 3.x
- AWS CLI configured
- Environment variable: `ENVIRONMENT_SUFFIX`

### Deploy

```bash
export ENVIRONMENT_SUFFIX=dev
pulumi up --yes
```

### Destroy

```bash
export ENVIRONMENT_SUFFIX=dev
pulumi destroy --yes
```

## Rotation Process

The Lambda function implements a 4-step rotation:

1. **createSecret**: Generates new credentials
2. **setSecret**: Updates RDS with new password
3. **testSecret**: Validates new credentials work
4. **finishSecret**: Promotes new version to AWSCURRENT

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

Tests validate:
- VPC configuration (3 private subnets)
- KMS key exists with rotation enabled
- Secret exists with 30-day rotation
- Lambda function is in VPC
- VPC endpoint is configured
- CloudWatch logs have 365-day retention

## Outputs

After deployment, the following outputs are available:

- `vpcId`: VPC identifier
- `secretArn`: Secrets Manager secret ARN
- `secretName`: Secret name with environment suffix
- `kmsKeyId`: KMS key identifier
- `rotationLambdaArn`: Lambda function ARN
- `privateSubnetIds`: List of private subnet IDs
- `vpcEndpointId`: Secrets Manager VPC endpoint ID

## Cost Optimization

- Uses VPC endpoint instead of NAT gateway (~$32/month savings)
- Serverless Lambda (pay per rotation)
- No public resources

## Compliance

Meets PCI-DSS requirements:
- Secrets encrypted at rest (KMS)
- Secrets encrypted in transit (VPC endpoint)
- 30-day rotation policy
- Audit logs with 1-year retention
- Network isolation (no internet access)
- Least privilege IAM policies

## Troubleshooting

### Rotation Failures

Check CloudWatch logs:
```bash
aws logs tail /aws/lambda/secrets-rotation-${ENVIRONMENT_SUFFIX} --follow
```

### VPC Connectivity

Verify VPC endpoint:
```bash
aws ec2 describe-vpc-endpoints --filters "Name=tag:Name,Values=secrets-manager-endpoint-*"
```

### Secret Status

Check rotation status:
```bash
aws secretsmanager describe-secret --secret-id rds-credentials-${ENVIRONMENT_SUFFIX}
```
