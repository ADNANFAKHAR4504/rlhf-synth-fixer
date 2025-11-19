Hey team,

We need to build a trading platform infrastructure in the US East region (us-east-1). The business needs a robust infrastructure with RDS Aurora MySQL clusters, Lambda functions for trade processing, and API Gateway endpoints. I've been asked to create this using Python with CDKTF to give us the flexibility of CDK while keeping Terraform's capabilities.

The main challenge here is ensuring we can deploy or destroy everything cleanly while maintaining proper configuration. The infrastructure needs to support workspace-based deployments so we can maintain dev, staging, and prod environments.

All data needs encryption at rest using KMS keys, and we have compliance requirements around data retention - 90 days for S3 artifacts and 30 days for CloudWatch logs.

## What we need to build

Create a trading platform infrastructure using **CDKTF with Python** in the **us-east-1** region while supporting environment-specific deployments.

### Core Requirements

1. **Single-Region Architecture**
   - Deploy infrastructure to us-east-1 region
   - Create modular structure that accepts region-specific variables
   - Use locals blocks to define region-specific settings like availability zones and CIDR ranges
   - Support workspace-based configuration with dev, staging, and prod environments

2. **Database Infrastructure**
   - Create RDS Aurora MySQL cluster in us-east-1
   - Configure 2 read replicas per cluster using db.r5.large instances
   - Set up VPC access for Lambda functions to communicate with RDS cluster
   - Ensure all database resources can be destroyed and recreated without data loss

3. **Compute and API Layer**
   - Deploy Lambda functions from a shared ZIP file with 512MB memory and 30-second timeout
   - Configure Lambda functions with VPC access to communicate with RDS cluster
   - Set up API Gateway REST API with Lambda proxy integration
   - Configure custom domains for API Gateway endpoints

4. **Storage and Encryption**
   - Create S3 bucket with lifecycle policies to delete objects older than 90 days
   - Set up KMS key with alias name following pattern alias/trading-us-east-1
   - Apply KMS encryption for all data at rest

5. **Logging and DNS**
   - Set up CloudWatch Log Groups with 30-day retention policies
   - Configure Route 53 for DNS management of API endpoints
   - Output the API Gateway invoke URL and RDS cluster endpoints

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **RDS Aurora MySQL** for database cluster with read replicas
- Use **Lambda** for trade processing functions
- Use **API Gateway** for REST API endpoints
- Use **S3** for artifact storage with lifecycle policies
- Use **KMS** for encryption key management
- Use **VPC** with private subnets for RDS and Lambda, public subnets for NAT gateways
- Use **CloudWatch Logs** for centralized logging
- Use **Route 53** for DNS management
- Resource names must include **environmentSuffix** parameter for uniqueness across workspaces
- Follow naming convention: {resource-type}-{environment-suffix}
- Deploy to **us-east-1** region only
- Requires Terraform 1.5+ with AWS provider 5.x or 6.x

### Deployment Requirements (CRITICAL)

- All resources MUST be destroyable without data loss
- Use RemovalPolicy.DESTROY equivalent (no RETAIN or DeletionProtection)
- Configure RDS Aurora with skip_final_snapshot=True for dev/staging
- S3 buckets must use force_destroy=True
- CloudWatch Log Groups must be deletable
- All KMS keys must allow deletion
- Resources MUST include environmentSuffix parameter in names for workspace isolation

### Constraints

- Security: KMS encryption required for all data at rest
- Compliance: 90-day data retention for S3, 30-day for CloudWatch Logs
- Performance: db.r5.large instances for RDS Aurora clusters
- Lambda: 512MB memory, 30-second timeout
- All resources must be destroyable and recreatable without data loss
- Include proper error handling and logging in Lambda functions
- VPC networking must support private subnet access for RDS and Lambda

## Success Criteria

- Functionality: Infrastructure deploys successfully to us-east-1 region
- Workspaces: Support for dev, staging, and prod environments
- Resource Naming: All resources include environmentSuffix for workspace isolation
- Destroyability: All resources can be cleanly destroyed and recreated
- Outputs: API Gateway URL and RDS endpoints clearly exposed
- Security: KMS encryption applied to all data at rest
- Compliance: Lifecycle and retention policies properly configured
- Code Quality: Python, well-structured, modular, documented

## What to deliver

- Complete CDKTF Python implementation with modular structure
- RDS Aurora MySQL cluster with read replicas in us-east-1
- Lambda functions with VPC access and API Gateway integration
- S3 bucket with lifecycle policies
- KMS key with region-specific alias
- CloudWatch Log Groups with retention policies
- Route 53 DNS configuration
- Workspace-based deployment support for dev/staging/prod
- Proper outputs for API URL and database endpoints
- Documentation on deployment and usage
