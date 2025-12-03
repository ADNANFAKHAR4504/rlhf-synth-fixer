# Deploy Loan Processing Application Infrastructure

Hey team,

We need to deploy a containerized loan processing application for a fintech startup that's launching soon. The business is dealing with sensitive financial data and strict regulatory compliance requirements, so everything needs to be secure, auditable, and reproducible. They want the entire infrastructure defined as code so we can deploy consistently across environments and maintain audit trails.

This is a production system handling real-time loan processing. They need high availability across multiple zones, encrypted data storage, and comprehensive logging for compliance. The application runs as containers on Fargate, backed by Aurora PostgreSQL for the loan data, with an S3 bucket for document storage. Everything needs to scale automatically based on demand.

The tricky part is meeting all the compliance requirements. They need 365-day log retention, customer-managed encryption keys for backups, and all compute resources isolated in private subnets. Plus, auto-scaling needs to be based on ALB request counts rather than the default CPU metrics.

## What we need to build

Create a complete loan processing application infrastructure using **CloudFormation with JSON format** for us-east-2 region.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 10.0.0.0/16 CIDR range
   - Public subnets for load balancers across 3 availability zones
   - Private subnets for application containers across 3 availability zones
   - NAT Gateways for outbound traffic from private subnets
   - Internet Gateway for public subnet access

2. **Container Platform**
   - ECS Fargate cluster for running the loan processing application
   - Task definitions with proper IAM roles and least-privilege permissions
   - Service configured to run tasks in private subnets only
   - Auto-scaling based on ALB request count metric (not CPU/memory)
   - CloudWatch Log Groups with 365-day retention for application logs

3. **Database Layer**
   - Aurora PostgreSQL Serverless v2 cluster
   - Multi-AZ configuration for high availability
   - Minimum capacity: 0.5 ACUs, Maximum capacity: 4 ACUs
   - Customer-managed KMS keys for backup encryption
   - Automated backups enabled

4. **Load Balancing and SSL**
   - Application Load Balancer in public subnets
   - HTTPS listener using ACM certificate
   - Target group routing to ECS Fargate tasks
   - Health checks configured

5. **Document Storage**
   - S3 bucket for loan document storage
   - Server-side encryption enabled (SSE-S3 or SSE-KMS)
   - Versioning enabled for all objects
   - Lifecycle policies for cost optimization
   - Block public access enabled

6. **Security and IAM**
   - Least-privilege IAM roles for ECS tasks
   - IAM roles for ECS task execution
   - Security groups with minimal required access
   - All compute resources in private subnets with no direct internet access

7. **Monitoring and Logging**
   - CloudWatch Log Groups with 365-day retention (compliance requirement)
   - Custom CloudWatch metrics for auto-scaling
   - CloudWatch alarms for critical metrics

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON format**
- Deploy to **us-east-2** region
- Use CloudFormation Parameters for configurable values (environment suffix, certificate ARN, container image)
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- All resources must be destroyable (no Retain deletion policies)
- Implement proper DependsOn relationships for resource ordering

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All named resources MUST include the environmentSuffix parameter value to ensure unique resource names across multiple deployments. This includes S3 buckets, ECS clusters, RDS clusters, ALB names, log groups, etc.
- **Destroyability**: All resources MUST use default deletion policies (Delete). DO NOT use "Retain" deletion policy as resources must be cleanable after testing.
- **KMS Keys**: Customer-managed KMS keys required for Aurora backup encryption, but ensure proper key policies allow CloudFormation to delete them.

### Constraints

1. All ECS Fargate tasks must run in private subnets with no direct internet access
2. Database backups must be encrypted using customer-managed KMS keys
3. Application logs must be retained for exactly 365 days for compliance
4. Auto-scaling must trigger based on ALB RequestCountPerTarget metric (custom CloudWatch metrics), not default CPU/memory metrics
5. All S3 buckets must have versioning enabled and lifecycle policies for cost optimization
6. No hardcoded values - use Parameters for environment-specific configuration

### Environment Details

Production infrastructure for loan processing web application in us-east-2 region. Architecture includes Application Load Balancer in public subnets, ECS Fargate containers in private subnets across 3 availability zones, Aurora PostgreSQL Serverless v2 in Multi-AZ configuration, S3 bucket for document storage. VPC uses 10.0.0.0/16 CIDR with public/private subnet pairs in each AZ. NAT Gateways provide outbound internet access for containers to pull images and access AWS services. Application handles sensitive financial data requiring encryption at rest and in transit.

## Success Criteria

- **Functionality**: Complete CloudFormation JSON template that deploys all required infrastructure
- **High Availability**: Resources distributed across 3 availability zones
- **Security**: All compute in private subnets, encryption at rest, least-privilege IAM, customer-managed KMS keys
- **Compliance**: 365-day log retention, audit trails, secure data handling
- **Auto-scaling**: Custom CloudWatch metric-based scaling (ALB RequestCountPerTarget)
- **Resource Naming**: All named resources include environmentSuffix parameter
- **Destroyability**: All resources can be deleted cleanly after testing (no Retain policies)
- **Code Quality**: Well-structured JSON template with Parameters and Outputs sections

## What to deliver

- Complete CloudFormation JSON template (lib/cfn-template.json)
- VPC with public/private subnets across 3 AZs, Internet Gateway, NAT Gateways
- ECS Fargate cluster with task definition, service, and auto-scaling
- Aurora PostgreSQL Serverless v2 with KMS encryption
- Application Load Balancer with HTTPS listener and ACM integration
- S3 bucket with encryption, versioning, and lifecycle policies
- CloudWatch Log Groups with 365-day retention
- IAM roles with least-privilege permissions
- CloudFormation Parameters for configuration
- CloudFormation Outputs for important resource identifiers
- Comprehensive documentation in README.md
