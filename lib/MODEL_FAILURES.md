1. Replace all RETAIN removal policies with DESTROY and enable autoDeleteObjects on S3 buckets to ensure clean stack teardown in test environments.
2. Reuse the environmentSuffix prop from bin/tap.ts for all resource names/exports instead of region-prefixed naming; remove hardcoded multi-stack source/target constructs.
3. Simplify S3 cross-region replication: remove placeholder replication IAM and outputs; use a single encrypted bucket with lifecycle policies; avoid partial replication configs that hinder deletion.
4. Use inline Lambda code for processor/validator to avoid external assets and speed CI; set architecture to ARM_64 and runtime to nodejs18.x.
5. Constrain VPC to 2 AZs with one NAT and add S3/DynamoDB VPC endpoints only; skip extra endpoints to reduce cost/complexity.
6. Reduce CloudWatch Step Functions log retention to one month and set state machine timeout to 15 minutes to meet rollback and retention constraints.
7. Remove context-driven multi-region exports; export names should be environment-prefixed only and minimal.
8. Avoid Route 53 real domains; switch health check FQDN to an environment-scoped placeholder under example.local to prevent external dependencies.
9. Minimize IAM: attach only Lambda basic/VPC managed policies and grant specific resource permissions from constructs instead of broad statements.