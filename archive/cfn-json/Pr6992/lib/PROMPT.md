Hey team,

We just inherited a complex situation from the recent acquisition. The security team discovered that the acquired company deployed their infrastructure using wildly inconsistent templates, and we need to analyze and validate everything against our standards before migration. This is a critical security gate we can't skip.

I've been asked to build an automated infrastructure validation system that can scan their existing CloudFormation templates for security and compliance issues. The business wants this built using **CloudFormation with JSON** so it integrates naturally with our existing template ecosystem.

The environment is in us-east-1 and includes typical three-tier application infrastructure - VPCs with public and private subnets, RDS MySQL instances, S3 buckets for application assets, EC2 Auto Scaling groups, and Application Load Balancers. All their templates are in JSON format, and we need to validate them against AWS best practices and our company security policies. We'll be using AWS CloudFormation Guard for the policy-as-code validation logic.

## What we need to build

Create an automated infrastructure validation system using **CloudFormation with JSON** that scans templates for security violations, stores results, and provides actionable insights for the security team.

### Core Requirements

1. **Lambda Function for Template Scanning**
   - Define a Lambda function that analyzes CloudFormation templates uploaded to S3
   - Must validate against security best practices and compliance rules
   - Use Python 3.12 or Node.js 20.x runtime
   - Implement actual validation logic, not just a placeholder
   - Parse JSON/YAML CloudFormation templates
   - Check for security anti-patterns like overly permissive IAM policies
   - Write findings to DynamoDB with proper error handling

2. **DynamoDB Table for Results Storage**
   - Create table to persist validation results
   - Partition key: TemplateId (String)
   - Sort key: Timestamp (String)
   - DeletionProtectionEnabled must be false for testing purposes
   - Enable point-in-time recovery for data safety

3. **EventBridge Rule for Automation**
   - Configure EventBridge rule triggered by S3 PutObject events
   - Pattern should match new template uploads
   - Target the Lambda function automatically
   - Pass S3 bucket and object key information to Lambda

4. **IAM Roles with Least Privilege**
   - Lambda execution role with specific policies only
   - Grant s3:GetObject on template bucket
   - Grant dynamodb:PutItem and dynamodb:UpdateItem on results table
   - Grant logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents
   - NO wildcard actions anywhere
   - Use AWSLambdaBasicExecutionRole managed policy where appropriate

5. **CloudWatch Logs Integration**
   - Create CloudWatch Logs group for Lambda function
   - Set retention to 30 days
   - Proper log stream configuration

6. **S3 Bucket for Template Storage**
   - Bucket for storing templates to analyze
   - Enable versioning (BucketVersioningConfiguration)
   - Enable encryption at rest (AES256 or aws:kms)
   - Enable EventBridge notifications (EventBridgeEnabled: true)
   - Block all public access

7. **Stack Outputs**
   - Export Lambda function ARN
   - Export DynamoDB table name
   - Export S3 bucket name
   - Only include non-sensitive information

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS Lambda** for template scanning
- Use **Amazon DynamoDB** for results storage
- Use **Amazon EventBridge** for event-driven automation
- Use **AWS IAM** for security controls
- Use **Amazon CloudWatch** for logging
- Use **Amazon S3** for template storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: !Sub 'resource-type-${EnvironmentSuffix}'
- Define Parameters section with EnvironmentSuffix parameter (Type: String, Default: "dev")
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be cleanly destroyable
- NO RemovalPolicy: Retain on any resource
- NO DeletionProtection: true on any resource
- Stack must delete completely without manual intervention
- This is a testing environment requirement

### Security Constraints

- IAM roles: no wildcard actions, only specific actions on specific ARNs
- S3 buckets: versioning enabled, encryption enabled, public access blocked
- Lambda: use environment variables for DynamoDB table name
- Follow principle of least privilege everywhere
- No hardcoded credentials or sensitive data

### Lambda Implementation Details

- Include actual Python or Node.js code inline using ZipFile property
- Implement real validation logic that:
  - Parses CloudFormation JSON/YAML from S3
  - Checks for security anti-patterns (wildcard IAM actions, public S3 buckets, etc.)
  - Writes structured findings to DynamoDB
- Use environment variables for configuration
- Implement proper error handling and logging
- Return meaningful status codes

## Success Criteria

- Functionality: Templates uploaded to S3 automatically trigger validation and results are stored in DynamoDB
- Performance: Validation completes within Lambda timeout limits (recommend 5 minutes max)
- Reliability: EventBridge rule correctly triggers Lambda on every S3 upload
- Security: IAM roles follow least privilege, S3 bucket is encrypted and versioned, no wildcard permissions
- Resource Naming: All named resources include environmentSuffix using !Sub syntax
- Code Quality: Complete working CloudFormation JSON template, well-documented, ready for deployment
- Destroyability: Stack deletes cleanly with no retained resources

## What to deliver

- Complete CloudFormation JSON template (lib/template.json)
- Lambda function with inline code implementing validation logic
- DynamoDB table for results storage
- EventBridge rule for S3 event automation
- IAM roles with least-privilege policies
- CloudWatch Logs group with 30-day retention
- S3 bucket with versioning, encryption, and EventBridge notifications enabled
- Stack Outputs for Lambda ARN, DynamoDB table name, and S3 bucket name
- Comprehensive documentation in MODEL_RESPONSE.md explaining architecture, services used, security considerations, and deployment instructions
- IDEAL_RESPONSE.md (copy of MODEL_RESPONSE.md for single-turn task)
