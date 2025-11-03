# Infrastructure QA and Management

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy an infrastructure compliance monitoring system. The configuration must: 1. Create CloudWatch custom metrics for tracking compliance violations across EC2 instances, S3 buckets, and Lambda functions. 2. Deploy a Lambda function that scans resources every 15 minutes for missing required tags (Environment, Owner, CostCenter). 3. Set up CloudWatch alarms for unencrypted S3 buckets and EC2 instances without proper security groups. 4. Create an SNS topic for compliance alert notifications with email subscription. 5. Implement CloudWatch Logs metric filters to detect unauthorized API calls. 6. Configure a dashboard showing compliance status across all monitored resources. 7. Store compliance scan results in an S3 bucket with lifecycle policies for 90-day retention. 8. Set up EventBridge rules to trigger scans on resource creation or modification events. Expected output: A fully automated compliance monitoring system that continuously analyzes infrastructure state, generates actionable alerts within 5 minutes of violation detection, and maintains an audit trail of all compliance checks performed. 11. Integrate AWS Security Hub with automated remediation through Lambda functions. 12. Deploy AWS Inspector for automated security assessments of EC2 and ECR. 13. Set up AWS Audit Manager for automated compliance evidence collection. 14. Implement AWS Detective for security investigation and root cause analysis. 15. Configure Amazon DevOps Guru for ML-powered operational insights. 16. Deploy AWS Compute Optimizer recommendations engine with automated reporting. 17. Set up AWS Health Dashboard API integration for proactive incident management. 18. Implement AWS Well-Architected Tool integration for architecture review automation.

---

## Additional Context

### Background
A financial services company needs to implement automated infrastructure compliance monitoring for their AWS resources. The compliance team requires real-time alerts when resources violate company policies around tagging, encryption, and access configurations.

### Constraints and Requirements
- [Lambda functions must have execution timeout of 5 minutes maximum, All S3 buckets created must use SSE-S3 encryption, CloudWatch dashboard must auto-refresh every 60 seconds, SNS topic must use server-side encryption with AWS KMS, Lambda functions must use environment variables for configuration, not hardcoded values, CloudWatch alarms must have treat_missing_data set to 'breaching', EventBridge rules must use precise event patterns to avoid unnecessary Lambda invocations, All IAM roles must follow principle of least privilege with specific resource ARNs, Must implement infrastructure as code testing using Pulumi's testing framework, All resources must support disaster recovery with RTO < 1 hour and RPO < 15 minutes, Implement cost allocation tags and AWS Cost Explorer integration for budget tracking, Must include comprehensive documentation with architecture diagrams exported as code, Implement automated security scanning in CI/CD pipeline before deployment, All secrets and credentials must use automatic rotation with zero-downtime updates, Must implement infrastructure drift detection with automated remediation, Deploy resources across multiple regions for high availability and disaster recovery]

### Environment Setup
Deployed in ap-northeast-1 region using AWS Lambda for compliance scanning logic, CloudWatch for metrics and monitoring, SNS for alert distribution, and S3 for audit log storage. Requires Pulumi CLI 3.x with TypeScript support, Node.js 18+, and AWS credentials with permissions for CloudWatch, Lambda, S3, SNS, and EventBridge. Infrastructure spans a single VPC with Lambda functions in private subnets accessing AWS APIs via VPC endpoints.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **ap-southeast-1**
