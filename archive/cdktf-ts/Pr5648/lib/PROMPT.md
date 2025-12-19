Develop a CDKTF (TypeScript) program code that provisions a secure AWS baseline meeting SOC 2-like requirements.

- The program should create IAM roles with MFA enforcement, KMS keys with automatic rotation, AWS Config rules for encryption compliance, Secrets Manager with credential rotation, and CloudWatch alarms for unauthorized activity.
- Ensure all resources are properly tagged and output the KMS key ARNs, IAM role ARN, and Config rule names for integration with external monitoring tools.
- The deployment should be fully automated with minimal user input and reusable for multiple environments.
- All code should be in one main file.
- Use ap-southeast-1 as the region.