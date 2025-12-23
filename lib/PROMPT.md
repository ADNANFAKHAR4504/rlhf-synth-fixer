Hey team,

We need to build an infrastructure analysis and QA system that can audit existing CloudFormation stacks across our AWS environment. The business wants a comprehensive solution that can automatically analyze stack configurations, check for compliance issues, and generate detailed reports. This needs to be deployed using CloudFormation with YAML, so everything can be version-controlled and easily deployed.

Right now, teams are manually reviewing CloudFormation stacks to ensure they follow our standards and best practices. This is time-consuming and error-prone. We need an automated system that can continuously audit our infrastructure, flag potential issues, and help us maintain a high quality bar across all our CloudFormation deployments.

The system should be able to read and analyze existing CloudFormation stack resources, check them against various quality assurance rules, and store the analysis results for review. We also need proper monitoring and alerting so teams can be notified when issues are detected.

## What we need to build

Create an infrastructure analysis and QA system using **CloudFormation with YAML** for auditing existing CloudFormation stacks across our AWS environment.

### Core Requirements

1. **Stack Analysis Capability**
   - Lambda function to analyze existing CloudFormation stacks
   - Ability to read and describe stack resources and properties
   - Extract configuration details for quality checks
   - Support scheduled and on-demand analysis

2. **Quality Assurance Checks**
   - Validate stack configurations against best practices
   - Check for security issues like missing encryption or overly permissive IAM policies
   - Verify resource tagging compliance
   - Identify deprecated resource types or configurations
   - Check for cost optimization opportunities

3. **Report Generation and Storage**
   - S3 bucket to store analysis reports in JSON format
   - Include detailed findings with severity levels
   - Organize reports by stack name and timestamp
   - Enable report retention and lifecycle management

4. **Scheduled Analysis**
   - EventBridge rule to trigger regular stack audits
   - Configurable schedule for automated analysis
   - Support for analyzing multiple stacks per run

5. **Monitoring and Alerting**
   - CloudWatch Logs for Lambda execution logs
   - CloudWatch alarms for failed analyses
   - SNS topic for notifications when critical issues are found
   - Metrics tracking for analysis execution and findings

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **AWS Lambda** with Python runtime for the analysis logic
- Use **Amazon S3** for storing analysis reports
- Use **AWS IAM** for roles and permissions following least-privilege
- Use **Amazon EventBridge** for scheduled triggers
- Use **Amazon CloudWatch** for logging and monitoring
- Use **Amazon SNS** for notifications
- Names for all infrastructure components must include the **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region

### Constraints

- Lambda execution role must have read-only permissions for CloudFormation stack operations
- IAM roles must follow least-privilege principle with specific resource ARNs instead of wildcards
- S3 bucket must have encryption enabled and public access blocked
- All resources must be destroyable - no Retain deletion policies
- Include proper error handling and logging in Lambda function
- Lambda function should handle pagination for large stack lists
- Reports should be structured JSON for easy parsing

## Success Criteria

- **Functionality**: Successfully analyzes existing CloudFormation stacks and identifies configuration issues
- **Performance**: Completes analysis of a typical stack within 30 seconds
- **Reliability**: Handles errors gracefully without failing the entire analysis
- **Security**: IAM permissions follow least-privilege, S3 bucket is encrypted and private
- **Naming Convention**: All resources include environmentSuffix parameter for uniqueness
- **Code Quality**: Clean YAML, well-documented with inline comments, proper error handling

## What to deliver

- Complete CloudFormation YAML template implementation
- Lambda function code inline or as separate file structure
- IAM roles with least-privilege permissions for stack auditing
- S3 bucket with encryption and lifecycle policies
- EventBridge rule for scheduled execution
- CloudWatch alarms and SNS notifications
- Parameters for environmentSuffix and notification email
- Outputs for key resource ARNs and bucket name
- Documentation with deployment instructions
