# Payment Processing Infrastructure

This Pulumi TypeScript project deploys a secure, PCI DSS-compliant payment processing infrastructure on AWS.

## Architecture

### Network Layer
- VPC with 3 availability zones
- Public subnets for Application Load Balancer
- Private subnets for ECS tasks and RDS database
- Single NAT Gateway for cost optimization
- VPC Flow Logs for network monitoring

### Compute Layer
- ECS Fargate cluster for containerized workloads
- Frontend service (React) running on port 3000
- Backend service (Node.js API) running on port 8080
- Separate security groups for frontend and backend isolation
- CloudWatch Logs for application logging

### Database Layer
- Aurora PostgreSQL Serverless v2 cluster
- IAM database authentication enabled
- Encrypted with customer-managed KMS keys
- RDS Performance Insights enabled
- Deployed in private subnets only

### Security Layer
- WAF Web ACL with rate limiting (1000 req/min per IP)
- Custom origin headers between CloudFront and ALB
- KMS keys with automatic annual rotation
- Least-privilege IAM roles for ECS tasks
- Secrets Manager for database credentials
- ECR vulnerability scanning on push

### CDN Layer
- CloudFront distribution as public endpoint
- Path-based routing to frontend and backend
- Custom headers to prevent direct ALB access
- HTTPS enforcement

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- Docker for building container images

## Configuration

Create a Pulumi stack and set required configuration:

```bash
pulumi stack init dev
pulumi config set environmentSuffix <unique-suffix>
pulumi config set certificateArn <acm-certificate-arn> --secret
pulumi config set aws:region us-east-1
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Build container images and push to ECR (after infrastructure is deployed):
```bash
# Build and push frontend image
docker build -t frontend:latest ./frontend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <frontend-repo-url>
docker tag frontend:latest <frontend-repo-url>:latest
docker push <frontend-repo-url>:latest

# Build and push backend image
docker build -t backend:latest ./backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <backend-repo-url>
docker tag backend:latest <backend-repo-url>:latest
docker push <backend-repo-url>:latest
```

3. Deploy infrastructure:
```bash
pulumi up
```

## Outputs

After deployment, Pulumi provides these outputs:

- `cloudFrontUrl`: Public URL for accessing the application
- `ecsClusterName`: ECS cluster name
- `dbClusterEndpoint`: RDS Aurora cluster endpoint
- `frontendRepoUrl`: ECR repository URL for frontend images
- `backendRepoUrl`: ECR repository URL for backend images

## Testing

Run unit tests:
```bash
npm test
```

## Security Considerations

- All data encrypted at rest using customer-managed KMS keys
- All data encrypted in transit using TLS/HTTPS
- IAM authentication for database (no passwords in code)
- WAF rate limiting to prevent DDoS attacks
- Container image vulnerability scanning
- VPC Flow Logs for network analysis
- CloudWatch Logs for audit trail

## GuardDuty Note

GuardDuty is an account-level service. This infrastructure does not create a GuardDuty detector. Enable GuardDuty manually at the account level or check for existence before creating programmatically.

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

All resources are configured for immediate deletion (no retention policies) to facilitate cleanup.

## PCI DSS Compliance

This infrastructure implements the following PCI DSS requirements:

- Requirement 1: Network security controls (VPC, security groups, WAF)
- Requirement 2: Secure configurations (least privilege IAM, encrypted storage)
- Requirement 3: Data encryption (KMS keys for RDS and ECS, TLS in transit)
- Requirement 4: Encrypted transmission (HTTPS only, custom headers)
- Requirement 6: Secure development (vulnerability scanning, monitoring)
- Requirement 10: Logging and monitoring (CloudWatch Logs, VPC Flow Logs)
