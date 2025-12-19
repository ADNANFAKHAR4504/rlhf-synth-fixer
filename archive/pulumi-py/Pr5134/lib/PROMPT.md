# FastCart Order Processing Platform

FastCart is preparing for the next big shopping season and needs a resilient, event-driven backend to process orders without bottlenecks. We already standardized on Pulumi for infrastructure provisioning, so this update must ship as Pulumi Python code in the `eu-central-1` region.

## Objectives
- Stream incoming orders through Amazon Kinesis and fan them out to compute.
- Persist order data in Amazon RDS for long-term storage while keeping hot data in ElastiCache Redis.
- Run the application tier on Amazon ECS Fargate with containers living in private subnets.
- Keep operational visibility high with CloudWatch logging and alarms.

## Requirements
1. **Technology guardrails**
   - Platform: Pulumi
   - Language: Python
   - Region: `eu-central-1`
   - Apply a deterministic `environment_suffix` to every resource name/tag.

2. **Networking & security**
   - Provision a VPC with two public and two private subnets spread across distinct AZs.
   - Attach an Internet Gateway and a single NAT Gateway so private workloads can reach the internet.
   - Create dedicated security groups for ECS tasks, RDS, and Redis with least-privilege rules.
   - Issue a customer-managed KMS key and reuse it for every encrypted service component.

3. **Core services**
   - Amazon Kinesis Data Stream with at least two shards and KMS encryption.
   - Amazon ECS Fargate service (minimum desired count of two tasks) using private subnets only.
   - Amazon RDS PostgreSQL instance (db.t3.micro) with storage encryption, backups, and CloudWatch log exports.
   - Amazon ElastiCache Redis (replication group) with encryption at rest and in transit, plus an auth token.
   - AWS Secrets Manager secret that stores the database credentials (rotation is optional).
   - Amazon ECR repository for the order processor container image.

4. **Observability**
   - CloudWatch Log Group for ECS tasks, encrypted with the same KMS key and a sensible retention period.
   - CloudWatch alarms for Kinesis iterator age and RDS CPU utilization.

5. **Outputs & tooling**
   - Emit rich stack outputs (IDs, ARNs, endpoints, etc.) and persist them to `cfn-outputs/flat-outputs.json` for downstream automation.
   - Supply unit tests with Pulumi mocks and integration tests that consume the generated outputs.

## Testing Expectations
- Unit tests should cover resource configuration without reaching AWS.
- Integration tests may assume a deployed stack and valid AWS credentials; skip gracefully when unavailable.

## Deliverables
- Pulumi Python module that encapsulates the entire stack.
- Updated tests under `tests/unit` and `tests/integration`.
- Documentation of exported outputs so downstream teams know what to expect.
