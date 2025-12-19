# Project brief

We need a single Terraform file called `tap_stack.tf` that brings up a small, production‑ready stack on AWS. The stack runs an ECS Fargate service behind an Application Load Balancer, uses an RDS Postgres database in private subnets, stores secrets in AWS Secrets Manager, and includes basic monitoring and autoscaling. Keep it simple, secure by default, and ready for zero‑downtime deployments.

Key constraints

- Provider and backend are defined in `provider.tf`; do not add provider/backend blocks to `tap_stack.tf`.
- Use a single region exposed via `variable "aws_region"` (default `us-west-2`) and reference it consistently.
- Everything lives in `tap_stack.tf`: variables, locals, data sources, resources, and outputs.
- Favor least‑privilege IAM, encryption at rest, multi‑AZ where appropriate, and consistent tagging.

Network

- Create a VPC with public and private subnets across at least two AZs.
- Public subnets have an Internet Gateway; private subnets route through a NAT Gateway.
- Associate route tables correctly.
  - Security groups:
  - ALB allows inbound 80/443 from `var.allowed_cidrs`.
  - ECS service (in private subnets) only accepts traffic from the ALB SG on the app port.
  - RDS allows inbound on the DB port only from the ECS tasks’ SG.

Security defaults

- Enable account‑level EBS encryption by default (`aws_ebs_encryption_by_default`).
- Encrypt RDS storage. Use CloudWatch Logs for application logs.

Compute (ECS)

- Create an ECS cluster for Fargate.
- Define a task execution role and a task role (least privilege).
- Send container logs to CloudWatch using the awslogs driver.
- Place an ALB in public subnets. Use IP target type, health checks, and separate target groups for blue/green.

Zero‑downtime deployments

- Configure CodeDeploy (ECS) for blue/green: a CodeDeploy app and deployment group using two target groups, plus prod and test listeners. Include a termination wait time and traffic shifting. The ECS service must use `deployment_controller { type = "CODE_DEPLOY" }`.

Autoscaling

- Add ECS service target tracking policies for CPU and memory.

Data layer

- RDS Postgres in private subnets, Multi‑AZ enabled, automated backups and a maintenance window, encrypted storage. Output the DB endpoint only (no secrets).

Secrets

- Store the DB password and any app config in Secrets Manager.
- Reference secrets from the task definition via `secrets`.
- Allow the task role to read only those specific secret ARNs.

Monitoring

- CloudWatch log group for ECS tasks (set a sensible retention).
- Alarms: ALB 5XX errors, ECS CPU high, ECS memory high, RDS CPU high, RDS free storage low. Use reasonable thresholds and short descriptions.

Structure in a single file

- Use clear comment headers to organize sections (e.g., `module: vpc`, `module: ecs`, `module: codedeploy`, `module: rds`, `module: secrets`, `module: monitoring`). Reuse names/ARNs via locals.

Variables (with defaults where practical)

- `aws_region` (default `us-west-2`)
- `project_name` (default `nova-model-breaking`)
- `environment` (default `Production`)
- `allowed_cidrs` (list, default `["0.0.0.0/0"]`)
- `db_engine` (default `postgres`)
- `db_engine_version` (default `15.5`)
- `db_instance_class` (default `db.t3.medium`)
- `db_allocated_storage` (default `50`)
- `container_image` (can be a public placeholder)
- `container_port` (default `8080`)
- `desired_count` (default `2`)
- Any other useful knobs (e.g., ALB idle timeout, health check path).

Outputs

- VPC ID; public and private subnet IDs
- ALB DNS name
- ECS service name and ARN
- CodeDeploy app and deployment group names
- RDS endpoint
- CloudWatch log group name(s)

Deliverable

- One file: `tap_stack.tf` (valid HCL), ready to pass `terraform validate` in a clean AWS account, with no provider/backend blocks inside it.
