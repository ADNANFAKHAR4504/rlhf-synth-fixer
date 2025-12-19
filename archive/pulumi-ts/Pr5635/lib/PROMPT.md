Hey team,

We need to build a comprehensive infrastructure compliance monitoring system for our financial services company. The compliance team has been struggling with manual audits and delayed violation detection, and they've asked us to automate the entire process. This needs to be implemented using **Pulumi with TypeScript** and deployed to the ap-southeast-1 region.

The business is under increasing pressure from regulators to demonstrate continuous compliance monitoring across our AWS infrastructure. Currently, we're finding out about violations days or weeks after they occur, which is unacceptable. We need real-time monitoring, automated alerts, and a complete audit trail of all compliance checks.

This is a complex project that requires integration with multiple AWS security and operational services. The system needs to scan our resources continuously, detect violations within minutes, and provide actionable insights through dashboards and alerts. We also need to integrate with AWS's native security services like Security Hub and Inspector for comprehensive coverage.

## What we need to build

Create an automated infrastructure compliance monitoring system using **Pulumi with TypeScript** that continuously monitors AWS resources for policy violations and security issues.

### Core Requirements

1. **Resource Compliance Scanning**
   - Lambda function scanning resources every 15 minutes for missing required tags (Environment, Owner, CostCenter)
   - Automated scanning of EC2 instances, S3 buckets, and Lambda functions
   - CloudWatch custom metrics for tracking compliance violations across all monitored resources
   - S3 bucket storing compliance scan results with lifecycle policies for 90-day retention

2. **Security Monitoring and Alerting**
   - CloudWatch alarms for unencrypted S3 buckets and EC2 instances without proper security groups
   - SNS topic for compliance alert notifications with email subscription
   - CloudWatch Logs metric filters to detect unauthorized API calls
   - CloudWatch dashboard showing compliance status across all monitored resources with 60-second auto-refresh

3. **Event-Driven Architecture**
   - EventBridge rules triggering scans on resource creation or modification events
   - Precise event patterns to avoid unnecessary Lambda invocations
   - Lambda function integration with 5 minutes maximum execution timeout

4. **Advanced Security Services Integration**
   - AWS Security Hub with automated remediation through Lambda functions
   - AWS Inspector for automated security assessments of EC2 and ECR
   - AWS Audit Manager for automated compliance evidence collection
   - AWS Detective for security investigation and root cause analysis

5. **Operational Intelligence**
   - Amazon DevOps Guru for ML-powered operational insights
   - AWS Compute Optimizer recommendations engine with automated reporting
   - AWS Health Dashboard API integration for proactive incident management
   - AWS Well-Architected Tool integration for architecture review automation

6. **Infrastructure Testing and Drift Detection**
   - Infrastructure as code testing using Pulumi's testing framework
   - Infrastructure drift detection with automated remediation
   - Automated security scanning in CI/CD pipeline before deployment

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **ap-southeast-1** region
- Lambda functions using Node.js 18+ runtime
- All Lambda functions: environment variables for configuration, no hardcoded values
- CloudWatch alarms: treat_missing_data set to 'breaching'
- S3 buckets: Must use SSE-S3 encryption
- SNS topic: Server-side encryption with AWS KMS
- IAM roles: Principle of least privilege with specific resource ARNs
- Architecture: Single VPC with Lambda functions in private subnets
- AWS API Access: Via VPC endpoints for S3, DynamoDB, and other services

### Constraints

- Lambda execution timeout: 5 minutes maximum
- Compliance violation detection: Alert within 5 minutes
- CloudWatch dashboard: Auto-refresh every 60 seconds
- S3 compliance scan results: 90-day retention lifecycle policy
- EventBridge rules: Precise event patterns to minimize unnecessary invocations
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging in all Lambda functions
- Disaster recovery: RTO less than 1 hour, RPO less than 15 minutes
- Multi-region deployment capability for high availability
- Cost allocation tags and AWS Cost Explorer integration for budget tracking
- Secrets and credentials with automatic rotation and zero-downtime updates

### Security and Compliance

- All S3 buckets encrypted with SSE-S3
- SNS topics encrypted with AWS KMS
- IAM roles with minimum required permissions
- VPC endpoints for private AWS API access
- Security scanning in CI/CD pipeline
- Automated remediation for common violations
- Complete audit trail of all compliance checks
- Unauthorized API call detection through CloudWatch Logs metric filters

## Success Criteria

- **Functionality**: System detects and alerts on compliance violations within 5 minutes
- **Coverage**: Monitoring of EC2 instances, S3 buckets, Lambda functions, and required tagging
- **Integration**: Full integration with Security Hub, Inspector, Audit Manager, Detective, DevOps Guru, Compute Optimizer, Health Dashboard, and Well-Architected Tool
- **Reliability**: Automated scanning every 15 minutes with event-driven immediate scans
- **Security**: All resources encrypted, IAM least privilege, VPC endpoints for private access
- **Resource Naming**: All resources include environmentSuffix following naming convention
- **Auditability**: Complete audit trail with 90-day retention in S3
- **Observability**: Real-time dashboard with compliance metrics and operational insights
- **Code Quality**: TypeScript, tested with Pulumi testing framework, well-documented
- **Disaster Recovery**: RTO under 1 hour, RPO under 15 minutes

## What to deliver

- Complete Pulumi TypeScript implementation with proper project structure
- Lambda functions for compliance scanning with Node.js 18+ runtime
- CloudWatch metrics, alarms, logs, and dashboard configuration
- SNS topic with email subscription and KMS encryption
- S3 bucket with lifecycle policies and SSE-S3 encryption
- EventBridge rules for resource creation/modification events
- AWS Security Hub integration with automated remediation
- AWS Inspector integration for security assessments
- AWS Audit Manager configuration for evidence collection
- AWS Detective integration for investigation capabilities
- Amazon DevOps Guru setup for operational insights
- AWS Compute Optimizer integration for recommendations
- AWS Health Dashboard API integration
- AWS Well-Architected Tool integration
- VPC and VPC endpoints for private AWS API access
- IAM roles and policies with least privilege
- Infrastructure testing using Pulumi testing framework
- Documentation including architecture overview and deployment instructions
