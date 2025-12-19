A SaaS company needs to enforce encryption standards on all resources.

Write a YAML CloudFormation template that:

- Provisions S3 buckets with mandatory encryption (AES-256/KMS)
- Enables default EBS encryption
- Applies IAM policy requiring MFA for all IAM users
- Configures AWS Config Rules to check encryption compliance

Expected output: YAML CloudFormation template validated with cfn-nag and AWS Config conformance packs.
