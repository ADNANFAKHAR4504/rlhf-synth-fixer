# Healthcare SaaS Cross-Region Disaster Recovery Implementation Brief

We need a Python-based AWS CDK project that stands up a HIPAA-ready disaster recovery footprint for our healthcare platform. Think of it as taking the current single-region stack and stretching it across us-east-1 and us-west-2 with an active/passive posture.

## What Success Looks Like
- Primary traffic stays in us-east-1 while an identical standby stack waits in us-west-2.
- Aurora Serverless v2 (PostgreSQL) runs as a Global Database so the DR region always holds a warm copy.
- Patient data lives in encrypted S3 buckets with versioning, access logs, and cross-region replication already wired.
- ECS Fargate services fronted by ALBs run in both regions, sharing the same task definitions, security groups, and health checks.
- Route53 keeps an eye on the primary ALB and fails over to DR automatically.
- CloudWatch, SNS, CloudTrail, VPC Flow Logs, and AWS Backup provide the observability, alerting, and retention trail we need for auditors.

## Guardrails and Naming
- Every resource name should include an `environmentSuffix` (for example `healthcare-data-prod`) so we can host multiple environments side by side.
- Plan for deployments in either region; pull the target region from context or environment variables rather than hardcoding it.
- Keep deployment time reasonable: one NAT Gateway per region, Aurora Serverless v2, and sensible CloudFormation timeouts.

## Architecture Checklist
- **Networking**: Dual-AZ VPC per region, public subnets for ALBs, private subnets for ECS and Aurora, plus VPC endpoints for S3 and other frequent services.
- **Security**: TLS everywhere, customer-managed KMS keys with rotation, CloudTrail, Flow Logs, and IAM roles trimmed to least privilege.
- **Storage**: Data bucket with CRR to DR, lifecycle policies for cost control, dedicated bucket for access logs.
- **Database**: Aurora Serverless v2 Global Database, automatic backups with at least seven days of retention, encryption at rest via KMS.
- **Compute**: ECS Fargate services behind ALBs, HTTPS listeners, access logging, health checks tuned for steady deployments.
- **DNS**: Route53 hosted zone, health checks, and failover routing records that point to the regional ALBs.
- **Monitoring**: CloudWatch alarms for database, ALB, and ECS metrics; SNS topic for alerts; log groups with a 14-day retention.
- **Backups**: AWS Backup plan that covers Aurora and ships cross-region copies.

## Deliverables
- CDK constructs under `lib/`: `tap_stack`, `networking_construct`, `database_construct`, `storage_construct`, `compute_construct`, `dns_construct`, `monitoring_construct`, `security_construct`, and `backup_construct`. Each construct should inherit from `Construct`, describe its dependencies clearly, and use type hints.
- Code samples provided in the response should be production-ready: proper imports, meaningful comments where the intent is not obvious, error handling for long-running operations, and all compliance hooks enabled by default.

## Final Expectations
By the end, we should have an end-to-end CDK solution that can be copy/pasted into a fresh repo, deployed in either region, and relied upon for DR drills without further tweaks. The documentation in the final response should walk through each file, explain the important choices, and give enough context that another engineer could pick it up next week and keep iterating.
