# Payment Processing Infrastructure

This Pulumi ts project deploys a secure, PCI DSS-compliant payment processing infrastructure on AWS.

## Architecture

The infrastructure includes:

- **Networking**: VPC with 3 public and 3 private subnets across 3 AZs, NAT gateways, VPC Flow Logs
- **Compute**: ECS Fargate cluster with auto-scaling
- **Database**: RDS Aurora PostgreSQL Multi-AZ with KMS encryption
- **Load Balancing**: Application Load Balancer with HTTPS termination
- **Storage**: S3 buckets with versioning and lifecycle policies
- **CDN**: CloudFront distribution for static assets
- **Security**: IAM least privilege, Secrets Manager with rotation, security groups
- **Monitoring**: CloudWatch logs with 7-year retention, CloudWatch alarms

## Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- ts 5.x
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the required resources

## Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <unique-suffix>
pulumi config set aws:region us-west-2
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Preview changes:
```bash
pulumi preview
```

3. Deploy:
```bash
pulumi up
```

## Outputs

After deployment, the following outputs will be available:

- `vpcId`: VPC ID
- `albDnsName`: Application Load Balancer DNS name
- `ecsClusterArn`: ECS cluster ARN
- `rdsClusterEndpoint`: RDS write endpoint
- `rdsClusterReadEndpoint`: RDS read endpoint
- `dbSecretArn`: Database credentials secret ARN
- `ecrRepositoryUrl`: ECR repository URL
- `cloudfrontDomainName`: CloudFront distribution domain
- `staticAssetsBucketName`: S3 bucket for static assets

## Post-Deployment Steps

1. **Push container image to ECR**:
```bash
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <ecr-url>
docker build -t payment-app .
docker tag payment-app:latest <ecr-url>:v1.0.0
docker push <ecr-url>:v1.0.0
```

2. **Configure DNS for ACM certificate validation**:
   - Add the DNS records provided by ACM to validate the certificate
   - Wait for certificate validation to complete

3. **Update ECS service** after image is pushed:
```bash
aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment
```

4. **Configure Secrets Manager rotation**:
   - The Lambda function for rotation needs to be configured
   - Enable automatic rotation for the database secret

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Security Considerations

- All data is encrypted at rest and in transit
- IAM roles follow least privilege principle
- Database credentials are stored in Secrets Manager with automatic rotation
- VPC Flow Logs capture all network traffic
- CloudWatch Logs retain audit trails for 7 years
- Security groups implement strict port allowlists

## Compliance

This infrastructure is designed to support PCI DSS compliance requirements including:
- Network segmentation (public/private subnets)
- Encryption at rest and in transit
- Access control (IAM, security groups)
- Logging and monitoring (CloudWatch, VPC Flow Logs)
- Credential rotation (Secrets Manager)

## Cost Optimization

- Uses Aurora Serverless v2 for cost-effective database scaling
- ECS Fargate auto-scaling based on CPU utilization
- S3 lifecycle policies to transition old versions to cheaper storage
- CloudFront caching to reduce origin requests
- VPC endpoints can be added to reduce NAT gateway data transfer costs
