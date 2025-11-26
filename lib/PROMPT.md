# CloudFormation Compliance Analyzer Infrastructure

Hey team,

We've got a critical compliance problem on our hands. Our security team just finished an audit across multiple AWS accounts and found CloudFormation stacks that don't meet our corporate compliance standards. Some S3 buckets aren't encrypted, RDS instances are running without encryption, and we've got non-approved EC2 instance types scattered everywhere. They need an automated way to continuously scan CloudFormation templates, identify violations, and get alerts when something doesn't meet our standards.

The challenge is that we're dealing with dozens of accounts with hundreds of CloudFormation stacks. Manual auditing isn't scalable, and by the time we catch issues, they've already been running in production for weeks. We need a system that can automatically analyze templates the moment they're deployed, validate them against our compliance rules, and generate detailed reports that our security team can actually use.

I've been asked to build this compliance analyzer infrastructure in **CloudFormation with JSON**. The system needs to handle complex scenarios like cross-stack references, nested templates, and resources with multiple dependencies. It also needs to work across accounts securely, which means we'll be dealing with cross-account IAM roles and assume role permissions.

## What we need to build

Create an automated CloudFormation compliance analysis system using **CloudFormation with JSON** that scans existing templates across multiple AWS accounts, validates resources against compliance rules, and generates actionable reports with automated notifications.

### Core Requirements

1. **Compliance Rules Definition**
   - AWS Config Rules for S3 bucket encryption (must use AES256 or KMS)
   - AWS Config Rules for RDS instance encryption (must be enabled)
   - AWS Config Rules for EC2 instance types (only t3.micro and t3.small allowed)
   - Rules must be managed through AWS Config service

2. **Template Parsing and Validation**
   - Lambda functions using Python 3.9 runtime
   - Parse CloudFormation templates retrieved from S3 buckets
   - Validate resources against Config Rules definitions
   - Handle complex template structures including nested stacks and cross-references
   - Extract resource configurations and compare against compliance criteria

3. **Results Storage and Tracking**
   - DynamoDB table with on-demand billing mode
   - Partition key format: accountId#timestamp (composite key)
   - Sort key: resourceId (individual resource identifier)
   - Store scan results including compliance status, violations, and timestamps
   - Support queries by account and time range

4. **Critical Violation Notifications**
   - SNS topic configured for email subscriptions
   - Alert on unencrypted RDS instances
   - Alert on publicly accessible S3 buckets
   - Alert on non-compliant EC2 instance types
   - Include violation details and remediation recommendations

5. **Workflow Orchestration**
   - Step Functions state machine that orchestrates the entire process
   - Fetch templates from S3 across multiple accounts
   - Parse template JSON structure
   - Validate each resource against compliance rules
   - Generate comprehensive compliance reports
   - Handle errors and retries gracefully

6. **Event-Driven Triggers**
   - EventBridge rules monitoring CloudFormation events
   - Trigger scans on CREATE_COMPLETE stack events
   - Trigger scans on UPDATE_COMPLETE stack events
   - Support filtering by account ID and region

7. **Compliance Metrics Dashboard**
   - CloudWatch dashboard with custom widgets
   - Display pass/fail rates by AWS service type
   - Track compliance score trends over time
   - Show top violating accounts and resources
   - Provide drill-down capability for detailed analysis

8. **Report Storage and Archival**
   - S3 bucket for storing compliance reports
   - Versioning enabled for audit trail
   - Lifecycle rules to transition reports older than 90 days to Glacier
   - Organized structure by account and date
   - Encryption at rest with S3-managed keys

9. **Cross-Account Security**
   - IAM roles in each target account
   - Trust relationships allowing sts:AssumeRole from central account
   - External ID requirement for additional security
   - Least privilege permissions for reading CloudFormation templates
   - Secure credential management

