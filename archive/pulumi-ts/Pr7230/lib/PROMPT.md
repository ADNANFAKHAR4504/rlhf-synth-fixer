Hey team,

We've got a critical project from a fintech startup that needs to deploy their payment processing web application with strict PCI DSS compliance requirements. The business wants a production-ready infrastructure that ensures all payment data is encrypted both in transit and at rest, with proper isolation between frontend and backend services. This is going to require careful attention to security controls, access management, and monitoring.

The application consists of a React frontend serving the customer-facing UI and a Node.js API backend handling payment transactions. The compliance team has been very clear that we need defense-in-depth security with multiple layers of protection, and everything needs to be auditable. They've also specified that we must use IAM authentication for database access instead of traditional passwords, and all container images must be scanned before deployment.

What makes this interesting is the requirement for custom origin headers between CloudFront and the ALB to prevent anyone from bypassing the CDN and accessing the load balancer directly. We also need to implement rate limiting at the WAF level to protect against potential DDoS attacks. The infrastructure needs to span three availability zones for high availability, and we're deploying everything to us-east-1.

## What we need to build

Create a secure payment processing infrastructure using **Pulumi with TypeScript** for a fintech application that requires PCI DSS compliance.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across 3 availability zones
   - NAT gateways for outbound internet access from private subnets
   - VPC Flow Logs enabled for network traffic analysis
   - Proper security group configurations for service isolation

2. **Container Platform**
   - ECS Fargate cluster for running containerized workloads
   - Two separate ECS services: React frontend (port 3000) and Node.js API backend (port 8080)
   - Frontend and backend must run in separate tasks with distinct security groups
   - ECR repositories with image scanning enabled on push
   - Block deployment of container images with HIGH or CRITICAL vulnerabilities
   - ECS task logging to CloudWatch Logs

3. **Database Layer**
   - Aurora PostgreSQL Serverless v2 cluster for scalable database workloads
   - IAM database authentication enabled (no password-based access)
   - Encrypted storage using customer-managed KMS keys
   - RDS Performance Insights enabled for query monitoring
   - Database deployed in private subnets only

