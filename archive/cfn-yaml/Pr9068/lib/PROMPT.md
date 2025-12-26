I need help creating a secure AWS infrastructure using CloudFormation YAML templates that establishes a comprehensive security monitoring and access control system with integrated service connectivity.

## Infrastructure Integration Requirements:

Create IAM roles with trust relationships for cross-account access, with policies that grant minimal KMS key permissions for encryption operations. These roles should connect to CloudTrail logging services which capture AWS API activity and encrypt audit logs using customer-managed KMS keys, delivering encrypted logs to S3 buckets protected by bucket policies requiring server-side encryption.

Configure AWS Security Hub to aggregate findings from IAM Access Analyzer policy validation, CloudTrail anomaly detection, and resource compliance checks. Security Hub should integrate with SNS topics to send critical security events for automated incident response workflows.

Implement MFA enforcement policies that integrate with IAM user authentication flows, where IAM policies require MFA authentication through aws:MultiFactorAuthPresent condition checks. Support FIDO2 passkeys through IAM identity providers that connect to external authentication systems.

Set up KMS customer-managed keys that integrate with multiple AWS services (S3, CloudTrail, Security Hub) to provide encryption at rest, with key policies that restrict access to specific IAM roles and cross-service integrations. These KMS keys should connect to CloudTrail for audit logging of key usage activities.

Create security groups that connect VPC resources with minimal required access, integrating with AWS Config rules to validate security group configurations and report compliance findings to Security Hub. Implement resource-based policies on S3 buckets and other services that work in conjunction with IAM policies for defense-in-depth access control.

Configure CloudTrail with data events enabled that feeds into Security Hub for real-time security monitoring, creating an integrated audit trail that connects API calls, resource access patterns, and security compliance validation across AWS services.

The solution should demonstrate how these security services work together to create a comprehensive security posture with automated monitoring, compliance validation, and incident response capabilities.

Please provide the infrastructure code as CloudFormation YAML templates with one code block per file.