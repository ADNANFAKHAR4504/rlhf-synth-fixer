Hey team,

We have a critical requirement for our financial services infrastructure. The compliance team needs automated security monitoring and remediation capabilities across our AWS environment. I've been tasked with implementing a comprehensive security compliance framework using **CDKTF with Python** that can continuously monitor our resources and automatically fix non-compliant configurations.

The business is concerned about manual compliance checks taking too long and human error in remediation. They want detective controls that identify security violations immediately and automated remediation that fixes issues within minutes. We need this deployed across multiple regions with centralized visibility into our security posture.

Our regulatory requirements are strict. We must maintain audit trails of all remediation actions, track configuration changes continuously, and ensure all resources meet security baselines. The solution needs to integrate with AWS native services for compliance reporting and provide real-time alerts for critical violations.

## What we need to build

Create an automated security compliance monitoring and remediation system using **CDKTF with Python** for a production financial services environment.

### Core Requirements

1. **AWS Config Multi-Region Monitoring**
   - Deploy AWS Config with configuration recorder in us-east-1, us-west-2, and eu-west-1
   - Create configuration aggregator in us-east-1 that collects data from all three regions
   - Set up S3 bucket for Config snapshots and history
   - Use correct IAM role with managed policy: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole

2. **Custom Config Rules for Compliance**
   - Create custom Config rules that check S3 bucket encryption status
   - Create custom Config rules that check S3 bucket versioning status
   - Rules must evaluate existing resources and new changes
   - Rules should trigger evaluation on configuration changes

3. **Lambda-Based Auto-Remediation**
   - Implement Lambda functions that enable versioning on non-compliant S3 buckets
   - Implement Lambda functions that enable KMS encryption on non-compliant S3 buckets
   - Lambda must use ARM64 architecture and Python 3.9 runtime for cost optimization
   - Remediation must complete within 5 minutes of detecting non-compliance
   - Lambda needs IAM permissions for S3 configuration changes

4. **AWS Security Hub Integration**
   - Configure Security Hub in all three regions
   - Enable CIS AWS Foundations Benchmark standard
   - Aggregate findings from AWS Config and GuardDuty
   - Security Hub should be the centralized dashboard for compliance status

5. **GuardDuty Multi-Region Deployment**
   - DO NOT create GuardDuty detectors in code (account-level limitation - one detector per account/region already exists)
   - Document that GuardDuty should be manually enabled if not already active
   - Configure Security Hub to receive GuardDuty findings from all three regions
   - GuardDuty findings should be exported to Security Hub automatically

6. **IAM Password Policy**
   - Create account password policy with minimum 14 characters
   - Require uppercase letters, lowercase letters, numbers, and symbols
   - Set password expiration and prevent password reuse
   - Enforce complexity requirements for all IAM users

7. **Centralized Audit Logging**
   - Create CloudWatch log group for all remediation actions
   - Set retention period to 90 days for compliance
   - Log all Lambda execution results and remediation outcomes
   - Include resource ARN, compliance status, and remediation timestamp in logs

8. **Resource Tagging with Aspects**
   - Use CDKTF aspects to apply mandatory tags to all resources
   - Required tags: CostCenter, Environment, ComplianceLevel
   - Tags must be applied automatically during resource creation
   - Ensure tags are propagated to all child resources

9. **SNS Notifications for Critical Issues**
   - Create SNS topic for critical compliance violations
   - Configure CloudWatch Events/EventBridge to publish to SNS
   - Send notifications for high-severity Config rule violations
   - Include resource details and violation type in notification

10. **Multi-Region Architecture**
    - Deploy Config, Security Hub, and CloudWatch Logs in all three regions
    - Centralize aggregation and alerting in us-east-1
    - Ensure cross-region access for Config aggregator
    - Regional resources must be independently deployable

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **AWS Config** for continuous configuration monitoring
- Use **Lambda** for automated remediation with ARM64 and Python 3.9
- Use **Security Hub** for centralized security findings
- Use **CloudWatch Logs** for audit trail with 90-day retention
- Use **SNS** for critical compliance notifications
- Use **IAM** for password policy and least-privilege permissions
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** as primary region with us-west-2 and eu-west-1 as secondary
- All Lambda functions must use AWS SDK v3 compatible patterns for Node.js 18+ compatibility

### Deployment Requirements (CRITICAL)

- All resources MUST be fully destroyable (no RemovalPolicy.RETAIN or DeletionProtection)
- All named resources MUST include environmentSuffix variable for unique naming
- DO NOT create GuardDuty detectors in code (one detector per account/region limit exists)
- Use correct AWS Config IAM role: arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
- Lambda functions MUST be compatible with AWS SDK v3 (avoid deprecated aws-sdk v2)
- S3 buckets for Config must have versioning enabled and KMS encryption
- Config recorder requires proper SNS topic and S3 bucket configuration
- CloudWatch log groups must specify retention period explicitly

### Constraints

- All S3 buckets must have versioning enabled and KMS server-side encryption
- IAM password policy must enforce minimum 14 characters with complexity requirements
- Security Hub must aggregate findings from Config and GuardDuty across all regions
- Config rules must automatically remediate non-compliant resources within 5 minutes
- All remediation actions must be logged to centralized CloudWatch log group
- Lambda functions must use ARM64 architecture for cost optimization
- All resources must be tagged with CostCenter, Environment, and ComplianceLevel
- No hardcoded values - use variables and parameters
- Proper error handling and logging for all Lambda functions
- Follow AWS Well-Architected security best practices

## Success Criteria

- **Functionality**: Config monitors all three regions, rules detect non-compliance, Lambda automatically remediates violations
- **Performance**: Remediation completes within 5 minutes of detection
- **Reliability**: Multi-region deployment with centralized aggregation in us-east-1
- **Security**: All S3 buckets encrypted with KMS, IAM password policy enforced, Security Hub enabled
- **Audit**: All remediation actions logged with 90-day retention, SNS notifications for critical issues
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: Well-structured Python CDKTF code with proper error handling
- **Destroyability**: All resources can be destroyed without manual intervention
- **Compliance**: CIS AWS Foundations Benchmark enabled, continuous monitoring active

## What to deliver

- Complete CDKTF Python implementation with multi-region Config deployment
- AWS Config aggregator in us-east-1 collecting from all three regions
- Custom Config rules for S3 encryption and versioning checks
- Lambda functions for automated remediation with ARM64 and Python 3.9
- Security Hub integration with CIS benchmark enabled
- IAM password policy with complexity requirements
- CloudWatch log group with 90-day retention for audit trail
- SNS topic for critical compliance notifications
- CDKTF aspects for automatic resource tagging
- Documentation on GuardDuty manual setup requirements
- Unit tests for all components
- Deployment instructions and architecture documentation