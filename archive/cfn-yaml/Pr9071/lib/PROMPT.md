# Security Configuration as Code Infrastructure

I need CloudFormation infrastructure that integrates AWS security services for threat detection, compliance monitoring, and security posture management.

## Service Integration Architecture

Amazon GuardDuty detects threats and publishes findings to AWS Security Hub as the centralized aggregation point. AWS Config continuously records resource configurations and evaluates compliance rules, sending compliance findings to Security Hub. CloudTrail logs all API activity across regions to an encrypted S3 bucket with KMS key protection. Amazon Macie scans the CloudTrail S3 bucket and other S3 buckets for sensitive data, publishing classification findings to Security Hub.

Security Hub aggregates all findings from GuardDuty, Config, Macie, and CloudTrail Insights, applying the new unified CSPM capabilities with OCSF data format. When Security Hub detects critical findings, CloudWatch Events rules trigger SNS topic notifications to alert security teams.

IAM roles grant GuardDuty access to analyze VPC Flow Logs and DNS logs, Config access to record resource configurations, CloudTrail write permissions to the S3 bucket with KMS decrypt/encrypt permissions, Macie access to scan S3 buckets, and Security Hub permissions to receive findings from all integrated services.

Config rules validate that S3 buckets have encryption enabled, CloudTrail is active in all regions, and GuardDuty is enabled. When Config detects non-compliant resources, it publishes findings to Security Hub and optionally triggers automatic remediation through Systems Manager Automation documents.

The S3 bucket for CloudTrail logs enforces bucket policies rejecting unencrypted uploads and blocks public access. The KMS key policy grants CloudTrail and Config encrypt permissions while restricting decrypt permissions to authorized IAM roles.

Resources use environment-based naming with a configurable suffix parameter for multi-environment deployment to us-west-2.

GuardDuty enables Extended Threat Detection including EKS protection and multi-stage attack detection. Security Hub activates the new Resources view for unified security posture visibility. Macie runs scheduled classification jobs scanning S3 buckets and sends alerts when discovering sensitive data patterns.

CloudWatch alarms monitor Security Hub finding counts and trigger SNS notifications when critical or high severity findings exceed thresholds. EventBridge rules detect specific finding types and invoke automated response workflows.