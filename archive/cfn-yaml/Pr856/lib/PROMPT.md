## Context
You are an AWS CloudFormation expert specializing in Infrastructure as Code (IaC) security best practices. Your task is to generate production-ready CloudFormation templates that implement secure, highly available web application infrastructures.

## Task Specifications

## Requirements

Design a CloudFormation template that provisions a **secure web application infrastructure** with the following mandatory components:

### 1. Network Infrastructure
- **Amazon VPC** with DNS support and hostnames enabled
- **Public subnets** across multiple Availability Zones (minimum 2)
- **Private subnets** for enhanced security (optional but recommended)
- **Internet Gateway** with proper routing
- **Route tables** with appropriate associations
- **NAT Gateways** for outbound traffic from private subnets (if implemented)

### 2. Compute Infrastructure
- **EC2 instances** configured as web servers
- **Must be deployed in Auto Scaling Groups** for high availability
- **Minimum 2 instances across different AZs**
- **Latest generation Amazon Linux AMI** (use SSM Parameter for dynamic resolution)
- **Proper IAM roles and instance profiles**
- **User data scripts** for web server configuration

### 3. Load Balancing
- **Application Load Balancer (ALB)** in public subnets
- **Target groups** with health checks configured
- **Listeners** for HTTP traffic distribution
- **Cross-zone load balancing** enabled

### 4. Security Configuration
- **Security groups** with least privilege principle:
  - ALB security group: Allow inbound HTTP (80) and HTTPS (443) from 0.0.0.0/0
  - EC2 security group: Allow inbound traffic only from ALB security group
- **Separate security groups** for different tiers
- **No SSH access** unless explicitly justified

### 5. Scalability and Availability
- **Auto Scaling Group** with appropriate scaling policies
- **CloudWatch alarms** for scaling triggers
- **Multi-AZ deployment** for high availability
- **Health checks** at both ALB and ASG levels

## Technical Constraints

### Mandatory Requirements:
1. **AMI Selection**: Use `AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>` with parameter `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`
2. **Validation**: Template must pass `cfn-lint` with zero errors
3. **Security**: Implement AWS Well-Architected Framework security principles
4. **Availability**: Multi-AZ deployment across minimum 2 Availability Zones
5. **Scalability**: Auto Scaling Group with minimum 2, maximum 6 instances

### Best Practices to Implement:
- **Parameterization**: Use parameters for configurable values
- **Conditions**: Implement conditional logic where appropriate  
- **Outputs**: Export key resource references for stack integration
- **Tagging**: Consistent tagging strategy across all resources
- **Naming**: Use `!Sub` for dynamic resource naming
- **Dependencies**: Proper `DependsOn` where CloudFormation can't infer

## Security Standards

### Network Security:
- VPC with appropriate CIDR blocks (suggest 10.0.0.0/16)
- Public subnets: 10.0.1.0/24, 10.0.4.0/24
- Private subnets (if used): 10.0.2.0/24, 10.0.3.0/24
- Internet Gateway with restricted routing

### Access Control:
- Security groups with minimal required permissions
- No default VPC usage
- No hardcoded credentials or sensitive data
- IAM roles instead of IAM users for EC2

### Encryption:
- EBS volumes encrypted (if specified)
- HTTPS configuration ready (certificates not required in template)

## Expected Output Structure
```
AWSTemplateFormatVersion: ‘2010-09-09’
Description: ‘Secure web application infrastructure with ALB and Auto Scaling’
Parameters:
    Environment, instance type, key pair, etc.
Conditions:
    Conditional logic for optional features
Resources:
    VPC and networking components
    Security groups
    IAM roles and policies
    Auto Scaling Group and Launch Template
    Application Load Balancer and Target Groups
    CloudWatch alarms (if applicable)
Outputs:
    Key resource references for integration
```

## Validation Criteria

Your template will be evaluated on:

1. **Functional Correctness**:  Infrastructure deploys successfully
2. **Security Compliance**:  Follows AWS security best practices
3. **Code Quality**:  Passes cfn-lint validation with zero errors
4. **Architecture**:  Implements high availability and scalability
5. **Best Practices**:  Proper parameterization, tagging, and documentation

## Additional Considerations

- **Resource Naming**: Use stack name for unique resource identification
- **Parameter Validation**: Include constraints and allowed values
- **Error Handling**: Consider failure scenarios in design
- **Documentation**: Include clear descriptions for parameters and resources
- **Monitoring**: CloudWatch alarms for operational excellence
- **Cost Optimization**: Use appropriate instance types and sizing

## Success Criteria

The generated CloudFormation template should:
-  Deploy a fully functional, secure web application infrastructure
-  Pass all cfn-lint validation checks
-  Follow AWS Well-Architected Framework principles
-  Be production-ready with proper security controls
-  Support high availability across multiple AZs
-  Include comprehensive documentation and comments

Generate a complete CloudFormation YAML template that meets all these requirements while maintaining security, scalability, and operational excellence standards.