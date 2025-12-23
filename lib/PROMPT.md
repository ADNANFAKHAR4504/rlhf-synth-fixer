Hey team,

We've got a critical project for a financial services company that needs rock-solid infrastructure consistency across their payment processing environments. They're currently struggling with configuration drift between dev, staging, and production, which has led to some hairy incidents where something works in staging but breaks in prod. Not acceptable for payment processing.

The business requirement is clear: we need identical infrastructure topology across all three environments, but with sensible sizing differences. Dev doesn't need production-scale resources, but the architecture must be exactly the same. Think of it like having the same blueprint but scaling the dimensions based on the environment.

This is a payment processing system, so we're dealing with financial transactions, PCI compliance requirements, audit trails, and zero tolerance for downtime in production. The infrastructure needs to be enterprise-grade from day one.

## What we need to build

Create a multi-environment infrastructure deployment using **Terraform with HCL** that provisions identical architecture across dev, staging, and production environments with environment-specific resource sizing.

### Core Requirements

1. **Multi-Environment Strategy**
   - Deploy to three distinct environments: dev, staging, prod
   - Maintain strict architectural consistency across all environments
   - Use Terraform workspaces or tfvars files for environment differentiation
   - Same networking topology, same services, same security patterns
   - Only resource sizes and capacities should differ

2. **Networking Infrastructure**
   - VPC with proper CIDR allocation for each environment
   - Public and private subnets across multiple availability zones, at least 2 AZs
   - Internet Gateway for public subnet access
   - NAT Gateways for private subnet outbound connectivity with Multi-AZ for production
   - Route tables with proper associations
   - Network ACLs following least privilege principles

3. **Application Tier**
   - EC2 instances or ECS cluster for application hosting
   - Auto Scaling Group with environment-appropriate sizing
   - Launch templates with user data for bootstrapping
   - Application Load Balancer for traffic distribution
   - Target groups with health checks
   - Security groups with least privilege ingress/egress rules

4. **Database Layer**
   - RDS PostgreSQL or MySQL database instances
   - Encryption at rest using KMS
   - Automated backups with appropriate retention periods
   - Multi-AZ deployment for staging and production
   - Single-AZ for development to optimize costs
   - Database subnet group in private subnets
   - Database security group restricting access to application tier only

5. **Security and Compliance**
   - KMS keys for encryption at rest with separate keys per environment
   - CloudTrail enabled for audit logging of API calls
   - CloudWatch log groups for application and infrastructure logs
   - IAM roles and instance profiles following least privilege
   - Security groups implementing network segmentation
   - All data encrypted in transit using HTTPS and TLS

6. **Monitoring and Observability**
   - CloudWatch alarms for critical metrics
   - CloudWatch log groups for application logs
   - CloudWatch metrics for custom application metrics
   - SNS topics for alarm notifications

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation
- Use **RDS** for managed database with encryption
- Use **EC2** or **ECS** for compute layer
- Use **ALB** for load balancing
- Use **KMS** for encryption key management
- Use **CloudTrail** for audit logging
- Use **CloudWatch** for monitoring and logging
- Use **IAM** for access management
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: resource-type-environment-suffix pattern
- Deploy to **us-east-1** region
- All infrastructure must use AWS-managed encryption where available

### Environment-Specific Configurations

**Development Environment:**
- Smaller EC2 instance types like t3.small or t3.medium
- RDS instance: db.t3.small with single-AZ deployment
- Minimal auto-scaling capacity with min 1 and max 2 instances
- Single NAT Gateway to optimize costs
- Shorter backup retention of 7 days

**Staging Environment:**
- Medium EC2 instance types like t3.medium or t3.large
- RDS instance: db.t3.medium with Multi-AZ deployment
- Moderate auto-scaling capacity with min 2 and max 4 instances
- NAT Gateways in multiple AZs
- Standard backup retention of 14 days

**Production Environment:**
- Large EC2 instance types like t3.large or c5.xlarge
- RDS instance: db.r5.large or db.r5.xlarge with Multi-AZ deployment
- Full auto-scaling capacity with min 3 and max 10 instances
- NAT Gateways in multiple AZs for high availability
- Extended backup retention of 30 days
- Enhanced monitoring enabled

### Deployment Requirements (CRITICAL)

- All resources must be destroyable using appropriate lifecycle policies
- No hardcoded credentials or secrets in code
- Use Terraform variables for all configurable values
- Provide separate tfvars files for each environment: dev.tfvars, staging.tfvars, and prod.tfvars
- Use remote state backend configuration with S3 and DynamoDB for state locking
- Include proper resource dependencies using depends_on where necessary
- Tag all resources with Environment, Project, and ManagedBy tags

### Constraints

- Must comply with PCI DSS requirements for payment processing
- All data must be encrypted at rest and in transit
- Database must not be publicly accessible
- Application tier must be behind load balancer
- No public SSH access to instances, use Session Manager instead
- All resources must be within private subnets except load balancer
- Must support zero-downtime deployments
- Infrastructure must be reproducible and version controlled

## Success Criteria

- **Functionality**: Infrastructure deploys successfully in all three environments
- **Consistency**: All environments have identical architecture with only sizing differences
- **Security**: Encryption enabled, network segmentation implemented, audit logging active
- **Reliability**: Multi-AZ deployment in staging and prod, auto-scaling configured
- **Compliance**: CloudTrail enabled, encryption at rest, proper IAM roles
- **Resource Naming**: All resources include environment suffix for uniqueness
- **Cost Optimization**: Dev environment uses minimal resources, prod uses appropriate scaling
- **Code Quality**: Clean HCL code, well-structured modules, comprehensive variables

## What to deliver

- Complete **Terraform HCL** implementation with proper file structure
- main.tf with all infrastructure resources
- variables.tf with all input variables and descriptions
- outputs.tf with useful output values
- provider.tf with AWS provider configuration
- Environment-specific tfvars files: dev.tfvars, staging.tfvars, prod.tfvars
- backend.tf for remote state configuration, optional but recommended
- README.md with deployment instructions and architecture overview
- Comprehensive tests using Terratest or similar framework
- All code must be production-ready and deployable
