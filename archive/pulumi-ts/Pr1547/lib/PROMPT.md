# Production-Ready Cloud Environment Setup

## Task Description

You are tasked with setting up a production-ready environment using AWS CloudFormation. This comprehensive infrastructure deployment requires implementing enterprise-grade AWS services with production best practices.

### Core Infrastructure Requirements

1. **Regional Deployment**: Deploy all resources in the 'us-east-1' region

2. **Naming Convention**: Use 'prod-' as a prefix for resource names, followed by the respective service name

3. **IAM Security**: Utilize IAM roles that follow the least privilege principle

4. **Network Architecture**: Design a VPC with at least two public and two private subnets spread across multiple availability zones

5. **Logging & Monitoring**: Configure logging for all S3 bucket access

6. **Database**: Use an RDS database with the db.t3.micro instance class

7. **Load Balancing**: Set up an Application Load Balancer (ALB) with an SSL certificate from ACM

8. **Monitoring**: Implement a CloudWatch alarm to detect any 5xx errors in your application

9. **Auto Scaling**: Enable automated scaling of your application based on CPU utilization metrics

## Expected Output

A valid CloudFormation template written in YAML that creates and configures the described infrastructure. Ensure all constraints are met, and test deployment confirms successful environment setup.

## Environment Details

- **Target Region**: us-east-1 (US East - N. Virginia)
- **Infrastructure Type**: Production web application environment
- **Components**: ALB, EC2 instances, RDS database, S3 for storage, IAM roles
- **Naming Standard**: 'prod-' prefix followed by service name

## Technical Requirements

- Platform: Originally CloudFormation+YAML, converted to Pulumi+TypeScript per platform enforcement
- Complexity: Medium (comprehensive production environment)
- Production Focus: Enterprise-grade configuration and monitoring

## Key Requirements Summary

1. **Regional Compliance**: All resources must be deployed in the us-east-1 region
2. **Naming Standards**: Resource naming conventions must include the 'prod-' prefix followed by the service name
3. **Security**: IAM roles must have the least privilege necessary for their function
4. **High Availability**: The VPC should include at least two public and two private subnets across different availability zones
5. **Audit Logging**: Implement logging for all S3 bucket access
6. **Cost Optimization**: The RDS instance should use the db.t3.micro instance class for cost-effectiveness
7. **SSL Security**: The application's ALB should be configured with an SSL certificate from ACM
8. **Error Monitoring**: Ensure that there is a CloudWatch alarm to monitor any 5xx errors from the application
9. **Performance Scaling**: The environment should support automatic scaling based on CPU utilization metrics

## Background

This task involves deploying an AWS-based web application environment using Infrastructure as Code. The solution requires familiarity with AWS services like VPC, EC2, RDS, S3, IAM, and CloudWatch, implementing production-grade configurations with proper security, monitoring, and scaling capabilities.

## Success Criteria

- Complete production-ready infrastructure deployment in us-east-1
- Multi-AZ high availability with public and private subnet architecture
- Secure IAM roles following least privilege principles
- RDS database in private subnets with proper security
- Application Load Balancer with SSL certificate from ACM
- Comprehensive logging and monitoring with CloudWatch alarms
- Auto Scaling functionality based on performance metrics
- Proper resource naming with 'prod-' prefix convention
- Enterprise-grade security and operational excellence