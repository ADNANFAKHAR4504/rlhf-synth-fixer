## Context
Need a production-ready CloudFormation template for secure web application infrastructure. Looking for something that follows AWS security best practices and can handle real production traffic.

## Requirements

Build a CloudFormation template for secure web app infrastructure with these components:

### 1. Network Infrastructure
- Amazon VPC with DNS support and hostnames enabled
- Public subnets across at least 2 Availability Zones
- Private subnets for better security isolation
- Internet Gateway with proper routing configured
- Route tables with subnet associations
- NAT Gateways for outbound traffic from private subnets

### 2. Compute Infrastructure
- EC2 instances as web servers
- Must use Auto Scaling Groups - no standalone instances
- Minimum 2 instances across different AZs for high availability
- Use latest Amazon Linux 2 AMI via SSM Parameter resolution
- IAM roles and instance profiles properly configured
- User data scripts to configure the web server on boot

### 3. Load Balancing
- Application Load Balancer in public subnets
- Target groups with health checks
- HTTP listeners for traffic distribution
- Cross-zone load balancing enabled

### 4. Security Configuration
Security groups need to follow least privilege:
- ALB security group allows inbound HTTP on port 80 and HTTPS on port 443 from anywhere
- EC2 security group only allows traffic from the ALB security group - no direct internet access
- Separate security groups for different tiers
- No SSH access unless there's a specific reason

### 5. Scalability and Availability
- Auto Scaling Group with scaling policies
- CloudWatch alarms that trigger scaling
- Multi-AZ deployment
- Health checks at both ALB and ASG levels

## Technical Requirements

### Must Have:
1. AMI Selection: Use `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` pointing to `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`
2. Validation: Template must pass cfn-lint with zero errors
3. Security: Follow AWS Well-Architected Framework security principles
4. Availability: Deploy across minimum 2 Availability Zones
5. Scalability: Auto Scaling Group with min 2, max 6 instances

### Best Practices:
- Use parameters for anything that might need to change per environment
- Add conditions for optional features
- Export important resource ARNs and IDs in Outputs
- Tag everything consistently
- Use `!Sub` for dynamic resource names
- Add explicit `DependsOn` where CloudFormation can't figure out dependencies

## Security Standards

### Network Security:
- VPC with 10.0.0.0/16 CIDR
- Public subnets: 10.0.1.0/24 and 10.0.4.0/24
- Private subnets: 10.0.2.0/24 and 10.0.3.0/24
- Internet Gateway with restricted routing

### Access Control:
- Security groups with only required permissions
- Don't use default VPC
- No hardcoded credentials anywhere
- EC2 instances use IAM roles, not IAM users

### Encryption:
- EBS volumes should be encrypted
- HTTPS configuration ready - certs can be added later

## Expected Template Structure
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure web application infrastructure with ALB and Auto Scaling'
Parameters:
    # Environment type, instance type, key pair name
Conditions:
    # Optional feature toggles
Resources:
    # VPC and networking
    # Security groups
    # IAM roles and policies - use specific actions, not wildcards
    # Launch Template and Auto Scaling Group
    # Application Load Balancer and Target Groups
    # CloudWatch alarms
Outputs:
    # ALB DNS name, VPC ID, security group IDs
```

## Validation

Template will be checked for:

1. Functional Correctness - does it actually deploy and work
2. Security Compliance - follows AWS security best practices
3. Code Quality - passes cfn-lint with zero errors
4. Architecture - proper HA and scalability design
5. Best Practices - good parameterization, tagging, docs

## Additional Notes

- Use stack name for resource naming to avoid conflicts
- Add parameter constraints and allowed values where it makes sense
- Think about failure scenarios
- Clear descriptions for all parameters and resources
- CloudWatch alarms for monitoring
- Pick appropriate instance types for cost efficiency

## Success Criteria

The CloudFormation template should:
- Deploy a working, secure web app infrastructure
- Pass all cfn-lint checks
- Follow AWS Well-Architected principles
- Be ready for production use with proper security
- Support HA across multiple AZs
- Include clear documentation

Generate a complete CloudFormation YAML template that meets these requirements.
