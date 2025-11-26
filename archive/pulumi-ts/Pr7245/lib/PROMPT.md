Hey team,

We need to build an automated infrastructure compliance scanning system for our financial services client. They're under heavy regulatory pressure and need real-time scanning of their AWS resources with detailed reporting and automated remediation capabilities. I've been asked to create this using TypeScript with Pulumi. The compliance team wants hourly scans, historical tracking, and immediate alerts when critical violations are detected.

Right now, they're manually reviewing CloudTrail logs and running ad-hoc scripts to check compliance. It's taking days to detect violations and they've had a few close calls with auditors. We need to automate the entire compliance workflow from detection through remediation, with proper audit trails for their compliance officers.

The system needs to scan EC2 instances, S3 buckets, and IAM policies against their internal compliance rules. When violations are found, it should calculate compliance scores, store the history, generate HTML reports, and automatically fix certain types of violations like unencrypted S3 buckets. For critical issues where the score drops below 70 percent, it needs to immediately notify the security team.

## What we need to build

Create an automated compliance scanning and remediation system using **Pulumi with TypeScript** for AWS infrastructure monitoring.

### Core Requirements

1. **Compliance Scanning Infrastructure**
   - Deploy AWS Config with custom rules for EC2, S3, and IAM compliance checking
   - Use the correct managed policy for Config: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
   - Configure Config recorder to track all supported resource types
   - Schedule hourly compliance scans using EventBridge with rate(1 hour)

2. **Compliance Analysis and Scoring**
   - Create Lambda function to analyze Config findings and generate compliance scores
   - Function should calculate scores based on violation severity and resource criticality
   - Memory allocation: 3008MB for processing large compliance datasets
   - Runtime: Node.js 18.x with AWS SDK version 3 (not v2)
   - Enable X-Ray tracing for performance monitoring
   - Do not set reservedConcurrentExecutions or use minimal values (1-5) only if absolutely required

3. **Historical Tracking and Reporting**
   - Store compliance history in DynamoDB with PAY_PER_REQUEST billing mode
   - Partition key: ResourceId (String)
   - Sort key: Timestamp (String)
   - Enable AWS managed KMS encryption
   - Generate HTML compliance reports and store in S3
   - S3 bucket with versioning enabled and 30-day lifecycle policy to delete old reports
   - Enable KMS server-side encryption on S3 bucket
   - Block all public access on S3 bucket

4. **Alerting and Notifications**
   - Send SNS notifications for critical violations when compliance score drops below 70 percent
   - Support both email and Lambda subscriptions on SNS topic
   - Encrypt SNS topic with KMS
   - Configure EventBridge to trigger analysis Lambda hourly
   - Ensure trigger latency within 2 minutes of detection

5. **Automated Remediation**
   - Create Lambda function for automated remediation of S3 bucket encryption violations
   - Same Lambda configuration as analysis function (3008MB, Node.js 18.x, X-Ray enabled)
   - Implement dead letter queue using SQS for failed Lambda executions
   - Connect DLQ to both analysis and remediation Lambda functions

6. **Monitoring and Observability**
   - Create CloudWatch dashboard showing compliance trends over 7 days
   - Include metrics for: compliance scores over time, violation counts by severity, remediation success rates
   - Enable CloudWatch logging for all Lambda functions
   - Log retention should follow standard practices

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Config** for resource compliance tracking
- Use **Lambda** for analysis and remediation functions
- Use **DynamoDB** for compliance history storage
- Use **S3** for HTML report storage with lifecycle policies
- Use **EventBridge** for hourly scan scheduling
- Use **SNS** for critical violation notifications
- Use **SQS** for dead letter queue on failed executions
- Use **CloudWatch** for dashboard and logging
- Use **IAM** roles with principle of least privilege
- Use **KMS** for encryption at rest across all services
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `compliance-{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** parameter for unique naming
- Resource naming format: `compliance-{resource-type}-{environmentSuffix}`
- All resources must be destroyable - use RemovalPolicy DESTROY or DeletionPolicy Delete
- FORBIDDEN: Do not use RemovalPolicy RETAIN or DeletionPolicy Retain
- AWS Config: Use managed policy `service-role/AWS_ConfigRole` or service-linked role
- Lambda Node.js 18+: Must use AWS SDK v3 (not v2) - SDK v2 not available in Node.js 18+ runtime

### Security and Compliance Constraints

- Encryption at rest: AWS KMS for all services (DynamoDB, S3, SNS, SQS)
- Encryption in transit: TLS/SSL for all communications
- IAM policies: Principle of least privilege, no wildcard permissions
- VPC deployment: Resources in private subnets where applicable
- Tagging: All resources must have CostCenter and Compliance tags
- S3 security: Block all public access, versioning enabled, encryption enabled
- Lambda security: X-Ray tracing enabled, CloudWatch logging enabled

### Constraints

- Lambda must not use reservedConcurrentExecutions or use minimal values only
- DynamoDB must use PAY_PER_REQUEST billing mode (not provisioned capacity)
- S3 lifecycle policy must delete reports after exactly 30 days
- EventBridge schedule must be hourly with rate(1 hour) expression
- SNS notifications only for scores below 70 percent threshold
- Config must use correct IAM managed policy for service role
- All resources must support full destruction (no Retain policies)

## Success Criteria

- Functionality: Hourly compliance scans with automated analysis and scoring
- Functionality: Automated remediation of S3 encryption violations
- Functionality: Historical compliance data stored in DynamoDB with correct schema
- Performance: Lambda functions execute within EventBridge 2-minute trigger window
- Performance: CloudWatch dashboard displays 7-day compliance trends
- Reliability: Dead letter queue captures failed Lambda executions
- Security: All data encrypted at rest with KMS
- Security: IAM roles follow least privilege principle
- Resource Naming: All resources include environmentSuffix for uniqueness
- Alerting: SNS notifications sent for critical violations (score < 70%)
- Reporting: HTML reports generated and stored in S3 with 30-day retention
- Code Quality: TypeScript, well-typed, production-ready, documented

## What to deliver

- Complete Pulumi TypeScript implementation in lib/tap-stack.ts
- AWS Config with custom compliance rules for EC2, S3, IAM
- Lambda functions for compliance analysis (scoring) and remediation (S3 encryption)
- DynamoDB table with ResourceId partition key and Timestamp sort key
- S3 bucket for HTML reports with 30-day lifecycle policy
- EventBridge rule for hourly scan scheduling
- SNS topic for critical violation notifications
- SQS dead letter queue for failed Lambda executions
- CloudWatch dashboard for 7-day compliance trends
- IAM roles and policies with least privilege access
- KMS keys for encryption at rest
- Stack exports: Config recorder name, DynamoDB table ARN, S3 report bucket URL
- All resources properly tagged with CostCenter and Compliance
- Unit tests for all components
- Documentation and deployment instructions in lib/README.md
