# Payment Processing Web Application Infrastructure

## Platform and Language
**MANDATORY**: This infrastructure MUST be implemented using **Pulumi with TypeScript**.

## Task Description
Create a Pulumi TypeScript program to deploy a secure payment processing web application. The configuration must:

1. Create a VPC with 3 public and 3 private subnets across 3 availability zones
2. Set up an Application Load Balancer with HTTPS listeners using ACM certificates
3. Deploy an ECS Fargate cluster running the payment application from ECR
4. Configure RDS Aurora PostgreSQL with Multi-AZ deployment and encryption
5. Create S3 buckets for static assets with CloudFront distribution
6. Implement Secrets Manager for database credentials with 30-day rotation
7. Configure CloudWatch Log Groups with 7-year retention for compliance
8. Set up VPC flow logs capturing all traffic to a dedicated S3 bucket
9. Create IAM roles with minimal permissions for ECS tasks and RDS
10. Implement security groups allowing only HTTPS from internet and restricting database access to ECS tasks
11. Configure auto-scaling for ECS services based on CPU utilization
12. Add CloudWatch alarms for high CPU, memory usage, and failed health checks

## Background Context
A fintech startup needs to deploy their payment processing web application with strict compliance requirements. The application handles sensitive financial data and must meet PCI DSS standards while maintaining high availability across multiple availability zones.

## Technical Requirements

### Environment
- Production deployment in us-east-2 region across 3 availability zones for high availability
- Infrastructure includes:
  - VPC with public and private subnets
  - Application Load Balancer for traffic distribution
  - ECS Fargate for containerized application hosting
  - RDS Aurora PostgreSQL Multi-AZ for database
  - S3 for static assets and logs storage
  - Secrets Manager for credentials
  - CloudWatch for monitoring and logging
  - NAT gateways in each AZ for outbound connectivity from private subnets

### Prerequisites
- Pulumi CLI 3.x
- Node.js 18+
- TypeScript 5.x
- AWS CLI configured with appropriate IAM permissions

### Compliance and Security Constraints
1. All S3 buckets must have versioning enabled and lifecycle policies for compliance
2. Security groups must follow least-privilege with explicit port allowlists
3. VPC flow logs must be enabled and sent to a dedicated S3 bucket
4. All RDS instances must use encrypted storage with customer-managed KMS keys
5. Database credentials must be stored in AWS Secrets Manager with automatic rotation
6. ECS tasks must run in private subnets with no direct internet access
7. Application load balancer must terminate SSL/TLS with ACM certificates
8. CloudWatch Logs retention must be set to 7 years for audit trails
9. All resources must be tagged with Environment, Project, and CostCenter tags
10. ECS task definitions must use specific image tags, not 'latest'

## Expected Output
A complete Pulumi TypeScript program that:
- Creates all resources with proper error handling
- Exports key resource ARNs and endpoints
- Follows TypeScript best practices with strong typing throughout
- Implements all security and compliance requirements
- Uses environmentSuffix for all named resources (pattern: `resourceName-${environmentSuffix}`)
- Ensures all resources are destroyable (no Retain policies)

## Important Deployment Notes
- All resource names MUST include `environmentSuffix` to avoid naming conflicts
- No resources should have RETAIN deletion policies
- RDS instances should have `skipFinalSnapshot: true` for destroyability
- GuardDuty should NOT be created (account-level resource)
- Use AWS SDK v3 for Lambda functions (Node.js 18+ compatible)
- Prefer Aurora Serverless v2 for faster provisioning when possible
- Use VPC Endpoints instead of NAT Gateways where applicable to reduce costs
