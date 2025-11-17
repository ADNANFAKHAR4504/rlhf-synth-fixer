Hey team,

We need to build infrastructure for our e-commerce platform that can be deployed consistently across multiple environments. The DevOps team has been asking for a way to maintain identical infrastructure patterns between dev, staging, and production while still allowing for environment-specific configurations like different instance sizes. Right now, we're managing separate configurations for each environment which leads to drift and inconsistencies.

The business wants a single Terraform configuration that handles all the complexity of multi-environment deployments. We need to ensure that when we make a change to the infrastructure pattern, it applies consistently across all environments without having to manually update multiple configuration files. This will significantly reduce deployment errors and make our infrastructure more maintainable.

For this synthetic infrastructure task, we'll implement a flexible, reusable infrastructure pattern using an environment suffix parameter. This approach will allow the same code to be deployed multiple times with different identifiers, which is perfect for testing and CI/CD workflows.

## What we need to build

Create a multi-environment infrastructure deployment system using **Terraform with HCL** that provisions a complete e-commerce application stack with consistent patterns across deployments.

### Core Requirements

1. **Network Infrastructure**
   - VPC with CIDR block 10.0.0.0/16
   - Public and private subnets across 2 availability zones
   - Internet Gateway for public subnet access
   - NAT Gateway for private subnet outbound connectivity
   - Proper route tables for public and private subnets

2. **Compute Layer**
   - Auto Scaling Group with configurable instance types
   - Launch template with user data for application setup
   - Support for different instance sizes based on environment (t3.micro for dev/staging, t3.large for prod)
   - Instances deployed in private subnets for security

3. **Load Balancing**
   - Application Load Balancer in public subnets
   - Target groups for routing traffic to EC2 instances
   - Health checks for application availability
   - HTTP/HTTPS listener configuration

4. **Database Layer**
   - RDS MySQL instance with configurable sizing
   - Different instance types per environment (db.t3.micro for dev/staging, db.t3.large for prod)
   - DB subnet group spanning multiple availability zones
   - Automated backups and maintenance windows

5. **Storage**
   - S3 buckets for static content with environment-prefixed names
   - Versioning enabled for content recovery
   - Appropriate bucket policies and access controls

6. **Security Configuration**
   - Security group for ALB allowing HTTP (80) and HTTPS (443) from internet
   - Security group for EC2 instances allowing traffic from ALB
   - Security group for RDS allowing MySQL (3306) from application tier only
   - KMS encryption for data at rest on RDS and S3
   - TLS/SSL for data in transit

7. **Infrastructure Management**
   - Single deployment using environment_suffix variable for resource naming
   - S3 backend for state management
   - DynamoDB table for state locking
   - Proper tagging strategy with Environment and ManagedBy keys

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Deploy to **us-east-1** region
- Use **VPC** for network isolation
- Use **EC2** with **Auto Scaling** for compute layer
- Use **Application Load Balancer** for traffic distribution
- Use **RDS MySQL** for relational database
- Use **S3** for static asset storage
- Use **KMS** for encryption at rest
- Use **CloudWatch** for logging and monitoring
- Use **DynamoDB** for Terraform state locking
- Resource names must include **environment_suffix** variable for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be fully destroyable (no prevent_destroy or retention policies)
- Include proper error handling and validation
- Implement least privilege IAM policies

### Constraints

- VPC must use 10.0.0.0/16 CIDR block consistently
- Each deployment spans 2 availability zones for high availability
- ALB must be in public subnets, instances in private subnets
- RDS must be in private subnets with multi-AZ support
- All data stores must use encryption at rest with KMS
- Security groups must follow principle of least privilege
- Resource names must be prefixed with environment identifier
- All resources must include Environment and ManagedBy tags
- Configuration must be modular and reusable
- Variables must be properly typed and documented
- Outputs must provide ALB DNS name and RDS endpoint
- Infrastructure must support complete teardown for testing

## Success Criteria

- Functionality: Complete infrastructure deploys successfully with all components properly connected
- Performance: Auto Scaling responds to load changes, ALB distributes traffic efficiently
- Reliability: Multi-AZ deployment ensures high availability, health checks detect failures
- Security: All data encrypted at rest and in transit, security groups properly configured, least privilege access
- Resource Naming: All resources include environment_suffix in their names for uniqueness
- Code Quality: Well-structured HCL, properly typed variables, comprehensive outputs, clear documentation
- Testability: Infrastructure can be deployed and destroyed cleanly for automated testing

## What to deliver

- Complete Terraform HCL implementation in lib/ directory
- lib/tap_stack.tf with main infrastructure resources
- lib/variables.tf with all variable definitions
- lib/outputs.tf with ALB DNS and RDS endpoint outputs
- Unit tests in test/terraform.unit.test.ts
- Integration tests in test/terraform.int.test.ts
- All resources properly tagged with Environment and ManagedBy
- VPC with public/private subnets across 2 AZs
- Application Load Balancer with target groups
- Auto Scaling Group with EC2 instances
- RDS MySQL with encryption and backups
- S3 buckets with versioning
- Security groups for ALB, EC2, and RDS tiers
- KMS keys for encryption
- CloudWatch log groups for monitoring
- Documentation of variable usage and deployment instructions
