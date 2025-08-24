# Serverless Application Infrastructure - Task trainr233

## Task Overview
Deploy a serverless application using Pulumi JavaScript with RESTful APIs served through API Gateway and backend processing implemented via AWS Lambda functions.

## Platform Configuration
- **Platform**: Pulumi (transformed from CloudFormation)
- **Language**: JavaScript (transformed from YAML)
- **Region**: us-west-2
- **Complexity**: hard

## Core Requirements

### 1. Serverless Computation
- Use AWS Lambda for all computational tasks
- Implement proper function configuration and runtime settings

### 2. RESTful API Implementation
- Deploy AWS API Gateway to provide RESTful interface
- Configure proper integration with Lambda functions
- Implement HTTP methods (GET, POST, PUT, DELETE)

### 3. IAM Security
- Define IAM role with least privilege permissions
- Grant only necessary permissions for Lambda execution
- Follow AWS security best practices

### 4. Regional Deployment
- Deploy all infrastructure in us-west-2 AWS region
- Ensure consistent regional configuration across all resources

### 5. Resource Tagging
- Apply 'Environment': 'Test' tag to all AWS resources
- Enable proper cost tracking and resource management

### 6. S3 Encryption
- Create S3 bucket for Lambda function code storage
- Enable server-side encryption for security compliance

### 7. Blue-Green Deployment Strategy
- Implement blue-green deployment for Lambda functions
- Use Lambda aliases and weighted routing
- Enable zero-downtime deployments

### 8. CloudWatch Monitoring
- Enable CloudWatch logs for API Gateway
- Enable CloudWatch logs for all Lambda functions
- Implement comprehensive logging strategy

## Expected Deliverables

### Infrastructure Components
1. IAM Role and Policies
2. S3 Bucket with encryption
3. Lambda Functions with logging
4. API Gateway REST API
5. Blue-Green deployment configuration
6. CloudWatch log groups

### Security Measures
- Least privilege IAM permissions
- Encrypted S3 storage
- Proper API Gateway security
- CloudWatch monitoring and alerting

### Deployment Strategy
- Blue-green deployment implementation
- Zero-downtime update capability
- Rollback mechanisms

## Implementation Files
- **Main Infrastructure**: `/lib/tap-stack.mjs`
- **Documentation**: `/lib/PROMPT.md`

## Validation Criteria
All 8 constraint requirements must be satisfied:
1. AWS Lambda for computation
2. API Gateway RESTful interface
3. IAM role with least privilege
4. us-west-2 region deployment
5. Environment tags for cost tracking
6. S3 server-side encryption
7. Blue-green deployment support
8. CloudWatch logs enabled