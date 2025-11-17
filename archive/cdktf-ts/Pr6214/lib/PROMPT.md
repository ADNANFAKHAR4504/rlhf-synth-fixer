# Payment Processing Infrastructure: Multi-Environment Deployment

Hey team,

We've been having some serious issues with environment inconsistencies in our payment processing platform. Our recent production deployment failures were traced back to configuration drift between dev, staging, and prod environments. The business has asked us to completely overhaul how we manage infrastructure to ensure identical configurations across all three environments.

I've been tasked with creating a comprehensive infrastructure solution using **cdktf with ts** that will handle VPC networking, RDS databases, S3 storage, and EC2 compute resources. The key challenge here is maintaining structural consistency while allowing environment-specific sizing and configuration.

The fintech compliance team has been clear that we need reproducible infrastructure patterns. Every environment should have the same network topology, security posture, and resource structure. The only differences should be in sizing and capacity parameters.

## What we need to build

Create a multi-environment payment processing infrastructure using **cdktf with ts** that deploys consistent resources across dev, staging, and production environments.

### Core Requirements

1. **VPC Network Architecture**
   - Create separate VPCs for each environment with identical topology
   - Dev environment: 10.0.0.0/16 CIDR block
   - Staging environment: 10.1.0.0/16 CIDR block
   - Production environment: 10.2.0.0/16 CIDR block
   - Each VPC needs 2 public subnet pairs and 2 private subnet pairs
   - Deploy across 2 availability zones in ap-southeast-2 region
   - NAT Gateways for private subnet outbound connectivity
   - VPC endpoints for S3 service access

2. **Database Infrastructure**
   - Deploy RDS PostgreSQL instances in each environment
   - Use db.t3.micro instance class for dev
   - Use db.t3.small instance class for staging
   - Use db.r5.large instance class for production
   - Configure RDS subnet groups consistently across environments
   - Implement parameter groups with consistent settings
   - Environment-specific backup retention policies
   - All database credentials managed through AWS Secrets Manager

3. **Object Storage**
   - Create S3 buckets with environment-specific naming
   - Enable versioning on all buckets
   - Configure lifecycle policies that vary by environment
   - Consistent bucket security and access controls
   - Encryption at rest for all stored objects

4. **Compute Resources**
   - Deploy EC2 instances running payment processing workloads
   - Environment-specific instance types based on load requirements
   - Consistent security group configurations with least-privilege access
   - Security groups must allow environment-specific adjustments
   - Proper IAM roles and instance profiles

5. **DNS and Routing**
   - Use data sources to reference existing Route53 hosted zones
   - Each environment has its own hosted zone
   - Configure DNS records pointing to environment resources

6. **Resource Organization**
   - Implement modular structure with reusable components
   - Create separate configuration files for each environment
   - Use workspace-aware resource definitions
   - Consistent tagging strategy across all resources

### Technical Requirements

- All infrastructure defined using **cdktf with ts**
- Deploy to **ap-southeast-2** region
- Use **VPC** for network isolation
- Use **RDS** for PostgreSQL database service
- Use **S3** for object storage
- Use **EC2** for compute instances
- Use **Route53** data sources for DNS
- Use **NAT Gateway** for private subnet internet access
- Use **VPC Endpoints** for S3 connectivity
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment}-{environmentSuffix}`
- All resources must support workspace-based deployment

### Constraints

- Use Terraform workspace pattern to manage three environments
- All environment-specific values in separate configuration files
- Create dev.tfvars, staging.tfvars, and prod.tfvars files
- Implement resource tagging with Environment, Application, and CostCenter tags
- All resources must be fully destroyable for CI/CD workflows
- No DeletionPolicy: Retain on any resources
- Security groups follow least-privilege principles
- Encryption at rest and in transit for all data
- Fetch secrets from existing AWS Secrets Manager entries
- Enable appropriate logging and monitoring
- Modular code structure for maintainability

### Success Criteria

- **Functionality**: Identical infrastructure topology across all three environments
- **Configuration**: Environment-specific sizing controlled through tfvars files
- **Networking**: Isolated VPCs with proper subnet segmentation and routing
- **Database**: RDS instances deployed with appropriate sizing and backup policies
- **Storage**: S3 buckets configured with versioning and lifecycle management
- **Security**: Least-privilege security groups and proper IAM configurations
- **Resource Naming**: All resources include environmentSuffix variable
- **Tagging**: Consistent tag application across all resources
- **Destroyability**: Complete infrastructure teardown capability
- **Code Quality**: TypeScript, well-tested, documented, modular structure

## What to deliver

- Complete cdktf TypeScript implementation in lib/tap-stack.ts
- CDKTF configuration in cdktf.json
- Entry point in bin/tap.ts if needed
- VPC module with subnet configuration
- RDS module with database setup
- S3 module with bucket policies
- EC2 module with security groups
- Tagging module for consistent resource tags
- Environment configuration files (dev.tfvars, staging.tfvars, prod.tfvars)
- Route53 data source configurations
- Unit tests with 100% coverage in test/tap-stack.unit.test.ts
- Integration tests in test/tap-stack.int.test.ts
- Documentation in lib/README.md with deployment instructions
- All code must use environmentSuffix variable pattern

The goal is to eliminate environment drift and ensure our payment processing infrastructure is reliable, consistent, and maintainable across all deployment stages.
