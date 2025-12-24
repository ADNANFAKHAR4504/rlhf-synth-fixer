# Security Configuration as Code Infrastructure Requirements

I need to implement a comprehensive security configuration infrastructure using AWS CloudFormation that establishes foundational security services for our cloud environment. The infrastructure should provide threat detection, compliance monitoring, and security posture management.

## Core Security Services Required

Deploy the following AWS security services with proper integration:

1. **Amazon GuardDuty** - Enable threat detection with Extended Threat Detection (XTD) for container workloads and multi-stage attack detection
2. **AWS Security Hub** - Implement the new unified security solution with CSPM capabilities for centralized security findings management  
3. **AWS Config** - Set up configuration recording and compliance rules for resource compliance monitoring
4. **AWS CloudTrail** - Enable API logging and activity monitoring across all regions
5. **Amazon Macie** - Configure sensitive data discovery and classification

## Infrastructure Components

The CloudFormation template should include:

- IAM roles and policies for each security service with least privilege access
- Cross-service integration to enable Security Hub to aggregate findings from GuardDuty, Config, and Macie
- CloudWatch alarms and SNS notifications for critical security events
- S3 buckets for CloudTrail logs and Config snapshots with proper encryption and access controls
- KMS keys for encryption of security service data
- Resource tagging strategy for compliance and cost tracking

## Configuration Requirements

- Deploy to us-west-2 region
- Use environment-based naming with configurable suffix parameter
- Enable all security services with reasonable default configurations that minimize deployment time
- Configure Security Hub to use the new Resources view and OCSF data format
- Set up GuardDuty with EKS protection if applicable
- Create Config rules for common security compliance checks
- Ensure all resources have deletion policies appropriate for security data retention

## Integration and Automation

- Configure automatic remediation workflows where possible
- Set up proper cross-service permissions for integrated security findings
- Enable Security Hub CSPM for posture management
- Configure event-driven responses to critical findings

Please generate the complete CloudFormation YAML template that implements this security infrastructure following AWS best practices for security service deployment.