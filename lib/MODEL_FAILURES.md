# Common Model Failures

## Infrastructure Issues

### VPC and Networking
- **Using custom VPC instead of default VPC** - The prompt specifically asks to use the default VPC
- **Not referencing existing VPC with data sources** - Should use `data "aws_vpc" "default"` instead of creating new VPC
- **Missing availability zone configuration** - Must deploy across 2+ AZs for high availability
- **Incorrect subnet configuration** - Need both public and private subnets across multiple AZs

### Load Balancer Problems
- **Using Classic Load Balancer instead of ALB** - ALB is required for HTTP/HTTPS traffic
- **Missing target group configuration** - ALB needs target groups to route traffic
- **No health check configuration** - Health checks are essential for removing unhealthy instances
- **Incorrect listener configuration** - Need both HTTP (80) and HTTPS (443) listeners

### Auto Scaling Issues
- **No auto scaling group defined** - Must create ASG for application instances
- **Missing scaling policies** - Need CPU-based scaling policies
- **Incorrect launch template** - ASG needs proper launch template with user data
- **No minimum/maximum instance limits** - Must set reasonable scaling boundaries

### Database Configuration
- **Single-AZ RDS deployment** - Must enable multi-AZ for high availability
- **No backup configuration** - Must enable automatic backups with 7-day retention
- **Missing security group rules** - Database must be accessible from application instances
- **No parameter group configuration** - RDS needs proper parameter group settings

### Security Problems
- **Missing IAM roles** - EC2 instances need IAM roles for AWS service access
- **No security groups** - Must create security groups for ALB, EC2, and RDS
- **Incorrect security group rules** - Rules must allow proper communication between components
- **Missing resource tagging** - All resources must be tagged with "Environment: Production"

### Monitoring Issues
- **No CloudWatch configuration** - Must set up CloudWatch for monitoring
- **Missing CloudWatch alarms** - Need alarms for CPU, memory, and other metrics
- **No log group configuration** - Application logs need CloudWatch log groups

## Terraform Configuration Errors

### Provider Issues
- **Missing AWS provider configuration** - Must specify region and credentials
- **No required provider version** - Should specify provider version for consistency

### Variable Problems
- **No variable definitions** - Should define variables for reusability
- **Missing variable validation** - Variables should have proper validation rules
- **No default values** - Sensible defaults should be provided

### Output Issues
- **Missing important outputs** - Should output load balancer DNS, RDS endpoint, etc.
- **No output descriptions** - Outputs should be documented

### Resource Dependencies
- **Missing depends_on** - Resources with dependencies need proper ordering
- **Circular dependencies** - Avoid circular references between resources

## Common Syntax and Logic Errors

### Resource Naming
- **Inconsistent naming conventions** - Should follow AWS naming standards
- **Missing name tags** - Resources should have proper name tags

### Data Source Usage
- **Not using data sources for existing resources** - Default VPC should be referenced, not created
- **Incorrect data source filters** - Filters must be specific enough to find correct resources

### Tagging Issues
- **Missing required tags** - "Environment: Production" tag is mandatory
- **Inconsistent tagging strategy** - All resources should have consistent tags

## Validation Failures

### AWS Service Limits
- **Exceeding service limits** - Check for limits on VPCs, subnets, security groups
- **Invalid instance types** - Ensure instance types are available in target region
- **Unsupported configurations** - Some combinations may not be supported

### Network Configuration
- **Invalid CIDR blocks** - Subnet CIDRs must be valid and not overlap
- **Incorrect route table configuration** - Public subnets need internet gateway routes
- **Missing NAT gateway** - Private subnets need NAT gateway for outbound internet access

## Best Practice Violations

### Security
- **Overly permissive security group rules** - Should follow least privilege principle
- **Hardcoded credentials** - Never hardcode AWS credentials in Terraform
- **Missing encryption** - RDS should use encryption at rest

### Cost Optimization
- **No cost considerations** - Should use appropriate instance types and storage
- **Missing resource cleanup** - Ensure resources can be properly destroyed

### Maintainability
- **No comments or documentation** - Code should be self-documenting
- **Hardcoded values** - Use variables for configurable values
- **No error handling** - Consider what happens if resources fail to create