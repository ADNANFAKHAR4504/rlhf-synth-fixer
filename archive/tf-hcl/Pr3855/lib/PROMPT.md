ROLE: You are a senior Terraform engineer specializing in AWS compliance and security governance.

CONTEXT:
A corporation with 100 AWS accounts needs GDPR and HIPAA compliance monitoring. The system must detect violations in real-time, automate remediation, and provide audit reports. Centralized logging is required for compliance.

REQUIREMENTS:
Build a complete, production-ready compliance framework using Terraform that includes:
- Real-time compliance violation detection across all accounts
- Automated remediation of common security issues
- Centralized audit logging and reporting
- GDPR and HIPAA compliance tracking and evidence collection
- Multi-account security posture management
- Executive dashboards and compliance reports

CONSTRAINTS:
- All Terraform resources MUST be in a single file (tap_stack.tf)
- Use AWS best practices for security (IAM least privilege, KMS encryption, cross-account access)
- Design for multi-account organization with centralized management
- Implement proper tagging strategy for compliance tracking
- Solutions must be deployable and functional in a real-world AWS environment with 100+ accounts
- Ensure resources are properly configured for production compliance workloads

AWS SERVICES TO USE:
- AWS Organizations: Multi-account management and organizational units structure
- AWS Config: Compliance rules monitoring and configuration tracking across accounts
- AWS Security Hub: Centralized security findings aggregation from all accounts
- AWS GuardDuty: Threat detection and intelligent threat analysis
- AWS CloudTrail: Audit trail with centralized logging in management account
- Lambda: Automated remediation functions for compliance violations
- EventBridge: Event-driven compliance event routing and automation
- DynamoDB: Violation tracking, remediation history, and compliance state storage
- QuickSight: Executive dashboards and compliance reporting visualizations
- S3: Audit log storage with encryption, versioning, and lifecycle policies
- KMS: Encryption keys for GDPR and HIPAA data protection requirements
- SNS: Alert notifications for critical compliance violations
- CloudWatch: Metrics, logs aggregation, and operational monitoring
- IAM: Cross-account roles and policies with least privilege access control

DELIVERABLES:
1) tap_stack.tf (all resources in a single file with logical organization using comments)
2) variables.tf (configurable parameters like region, organization ID, account IDs, compliance standards, etc.)

ARCHITECTURE REQUIREMENTS:
- AWS Organizations with organizational units for account grouping
- Config Rules deployed across all member accounts for compliance monitoring
- Config Aggregator in management account collecting findings from all accounts
- Security Hub with standards enabled (AWS Foundational Security, CIS, PCI-DSS)
- GuardDuty enabled in all accounts with centralized findings
- CloudTrail organization trail with encryption and log file validation
- S3 buckets for centralized logs with versioning, encryption, and MFA delete
- Lambda functions for automated remediation (stop non-compliant instances, enable encryption, etc.)
- EventBridge rules matching compliance events and triggering remediation
- DynamoDB tables for tracking violations, remediation actions, and compliance status
- SNS topics for alert routing to security and compliance teams
- CloudWatch Logs for Lambda execution and centralized log aggregation
- CloudWatch dashboards for real-time compliance metrics
- QuickSight datasets and dashboards for executive compliance reporting
- IAM roles for cross-account access with proper trust relationships
- KMS keys for encrypting logs, data stores, and sensitive information

FUNCTIONAL REQUIREMENTS:
- Real-time detection: Config Rules → EventBridge → Lambda remediation
- Centralized logging: CloudTrail → S3 → Config Aggregator → Security Hub
- Automated remediation: EventBridge event → Lambda function → Fix violation → DynamoDB tracking
- Compliance reporting: Config data → DynamoDB → QuickSight dashboard
- Threat detection: GuardDuty findings → Security Hub → SNS alerts
- Audit trail: All actions logged to CloudTrail with immutable storage in S3
- Multi-account governance: Organizational policies and SCPs for baseline security
- Evidence collection: Automated compliance evidence gathering for audits

OUTPUT FORMAT (IMPORTANT):
- Provide each file in a separate fenced code block with its filename as the first line in a comment
- Use clear section comments to organize resources in tap_stack.tf (e.g., # ========== ORGANIZATION RESOURCES ==========)
- Include inline comments explaining critical compliance configurations
- Follow HCL best practices (consistent formatting, proper use of locals, data sources where appropriate)
- Ensure all resource dependencies are properly defined using Terraform references
- Include outputs for critical resource ARNs, dashboard URLs, and compliance endpoints

```hcl
# tap_stack.tf
...
```

```hcl
# variables.tf
...
```

VALIDATION CRITERIA:
- terraform init should run without errors
- terraform validate should pass
- terraform plan should show a valid execution plan
- All resources should be properly linked (no hardcoded ARNs)
- IAM policies should follow least privilege
- All sensitive data should be encrypted with KMS
- The infrastructure should be ready for terraform apply in a real AWS Organization
- Config Rules should be deployable across all member accounts
- Security Hub and GuardDuty should aggregate findings from all accounts
