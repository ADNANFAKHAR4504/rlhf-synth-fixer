I need to create a single, parameterized CloudFormation template that deploys consistent infrastructure across three environments — dev, staging, and production — while automatically customizing resources based on the selected environment.

Each environment should live in its own isolated VPC with non-overlapping CIDR ranges (10.0.0.0/16 for dev, 10.1.0.0/16 for staging, and 10.2.0.0/16 for production). Each VPC should include public and private subnets across two Availability Zones, NAT Gateways for private outbound access, and security groups that prevent traffic between environments.

The stack must deploy:

RDS PostgreSQL instances using environment-specific instance sizes (db.t3.micro for dev, db.t3.small for staging, db.m5.large for production) with daily snapshots retained for 1, 7, and 30 days respectively. Automatic pre-update snapshots are required for safety.

Auto Scaling groups for EC2 instances with minimum counts of 1 (dev), 2 (staging), and 4 (production), all behind Application Load Balancers configured with health check intervals of 30, 15, and 5 seconds depending on the environment.

S3 buckets (one per environment) with versioning enabled and lifecycle policies for data retention: 7 days for dev, 30 days for staging, and 90 days for production. These should follow strict naming conventions such as dev-artifacts-bucket or prod-logs-bucket.

IAM roles and policies enforcing least privilege and restricting production access to approved IAM principals only, using policy conditions to enforce access boundaries.

CloudWatch dashboards and alarms with environment-based thresholds, aggregating metrics from all environments into a centralized dashboard.

SNS topics for alerting, with distinct email subscriptions per environment.

The Environment parameter (dev, staging, prod) will drive all conditional logic using Mappings and Conditions to determine instance sizes, scaling limits, and retention policies. The template must not use nested stacks — everything should exist in a single CloudFormation file.

All resources should follow consistent naming and tagging conventions including tags for Environment, Project, and CostCenter. The stack should export key outputs (like VPC IDs, DB instance endpoints, and ALB DNS names) for each environment.

Finally, ensure the template:

Enforces encryption at rest for databases and S3 buckets.

Implements stack policies to prevent accidental deletion or updates in production.

Keeps all inter-resource communication private within the VPC using subnets and endpoints.

Uses Conditions to control environment-specific logic.

In short, I want a single CloudFormation template that cleanly deploys three isolated but identical environments (dev, staging, prod) with size, scaling, retention, and security differences managed through parameters and mappings — all ready for production deployment with full monitoring, compliance, and automated backups.
