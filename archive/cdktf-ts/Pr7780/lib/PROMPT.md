# Web Application Deployment - Secure Payment Processing

## Platform Requirements
**MANDATORY**: Use **CDKTF with TypeScript**

## Task Overview
Create a CDKTF TypeScript program to deploy a secure payment processing web application with strict PCI DSS compliance requirements.

## Background Context
A fintech startup needs to deploy their payment processing web application with strict compliance requirements. The application handles sensitive financial data and must meet PCI DSS standards while maintaining high availability across multiple availability zones.

## Infrastructure Requirements

### 1. Networking (VPC)
- Create a VPC with 3 public and 3 private subnets across 3 availability zones
- Configure NAT gateways in each AZ for outbound connectivity from private subnets
- Enable VPC flow logs capturing all traffic to a dedicated S3 bucket
- All resources must include `environmentSuffix` in names to avoid collisions

### 2. Load Balancing (ALB)
- Set up an Application Load Balancer with HTTPS listeners using ACM certificates
- Application load balancer must terminate SSL/TLS with ACM certificates
- Distribute traffic across multiple availability zones

### 3. Compute (ECS Fargate)
- Deploy an ECS Fargate cluster running the payment application from ECR
- ECS tasks must run in private subnets with no direct internet access
- Configure auto-scaling for ECS services based on CPU utilization
- ECS task definitions must use specific image tags, not 'latest'
- Create IAM roles with minimal permissions for ECS tasks

### 4. Database (RDS Aurora PostgreSQL)
- Configure RDS Aurora PostgreSQL with Multi-AZ deployment and encryption
- All RDS instances must use encrypted storage with customer-managed KMS keys
- Create IAM roles with minimal permissions for RDS
- Restrict database access to ECS tasks only via security groups

### 5. Storage and CDN (S3 and CloudFront)
- Create S3 buckets for static assets with CloudFront distribution
- All S3 buckets must have versioning enabled and lifecycle policies for compliance
- Create dedicated S3 bucket for VPC flow logs

### 6. Secrets Management
- Implement Secrets Manager for database credentials with 30-day rotation
- Database credentials must be stored in AWS Secrets Manager with automatic rotation

### 7. Monitoring and Logging (CloudWatch)
- Configure CloudWatch Log Groups with 7-year retention for compliance
- CloudWatch Logs retention must be set to 7 years (2555 days) for audit trails
- Add CloudWatch alarms for high CPU, memory usage, and failed health checks

### 8. Security
- Implement security groups allowing only HTTPS from internet
- Security groups must follow least-privilege with explicit port allowlists
- Restrict database access to ECS tasks via security groups
- All resources must be tagged with Environment, Project, and CostCenter tags

## Deployment Environment
- **Region**: us-east-1
- **Availability Zones**: 3 (for high availability)
- **Requirements**: CDKTF CLI, Node.js 18+, TypeScript 5.x, AWS CLI with appropriate IAM permissions

## AWS Services Required
- VPC (Networking)
- Application Load Balancer (ALB)
- ECS Fargate (Containerized compute)
- ECR (Container registry)
- RDS Aurora PostgreSQL Multi-AZ (Database)
- S3 (Storage for static assets and logs)
- CloudFront (CDN)
- Secrets Manager (Credential management)
- CloudWatch (Monitoring and logging)
- IAM (Identity and access management)
- KMS (Encryption key management)
- ACM (Certificate management)
- Auto Scaling (Dynamic scaling)

## Compliance Constraints (PCI DSS)
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

## Deployment Requirements (CRITICAL)

These requirements are MANDATORY for successful deployment and testing:

### Resource Naming
- ALL resource names MUST include `${environmentSuffix}` parameter
- Use naming pattern: `resource-type-${environmentSuffix}`
- This prevents naming collisions in multi-deployment environments

### Destroyability
- ALL resources MUST be fully destroyable
- Do NOT use RemovalPolicy.RETAIN or deletion protection
- Do NOT enable termination protection on any resources
- S3 buckets must allow deletion (no RETAIN policies)
- RDS instances must allow deletion (deletionProtection: false)

### Service-Specific Requirements
- **CloudWatch Logs**: Retention MUST be exactly 2555 days (7 years)
- **Secrets Manager**: Rotation period MUST be 30 days
- **RDS Aurora**: Use customer-managed KMS keys (not AWS managed)
- **ECS Task Definitions**: Must specify exact image tags (never 'latest')
- **NAT Gateways**: Required in each AZ for private subnet outbound connectivity
- **Security Groups**: Use explicit port numbers, no broad CIDR ranges

### Testing Requirements
- Infrastructure must deploy successfully in us-east-1
- All resources must be independently verifiable
- Stack outputs must include all critical ARNs and endpoints
- Integration tests must validate cross-service connectivity

## Expected Output
A complete CDKTF TypeScript program that:
- Creates all resources with proper error handling
- Exports key resource ARNs and endpoints
- Follows TypeScript best practices with strong typing throughout
- Includes comprehensive unit tests with 90%+ coverage
- Includes integration tests using actual deployment outputs
- Passes all linting and build quality checks
- Is fully deployable and destroyable

## Important Notes
- All resource names MUST include `${environmentSuffix}` to avoid naming collisions
- Do NOT use RemovalPolicy.RETAIN or deletionProtection for synthetic tasks
- Follow CDKTF best practices for TypeScript
- Ensure all resources are properly tagged
- Implement proper error handling throughout
- Use strong TypeScript typing (avoid 'any' types)
