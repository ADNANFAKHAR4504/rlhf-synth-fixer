I need help creating a comprehensive security-focused AWS infrastructure using CDKTF with Go. The setup needs to meet our company's strict security standards and include the following components:

1. IAM Configuration: Implement IAM roles using solely AWS Managed Policies

2. Network Infrastructure: Create a VPC with 2 public and 2 private subnets distributed across 2 availability zones in us-west-2 for high availability. Include proper routing and NAT gateways.

3. Security Groups: Configure security groups that restrict inbound and outbound traffic to specific IP ranges only. No overly permissive rules.

4. S3 Storage: Ensure that all S3 buckets are configured to be private by default.

5. Logging Infrastructure: Enable logging for all AWS Lambda functions deployed also Set up AWS CloudTrail to capture all management events across our infrastructure for compliance auditing.

6. RDS: Use AWS KMS to encrypt RDS instances, ensuring data security.

7. Database Security: Configure KMS encryption for RDS instances using customer-managed keys. Implement proper key rotation policies and access controls following the new FIPS 140-3 Level 3 certified HSM standards.

8. Resource Management: Apply consistent tagging across all resources to support cost management and resource tracking. Include tags for environment, project, owner, and cost-center.

9. Modular Design: Structure the code to be modular and reusable, allowing for easy scaling and configuration management across different environments.

The infrastructure code should be production-ready, following AWS Well-Architected Framework security principles, and incorporate the latest 2025 security features including enhanced KMS capabilities and the new Security Hub controls. Please provide complete CDKTF Go code with one code block per file.

I want a clean two-file setup for your CDKTF Go project:

main.go → entrypoint, just instantiates my app and stack.

tap-stack.go → defines a TapStack struct where you put all AWS modules/resources.