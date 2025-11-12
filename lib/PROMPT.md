# Multi-Environment Infrastructure Standardization

Hey team,

We've got a pretty common but critical problem on our hands. Our SaaS platform has three environments - dev, staging, and prod - and they've drifted significantly over time. Different configurations, inconsistent setups, you know the drill. Management has made it clear we need to standardize everything across environments while still allowing for practical differences like instance sizes and replica counts.

I've been asked to create this using **Pulumi with Python**. The goal is to establish a single source of truth that we can use across all three environments with minimal variation. This should prevent the drift we've been experiencing and make our deployments much more predictable.

The business is particularly concerned about consistency. They want to know that if something works in staging, it'll work exactly the same way in production because the architecture is identical. The only differences should be in sizing parameters that we explicitly control through configuration.

## What we need to build

Create a multi-environment infrastructure management system using **Pulumi with Python** that maintains identical architecture across dev, staging, and production environments while allowing controlled variations in resource sizing.

### Core Requirements

1. **Reusable Infrastructure Components**
   - Define reusable Pulumi component resources or classes for VPC, ALB, ASG, RDS, and S3
   - Components must be environment-agnostic and configurable through stack parameters
   - All components should follow consistent patterns and naming conventions

2. **Stack-Based Environment Management**
   - Configure three Pulumi stacks: dev, staging, and prod
   - Each stack represents a complete isolated environment
   - Use Pulumi stack configuration files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml) for environment-specific values
   - Stack configs should define instance sizes, replica counts, and min/max capacity

3. **Network Isolation**
   - Implement VPC isolation with environment-specific but identical CIDR schemes
   - dev: 10.0.0.0/16
   - staging: 10.1.0.0/16
   - prod: 10.2.0.0/16
   - Each VPC needs proper subnets, route tables, internet gateway, and NAT gateway

4. **Database Configuration**
   - Set up RDS MySQL instances for each environment
   - Store database passwords in AWS Secrets Manager (never hardcode)
   - Use environment-specific replica counts from stack configuration
   - Ensure databases are tagged and named consistently

5. **Application Load Balancing**
   - Deploy Application Load Balancers with health checks
   - Configure target groups for Auto Scaling Groups
   - Ensure ALBs are properly integrated with VPC subnets

6. **Auto Scaling Configuration**
   - Configure Auto Scaling Groups with EC2 instances
   - Set min/max capacity based on environment (from stack config)
   - Instance types vary by environment: t3.micro (dev), t3.small (staging), t3.medium (prod)

7. **Storage Configuration**
   - Create S3 buckets for static assets
   - Implement environment-specific naming conventions
   - Resource names must include **environmentSuffix** parameter for uniqueness
   - Follow naming pattern: `{resource-type}-{environment}-{suffix}`

8. **Tagging and Naming Standards**
   - Implement consistent tagging across all resources
   - Required tags: Environment=<env>, ManagedBy=Pulumi
   - Ensure all resources follow the same naming pattern with environmentSuffix

9. **Validation and Outputs**
   - Use Pulumi stack outputs to export critical resource information
   - Outputs should validate that critical resources exist in all environments
   - Export VPC IDs, ALB DNS names, RDS endpoints, S3 bucket names

10. **State Management**
    - Configure Pulumi backend for state management
    - Ensure proper stack isolation
    - State should be stored securely and accessibly by the team

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS VPC** for network isolation with consistent CIDR schemes
- Use **Application Load Balancer** for traffic distribution
- Use **Auto Scaling Groups** with **EC2 instances** for compute
- Use **RDS MySQL** for database layer
- Use **S3** for static asset storage
- Use **AWS Secrets Manager** for password management
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment}-{suffix}`
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation
- Code must be well-structured and reusable

### Constraints

- Each environment must have its own isolated VPC
- CIDR blocks must not overlap between environments
- RDS database passwords must never be hardcoded
- All environment-specific values must come from Pulumi stack configuration files
- Infrastructure must be identical across environments except for explicitly configured variations
- All resources must have consistent tagging
- All resources must be destroyable without manual intervention
- No hardcoded environment names in the main infrastructure code

## Success Criteria

- **Functionality**: Three complete environments (dev, staging, prod) with identical architecture
- **Consistency**: Same infrastructure components across all environments with only sizing differences
- **Configuration**: All environment-specific values in Pulumi stack config files
- **Security**: Database passwords in AWS Secrets Manager, no secrets in code
- **Isolation**: Each environment has its own VPC with non-overlapping CIDR blocks
- **Resource Naming**: All resources include environmentSuffix and follow consistent naming patterns
- **Tagging**: All resources properly tagged with Environment and ManagedBy tags
- **Validation**: Stack outputs confirm all critical resources are deployed
- **Code Quality**: Python code is clean, reusable, and well-documented
- **Destroyability**: All resources can be destroyed cleanly without errors

## What to deliver

- Complete Pulumi Python implementation with reusable component resources
- Three Pulumi stack configuration files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml)
- Main Pulumi program (__main__.py) that uses stack configurations
- Reusable component classes or modules for VPC, ALB, ASG, RDS, S3
- AWS VPC with subnets, route tables, internet gateway, NAT gateway
- Application Load Balancer with health checks and target groups
- Auto Scaling Groups with environment-specific sizing
- RDS MySQL instances with Secrets Manager integration
- S3 buckets with proper naming and tagging
- Comprehensive stack outputs for validation
- Python code following best practices
- Documentation for deploying each stack
