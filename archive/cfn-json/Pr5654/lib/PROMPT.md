# Multi-Environment Infrastructure Migration to AWS

Hey team,

We have been asked to help migrate a legacy monolithic application from on-premises infrastructure to AWS. The application currently runs on physical servers with local storage and needs to be containerized and deployed across three environments: dev, staging, and production. The migration needs to happen in phases to minimize downtime and business disruption.

The business has requested that we build this using CloudFormation with JSON format to maintain consistency with their existing infrastructure tooling. They have already set up multi-account AWS environments with VPCs in each account and want us to create the compute, database, and networking resources needed to run the containerized application.

We need to make this work across all three environments with the ability to configure environment-specific differences like instance sizes, database configurations, and scaling parameters. The production environment needs additional safeguards like Multi-AZ database deployments and stack termination protection, while dev and staging can use simpler configurations to save costs.

## What we need to build

Create a multi-environment infrastructure deployment system using **CloudFormation with JSON** that provisions containerized application infrastructure across AWS accounts. The solution must support three distinct environments (dev, staging, production) with environment-specific variations.

### Core Requirements

1. **Container Orchestration**
   - ECS cluster with Fargate launch type for running containerized workloads
   - ECS task definitions with proper CPU and memory allocations
   - ECS service with auto-scaling capabilities based on CPU utilization
   - Task execution role with permissions for ECR, CloudWatch, and Secrets Manager
   - Task role with minimal permissions for application workload

2. **Database Layer**
   - RDS PostgreSQL instance with parameterized engine version
   - Multi-AZ deployment for production environment only (use conditions)
   - Single-AZ for dev and staging to reduce costs
   - Parameter group with appropriate performance settings
   - Subnet group spanning private subnets across availability zones
   - Automated backups with environment-specific retention periods
   - Database credentials stored in AWS Secrets Manager

3. **Load Balancing and Networking**
   - Application Load Balancer in public subnets with internet-facing scheme
   - Target group for ECS tasks with health check configuration
   - Listener rules for HTTP/HTTPS traffic routing
   - Security group for ALB allowing inbound 80/443 from internet
   - Security group for ECS tasks allowing traffic only from ALB
   - Security group for RDS allowing traffic only from ECS tasks
   - All security groups must have explicit egress rules (no 0.0.0.0/0)

4. **Container Registry**
   - ECR repositories for application Docker images
   - Lifecycle policies to retain only last 10 images and remove untagged after 7 days
   - Repository policies for cross-account access if needed
   - Scan on push enabled for vulnerability detection

5. **Monitoring and Logging**
   - CloudWatch log groups for ECS container logs
   - CloudWatch log groups for application logs
   - Log retention policies (7 days for dev, 30 days for staging, 90 days for production)
   - Route53 health checks monitoring ALB endpoint availability
   - CloudWatch alarms for critical metrics (CPU, memory, database connections)

6. **DNS and Service Discovery**
   - Route53 DNS records pointing to ALB (use existing hosted zone via parameter)
   - Health checks for endpoint monitoring
   - Environment-specific subdomains (app-dev, app-staging, app-prod)

7. **Secrets Management**
   - AWS Secrets Manager secret for database master password
   - Secrets Manager secret for application API keys and tokens
   - Automatic secret rotation configuration (production only)
   - IAM permissions for ECS tasks to retrieve secrets

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **ECS Fargate** for serverless container orchestration
- Use **RDS PostgreSQL** with conditional Multi-AZ (production only)
- Use **Application Load Balancer** for traffic distribution
- Use **ECR** for container image storage with lifecycle policies
- Use **Secrets Manager** for credential storage
- Use **CloudWatch** for logging and monitoring
- Use **Route53** for DNS management
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- All resources must be destroyable (no Retain deletion policies)
- Reference existing VPCs via parameters (do not create new VPCs)

### Architecture Requirements

- Modular nested stack structure with separate templates for:
  - Main/root stack orchestrating nested stacks
  - Compute stack (ECS cluster, services, task definitions)
  - Database stack (RDS instance, subnet group, parameter group)
  - Networking stack (ALB, target groups, security groups)
  - Monitoring stack (CloudWatch, Route53 health checks)
- Parameter files for each environment (dev-params.json, staging-params.json, prod-params.json)
- Conditions for environment-specific resource variations
- Mappings for environment-specific configuration values
- Comprehensive tagging strategy (Environment, Project, CostCenter, ManagedBy)

### Environment-Specific Configurations

- Dev: t3.small ECS tasks, db.t3.micro single-AZ RDS, 7-day logs, no termination protection
- Staging: t3.medium ECS tasks, db.t3.small single-AZ RDS, 30-day logs, no termination protection
- Production: t3.large ECS tasks, db.r5.large Multi-AZ RDS, 90-day logs, termination protection enabled

### Constraints

- Use existing VPCs and subnets (passed as parameters, not created)
- All IAM roles must follow principle of least privilege
- Security groups must have explicit egress rules (no 0.0.0.0/0 blanket rules)
- Database credentials must never be hardcoded in templates
- All resources must include comprehensive tags
- Stack must support clean deletion without manual intervention
- No Lambda-backed custom resources (keep it simple and maintainable)
- Prefer Aurora Serverless v2 if cost optimization needed (alternative to standard RDS)

## Success Criteria

- **Functionality**: Infrastructure deploys successfully in all three environments with correct resource configurations
- **Performance**: Application responds within 200ms at 50th percentile, auto-scales based on load
- **Reliability**: Multi-AZ database in production provides 99.95% availability, automated backups working
- **Security**: All secrets in Secrets Manager, least-privilege IAM, security groups with explicit rules, no public database access
- **Cost Optimization**: Dev/staging use cost-effective instance types, log retention appropriate per environment
- **Resource Naming**: All resources include environmentSuffix for uniqueness and easy identification
- **Code Quality**: JSON templates are well-formatted, heavily commented, follow CloudFormation best practices
- **Maintainability**: Nested stack structure allows updating individual components without full stack replacement
- **Testing**: Comprehensive unit tests validate template syntax and resource properties with 90% coverage

## What to deliver

- Complete CloudFormation JSON implementation with nested stack architecture
- Main template orchestrating compute, database, networking, and monitoring stacks
- Nested templates for each infrastructure layer (compute, database, networking, monitoring)
- Parameter files: dev-params.json, staging-params.json, prod-params.json with environment-specific values
- IAM roles and policies for ECS task execution and application workload
- Security groups with explicit ingress and egress rules for ALB, ECS, and RDS
- ECR repositories with lifecycle policies
- RDS PostgreSQL with conditional Multi-AZ based on environment
- Secrets Manager secrets for database credentials and application secrets
- CloudWatch log groups with environment-specific retention
- Route53 health checks and DNS records
- Comprehensive outputs in each stack for cross-stack references and application team usage
- Unit tests validating template syntax, required parameters, outputs, and resource properties
- Integration tests using stack outputs to verify deployed resources
- Deployment documentation with instructions for each environment