10. **Performance Monitoring**
    - X-Ray tracing enabled on all Lambda functions
    - X-Ray tracing enabled on Step Functions state machine
    - Track execution time for template parsing
    - Identify performance bottlenecks in validation logic
    - Monitor API call patterns and latencies

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **AWS Config** for defining compliance rules
- Use **Lambda** (Python 3.9 runtime) for template parsing and validation
- Use **DynamoDB** for storing scan results with composite keys
- Use **SNS** for critical violation notifications
- Use **Step Functions** for workflow orchestration
- Use **EventBridge** for event-driven CloudFormation monitoring
- Use **CloudWatch** for metrics dashboard and custom widgets
- Use **S3** for compliance report storage with lifecycle policies
- Use **IAM** for cross-account roles with assume permissions
- Use **X-Ray** for distributed tracing and performance analysis
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: resource-name-environment-suffix
- Deploy to **us-east-1** region
- Lambda functions must be in lib/lambda/ directory
- All resources must be destroyable (no Retain policies, RDS with SkipFinalSnapshot: true)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All named resources (S3 buckets, Lambda functions, DynamoDB tables, SNS topics, IAM roles) must include an environmentSuffix parameter reference using CloudFormation intrinsic functions like !Sub
- **Destroyability**: All resources must be fully destroyable without manual intervention. No DeletionPolicy: Retain allowed. RDS instances must have SkipFinalSnapshot: true and DeletionProtection: false. S3 buckets must not have retention policies that block deletion.
- **Lambda Runtime**: Use Python 3.9 runtime. For Node.js runtimes 18 or higher, be aware that AWS SDK v2 is not included by default - you must bundle AWS SDK v3 or include it in deployment package.
- **AWS Config Limitation**: Do NOT create AWS Config Recorder or Configuration Aggregator resources in the template. AWS Config allows only one recorder per account per region. Assume AWS Config is already enabled in the account.
- **Cross-Account IAM**: When creating cross-account IAM roles, use service principals or specific account ARNs in trust policies. Test assume-role permissions thoroughly.

### Constraints

- Lambda functions must parse CloudFormation JSON templates and extract all resource definitions
- DynamoDB queries must support filtering by account ID and timestamp range efficiently
- SNS notifications must include enough context for security teams to take immediate action
- Step Functions must handle long-running scans across dozens of templates without timeout
- EventBridge rules must filter events to avoid unnecessary Lambda invocations
- CloudWatch custom metrics must accurately calculate compliance percentage
- S3 lifecycle policies must preserve recent reports while archiving old data to reduce costs
- Cross-account IAM roles must use external IDs to prevent confused deputy attacks
- X-Ray tracing must not significantly impact Lambda function performance
- Config Rules must be flexible enough to add new compliance criteria without infrastructure changes
- All resources must include appropriate tags for cost allocation and resource management
- Lambda functions must handle API throttling and implement exponential backoff
- DynamoDB table must scale automatically to handle variable scan volumes

## Success Criteria

- **Functionality**: System successfully scans CloudFormation templates across multiple accounts, validates against all Config Rules, stores results in DynamoDB, and sends notifications for critical violations
- **Performance**: Template parsing completes within 30 seconds per template, Step Functions workflows complete within 5 minutes for batches of 20 templates
- **Reliability**: System handles CloudFormation events without message loss, retries failed validations, and maintains accurate compliance scores
- **Security**: Cross-account access uses secure assume-role patterns with external IDs, all data encrypted at rest and in transit, IAM follows least privilege
- **Resource Naming**: All resources include environmentSuffix parameter for unique identification
- **Code Quality**: CloudFormation JSON templates are well-structured, Lambda functions in Python 3.9 have comprehensive error handling, code is documented with inline comments
- **Testing**: Unit tests cover template parsing logic and validation rules, integration tests verify end-to-end workflows using deployed resources
- **Monitoring**: X-Ray traces provide visibility into execution flow, CloudWatch dashboard shows real-time compliance metrics

## What to deliver

- Complete CloudFormation JSON template defining all infrastructure resources
- AWS Config Rules for S3 encryption, RDS encryption, and EC2 instance types
- Lambda function code (Python 3.9) for parsing CloudFormation templates from S3
- Lambda function code for validating resources against Config Rules
- Step Functions state machine definition in Amazon States Language (ASL) JSON
- DynamoDB table schema with partition key accountId#timestamp and sort key resourceId
- SNS topic with email subscription configuration
- EventBridge rules for CloudFormation CREATE_COMPLETE and UPDATE_COMPLETE events
- CloudWatch dashboard JSON definition with custom widgets for compliance metrics
- S3 bucket configuration with versioning and Glacier lifecycle rules
- Cross-account IAM roles with sts:AssumeRole trust policies and external ID
- X-Ray tracing configuration for Lambda functions and Step Functions
- Unit tests validating template parsing and compliance rule evaluation
- Integration tests using cfn-outputs/flat-outputs.json for deployed resource testing
- Documentation explaining the architecture, components, and deployment process
