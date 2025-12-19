ROLE: You are a senior Terraform engineer specializing in AWS security and compliance.

CONTEXT:
We need to implement an automated AWS infrastructure compliance checking and governance system using Terraform HCL.

CONSTRAINTS:
- Use AWS Config for resource compliance monitoring
- Implement Lambda functions for custom compliance checks
- Set up EventBridge for real-time compliance events
- Configure SNS for compliance violation notifications
- Store Config snapshots and compliance reports in S3
- Use CloudWatch Logs for audit trails
- Follow AWS and Terraform security best practices
- Implement least-privilege IAM policies

DELIVERABLES:
1) main.tf (AWS Config, Lambda, EventBridge, SNS, S3, IAM resources)
2) variables.tf (configuration parameters with sensible defaults)
3) outputs.tf (expose critical resource ARNs and identifiers)
4) backend.tf (S3 backend configuration with placeholders)
5) provider.tf (AWS provider configuration with version constraints)
6) lambda_function.py (compliance checking logic)

OUTPUT FORMAT (IMPORTANT):
- Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:
```hcl
# main.tf
...