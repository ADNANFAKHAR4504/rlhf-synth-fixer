# EC2 Compliance Monitoring System

This infrastructure provides automated compliance monitoring for EC2 instances with tag validation and remediation.

## Architecture

- **VPC**: Multi-AZ VPC with public and private subnets
- **EC2 Instances**: Monitored instances in private subnets with required tags
- **Lambda Function**: Automated tag remediation triggered every 5 minutes
- **CloudWatch**: Dashboard and alarms for compliance monitoring
- **Systems Manager**: Parameter Store for compliance reports

## Required Tags

All EC2 instances must have:
- Environment
- Owner
- CostCenter

## Deployment

```bash
# Install dependencies
npm install

# Set environment suffix
pulumi config set environmentSuffix dev

# Deploy
pulumi up
```

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

## Outputs

- `vpcId`: VPC identifier
- `instanceIds`: List of EC2 instance IDs
- `lambdaFunctionArn`: Tag remediation Lambda function ARN
- `dashboardUrl`: CloudWatch Dashboard URL
