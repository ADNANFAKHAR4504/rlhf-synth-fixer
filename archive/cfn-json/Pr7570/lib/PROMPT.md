# Infrastructure Compliance Monitoring System

Hey team,

We've got a critical situation at one of our financial services clients. They just completed a security audit and discovered significant configuration drift in their production environment. Their CloudFormation stacks have diverged from the approved configurations, and they have no automated way to detect or prevent these compliance violations. The security team is understandably concerned, and we need to implement a comprehensive automated compliance monitoring solution.

The client runs a large AWS infrastructure with multiple CloudFormation stacks managing everything from compute resources to databases and networking. Without continuous monitoring, developers sometimes modify resources directly through the console, or updates to stacks inadvertently introduce non-compliant configurations. The audit revealed resources without proper tagging, security groups with overly permissive rules, and several instances running unapproved AMIs. These issues create security risks and make cost allocation nearly impossible.

We need to build an automated infrastructure compliance analysis system that continuously monitors their AWS environment, detects drift and compliance violations, validates configurations against their security policies, and alerts the security team immediately when issues are detected. This system needs to be comprehensive, covering all the compliance requirements they've identified during the audit.

## What we need to build

Create an automated infrastructure compliance monitoring system using **CloudFormation with JSON** for a financial services company. The system must continuously monitor AWS resources for configuration drift, compliance violations, and security policy adherence.

### Core Requirements

1. **AWS Config Setup**
   - Deploy AWS Config service to monitor CloudFormation stack drift
   - Create custom AWS Config rules to validate resource configurations
   - Ensure continuous monitoring of all supported AWS resource types
   - Use the managed policy service-role/AWS_ConfigRole for Config service role
   - Note: AWS Config is a regional service, so configure for us-east-1 region

2. **Compliance Validation Functions**
   - Implement Lambda functions using Python 3.9 runtime
   - Allocate 256MB memory for each Lambda function
   - Functions must validate resource configurations against security policies
   - Include logic to check for approved AMI IDs from Parameter Store
   - Validate security group rules against approved configurations
   - Enable CloudWatch Logs for all Lambda functions with 30-day retention

3. **Compliance Report Storage**
   - Create S3 bucket with versioning enabled
   - Implement lifecycle rules to transition reports to Glacier after 30 days
   - Apply 90-day total retention policy for compliance reports
   - Include environmentSuffix in bucket name for uniqueness
   - Enable server-side encryption for stored reports

4. **Real-Time Event Monitoring**
   - Configure EventBridge rules to capture AWS Config compliance changes
   - Trigger Lambda validation functions on configuration change events
   - Monitor CloudFormation stack drift events
   - Enable event pattern matching for non-compliant resource states

5. **Security Team Notifications**
   - Create SNS topic for compliance alerts
   - Configure email subscriptions for security team notifications
   - Send notifications immediately when non-compliant resources are detected
   - Include resource details and violation descriptions in alerts
   - Use environmentSuffix in SNS topic name

6. **Compliance Metrics Dashboard**
   - Create CloudWatch dashboard displaying compliance metrics
   - Show drift detection results and compliance status
   - Include metrics for total resources monitored and compliance rate
   - Display Lambda function execution statistics

7. **Configuration Storage**
   - Set up Systems Manager Parameter Store entries
   - Store approved AMI IDs for allowed instance types
   - Store approved security group rules
   - Store compliance thresholds and configuration values
   - Use SecureString type for sensitive parameters

8. **Automated Tagging Compliance**
   - Implement compliance checks for required resource tags
   - Validate presence of Environment, Owner, and CostCenter tags
   - Alert on resources missing required tags
   - Include tag validation in Lambda functions

9. **Multi-Account Support**
   - Configure AWS Config aggregator for multi-account compliance data collection
   - Note: Implementation should support single-account deployment initially
   - Design allows for future multi-account aggregation

10. **Security and Access Control**
    - Create IAM roles and policies following least privilege principle
    - Separate roles for AWS Config, Lambda functions, and other services
    - Enable service-to-service permissions with minimal required access
    - Use managed policies where appropriate (AWS_ConfigRole)

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS Config** for continuous compliance monitoring
- Use **Lambda** functions with Python 3.9 runtime for custom validation
- Use **S3** for compliance report storage with lifecycle policies
- Use **EventBridge** for real-time event-driven compliance checks
- Use **SNS** for security team notifications
- Use **CloudWatch** for metrics dashboard and Lambda logging
- Use **Systems Manager Parameter Store** for configuration management
- Use **IAM** roles with least privilege access patterns
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: {resource-type}-{purpose}-${EnvironmentSuffix}
- Deploy to **us-east-1** region
- All Lambda functions must use Python 3.9 runtime (compatible with aws-sdk)

### Deployment Requirements (CRITICAL)

- All resources must be destroyable with no Retain policies
- Use DeletionPolicy: Delete for all resources (RemovalPolicy: DESTROY in CDK terms)
- Resource naming must use ${EnvironmentSuffix} parameter to avoid conflicts
- Do NOT create GuardDuty detectors (account-level resource limitation)
- AWS Config service role must use managed policy: service-role/AWS_ConfigRole
- Lambda functions must handle Python 3.9+ runtime requirements
- S3 buckets must be emptied before stack deletion (consider custom resource)

### Constraints

- Infrastructure must handle CloudFormation stacks with hundreds of resources
- Compliance checks must execute within 5 minutes of configuration changes
- Lambda functions must complete execution within 5 minutes (function timeout)
- S3 bucket must support high-frequency compliance report writes
- All Lambda logs must be retained for 30 days in CloudWatch
- Parameter Store must support frequent read operations for AMI validation
- SNS notifications must deliver within 1 minute of compliance violation
- All resources must support deletion without data retention requirements
- IAM policies must follow least privilege with no wildcard permissions on sensitive actions

## Success Criteria

- **Functionality**: System detects configuration drift within 5 minutes of changes
- **Functionality**: Custom compliance rules validate all specified security policies
- **Functionality**: SNS notifications deliver to security team on violations
- **Functionality**: Compliance reports stored in S3 with proper lifecycle transitions
- **Performance**: Lambda functions execute within 300 seconds
- **Performance**: EventBridge rules trigger validation within 1 minute of changes
- **Reliability**: AWS Config continuously monitors without service interruptions
- **Reliability**: All Lambda functions include error handling and logging
- **Security**: IAM roles use least privilege principle with no excessive permissions
- **Security**: S3 bucket encrypted with server-side encryption
- **Security**: Parameter Store uses SecureString for sensitive values
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: Complete stack can be deleted without manual intervention
- **Code Quality**: JSON syntax valid and properly formatted
- **Code Quality**: CloudFormation template passes validation

## What to deliver

- Complete CloudFormation JSON template implementing all requirements
- AWS Config service with custom compliance rules
- Lambda functions (Python 3.9) for policy validation with inline code or references
- S3 bucket with versioning and lifecycle policies
- EventBridge rules for real-time compliance monitoring
- SNS topic with subscription configuration
- CloudWatch dashboard with compliance metrics
- Systems Manager Parameter Store entries
- IAM roles and policies with least privilege access
- Documentation of deployment process and parameters
- README with setup instructions and parameter descriptions

