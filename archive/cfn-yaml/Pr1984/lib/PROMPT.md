# Task: Secure CloudFormation Infrastructure for Web Application

## Problem ID: SecurityConfigurationasCode_CloudFormation_YAML_9kn8fhc2zg57

## Requirements

Design a secure CloudFormation YAML template to deploy a web application in AWS. The infrastructure deployment must meet the following requirements:

1. Set up an AWS VPC with both public and private subnets in two availability zones.
2. Deploy an EC2 instance with a configured AWS WAF to protect it.
3. Use IAM Roles with policies adhering to the least privilege principle.
4. Implement AWS RDS for the database with automated backups.
5. Utilize AWS Secrets Manager for database credentials.
6. Enable logging and monitoring via CloudWatch and CloudTrail.
7. Ensure all data at rest, especially in S3 buckets, is encrypted using AWS KMS.
8. Configure Auto Scaling for EC2 instances.
9. Enable AWS Trusted Advisor and Multi-Factor Authentication (MFA) for enhanced security.

## Expected Output

A CloudFormation YAML template satisfying all the above constraints. The template file should be named `secure-infrastructure.yaml`, and all specified services must be properly integrated with tests confirming adherence to requirements.

## Environment Details

The infrastructure is to be deployed in the us-west-2 region and should follow a standard naming convention with the prefix 'prod-'. The VPC ID is 'vpc-123abcde'. All resources should be tagged with 'Environment:Production'.

## Additional Context

Security Configuration as Code ensures that security best practices are embedded within the infrastructure setup phase, rather than being an afterthought, providing consistent security posture as infrastructure scales.

## Constraints

1. Usage of AWS IAM Roles and Policies for access control.
2. Enable encryption at rest for all AWS S3 buckets.
3. Configure CloudWatch for detailed monitoring of all AWS Lambda functions.
4. Set up VPC with private and public subnets across two availability zones.
5. Implement AWS WAF for the web application hosted on AWS EC2.
6. Use AWS RDS for the database with automated backups enabled.
7. Ensure logging is enabled for all AWS S3 buckets.
8. Set up an Auto Scaling group for the EC2 instances.
9. Use AWS Secrets Manager for storing database credentials.
10. Enable AWS Trusted Advisor for monitoring security best practices.
11. Configure AWS KMS for managing encryption keys.
12. Use AWS CloudTrail for logging API activities.
13. Ensure Multi-Factor Authentication (MFA) for user access.
14. Apply least privilege principle to all IAM entities.

## Platform and Language

- Platform: CloudFormation
- Language: YAML
