# Payment Processing Infrastructure

This Pulumi TypeScript program deploys a complete payment processing web application infrastructure on AWS with PCI DSS compliance features.

## Architecture

- **VPC**: 3 public and 3 private subnets across 3 availability zones
- **ECS Fargate**: Containerized payment service running in private subnets
- **RDS Aurora MySQL**: Multi-AZ encrypted database cluster
- **Application Load Balancer**: HTTPS-only traffic distribution
- **S3**: VPC flow logs with lifecycle policies
- **CloudWatch**: 7-year log retention for compliance
- **Security**: Customer-managed KMS encryption, restrictive security groups, least-privilege IAM

## Prerequisites

- Node.js 18+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- ACM certificate for HTTPS (ARN required)

## Configuration

Set the following configuration values:

```bash
pulumi config set aws:region ap-southeast-1
pulumi config set environmentSuffix <your-environment>
pulumi config set certificateArn <your-acm-certificate-arn> --secret
```

## Deployment

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Outputs

- `albDnsName`: DNS name of the Application Load Balancer
- `rdsClusterEndpoint`: Writer endpoint for RDS Aurora cluster
- `rdsClusterReadEndpoint`: Reader endpoint for RDS Aurora cluster
- `flowLogsBucketName`: S3 bucket name for VPC flow logs
- `vpcId`: VPC identifier
- `ecsClusterName`: ECS cluster name
- `ecsServiceName`: ECS service name

## Security Features

- All RDS data encrypted at rest with customer-managed KMS keys
- VPC flow logs enabled and stored in S3 with 90-day glacier transition
- CloudWatch logs retained for 7 years (2557 days)
- Security groups with explicit deny-by-default rules
- IAM roles following principle of least privilege
- ECS tasks run in private subnets without direct internet access
- HTTPS-only traffic to Application Load Balancer
- RDS automated backups retained for 35 days

## Compliance

This infrastructure meets the following compliance requirements:

- **PCI DSS**: Encrypted storage, audit logging, network isolation
- **Data Isolation**: Private subnets for application and database layers
- **Audit Trail**: VPC flow logs, CloudWatch logs with 7-year retention
- **High Availability**: Multi-AZ deployment for RDS and ECS

## Resource Naming

All resources use the `environmentSuffix` variable to support multiple environments. Example:

- VPC: `payment-vpc-{environmentSuffix}`
- ECS Cluster: `payment-cluster-{environmentSuffix}`
- RDS Cluster: `payment-aurora-{environmentSuffix}`

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Notes

- The default container image is `nginx:latest`. Replace with your actual payment service image.
- Database credentials are stored as Pulumi secrets. In production, integrate with AWS Secrets Manager.
- ACM certificate must be created separately and ARN provided via configuration.
- NAT Gateways are deployed in each AZ for high availability (incurs additional costs).
