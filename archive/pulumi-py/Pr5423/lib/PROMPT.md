Hey dude, soo, we’d like you to build a Pulumi + Python solution that implements the details described below.
Keep it modular, and hands-on: Pulumi + Python only, multi-environment (dev, staging, prod), and enforce strict config consistency while allowing environment-specific sizing.

Requirements:

- Create a reusable construct/module that accepts environment-specific parameters (instance sizes, retention periods, replica counts) and is used by each environment stack.
- Deploy S3 buckets per environment with env-specific names and versioning enabled, consistent lifecycle policies, server-side encryption (AWS-managed keys / SSE-S3), and block all public access.
- Create DynamoDB tables per environment:
  - dev: on-demand billing
  - staging/prod: provisioned capacity with autoscaling; dev RCU/WCU 5/5, staging 25/25, prod 100/100.
  - Enable global replication so prod → staging is replicated for testing.
- Implement Lambda functions that process S3 objects and write to DynamoDB. The same ZIP package is reused across environments (single build artifact).
  - Runtime Latest python
  - Memory: prod 3GB, staging 1GB, dev 512MB
  - Lambdas: for each particular activity.
- Configure EventBridge rules to trigger the Lambdas on S3 object creation events; include DLQs per rule with environment-specific retention periods.
- IAM: create least-privilege roles/policies that are consistent across environments but reference env-scoped resources (S3 prefixes, DynamoDB ARNs, SQS DLQs).
- Validation: implement a config validation step during synthesis that checks critical settings match across environments (table schemas, lifecycle rules, tag values, replica counts) and fail/flag if mismatched.
- Outputs: generate environment-specific outputs (resource ARNs, endpoints, bucket names, table names).
- Deployment model: support parameterized deployments via environment variables or config files, and deploy each environment into a separate AWS account using assume-role credentials (one profile per env).
- Tagging: apply centralized tags on all resources: Environment, Project, ManagedBy.
- Extras/constraints:
  - EventBridge rules must include DLQs with env-specific retention periods.
  - S3 lifecycle rules must be consistent across envs (versioning + retention rules).
  - Validate and emit clear errors during synth if any environment deviates from the shared construct defaults.

Environment specifics to assume:

- AWS region us-east-1 for all environments.
- Three separate AWS envs (dev, staging, prod).
- DynamoDB global tables enable prod→staging replication for testing.
