# Loan Processing Application Infrastructure

Hey team,

We need to build production infrastructure for our fintech startup's loan processing application. I've been asked to create this in JSON using CloudFormation. The business wants a fully containerized deployment with strict compliance and audit capabilities for regulatory requirements.

The application handles sensitive financial data and needs real-time processing capabilities. We're dealing with loan applications, document storage, and transaction logs that must meet financial industry compliance standards. The infrastructure needs to be reproducible across environments and fully defined as code.

Our architecture team has specified us-east-2 as the deployment region, and we need to ensure everything can scale automatically based on actual load patterns. Cost optimization is important, but security and compliance cannot be compromised.

## What we need to build

Create a complete infrastructure deployment using **CloudFormation with JSON** for a containerized loan processing web application with production-grade security and compliance features.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 10.0.0.0/16 CIDR block
   - Public and private subnets across 3 availability zones
   - NAT Gateways for outbound traffic from private subnets
   - Proper route tables and security groups

2. **Database Layer**
   - Aurora PostgreSQL Serverless v2 cluster
   - Minimum capacity: 0.5 ACUs
   - Maximum capacity: 4 ACUs
   - Multi-AZ deployment for high availability
   - Encrypted backups using customer-managed KMS keys

3. **Application Load Balancing**
   - Application Load Balancer in public subnets
   - HTTPS listener configuration using ACM certificate
   - Target groups for container tasks
   - Health check configuration

4. **Document Storage**
   - S3 bucket for loan document storage
   - Server-side encryption enabled
   - Versioning enabled for compliance
   - Lifecycle policies for cost optimization

5. **Auto-scaling Configuration**
   - EC2 auto-scaling based on ALB request count metric
   - Custom CloudWatch metrics for scaling decisions
   - Must NOT use default CPU/memory metrics

6. **Logging and Monitoring**
   - CloudWatch Log Groups for all services
   - Exactly 365-day retention period for compliance
   - Centralized logging for audit trail

7. **Security and IAM**
   - Least-privilege IAM roles for all services
   - Service-specific execution roles
   - No overly permissive policies

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network isolation
- Use **Aurora PostgreSQL Serverless v2** for database
- Use **Application Load Balancer** for traffic distribution
- Use **ACM** for SSL/TLS certificates
- Use **S3** with encryption for document storage
- Use **EC2** for compute resources
- Use **CloudWatch** for logging and monitoring
- Use **KMS** for encryption key management
- Use **IAM** for access control
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-2** region
- Template should use nested stack approach for modularity

### Constraints

- All compute resources MUST run in private subnets with no direct internet access
- Database backups MUST be encrypted using customer-managed KMS keys
- Application logs MUST be retained for exactly 365 days for compliance
- Auto-scaling MUST trigger based on custom CloudWatch metrics (ALB request count)
- Auto-scaling must NOT use default CPU/memory metrics
- All S3 buckets MUST have versioning enabled
- All S3 buckets MUST have lifecycle policies for cost optimization
- All resources must be destroyable (no Retain deletion policies)
- Encryption at rest required for all data stores
- Encryption in transit required for all communications
- Include proper error handling in CloudFormation template

## Deployment Requirements (CRITICAL)

1. **Resource Naming**
   - All resource names MUST include an environmentSuffix parameter
   - Format: ResourceType-EnvironmentSuffix
   - Example: LoanProcessingVPC-dev, DocumentBucket-prod
   - This ensures multiple deployments can coexist without conflicts

2. **Destroyability**
   - ALL resources MUST be fully destroyable
   - DO NOT use DeletionPolicy: Retain on any resource
   - S3 buckets should be deletable when stack is deleted
   - Database clusters should be deletable (no snapshot retention for testing)
   - This is critical for testing and cleanup

3. **CloudFormation Parameters**
   - Include environmentSuffix as a required parameter
   - Include ACM certificate ARN as a parameter
   - Include any other deployment-specific configuration as parameters

4. **Resource Dependencies**
   - Ensure proper DependsOn attributes where needed
   - VPC and subnets must be created before dependent resources
   - Security groups must exist before resources that use them
   - IAM roles must be created before services that assume them

## Success Criteria

- **Functionality**: Complete infrastructure deploys successfully via CloudFormation
- **Security**: All compute in private subnets, encryption at rest and in transit
- **Compliance**: 365-day log retention, encrypted backups, audit trail
- **Scalability**: Auto-scaling based on ALB request count custom metric
- **Cost Optimization**: Aurora Serverless v2, S3 lifecycle policies
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: Stack can be completely deleted without manual intervention
- **Code Quality**: Valid JSON, well-structured CloudFormation template

## What to deliver

- Complete CloudFormation JSON template
- VPC with public/private subnets across 3 AZs
- Aurora PostgreSQL Serverless v2 cluster with encryption
- Application Load Balancer with HTTPS
- S3 bucket with versioning and encryption
- EC2 auto-scaling configuration
- CloudWatch Log Groups with 365-day retention
- KMS keys for encryption
- IAM roles with least privilege
- All resources parameterized with environmentSuffix
- Documentation of parameters and outputs
