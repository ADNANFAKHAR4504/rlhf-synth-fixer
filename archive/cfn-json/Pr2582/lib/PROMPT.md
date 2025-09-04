# CloudFormation CI/CD Pipeline Generation Prompt

## Task
Generate a complete AWS CloudFormation template in JSON format that creates a comprehensive CI/CD pipeline for a web application using CodePipeline, CodeBuild, CodeDeploy, and Elastic Beanstalk.

## Required Output Format
- **Format**: Valid JSON CloudFormation template
- **Structure**: Must include AWSTemplateFormatVersion, Description, Parameters, Resources, and Outputs sections
- **Validation**: Template must pass AWS CloudFormation linting with zero errors
- **Naming**: All resources prefixed with 'devteam-'

## Core Requirements

### Pipeline Architecture
1. **Source Stage**: GitHub integration with webhook triggers for specific branches
2. **Build Stage**: AWS CodeBuild with compilation, testing, and static code analysis
3. **Test Stage**: Deploy to staging Elastic Beanstalk environment (t3.micro)
4. **Approval Stage**: Manual approval gate before production deployment
5. **Deploy Stage**: Deploy to production Elastic Beanstalk environment (t3.micro)

### Security & Compliance
- Implement least-privilege IAM roles for all pipeline components
- Enable encryption for all S3 buckets and artifact stores using KMS
- Apply security best practices to all AWS services
- Include proper resource policies and cross-service permissions

### Monitoring & Notifications
- CloudWatch Logs integration for all pipeline activities
- SNS topic for pipeline status notifications (success, failure, approval needed)
- CloudWatch alarms for pipeline failures
- Detailed logging configuration for troubleshooting

### Infrastructure Specifications
- **Region**: us-east-1
- **Instance Type**: t3.micro for both staging and production Beanstalk environments
- **Retry Logic**: Automatic retry up to 2 times for failed stages
- **Rollback**: Enable automatic rollback on deployment failures
- **Versioning**: S3 bucket versioning enabled for artifacts

## Technical Constraints

### CodeBuild Configuration
```
- Build environment: Amazon Linux 2
- Runtime: Latest available
- Include buildspec.yml inline specification
- Enable CodeBuild reports for test results and code coverage
- Static code analysis integration
```

### Elastic Beanstalk Setup
```
- Platform: Latest supported web server platform
- Instance type: t3.micro
- Auto-scaling: Min 1, Max 2 instances
- Health checks enabled
- Enhanced health monitoring
```

### GitHub Integration
```
- Source provider: GitHub (Version 2)
- Webhook configuration for automatic triggers
- Branch-specific filtering capability
- OAuth token parameter for authentication
```

## Expected Template Structure

Please organize the CloudFormation template with these sections:

1. **Parameters**: GitHub repository details, branch names, notification email
2. **Resources**: All AWS resources with proper dependencies and configurations
3. **Outputs**: Pipeline ARN, S3 bucket names, Elastic Beanstalk environment URLs
4. **Metadata**: Template description and author information

## Validation Requirements

The generated template must:
- Pass AWS CloudFormation template validation
- Follow AWS resource naming conventions
- Include all required IAM permissions
- Implement proper resource dependencies using DependsOn where necessary
- Include comprehensive error handling and rollback configurations

## Additional Context
- This is for a development team's production workload
- Cost optimization is important - use appropriate instance sizes and storage classes
- The pipeline should be production-ready and follow AWS Well-Architected principles
- Include comments in the JSON for complex configurations

Please generate the complete CloudFormation template with all necessary resources, proper formatting, and comprehensive configuration to meet these requirements.