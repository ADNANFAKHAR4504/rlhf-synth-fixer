Generate a single AWS CloudFormation template in **YAML** that sets up secure AWS infrastructure in the **us-east-1** region, following best practices and meeting the following requirements:

- **IAM**: Implement IAM roles and policies using the least privilege principle, attach policies to roles (not users), and require MFA for all IAM users accessing the AWS Management Console. Use condition keys to restrict requests based on AWS attributes.
- **Storage Security**: Encrypt all S3 buckets, RDS instances, and EBS volumes at rest (AWS KMS or managed keys). Enable logging for all S3 buckets, storing logs in a dedicated logging bucket.
- **Secrets & Keys**: Use AWS Secrets Manager for key rotation and secret storage; automatically rotate API credentials.
- **Networking**: Deploy all EC2 instances inside a specific VPC and block default VPC creation. Restrict traffic with security groups, blocking all traffic except explicitly allowed ports. Ensure environment isolation between development and production.
- **Monitoring & Logging**: Enable audit logging for all infrastructure, CloudWatch detailed monitoring for EC2, and enforce least privilege access for Lambda functions.
- **Policies**: Create a least privilege IAM policy for applications accessing S3 buckets.

**Constraints**:
- All resources must be declared in YAML format within a single CloudFormation template.
- Disallow creation of default VPC.
- Tag all resources with `env` (environment), `owner` (team ownership), and `project` (project name).
- All EC2 and RDS resources must be launched only in the `us-east-1` region.
- Include Outputs for key resources and identifiers.

**Output**:
- A complete, deployable CloudFormation YAML file that passes AWS compliance checks.
- Use `Parameters`, `Mappings`, `Resources`, and `Outputs` sections where applicable.
- Include inline comments explaining how each security requirement is satisfied.
