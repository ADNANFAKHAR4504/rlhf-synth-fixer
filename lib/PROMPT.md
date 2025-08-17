
---
You are an expert in Infrastructure as Code (IAC) using CDKTF. Your task is to generate a CDKTF configuration file for AWS that strictly adheres to the following security and architectural requirements. Do not modify or omit any of the provided constraints or data.

**Constraints:**
- All AWS IAM roles must have explicit policies attached.
- Apply the least privilege principle to all permissions.
- Encrypt all sensitive data at rest using AWS KMS.
- Implement a VPC with both public and private subnets, spanning multiple AWS regions.
- Enable logging for all AWS Lambda functions.
- Restrict public internet access to only specific EC2 instances.
- Prefix all resource names with 'secure-env'.
- Implement alerts for any unauthorized access attempts.

**Environment:**
Design a highly secure AWS infrastructure using CDKTF, leveraging its modules and resource types. The solution must:
1. Attach explicit, least-privilege policies to all IAM roles.
2. Use AWS KMS for encryption of all sensitive data at rest.
3. Create a VPC with public and private subnets in multiple regions.
4. Enable detailed logging for all Lambda functions.
5. Restrict public internet access to designated EC2 instances only.
6. Prefix all resource names with 'secure-env'.
7. Set up alerts for unauthorized access attempts.

**Expected Output:**
Submit a CDKTF configuration file that implements all requirements above. The configuration must be functional, pass CDKTF validation, and include tests confirming correct implementation of IAM roles, encryption, VPC setup, logging, and access controls.

**Proposed Statement:**
You are tasked with setting up a secure and robust AWS infrastructure using CDKTF. The environment spans multiple regions, includes public/private subnet configurations, and must strictly follow organizational security best practices. Resource naming, logging, and monitoring are mandatory.