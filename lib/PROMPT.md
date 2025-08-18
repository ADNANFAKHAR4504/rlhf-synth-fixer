This prompt outlines the requirements for generating a secure AWS infrastructure using Terraform HCL.

Requirements:
- Every AWS IAM role must have explicit policies attached, with permissions limited to the minimum necessary for each workload.
- Sensitive data at rest must be encrypted with AWS KMS.
- The architecture includes a VPC with both public and private subnets, spanning more than one AWS region.
- All AWS Lambda functions must have logging enabled.
- Public internet access should be restricted to only explicitly designated EC2 instances.
- All resource names must start with the prefix `secure-env`.
- The system must provide alerting for any unauthorized access attempts.

Environment:
Design an AWS environment using Terraform HCL that prioritizes security and uses Terraform modules and resources appropriately. The solution should:
1. Apply least-privilege, explicit policies to all IAM roles.
2. Use AWS KMS for all encryption at rest.
3. Define a VPC with public and private subnets in multiple regions.
4. Enable logging on every Lambda function.
5. Ensure only specific EC2 instances have public internet access.
6. Prefix all resource names with `secure-env`.
7. Include alerting for unauthorized access attempts.

Deliverable:
Produce a complete, functional Terraform HCL configuration file that satisfies all requirements above. The configuration must validate successfully and be ready for use. Include verification steps or test code confirming correct implementation of IAM roles, encryption, VPC setup, logging, and access controls.

Instructions:
- Do not modify or omit any requirements.
- Use Terraform idioms and recommended security practices.
- Resource naming and security controls must be consistent throughout.