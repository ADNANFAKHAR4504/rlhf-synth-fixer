# Task: Extend Existing AWS CDK Python Infrastructure Stack

I need help extending an existing AWS CDK stack written in Python. The current stack is located in `lib/tap_stack.py` and currently has a basic structure with nested stack support, but no AWS resources implemented yet.

## Current Code Structure

The existing `lib/tap_stack.py` file contains:
- A `TapStack` class that serves as the main CDK stack
- A `TapStackProps` class for stack properties
- Environment suffix handling (dev/prod environments)
- Commented examples showing how to add nested stacks
- **IMPORTANT**: The file explicitly states "DO NOT create resources directly in this stack. Instead, instantiate separate stacks for each resource type."

## Your Task

I need you to **UPDATE THE EXISTING `lib/tap_stack.py` FILE** to implement a comprehensive, production-ready AWS infrastructure. Please follow the nested stack pattern that's already outlined in the comments.

### Required Infrastructure Components

Please implement the following AWS services as separate nested stacks within the main TapStack:

1. **VPC and Networking**
   - VPC with both public and private subnets across multiple availability zones
   - Proper routing tables, internet gateway, and NAT gateways
   - Security groups configured to restrict access to specific IP ranges only

2. **EC2 Auto Scaling**
   - EC2 instances with auto-scaling configuration
   - Launch templates with proper AMI and instance types
   - Scaling policies based on CPU/memory utilization
   - Integration with VPC private subnets

3. **S3 Storage with Enhanced Security**
   - S3 bucket with AWS KMS encryption (customer-managed keys)
   - Versioning enabled on all buckets
   - Access logging enabled
   - Bucket policies following least privilege principles

4. **CloudFront Distribution**
   - CloudFront distribution that retrieves content from the S3 bucket
   - Proper origin access identity/control
   - HTTPS enforcement
   - Caching configurations

5. **Route 53 DNS Management**
   - Route 53 hosted zone
   - Latency-based routing policies
   - Health checks for failover scenarios
   - DNS records pointing to CloudFront distribution

6. **AWS Config for Compliance**
   - AWS Config setup to track resource configuration changes
   - Configuration rules for compliance monitoring
   - SNS notifications for configuration changes

7. **CloudWatch Monitoring**
   - CloudWatch alarms for critical metrics
   - Custom metrics where needed
   - Dashboard for monitoring infrastructure health
   - Log groups for application and infrastructure logs

8. **Serverless Components**
   - SNS topics for notifications of critical events
   - Lambda functions for serverless processing tasks
   - Event-driven architecture connecting various services
   - Proper IAM roles with least privilege access

9. **CI/CD Integration**
   - CodePipeline setup for continuous deployment
   - Integration with the existing CDK stack
   - Automated deployment stages

10. **Security and Compliance**
    - CloudTrail enabled for auditing all API calls
    - IAM roles and policies following least privilege principle for ALL services
    - Security group rules limiting access appropriately
    - Encryption at rest and in transit where applicable

11. **Multi-Region Resilience**
    - Infrastructure designed to be deployed across multiple AWS regions
    - Cross-region replication where applicable
    - Failover mechanisms

## Critical Requirements

**EXTREMELY IMPORTANT - Please read carefully:**

1. **DO NOT CREATE NEW FILES** - Update only the existing `lib/tap_stack.py` file
2. **DO NOT CREATE NEW STACKS FROM SCRATCH** - Work within the existing TapStack structure
3. **FOLLOW THE NESTED STACK PATTERN** - Use the commented example in the file as a guide. Create NestedStack classes within the TapStack for each resource type
4. **UPDATE EXISTING CODE ONLY** - Do not provide output by creating separate stack files
5. **MAINTAIN THE ENVIRONMENT SUFFIX PATTERN** - Use the existing environment_suffix variable for resource naming
6. **PRESERVE THE EXISTING STRUCTURE** - Keep the TapStackProps class and initialization logic intact

## Implementation Guidelines

- Use proper Python typing hints throughout the code
- Follow AWS CDK best practices for Python
- Add comprehensive docstrings for all classes and methods
- Ensure all resources are properly tagged with environment information
- Make resource names dynamic using the environment_suffix variable
- Handle dependencies between nested stacks properly
- Use CDK constructs efficiently to minimize boilerplate

## Expected Output

Please provide the **complete updated `lib/tap_stack.py` file** that:
- Maintains all existing structure and patterns
- Implements all required infrastructure components as nested stacks
- Follows the constraint guidelines specified above
- Is production-ready and can be deployed successfully
- Includes all necessary imports and dependencies
- Has no hardcoded values - uses environment suffix and context appropriately

## Constraints Summary

- S3 buckets encrypted with AWS-KMS (customer-managed keys)
- CloudFront for content delivery from S3
- Route 53 with health checks and latency-based routing
- Auto Scaling enabled for EC2 instances
- VPC with public and private subnets
- Security Groups with specific IP range restrictions
- S3 versioning enabled
- AWS Config for change detection and response
- CI/CD integration with CodePipeline
- IAM roles with least privilege permissions
- CloudTrail logging enabled
- SNS notifications for critical events
- CloudWatch Alarms for resource monitoring
- Lambda functions for serverless tasks
- Multi-region deployment support

Please provide the complete, updated code that I can directly use to replace the existing `lib/tap_stack.py` file. Make sure the implementation is comprehensive, follows AWS best practices, and can pass both unit and integration tests.
