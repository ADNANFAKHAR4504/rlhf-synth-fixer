Hey team,

We need to refactor our payment processing infrastructure that has become a maintenance nightmare. The DevOps team at our financial services company discovered we have three separate CloudFormation templates with tons of duplicated code and hardcoded values everywhere. I've been asked to consolidate this into a single optimized template using CloudFormation YAML.

The business is struggling with template sprawl. Every time we need to deploy to a new environment or region, someone has to manually update dozens of hardcoded values. We keep running into deployment failures because of inconsistent configurations between dev and prod. Management wants this fixed properly using CloudFormation best practices.

Our payment processing stack includes EC2 instances in Auto Scaling Groups behind an Application Load Balancer, an RDS Aurora PostgreSQL cluster for transaction data, and S3 buckets for storing transaction logs. Right now we're running in us-east-1 and eu-west-1, but the way the templates are structured makes it really hard to maintain consistency across regions.

## What we need to build

Create a single optimized payment processing infrastructure template using **CloudFormation with YAML** that consolidates three existing templates into one maintainable, parameterized solution.

### Core Requirements

1. **Parameters for Environment Configuration**
   - Define parameters for EnvironmentType (dev/prod)
   - Define parameters for DBUsername and DBPassword
   - Define parameter for KeyPairName
   - All environment-specific values should be parameterized

2. **Regional and Environment Mappings**
   - Create mappings for RegionAMIs supporting us-east-1 and eu-west-1
   - Create mappings for EnvironmentConfig with instance types
   - Map minimum and maximum ASG sizes based on environment
   - Development uses t3.micro instances, production uses m5.large

3. **Environment-Based Conditionals**
   - Implement conditions to differentiate between development and production
   - Use conditions to toggle Multi-AZ configurations
   - Apply conditional resource configurations based on EnvironmentType

4. **Auto Scaling Group with Launch Template**
   - Deploy Auto Scaling Group using mapped AMI IDs from RegionAMIs
   - Use launch template with instance types from EnvironmentConfig mappings
   - Configure ASG with min/max sizes based on environment mappings
   - Ensure proper health checks and scaling policies

5. **Application Load Balancer**
   - Create Application Load Balancer in VPC with public subnets
   - Configure target group pointing to the Auto Scaling Group
   - Set up proper health check endpoints
   - Configure listener rules for traffic routing

6. **RDS Aurora PostgreSQL Cluster**
   - Deploy Aurora PostgreSQL cluster for transaction data
   - Implement conditional Multi-AZ deployment based on environment
   - Single AZ for development, Multi-AZ for production
   - Use parameter references for database credentials

7. **S3 Transaction Log Storage**
   - Configure S3 bucket for storing transaction logs
   - Implement lifecycle policies (30 days retention for dev, 90 days for prod)
   - Use conditional lifecycle rules based on EnvironmentType
   - Apply proper bucket policies and encryption

8. **Consistent Resource Tagging**
   - Apply tags to all resources using Fn::Sub for dynamic values
   - Include environment type, application name, and cost center tags
   - Use consistent tagging strategy across all resources
   - Enable cost tracking and resource management

9. **Stack Outputs**
   - Export ALB DNS name for application access
   - Export RDS endpoint for database connections
   - Export S3 bucket ARN for log management
   - Use outputs for cross-stack references

10. **Eliminate Hardcoded References**
    - Use Ref function for all resource references
    - Use Fn::GetAtt to retrieve resource attributes dynamically
    - No hardcoded resource names, ARNs, or IDs
    - All resource naming must use intrinsic functions

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **EC2** with Auto Scaling Groups and launch templates
- Use **Application Load Balancer** for traffic distribution
- Use **RDS Aurora PostgreSQL** for database tier
- Use **S3** for transaction log storage
- Use **VPC** with public and private subnets across 2 availability zones
- Resource names must include **EnvironmentType** parameter for uniqueness
- Follow naming convention: `PaymentProcessing-{ResourceType}-{EnvironmentType}`
- Deploy to **us-east-1** region with support for eu-west-1
- Use CloudFormation intrinsic functions (Ref, Fn::GetAtt, Fn::Sub)
- Implement mappings for region-specific and environment-specific values
- Use conditions for environment-based resource configuration

### Constraints

- Template must be under 51,200 bytes when deployed
- Use CloudFormation parameters for all environment-specific values
- No hardcoded strings anywhere in the template
- Implement DependsOn only where explicitly required to avoid delays
- Avoid circular dependencies between resources
- All resources must be destroyable (no Retain policies or DeletionProtection)
- Include proper error handling and rollback configuration
- Ensure consistent tagging strategy across all resources
- VPC and subnet IDs should be parameterized or mapped
- Database passwords should use NoEcho parameter property

## Success Criteria

- **Functionality**: Single template replaces three existing templates with same functionality
- **Maintainability**: Parameters and mappings eliminate hardcoded values
- **Flexibility**: Easy to deploy to new environments and regions
- **Reliability**: Proper health checks and Multi-AZ for production
- **Security**: No hardcoded credentials, proper IAM configurations
- **Resource Naming**: Consistent naming using EnvironmentType parameter
- **Best Practices**: Proper use of CloudFormation intrinsic functions
- **Code Quality**: Clean YAML, well-structured, properly commented

## What to deliver

- Complete CloudFormation YAML template implementing all requirements
- Parameters section with EnvironmentType, DBUsername, DBPassword, KeyPairName
- Mappings for RegionAMIs and EnvironmentConfig
- Conditions for environment-based resource configuration
- EC2 Auto Scaling Group with launch template
- Application Load Balancer with target group
- RDS Aurora PostgreSQL cluster with conditional Multi-AZ
- S3 bucket with conditional lifecycle policies
- Consistent tagging using Fn::Sub
- Outputs for ALB DNS, RDS endpoint, and S3 bucket ARN
- Documentation comments explaining key sections
