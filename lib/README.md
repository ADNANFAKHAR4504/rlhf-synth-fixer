# Multi-Environment Infrastructure

This Pulumi TypeScript project deploys consistent infrastructure across dev, staging, and production environments.

## Prerequisites

- Node.js 18+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Architecture

- **VPC**: Custom component with public/private subnets across 2 AZs
- **RDS**: PostgreSQL instances with environment-specific sizing
- **S3**: Buckets with versioning and lifecycle policies
- **Lambda**: Data processing functions with VPC integration
- **API Gateway**: REST APIs with IAM authorization
- **CloudWatch**: Monitoring, logging, and alarms

## Environment Configuration

Each environment has specific configuration:

### Dev
- VPC: 10.0.0.0/16
- RDS: t3.micro
- Lambda: 128MB memory, 30s timeout
- S3 retention: 7 days
- Multi-AZ: false

### Staging
- VPC: 10.1.0.0/16
- RDS: t3.small
- Lambda: 256MB memory, 60s timeout
- S3 retention: 30 days
- Multi-AZ: true

### Prod
- VPC: 10.2.0.0/16
- RDS: t3.medium
- Lambda: 512MB memory, 120s timeout
- S3 retention: 90 days
- Multi-AZ: true

## Deployment

### Initial Setup

```bash
# Install dependencies
npm install

# Set database password for environment
pulumi config set --secret tap-stack:dbPassword YOUR_SECURE_PASSWORD --stack dev
```

### Deploy to Dev

```bash
pulumi stack select dev
pulumi up
```

### Deploy to Staging

```bash
pulumi stack select staging
pulumi up
```

### Deploy to Production

```bash
pulumi stack select prod
pulumi up
```

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage
```

## Stack Outputs

Each stack exports:
- `vpcId`: VPC identifier
- `rdsEndpoint`: RDS connection endpoint
- `bucketName`: S3 bucket name
- `lambdaArn`: Lambda function ARN
- `apiUrl`: API Gateway endpoint URL

## Cross-Stack References

Use Pulumi stack references to share outputs between environments:

```typescript
import * as pulumi from "@pulumi/pulumi";

const devStack = new pulumi.StackReference("organization/project/dev");
const devVpcId = devStack.getOutput("vpcId");
```

## Cleanup

```bash
# Destroy environment
pulumi destroy

# Remove stack
pulumi stack rm <stack-name>
```

## Security Considerations

- All resources use encryption at rest
- IAM roles follow least-privilege principle
- RDS instances in private subnets
- Lambda functions use VPC integration
- API Gateway uses IAM authorization

## Cost Optimization

- Dev uses t3.micro instances and lower retention
- Serverless architecture minimizes idle costs
- NAT gateways can be replaced with VPC endpoints for further savings
- Multi-AZ disabled in dev to reduce costs

## Troubleshooting

### RDS Connection Issues
- Verify security group rules
- Check Lambda is in correct VPC subnets
- Validate RDS endpoint in environment variables

### Lambda Timeouts
- Increase timeout in stack configuration
- Check VPC NAT gateway configuration
- Review CloudWatch logs for details

### API Gateway Errors
- Verify IAM role permissions
- Check Lambda function is accessible
- Review API Gateway CloudWatch logs
