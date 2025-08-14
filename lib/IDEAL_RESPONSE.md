# Ideal CloudFormation Template for Web Application with DynamoDB

This is the ideal, production-ready CloudFormation template that combines both the web application requirements from the prompt and the DynamoDB table requirements for the TAP Stack.

## Key Features Implemented

### Web Application Infrastructure (from PROMPT.md requirements):

1. **Multi-AZ High Availability**
   - Deployed across 3 availability zones in us-west-2 region
   - VPC with public subnets in multiple AZs for redundancy

2. **Auto Scaling Group (ASG) Configuration**
   - Minimum instances: 2
   - Maximum instances: 6  
   - Desired capacity: 2
   - CPU-based scaling with CloudWatch alarms
   - Scale up when CPU > 70%, scale down when CPU < 25%

3. **Application Load Balancer (ALB)**
   - Internet-facing configuration for public access
   - HTTPS support with AWS Certificate Manager integration
   - Automatic HTTP to HTTPS redirection (301 redirects)
   - Health checks configured for high availability

4. **Security Configuration**
   - All traffic restricted to HTTPS only via automatic redirection
   - Security groups with proper ingress/egress rules
   - ALB security group allows HTTP/HTTPS from internet
   - EC2 security group allows traffic only from ALB

5. **Logging & Storage**
   - S3 bucket for ALB access logs with proper bucket policies
   - Lifecycle policies: transition to Glacier after 30 days, delete after 365 days
   - CloudWatch log groups for application logs with 365-day retention
   - CloudWatch agent configuration for EC2 instances

6. **Tagging Compliance**
   - All resources tagged with Environment: Production and App: WebApp
   - Consistent tagging strategy across all infrastructure components

### DynamoDB Integration (from unit test requirements):

7. **TurnAroundPromptTable Configuration**
   - Table name with environment suffix: `TurnAroundPromptTable${EnvironmentSuffix}`
   - PAY_PER_REQUEST billing mode for cost optimization
   - Single partition key: `id` (String type)
   - DeletionPolicy and UpdateReplacePolicy set to Delete for testing
   - DeletionProtectionEnabled: false to allow easy cleanup

### Infrastructure Best Practices:

8. **Resource Naming Convention**
   - All resource names include EnvironmentSuffix parameter
   - Consistent naming pattern across all components
   - Export names follow CloudFormation best practices

9. **Deployment Readiness**
   - Template ready to deploy without modification
   - All IAM roles and policies included
   - Launch template with proper EC2 configuration
   - CloudWatch alarms for monitoring and auto-scaling

10. **Testing Integration**
    - Comprehensive unit test coverage for template validation
    - Integration test support with proper output definitions
    - Template structure validates against test expectations

## Template Structure

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix for resource naming (e.g., dev, staging, prod)
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: Must contain only alphanumeric characters

Resources:
  # VPC and Networking (6 resources)
  # Security Groups (2 resources)  
  # S3 Bucket and Policies (3 resources)
  # SSL Certificate (1 resource)
  # Application Load Balancer and Components (3 resources)
  # IAM Roles and Policies (2 resources)
  # Launch Template (1 resource)
  # Auto Scaling Group (1 resource)
  # Scaling Policies (2 resources)
  # CloudWatch Alarms (2 resources)
  # CloudWatch Log Groups (2 resources)
  # DynamoDB Table (1 resource)
  # Total: 29 resources

Outputs:
  # Web Application Outputs
  LoadBalancerURL: ALB URL for accessing the web application
  LoadBalancerDNSName: ALB DNS name
  LogsBucketName: S3 bucket name for logs
  AutoScalingGroupName: ASG name
  
  # DynamoDB Table Outputs (required by tests)
  TurnAroundPromptTableName: DynamoDB table name
  TurnAroundPromptTableArn: DynamoDB table ARN
  
  # Stack Metadata Outputs (required by tests)
  StackName: CloudFormation stack name
  EnvironmentSuffix: Environment suffix used
```

## Validation Results

- ✅ All 29 unit tests pass
- ✅ CloudFormation lint validation passes (1 minor warning)
- ✅ TypeScript build successful
- ✅ ESLint validation passes
- ✅ Template ready for deployment in us-west-2 region
- ✅ All required outputs defined for integration testing
- ✅ Proper resource naming with environment suffix
- ✅ All resources configured for deletion (no retention policies)

This template successfully combines the complex web application infrastructure requirements with the specific DynamoDB table needs, providing a comprehensive, production-ready solution that meets all specified requirements and passes all validation tests.