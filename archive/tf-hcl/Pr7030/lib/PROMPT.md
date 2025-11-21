# Multi-Environment Payment Processing Infrastructure

Hey team,

We have a fintech startup that needs to maintain identical infrastructure across development, staging, and production environments for their payment processing platform. Right now they're managing environments inconsistently, which is causing deployment issues and making it hard to ensure parity between what they test and what they deploy to production. They need a solution that lets them define infrastructure once and deploy it consistently across all three environments with environment-specific configurations.

The challenge is that each environment has different requirements - development needs smaller instances and shorter log retention for cost savings, staging needs to mirror production for realistic testing, and production needs high availability, longer log retention, and additional routing capabilities for blue-green deployments. But the core infrastructure components should be identical in structure, just varying in scale and configuration.

They're using AWS and need to manage this through infrastructure as code to ensure consistency and enable rapid environment provisioning. The payment processing platform requires secure networking, managed databases, containerized services, and comprehensive monitoring across all environments.

## What we need to build

Create a multi-environment infrastructure using **Terraform with HCL** that deploys consistent infrastructure across development, staging, and production environments for a payment processing platform.

### Core Infrastructure Components

1. **Networking Infrastructure**
   - VPC module that provisions isolated networks with configurable CIDR ranges per environment
   - Each environment requires its own isolated VPC with appropriate CIDR blocks
   - Environment-specific subnet configurations

2. **Container Services**
   - Deploy ECS Fargate services with environment-specific task definitions
   - Configure auto-scaling policies that vary by environment
   - Ensure services can scale based on environment requirements

3. **Database Infrastructure**
   - Provision RDS Aurora PostgreSQL clusters with environment-appropriate instance sizes
   - Development can use smaller instances, production needs larger capacity
   - Enable encryption at rest for all environments

4. **Load Balancing**
   - Configure Application Load Balancers for each environment
   - Set up target groups pointing to ECS services
   - Ensure proper health checks

5. **Secrets Management**
   - Implement AWS Secrets Manager for database credentials
   - Automatic rotation should be disabled for non-production environments
   - Production should have rotation enabled

6. **Security Groups**
   - Create environment-specific security groups with appropriate ingress/egress rules
   - Implement least-privilege access patterns
   - Ensure proper isolation between environments

7. **Logging and Monitoring**
   - Set up CloudWatch Log Groups with environment-based retention periods
   - Development: 7 days retention
   - Staging: 30 days retention
   - Production: 90 days retention

8. **DNS and Traffic Management**
   - Configure Route53 weighted routing records for blue-green deployments
   - This is only required for production environment
   - Other environments use standard DNS routing

9. **IAM and Permissions**
   - Implement IAM roles with environment-scoped permissions
   - Use aws:RequestedRegion condition to scope access appropriately
   - Follow least-privilege principles

10. **Alerting**
    - Create SNS topics for environment-specific alerts
    - Configure email subscriptions per environment
    - Alert thresholds should vary by environment criticality

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation
- Use **ECS Fargate** for containerized workloads
- Use **RDS Aurora PostgreSQL** for database layer
- Use **Application Load Balancer** for traffic distribution
- Use **AWS Secrets Manager** for credential management
- Use **CloudWatch** for logging and monitoring
- Use **Route53** for DNS management
- Use **IAM** for access control
- Use **SNS** for alerting
- Resource names must include **environmentSuffix** variable for uniqueness across deployments
- Follow naming convention: {env}-{region}-{service}-{resource}
- Deploy to **us-east-1** region
- All resources must be tagged with Environment, Project, and ManagedBy tags

### Deployment Requirements (CRITICAL)

- Use Terraform workspaces to manage multiple environments from a single configuration
- Implement a modular structure with reusable modules for common components
- Environment-specific variables must be loaded from separate .tfvars files
- All resources must follow consistent naming convention: {env}-{region}-{service}-{resource}
- Database passwords must be generated dynamically and stored in AWS Secrets Manager
- Each environment must have its own state file stored in separate S3 buckets
- Implement remote state locking using DynamoDB with environment-specific tables
- Use data sources to reference existing shared resources (Route53 hosted zone, ACM certificates)
- Implement lifecycle rules to prevent accidental destruction of production resources
- All IAM roles must include condition keys restricting access to environment-specific resources
- All resources must be destroyable (no Retain policies or deletion protection)
- Include proper error handling and logging throughout

### Constraints

- Workspace-based environment management is mandatory
- Module structure must be reusable across environments
- Separate .tfvars files required for dev, staging, and production
- Naming must be consistent and include environment identifier
- Credentials must never be hardcoded
- State management must use S3 backend with DynamoDB locking
- State files must be isolated per environment
- Shared resources must be referenced via data sources, not recreated
- Production resources must have lifecycle prevent_destroy rules
- IAM policies must enforce environment boundaries

## Success Criteria

- **Functionality**: Infrastructure deploys successfully across all three environments from single Terraform configuration
- **Environment Isolation**: Each environment has isolated networking, state, and resources
- **Consistency**: Core infrastructure is identical in structure across environments with only configuration differences
- **Scalability**: Auto-scaling works appropriately for each environment
- **Security**: Credentials are managed securely, IAM follows least-privilege, encryption is enabled
- **Monitoring**: CloudWatch logs retain for appropriate periods per environment
- **Reliability**: Load balancers properly distribute traffic, health checks function correctly
- **Resource Naming**: All resources include environmentSuffix and follow naming convention
- **Tagging**: All resources have Environment, Project, and ManagedBy tags
- **Cost Optimization**: Development uses smaller resources than production
- **Code Quality**: Well-structured HCL modules, properly tested, documented
- **Destroyability**: All resources can be destroyed without manual intervention

## What to deliver

- Complete Terraform HCL implementation with modular structure
- VPC module for network isolation
- ECS Fargate configuration with auto-scaling
- RDS Aurora PostgreSQL cluster definitions
- Application Load Balancer setup
- AWS Secrets Manager integration
- Security group configurations
- CloudWatch Log Group definitions
- Route53 DNS configuration
- IAM roles and policies
- SNS topic setup
- Separate .tfvars files for dev, staging, production
- Backend configuration for state management
- Unit tests for all modules
- Documentation covering workspace usage and deployment process
- README with deployment instructions and architecture overview
- Output all critical values including ALB DNS names, RDS endpoints, and ECS cluster ARNs per environment