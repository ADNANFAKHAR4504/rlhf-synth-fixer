# AWS Secure CloudFormation Template Generation

## Environment Requirements

Create a CloudFormation template in YAML format that sets up a highly secure AWS environment for a new application.

## Core Requirements

### 1. S3 Security Configuration

- All S3 buckets must be encrypted with AES-256
- Enable versioning for all S3 buckets

### 2. IAM Security Implementation

- Implement least privilege IAM roles without using wildcard characters
- IAM roles should only allow specific actions in specified S3 buckets
- Policies should not allow wildcards
- Specific IAM role should allow listing and creating objects in only specific S3 buckets

### 3. EC2 Infrastructure

- Launch all EC2 instances as 't3.micro' type within a specific VPC and subnet
- All EC2 instances must be launched within a specified VPC and subnet

### 4. Logging and Monitoring

- Enable CloudTrail logging for all AWS regions

### 5. Database Security

- Use AWS KMS for RDS encryption
- Ensure RDS instances are encrypted using AWS KMS

### 6. Notification System

- Set up an SNS topic for specific event notifications with correct access policies
- Create an SNS topic for sending notifications on certain events and ensure it has access policy configured

### 7. Disaster Recovery

- Establish multi-region disaster recovery for critical services
- Set up multi-region disaster recovery for certain critical services

### 8. Security Automation

- Configure an AWS Lambda function to react to security breaches detected via CloudWatch
- Configure an AWS Lambda function to respond to security breaches detected by CloudWatch

### 9. Resource Tagging

- Ensure all resources have the tags: 'Owner', 'Environment', and 'Project'
- Ensure all resources have tags

## Expected Output

A valid and tested CloudFormation YAML template that satisfies all requirements, including all standard section headers:

- AWSTemplateFormatVersion
- Description
- Parameters
- Resources
- Outputs (where applicable)

## Quality Requirements

- The template should pass YAML linting
- Deploy successfully in the AWS environment without errors
- Must be a complete, production-ready template

## Project Context

- **Focus:** Highly secure AWS environment setup
- **Compliance:** All security best practices must be implemented
