# Infrastructure Compliance Monitoring System

Hey team,

We need to build an automated infrastructure compliance monitoring system for our production environment. I've been asked to create this using **AWS CDK with TypeScript**. The business wants a comprehensive solution that continuously monitors our AWS resources for compliance violations and sends alerts when things drift from our security standards.

This is for our production compliance and audit requirements. The system needs to track resource configurations over time, run automated compliance checks, and generate reports that we can hand to auditors. We also need different levels of alerting based on violation severity.

## What we need to build

Create an automated compliance monitoring infrastructure using **AWS CDK with TypeScript** for production compliance tracking and audit support.

### Core Requirements

1. **AWS Config Setup**
   - Deploy AWS Config to continuously monitor and record AWS resource configurations
   - Enable Config in multiple regions specified through CDK context variables
   - Configure delivery channel to send configuration snapshots every 6 hours
   - Store all configuration data in a dedicated S3 bucket

2. **Custom Config Rules**
   - S3 bucket encryption compliance check
   - EC2 instance type validation check
   - RDS backup retention compliance check
   - Each rule should evaluate resources automatically

3. **Compliance Storage**
   - Dedicated S3 bucket for configuration snapshots and compliance history
   - Lifecycle policies for cost optimization
   - Proper bucket configuration and security

4. **Compliance Analysis**
   - Lambda function that analyzes Config evaluation results
   - Generates compliance reports from evaluation data
   - Processes compliance violations and categorizes by severity
   - Must be Node.js 18+ compatible (do not use AWS SDK v2)

5. **Alert System**
   - SNS topics for compliance violation notifications
   - Separate topics for each severity level: critical, high, medium, low
   - Lambda should send notifications to appropriate topic based on violation severity

6. **IAM Security**
   - IAM roles with least-privilege access for Config service
   - IAM role for Lambda execution with minimal required permissions
   - Follow AWS best practices for service roles

7. **Multi-Region Support**
   - Infrastructure should support deployment to multiple regions
   - Use CDK context variables to specify target regions
   - Config should be enabled in all specified regions

8. **Resource Tagging**
   - All resources must be tagged with: CostCenter, Environment, ComplianceLevel
   - Consistent tagging across all infrastructure components

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **AWS Config** for continuous configuration monitoring
- Use **Lambda** (Node.js 18+) for compliance analysis and reporting
- Use **SNS** for multi-level notifications
- Use **S3** for configuration data storage
- Use **IAM** for service roles and permissions
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region (with multi-region support via context)
- Config delivery channel: 6-hour snapshot interval

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (NO RemovalPolicy.RETAIN)
- All resources must be destroyable (NO deletionProtection: true)
- Resource naming MUST include environmentSuffix parameter
- Lambda must use Node.js 18+ runtime (no AWS SDK v2 dependencies)
- Use service-role/AWS_ConfigRole for AWS Config IAM managed policy

### Constraints

- Must follow AWS security best practices
- IAM roles must use least-privilege principle
- Lambda function must handle errors gracefully
- S3 bucket must have lifecycle policies for cost management
- Config rules must be non-intrusive (monitoring only, no remediation)
- Support multi-region deployment through context variables
- All resources properly tagged for cost tracking and compliance
- System must support audit requirements (full history retention with lifecycle)

## Success Criteria

- **Functionality**: Config monitors resources, rules evaluate compliance, Lambda generates reports
- **Alerting**: SNS notifications sent for violations with correct severity routing
- **Multi-Region**: Infrastructure deploys to multiple regions via context
- **Security**: IAM follows least-privilege, proper service role configuration
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be cleanly destroyed (no retain policies)
- **Code Quality**: TypeScript, well-tested, documented, production-ready

## What to deliver

- Complete AWS CDK TypeScript implementation
- AWS Config service with custom rules
- Lambda function for compliance analysis (Node.js 18+)
- SNS topics for multi-level alerting
- S3 bucket with lifecycle policies
- IAM roles with least-privilege access
- Multi-region support via CDK context
- Unit tests for all components
- Documentation and deployment instructions