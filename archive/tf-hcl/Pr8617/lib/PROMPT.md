Hey team,

We've got a critical infrastructure problem to solve. Our SaaS platform has been experiencing deployment inconsistencies across environments, and just last week we had a production incident because something worked perfectly in staging but completely failed in production. The root cause was configuration drift between environments, and we need to fix this now.

The business is asking us to implement a solution that ensures consistent infrastructure across all three of our environments - development, staging, and production. We need to deploy identical infrastructure patterns with controlled variations for things like instance sizes and retention periods. The leadership wants this done right, with proper modules and environment separation.

I've been asked to create this using Terraform with HCL. We need a solid foundation that can scale as we grow and prevent these environment drift issues from happening again.

## What we need to build

Create a multi-environment infrastructure management system using **Terraform with HCL** for our SaaS platform spanning development, staging, and production environments in the us-east-1 region.

### Core Requirements

1. **Module Architecture**
   - Define a reusable module structure that accepts environment-specific parameters
   - All environment-specific values must be defined in separate tfvars files
   - Use Terraform workspaces to manage environment separation

2. **Network Infrastructure**
   - Implement VPC creation with environment-specific CIDR blocks following the 10.X.0.0/16 pattern
   - Each environment must have its own VPC with identical CIDR block patterns (10.1.0.0/16 for dev, 10.2.0.0/16 for staging, 10.3.0.0/16 for production)
   - Include public and private subnets across 2 availability zones
   - NAT gateways for outbound connectivity from private subnets

3. **Application Infrastructure**
   - Deploy an ECS Fargate service with environment-appropriate task definitions and resource allocations
   - Configure ALB with proper target groups and health check settings for each environment
   - Application runs as containerized web application

4. **Data Layer**
   - Provision RDS PostgreSQL instances with environment-specific instance classes and backup retention periods
   - RDS instances must use different instance classes per environment (t3.micro for dev, t3.small for staging, t3.medium for production)
   - Databases must be deployed in private subnets

5. **Storage and Encryption**
   - Create S3 buckets with consistent naming conventions and environment-specific KMS encryption keys
   - S3 buckets must use versioning and encryption with environment-specific KMS keys
   - Implement encryption at rest for all data stores using AWS KMS
   - Enable encryption in transit using TLS/SSL

6. **Monitoring and Logging**
   - Set up CloudWatch log groups with environment-specific retention periods (7 days for dev, 30 for staging, 90 for production)
   - Enable logging and monitoring using CloudWatch

7. **DNS and Routing**
   - Use data sources to reference existing Route53 hosted zones for each environment

8. **Security Controls**
   - Configure security groups that allow only necessary traffic between components
   - Follow the principle of least privilege for IAM roles and policies

9. **Resource Organization**
   - Implement proper tagging strategy with Environment, Project, and ManagedBy tags
   - Resource naming must include the environment prefix (dev-, stg-, prod-)
   - Ensure all resources use the environment_suffix variable for naming to support parallel deployments

10. **Three Environment Deployment**
    - Three separate tfvars files (dev.tfvars, staging.tfvars, prod.tfvars)
    - Each environment contains complete infrastructure stack

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation
- Use **ECS Fargate** for containerized application hosting
- Use **RDS PostgreSQL** for relational database
- Use **S3** with versioning for static asset storage
- Use **KMS** for encryption key management
- Use **ALB** (Application Load Balancer) for traffic distribution
- Use **CloudWatch** for logs and monitoring
- Use **Route53** data sources for DNS (reference existing zones, do not create)
- Use **IAM** for roles and policies
- Resource names must include **environment_suffix** for uniqueness
- Follow naming convention: environment-prefix-resource-type-environment-suffix
- Deploy to **us-east-1** region
- Terraform version 1.5 or higher
- Remote state stored in S3

### Constraints

- Infrastructure should be fully destroyable for CI/CD workflows
- Avoid DeletionPolicy: Retain unless required
- Secrets should be fetched from existing Secrets Manager entries, not created
- All resources must support parallel deployments via environment_suffix
- Three separate AWS accounts with cross-account IAM roles for deployment
- Cost optimization: prefer serverless options where possible

## Success Criteria

- **Functionality**: Deploy complete infrastructure across all three environments using workspace or tfvars approach
- **Consistency**: Identical infrastructure patterns with only controlled variations (CIDR blocks, instance sizes, retention periods)
- **Modularity**: Reusable module structure that accepts environment parameters
- **Security**: Encryption at rest and in transit, least privilege IAM, proper security groups
- **Resource Naming**: All resources include environment prefix and environmentSuffix
- **Destroyability**: Full stack can be created and destroyed without manual intervention
- **Code Quality**: Clean HCL code, well-documented, follows Terraform best practices
- **Testing**: Unit tests with good coverage, integration tests validating end-to-end workflows
- **Configuration Management**: Separate tfvars files for each environment

## What to deliver

- Complete Terraform HCL implementation with modular structure
- VPC with public/private subnets across 2 AZs for each environment
- ECS Fargate service with ALB
- RDS PostgreSQL with environment-appropriate instance classes
- S3 buckets with versioning and KMS encryption
- CloudWatch log groups with proper retention
- Security groups and IAM roles following least privilege
- Three tfvars files: dev.tfvars, staging.tfvars, prod.tfvars
- Unit tests for all components
- Integration tests using cfn-outputs/flat-outputs.json
- Documentation and deployment instructions