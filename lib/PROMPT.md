ROLE: You are a senior Terraform engineer specializing in security and compliance.

CONTEXT:
A banking application needs to manage credentials for 100,000 daily users with automated rotation and audit compliance. The system must provide secure credential storage, automated rotation, comprehensive monitoring, and integration with existing database services.

CONSTRAINTS:
- Must use AWS Secrets Manager for credential storage and automated rotation
- Implement Lambda functions for custom rotation logic
- Use RDS MySQL with IAM authentication for secure database access
- Rotation events must be managed via EventBridge for scheduling and orchestration
- Full audit trail via CloudTrail for compliance requirements
- Real-time monitoring and alerting using CloudWatch metrics and alarms
- Follow principle of least privilege with IAM roles and policies
- Support rotation for 100,000+ credentials with minimal service disruption
- Include automatic rollback mechanism for failed rotations
- Meet banking industry compliance standards (encryption at rest and in transit)

DELIVERABLES:
1) tap_stack.tf (all resources and outputs including Secrets Manager, Lambda, RDS, EventBridge, CloudTrail, CloudWatch, IAM in single file )
2) variables.tf (parameterize regions, rotation schedules, alert thresholds, RDS config)
3) provider.tf (secret ARNs, Lambda function names, RDS endpoints, CloudWatch dashboard URLs)
4) lambda/rotation-function.py (Lambda rotation logic with error handling and rollback)
5) iam-policies.json (least privilege policies for Lambda execution and Secrets Manager access)


OUTPUT FORMAT (IMPORTANT):
- Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:
```hcl
# tap_stack.tf
...