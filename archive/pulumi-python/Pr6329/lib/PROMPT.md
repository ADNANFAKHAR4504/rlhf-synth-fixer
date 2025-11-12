Hey team,

We're building infrastructure for a fintech startup's payment processing system. The business needs to deploy identical infrastructure across development, staging, and production environments with strict consistency. They want to ensure that the same configuration patterns work everywhere, while still allowing for environment-specific variations in capacity and sizing.

The challenge here is maintaining consistency without sacrificing flexibility. Each environment needs its own VPC, database cluster, serverless compute, and storage - but the topology and configuration patterns should be identical. We need to make sure that what works in development will work the same way in production, just scaled differently.

I've been asked to create this using Pulumi with Python. The business wants a reusable component architecture that can stamp out consistent environments with just configuration changes. They're particularly concerned about maintaining consistency in security configurations and network topology while allowing for different database sizes and compute capacities per environment.

## What we need to build

Create a multi-environment infrastructure deployment system using **Pulumi with Python** for a payment processing platform that ensures consistency across development, staging, and production environments.

### Core Requirements

1. **Reusable Component Architecture**
   - Define a ComponentResource class that encapsulates all infrastructure for a single environment
   - Enable deployment to any environment using stack configuration
   - Ensure the same component logic works across all environments

2. **Multi-Region VPC Infrastructure**
   - Development environment in eu-west-1 with 10.0.0.0/16 CIDR
   - Staging environment in us-west-2 with 10.1.0.0/16 CIDR
   - Production environment in us-east-1 with 10.2.0.0/16 CIDR
   - Each VPC must have 3 availability zones
   - Private and public subnets in each availability zone
   - NAT gateways for private subnet internet access

3. **Database Infrastructure**
   - Deploy RDS Aurora PostgreSQL 15.x clusters
   - Environment-specific instance types:
     - Development: db.t3.medium
     - Staging: db.r5.large
     - Production: db.r5.xlarge
   - Automated backups with environment-specific retention:
     - Development: 7 days
     - Staging: 14 days
     - Production: 30 days

4. **Serverless Compute**
   - Lambda functions for payment validation
   - Consistent 512MB memory allocation across all environments
   - Proper IAM roles and permissions

5. **Object Storage**
   - S3 buckets for transaction logs
   - Identical 90-day lifecycle policies across all environments
   - Separate bucket per environment with proper naming

6. **Secrets Management**
   - AWS Secrets Manager for database passwords
   - 30-day automatic rotation enabled
   - Secure integration with RDS clusters

7. **Network Security**
   - Security groups allowing HTTPS (443) within VPC
   - PostgreSQL (5432) traffic restricted to VPC only
   - Define once and reuse across all environments

8. **Resource Tagging**
   - Environment tag (dev/staging/prod)
   - ManagedBy: Pulumi
   - Project: PaymentSystem
   - Resource names must include environmentSuffix for uniqueness

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **Amazon VPC** for network isolation
- Use **Amazon RDS Aurora PostgreSQL** for database clusters
- Use **AWS Lambda** for serverless compute
- Use **Amazon S3** for object storage
- Use **AWS Secrets Manager** for credential management
- Use **Amazon EC2** for NAT Gateways
- Use **AWS IAM** for access management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Primary deployment region: **us-east-1** (with multi-region support)
- Pulumi 3.x compatibility
- Python 3.9+ compatibility

### Constraints

- All environments must use their designated CIDR blocks (10.0.0.0/16 for dev, 10.1.0.0/16 for staging, 10.2.0.0/16 for prod)
- RDS instances must have automated backups with environment-specific retention periods (7/14/30 days)
- Use Pulumi's stack configuration system for environment-specific values
- All Lambda functions must have identical 512MB memory allocations
- Security groups must be defined once and reused across all environments
- Each environment must have its own S3 bucket with identical lifecycle policies
- Use Pulumi ComponentResource pattern to create reusable environment modules
- All resources must be tagged with Environment and ManagedBy tags
- Database passwords must be stored in AWS Secrets Manager with automatic rotation enabled
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and logging

### Configuration Management

- Use Pulumi stack configuration files for environment-specific values
- Stack names should correspond to environments (dev, staging, prod)
- Configuration should include: region, CIDR block, instance types, backup retention
- Enable deployment with simple pulumi up -s environment commands

## Success Criteria

- Functionality: All AWS services properly configured and integrated
- Consistency: Identical topology across all three environments
- Flexibility: Environment-specific sizing through configuration
- Security: Secrets properly managed, network security enforced
- Reusability: ComponentResource pattern enables easy environment replication
- Resource Naming: All resources include environmentSuffix for uniqueness
- Code Quality: Clean Python code, well-structured, properly documented
- Deployability: Can deploy to any environment using stack selection

## What to deliver

- Complete Pulumi Python implementation
- ComponentResource class for environment encapsulation
- Stack configuration files for dev, staging, and prod
- VPC with multi-AZ subnets and NAT gateways
- RDS Aurora PostgreSQL clusters with environment-specific sizing
- Lambda functions with consistent configuration
- S3 buckets with lifecycle policies
- Secrets Manager integration with automatic rotation
- Security groups with proper ingress/egress rules
- IAM roles and policies
- Resource tagging implementation
- Outputs for RDS endpoints, S3 bucket names, and Lambda ARNs
- Unit tests for all components
- Documentation and deployment instructions