4. **Load Balancing and CDN**
   - Application Load Balancer with HTTPS listener using ACM certificate
   - Path-based routing: /api/* routes to backend, /* routes to frontend
   - CloudFront distribution as the public-facing endpoint
   - Custom origin headers that ALB validates to prevent direct access
   - Backend API must not be directly accessible from the internet

5. **Security Controls**
   - WAF web ACL with rate limiting rule (1000 requests per minute per IP)
   - WAF attached to CloudFront distribution
   - KMS keys for RDS encryption with automatic annual rotation
   - KMS keys for ECS task encryption with automatic annual rotation
   - Least-privilege IAM roles for ECS tasks with specific permissions for RDS IAM authentication
   - IAM roles with permissions for Secrets Manager access

6. **Secrets and Configuration Management**
   - Database connection details stored in AWS Secrets Manager
   - Application configuration stored in Systems Manager Parameter Store
   - Secure retrieval of secrets by ECS tasks

7. **Monitoring and Compliance**
   - GuardDuty for threat detection (note: account-level service, do not create detector if one already exists)
   - CloudWatch Logs for ECS tasks and application logging
   - VPC Flow Logs for network traffic analysis
   - RDS Performance Insights for database query monitoring

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon VPC** for network isolation with 3 availability zones
- Use **ECS Fargate** for running frontend and backend containers
- Use **Aurora PostgreSQL Serverless v2** for database with IAM authentication
- Use **Application Load Balancer** for routing traffic to ECS services
- Use **CloudFront** as the CDN and public endpoint
- Use **ECR** for container image storage with vulnerability scanning
- Use **WAF** for web application firewall with rate limiting
- Use **KMS** for encryption key management with automatic rotation
- Use **IAM** for role-based access control and task permissions
- Use **Secrets Manager** for sensitive database credentials
- Use **Systems Manager Parameter Store** for application configuration
- Use **CloudWatch Logs** for centralized logging
- Use **VPC Flow Logs** for network monitoring
- Use **RDS Performance Insights** for database performance
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resourceType-environmentSuffix
- Deploy to **us-east-1** region
- All resources must be destroyable (RemovalPolicy.DESTROY, no RETAIN policies)
- Use deletionProtection: false for databases and load balancers

### Constraints

- All data encrypted at rest using customer-managed KMS keys
- All data encrypted in transit using TLS/HTTPS
- IAM authentication required for database access (no passwords)
- Container images must pass vulnerability scanning before deployment
- Frontend and backend must have separate security groups and network isolation
- CloudFront must be the only public entry point (ALB not directly accessible)
- Rate limiting of 1000 requests per minute per IP address
- PCI DSS compliance requirements must be met
- All resources must be destroyable without manual intervention
- Include proper error handling and logging for troubleshooting

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: ALL named resources (S3 buckets, ECR repositories, ECS clusters, RDS clusters, KMS keys, IAM roles, security groups, etc.) MUST include environmentSuffix parameter for uniqueness across parallel deployments
- **Destroyability**: NO resources should have RemovalPolicy.RETAIN or DeletionPolicy: Retain. Use RemovalPolicy.DESTROY for all resources. Set deletionProtection: false for RDS clusters and load balancers
- **GuardDuty Warning**: GuardDuty is an account-level service that allows only ONE detector per AWS account. Do not create a GuardDuty detector if one already exists. Document that GuardDuty should be enabled manually at the account level or checked for existence before creation
- **ACM Certificate**: The task requires an ACM certificate for HTTPS. For this synthetic task, either create a self-signed certificate placeholder, use an example domain, or document that a valid ACM certificate ARN must be provided as a Pulumi config parameter
- **Container Images**: ECS tasks require container images in ECR. For this synthetic task, create placeholder ECR repositories and document that actual application images must be built and pushed separately
- **NAT Gateway Cost**: NAT Gateways are expensive. For cost optimization, consider using 1 NAT Gateway instead of 3 (one per AZ) for synthetic tasks, unless high availability is explicitly required

## Success Criteria

- **Functionality**: Complete payment processing infrastructure with frontend, backend, and database components deployed and accessible via CloudFront
- **Security**: All data encrypted at rest and in transit, IAM authentication for database, WAF rate limiting active, custom headers preventing direct ALB access
- **Isolation**: Frontend and backend in separate ECS tasks with distinct security groups, database in private subnets only
- **Scanning**: ECR image scanning enabled with blocking of HIGH/CRITICAL vulnerabilities
- **Monitoring**: CloudWatch Logs, VPC Flow Logs, and RDS Performance Insights enabled and collecting data
- **Compliance**: PCI DSS requirements met with encryption, IAM controls, and audit logging
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Destroyability**: All resources can be destroyed without manual intervention (no RETAIN policies)
- **Code Quality**: TypeScript with proper types, well-structured Pulumi components, documented

## What to deliver

- Complete Pulumi TypeScript implementation with proper project structure
- VPC with 3 AZs, public/private subnets, NAT gateways, and security groups
- ECS Fargate cluster with frontend and backend services
- Aurora PostgreSQL Serverless v2 with IAM auth and encryption
- Application Load Balancer with HTTPS and path-based routing
- CloudFront distribution with custom origin headers
- ECR repositories with vulnerability scanning configuration
- WAF web ACL with rate limiting rule
- KMS keys with automatic rotation for RDS and ECS
- IAM roles with least-privilege permissions for ECS tasks
- Secrets Manager secrets for database credentials
- Systems Manager parameters for application config
- CloudWatch Logs, VPC Flow Logs, and RDS Performance Insights
- Pulumi outputs for CloudFront URL and ECS cluster endpoint
- Comprehensive unit tests for all infrastructure components
- Documentation with deployment instructions and architecture overview
