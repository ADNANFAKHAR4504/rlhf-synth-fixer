# Model Failures

## Summary
The initial MODEL_RESPONSE does not fully align with the prompt and best practices reflected in the updated TapStack.yml. Below are the gaps and how the IDEAL_RESPONSE addresses them.

## Gaps vs. Prompt and Best Practices

- Missing console metadata
  - Issue: No `Metadata` → `AWS::CloudFormation::Interface` with `ParameterGroups`.
  - Impact: Poor parameter UX in the CloudFormation console.
  - Fix: Added `Metadata` with grouped parameters.

- Ingress not parameterized
  - Issue: Security group ingress hard-coded to `0.0.0.0/0`.
  - Impact: Harder to restrict access in different environments.
  - Fix: Introduced `AllowedCidr` parameter and used it for SG ingress on ports 80/22.

- Required global tagging not applied
  - Issue: Missing or inconsistent required tags across resources; used `Environment: !Ref EnvironmentName` and no `Owner`.
  - Impact: Non-compliance with governance requirement “Apply these tags to all resources: Environment: Test, Owner: DevOpsTeam”.
  - Fix: Applied `Environment: Test` and `Owner: DevOpsTeam` to all taggable resources (VPC, subnets, IGW, EIP/NAT, route tables, SG, log group, instance).

- Missing SSM access for EC2
  - Issue: EC2 role lacks `AmazonSSMManagedInstanceCore`.
  - Impact: No AWS Systems Manager Session Manager access (operational and security best practice).
  - Fix: Added `arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore` to `EC2Role.ManagedPolicyArns`.

## Additional Improvements Adopted
- Consistent tagging set preserved alongside project tags (kept `Project: TestEnvironment` where present).
- Retained detailed monitoring and CloudWatch Logs setup but standardized log group tagging.

## What Stayed Correct
- VPC, subnets, IGW, NAT Gateway, routes, and associations meet the networking requirements.
- EC2 instance configuration (AMI via SSM, `t2.micro`, detailed monitoring, user data for awslogs + httpd).
- CloudWatch log group with retention (14 days).
- IAM role includes CloudWatch agent and S3 access as required by the prompt.
