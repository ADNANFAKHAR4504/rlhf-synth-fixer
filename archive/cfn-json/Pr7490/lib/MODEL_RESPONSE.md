# ECS Batch Processing System - CloudFormation Implementation

Complete CloudFormation JSON template for deploying a containerized batch processing system using Amazon ECS with Fargate.

## Architecture

- ECS Cluster with Container Insights enabled
- Three task definitions with X-Ray sidecar containers (data-ingestion, transaction-processing, report-generation)
- Three ECS services with exactly 2 tasks each
- Application Load Balancer for report-generation service
- Auto-scaling policies based on CPU utilization (70% scale up, 30% scale down)
- CloudWatch log groups with 30-day retention
- IAM roles with Secrets Manager and S3 permissions

## Resources Created

1. ECS Cluster with Fargate capacity providers
2. IAM roles (Task Execution Role, Task Role)
3. CloudWatch Log Groups (4 total)
4. Task Definitions (3 with X-Ray sidecars)
5. Security Groups (ECS tasks, ALB)
6. Application Load Balancer with target group
7. ECS Services (3 services)
8. Auto Scaling targets and policies (3 sets)

All resources include environmentSuffix for unique naming and are fully destroyable.

---

See complete implementation in `template.json`
