# AWS Environment Migration Infrastructure

Hey team,

We've been tasked with migrating a financial services company's development environment from their legacy AWS account to a new account with improved security and network isolation. The existing setup is pretty straightforward - they have a single RDS MySQL database, two EC2 application servers, and an S3 bucket for static assets. The business requirement is clear: we need to minimize downtime and preserve all data integrity during the migration.

The challenge here isn't just lifting and shifting resources. We need to rebuild the infrastructure in the target account with enhanced security configurations while ensuring a smooth transition path for their existing data. Think database snapshot imports, cross-account S3 replication, and proper network segmentation.

I've been asked to create this infrastructure using **Pulumi with TypeScript** for the target account setup.

## What we need to build

Create an AWS migration infrastructure using **Pulumi with TypeScript** that provisions a secure, isolated environment in the target account and orchestrates data migration from the source account.

### Core Requirements

1. **Network Infrastructure**
   - VPC with CIDR 10.0.0.0/16 in us-east-1
   - Private subnets across 2 availability zones for database and application tiers
   - Public subnets across 2 availability zones for NAT gateways
   - Internet Gateway for public subnet connectivity
   - NAT Gateway for private subnet internet access
   - Route tables configured appropriately for public and private subnets

2. **Database Layer**
   - RDS MySQL 8.0 instance deployed in private subnets
   - Multi-subnet group spanning both availability zones
   - Automated backups enabled with 7-day retention period
   - Encrypted storage using AWS managed keys
   - Import capability from existing database snapshot in source account S3 bucket
   - Restore database from snapshot to new RDS instance

3. **Application Layer**
   - Two EC2 instances (t3.medium) running Amazon Linux 2 AMI
   - Deployed in private subnets across different availability zones
   - No public IP addresses assigned to instances
   - IAM instance profile attached with minimal S3 permissions

4. **Security Configuration**
   - Security group for RDS allowing MySQL traffic (port 3306) only from EC2 security group
   - Security group for EC2 instances with appropriate ingress/egress rules
   - Security group for VPC endpoints
   - All inter-resource communications contained within VPC

5. **Storage and Data Migration**
   - S3 bucket in target account with versioning enabled
   - Server-side encryption enabled with AES256
   - Cross-account replication configured from source account bucket
   - Replication role with appropriate cross-account trust policy

6. **VPC Endpoints**
   - S3 VPC endpoint (Gateway type) to avoid internet gateway traffic
   - Associate endpoint with private subnet route tables
   - Endpoint policy allowing required S3 actions

7. **IAM Configuration**
   - EC2 instance role with least privilege permissions for S3 access
   - Instance profile for EC2 associations
   - S3 replication role with cross-account assume role policy
   - Appropriate trust relationships for cross-account access

8. **Resource Management**
   - All resources tagged with Environment=dev
   - All resources tagged with MigrationDate with current date
   - Resource naming must include **environmentSuffix** variable for uniqueness
   - Follow naming pattern: resource-type-environment-suffix

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- AWS provider version 5.x or higher
- Deploy to **us-east-1** region
- Use Pulumi config for environment-specific values
- Resource names must include **environmentSuffix** parameter
- All resources must be fully destroyable (no retain deletion protection)
- Database must use encrypted storage
- EC2 instances must not have public IPs
- S3 bucket must have encryption at rest
- Proper error handling and validation in code

### Key Constraints

- Database migration must use snapshot method, not direct database connection
- All inter-resource communications must stay within VPC boundaries
- EC2 instances in private subnets only, no direct internet access
- S3 bucket requires encryption with AES256 minimum
- RDS must use encrypted storage with AWS managed keys
- No hardcoded values - use configuration and parameters
- Cross-account IAM roles required for snapshot access and replication
- Database snapshot must be accessible from source account S3 bucket

## Success Criteria

- **Functionality**: Complete VPC setup with proper network segmentation, working RDS instance imported from snapshot, EC2 instances with S3 access via instance profiles, S3 replication working from source to target
- **Performance**: Resources provisioned in under 15 minutes, database restore completes successfully, cross-account replication active
- **Security**: All traffic contained within VPC or through VPC endpoints, encryption at rest for RDS and S3, IAM least privilege for all roles, security groups following principle of least access
- **Reliability**: Multi-AZ subnet groups for RDS, instances in different AZs, automated backups configured, versioning enabled on S3
- **Resource Naming**: All resources include environmentSuffix in names for parallel deployment support
- **Code Quality**: Well-structured TypeScript code, proper Pulumi resource definitions, no hardcoded values, comprehensive exports for outputs

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- VPC with public and private subnets across 2 AZs
- RDS MySQL 8.0 instance with snapshot import configuration
- Two EC2 t3.medium instances with Amazon Linux 2
- Security groups for RDS and EC2 with proper ingress/egress rules
- S3 bucket with versioning, encryption, and cross-account replication setup
- VPC endpoint for S3 (Gateway type)
- IAM roles for EC2 instances and S3 replication
- Proper resource tagging (Environment, MigrationDate)
- Stack outputs: RDS endpoint, EC2 private IPs, S3 bucket name
- Unit tests for all infrastructure components
- Integration tests using real deployment outputs
- Deployment instructions and documentation