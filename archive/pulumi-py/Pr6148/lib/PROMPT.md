Hey team,

We need to build a multi-environment infrastructure management solution that can consistently deploy our three-tier web application across development, staging, and production AWS environments. The business is frustrated with the drift between environments and wants a single source of truth that maintains identical architecture while allowing for environment-specific configurations like replica counts and instance sizes.

Right now we're managing separate configurations for each environment, which is causing inconsistencies. A change made in dev doesn't always make it to staging correctly, and production configurations diverge over time. We need to fix this with a proper infrastructure-as-code approach that enforces consistency while being flexible enough to handle different scaling requirements.

The infrastructure team has asked us to implement this using **Pulumi with Python** since we want to leverage Python's ecosystem and Pulumi's stack-based configuration management to handle the three separate environments from a single codebase.

## What we need to build

Create a multi-environment AWS infrastructure deployment using **Pulumi with Python** that maintains consistency across development, staging, and production environments while allowing environment-specific variations.

### Core Requirements

1. **Reusable Component Architecture**
   - Define modular ComponentResource classes that accept environment-specific parameters
   - All components must be reusable across all three environments
   - No code duplication between environments

2. **Stack-Based Configuration**
   - Configure three separate Pulumi stacks: dev, staging, prod
   - Use Pulumi stack configuration files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml)
   - Load environment-specific values using pulumi.Config()

3. **Network Infrastructure**
   - Create VPCs with identical architecture but environment-specific tags
   - Deploy public and private subnets across 2 availability zones
   - Implement NAT gateways for private subnet outbound traffic
   - Resource names must include environmentSuffix parameter

4. **Compute Tier with Auto Scaling**
   - Deploy Auto Scaling Groups with environment-specific capacity:
     - Development: min=1, max=2
     - Staging: min=2, max=4
     - Production: min=3, max=10
   - Use EC2 instances with appropriate security groups

5. **Load Balancer Configuration**
   - Deploy Application Load Balancers for each environment
   - Production ALB must have WAF enabled
   - Dev and staging ALBs do not require WAF
   - Implement proper health checks and target groups

6. **Database Layer**
   - Deploy RDS Aurora PostgreSQL with environment-specific read replica counts:
     - Development: 1 read replica
     - Staging: 1 read replica
     - Production: 3 read replicas
   - Enable encryption at rest for all environments
   - Environment-specific backup retention policies:
     - Development: 1 day retention
     - Staging: 7 days retention
     - Production: 30 days retention

7. **Storage Configuration**
   - Create S3 buckets following naming pattern: company-{env}-{purpose}-{random}
   - Enable encryption at rest for all buckets
   - Separate buckets for static assets and application logs

8. **Security and Secrets Management**
   - Implement proper security groups for ALB, compute, and database tiers
   - Use AWS Secrets Manager or Parameter Store for sensitive configuration
   - Apply least privilege IAM policies

9. **Monitoring and Observability**
   - Configure CloudWatch alarms for critical metrics
   - Enable appropriate logging for all components

10. **Tagging Strategy**
    - All resources must be tagged with:
      - Environment tag (dev/staging/prod)
      - ManagedBy tag (Pulumi)
      - CostCenter tag (environment-specific values)

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** for network isolation with public/private subnets across 2 AZs
- Use **Application Load Balancer** for traffic distribution
- Use **WAF** for production ALB only (conditional deployment)
- Use **Auto Scaling Groups** with environment-specific min/max sizes
- Use **EC2** instances for compute tier
- Use **RDS Aurora PostgreSQL** with environment-specific read replicas
- Use **S3** buckets with consistent naming pattern
- Use **NAT Gateway** for private subnet internet access
- Use **Security Groups** for network access control
- Use **CloudWatch** for monitoring and alarms
- Use **Secrets Manager** or **Parameter Store** for sensitive data
- Optional: **VPC Peering** between environments for secure communication
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: {resource-type}-environment-suffix
- Deploy to us-east-1 region
- All resources must be destroyable (no Retain policies or deletion protection)

### Constraints

- Must use Pulumi stacks to manage all three environments from single codebase
- All environments must use the same ComponentResource structure
- Environment-specific variables must be loaded from Pulumi stack config
- Production must have at least 3 RDS read replicas while dev/staging have 1
- Auto-scaling group min/max sizes must differ per environment as specified
- All S3 buckets must follow naming convention: company-{env}-{purpose}-{random}
- Production ALB must have WAF enabled while dev/staging do not
- Each environment must have its own Pulumi stack with separate state
- Tags must include Environment, ManagedBy, and CostCenter with environment-specific values
- Database backup retention must be 1 day for dev, 7 for staging, and 30 for production
- All resources must be tagged appropriately for cost allocation
- Include proper error handling and logging

## Success Criteria

- Functionality: Infrastructure deploys successfully across all three environments with identical architecture
- Configuration: Environment-specific parameters (replica counts, scaling limits, backup retention) correctly applied per environment
- Consistency: No code duplication, all environments use same ComponentResource classes
- Security: Proper encryption, security groups, IAM policies, and secrets management implemented
- Resource Naming: All resources include environmentSuffix parameter
- Monitoring: CloudWatch alarms and logging configured for critical components
- Code Quality: Python code is well-structured, modular, tested, and documented
- Destroyability: All resources can be destroyed without retention policies

## What to deliver

- Complete Pulumi Python implementation with __main__.py as entry point
- ComponentResource classes in lib/ directory for VPC, ALB, ASG, RDS components
- Stack configuration files: Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml
- Proper use of Pulumi stack outputs for cross-stack references if needed
- Unit tests validating component resource creation and configuration
- Integration tests verifying actual AWS resource deployment
- Documentation including deployment instructions and stack configuration guide
