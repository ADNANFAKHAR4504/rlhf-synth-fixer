Create a Pulumi program in TypeScript contained entirely within a single file to design a security-hardened AWS environment with automated compliance controls for a financial services company following a zero-trust architecture.

Requirements:

    1.	Create a KMS key hierarchy with separate keys for PII, financial, and general data classifications — each with automatic rotation enabled and multi-region replication to us-west-2.
    2.	Implement IAM permission boundaries restricting maximum allowed permissions for all IAM roles created in the account.
    3.	Deploy AWS Secrets Manager with automatic 30-day credential rotation for database credentials and API keys.
    4.	Configure S3 bucket policies that enforce encryption-in-transit (TLS 1.2+) and encryption-at-rest using customer-managed KMS keys.
    5.	Set up cross-account IAM roles requiring MFA and external ID validation for administrative access.
    6.	Create CloudWatch log groups with KMS encryption, tamper protection, and 365-day retention.
    7.	Implement Service Control Policies (SCPs) preventing disabling of CloudTrail or equivalent audit mechanisms.
    8.	Configure AWS Config rules to continuously monitor compliance against CIS benchmarks.
    9.	Deploy Lambda functions (within isolated VPCs, no internet access) to automatically remediate non-compliant resources.
    10.	Set up SNS topics with server-side encryption and KMS-managed keys for sending security violation alerts via encrypted email.

Expected Output:
• A Pulumi stack that provisions all resources with correct dependencies and clean teardown on stack destroy.
• Outputs:
• KMS Key ARNs (PII, Financial, General)
• IAM Role ARNs
• Compliance Report showing all enabled security controls

Environment:
• Region: us-east-1 (primary), with replication to us-west-2
• Tools: Pulumi CLI v3.x, Python 3.9+, boto3, AWS CLI
• Identity: Managed through IAM
• Encryption: Managed through KMS
• Monitoring: AWS Config + CloudWatch
