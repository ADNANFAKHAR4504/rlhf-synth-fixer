Hey team,

We need to build a comprehensive multi-environment infrastructure setup that our platform teams can use for deploying containerized applications across dev, staging, and production. The business wants a complete solution using **Terraform with HCL** that demonstrates proper workspace isolation and environment-specific configurations.

We've been running into issues where different teams are stepping on each other's resources, and we need a proper multi-environment framework that can scale. The goal is to create a reference architecture that shows how to properly separate environments using Terraform workspaces while maintaining consistency and following best practices.

The infrastructure needs to support containerized applications with background processing, use Aurora PostgreSQL for the database layer, and include proper monitoring and access controls. We also need this deployed across multiple regions - production in us-east-1, staging in us-west-2, and development in eu-west-1.

## What we need to build

Create a multi-environment infrastructure framework using **Terraform with HCL** that demonstrates workspace-based environment isolation with all necessary supporting services.

### Core Requirements

1. **Multi-Environment Framework**
   - Use Terraform workspaces for environment separation (dev, staging, prod)
   - Environment-specific tfvars files (dev.tfvars, staging.tfvars, prod.tfvars)
   - Cross-environment state data sources for output sharing
   - Validation rules using precondition blocks to enforce environment constraints

2. **Networking Infrastructure**
   - VPC with 3 availability zones for high availability
   - Public and private subnets in each AZ
   - NAT gateways for private subnet internet access
   - Internet gateway for public subnet access
   - Proper route tables and subnet associations

3. **Application Load Balancing**
   - Application Load Balancer for traffic distribution
   - Target groups for container services
   - Health checks and proper routing rules
   - Security groups for ALB traffic

4. **Container Platform**
   - ECS cluster with Fargate launch type
   - ECS service definitions for running containers
   - Task definitions with proper CPU and memory allocation
   - Auto-scaling policies based on CPU utilization

5. **Background Processing**
   - Lambda functions for asynchronous tasks
   - IAM roles with least privilege permissions
   - CloudWatch Logs integration for Lambda logging
   - Proper error handling and retry configuration

6. **Database Layer**
   - Aurora PostgreSQL cluster with Multi-AZ deployment
   - Database subnet groups across all private subnets
   - Parameter groups for database configuration
   - Automated backups and maintenance windows

7. **State Management**
   - S3 bucket for Terraform state backend
   - DynamoDB table for state locking
   - Backend configuration with proper encryption
   - State bucket versioning enabled

8. **Monitoring and Logging**
   - CloudWatch Log Groups for all services
   - CloudWatch Alarms for critical metrics
   - Metric filters and dashboards
   - SNS topics for alarm notifications

9. **Resource Tagging**
   - Mandatory tags: Environment, Project, ManagedBy, Team
   - Tag validation using precondition blocks
   - Consistent tagging across all resources

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation across 3 availability zones
- Use **Application Load Balancer** for traffic distribution
- Use **ECS with Fargate** for container orchestration
- Use **Lambda** for background processing
- Use **Aurora PostgreSQL** for database layer with Multi-AZ
- Use **S3** for Terraform state storage
- Use **DynamoDB** for state locking mechanism
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for access control and service permissions
- Resource names must include **environmentSuffix** variable for uniqueness
- Follow naming convention: `{resource-type}-${var.environment_suffix}`
- Deploy production to **us-east-1**, staging to **us-west-2**, development to **eu-west-1**
- Configure provider aliases for multi-region support

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies)
- Aurora cluster must have `skip_final_snapshot = true` for destroyability
- All named resources MUST include environmentSuffix for uniqueness
- Include proper error handling and logging for all services
- Use latest stable provider versions
- Include validation blocks to enforce configuration constraints

### Constraints

- Must use workspace-based environment separation (not separate state files)
- Backend configuration must be parameterized (no hardcoded bucket names)
- All secrets and sensitive data must use appropriate variable types
- Security groups must follow least privilege principles
- Database must have automated backups enabled
- All logs must have retention policies defined
- Cross-region provider configuration must support all three regions

## Success Criteria

- **Functionality**: Complete multi-environment framework with workspace isolation
- **Infrastructure**: All 9+ AWS services properly configured and integrated
- **Performance**: ECS auto-scaling and Aurora Multi-AZ for high availability
- **Security**: Proper IAM roles, security groups, and network isolation
- **Resource Naming**: All named resources include environmentSuffix variable
- **Destroyability**: All resources can be destroyed without manual intervention
- **Multi-Region**: Provider aliases configured for us-east-1, us-west-2, eu-west-1
- **Code Quality**: Clean HCL, modular structure, well-documented

## What to deliver

- Complete Terraform HCL implementation
- Backend configuration (backend.tf) with S3 and DynamoDB
- Provider configuration (provider.tf) with multi-region aliases
- Main infrastructure (main.tf) with all resources
- Variables (variables.tf) with all required inputs
- Environment-specific tfvars (dev.tfvars, staging.tfvars, prod.tfvars)
- Outputs (outputs.tf) for cross-stack references
- Documentation with deployment instructions
- Unit tests for infrastructure validation
