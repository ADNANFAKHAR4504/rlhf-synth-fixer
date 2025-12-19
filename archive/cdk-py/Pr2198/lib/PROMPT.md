# Task: trainr191cdkpy - Security Configuration as Code

## Original Requirements (CloudFormation YAML → CDK Python per platform enforcement)

**Task ID**: trainr191cdkpy  
**Difficulty**: hard  
**Platform**: CloudFormation YAML → **CDK Python** (transformed per cdk+py enforcement)  
**Category**: Security Configuration as Code  

## Requirements

Design a CloudFormation template to set up a secure web application infrastructure on AWS. The infrastructure must include:

1. An Amazon VPC with appropriate subnets, route tables, and internet gateway.
2. EC2 instances configured as web servers in a public subnet, using the Auto Scaling group for high availability.  
3. Application Load Balancer (ALB) to distribute incoming traffic to the EC2 instances.
4. A security group that allows inbound HTTP and HTTPS traffic to the ALB.
5. Ensure all EC2 instances are launched with the latest generation Amazon Linux AMI available in the region.

## Expected Output

A valid YAML CloudFormation template file that sets up the described infrastructure. The template must pass 'cfn-lint' checks with no errors and adhere to best practices for security and availability.

## Transformation Note

**IMPORTANT**: This task was originally specified for CloudFormation YAML but must be transformed to **CDK Python** per the platform enforcement rule (cdk+py). The solution should implement all the same infrastructure components using AWS CDK with Python, following CDK best practices and patterns.

## Environment

- **Region**: Any preferred region (recommend us-east-1 for consistency)
- **AWS Account**: With permissions to provision resources using CDK
- **Focus**: CloudFormation → CDK transformation, security best practices, high availability

## Constraints

1. **Platform Transformation**: Must use AWS CDK with Python instead of CloudFormation YAML
2. **Security**: Ensure all EC2 instances are launched with the latest generation Amazon Linux AMI available in the region
3. **High Availability**: Use Auto Scaling groups for EC2 instances 
4. **Load Balancing**: Application Load Balancer to distribute traffic
5. **Network Security**: Appropriate security groups and network configuration
6. **Best Practices**: Follow AWS CDK and security best practices

This exercise focuses on using Infrastructure as Code (CDK Python) for deploying a web application that scales and operates securely according to modern cloud best practices.