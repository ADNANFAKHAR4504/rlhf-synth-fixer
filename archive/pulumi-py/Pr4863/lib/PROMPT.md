Create a Pulumi + Python code that builds a prod-ready, highly-available AWS environment that is focused on failure recovery and operational resilience. Keep the default region set to us-west-1\us-east-1 but allow it to be easily configurable.

Key requirements should be:

- Networking, VPC with public + private subnets across ≥3 AZs, IGW for public subnets, NAT Gateways designed for AZ HA, route tables and associations.
- Compute & scaling, Launch Templates + AutoScalingGroups across AZs in private subnets, health checks, target-tracking scaling, automatic replacement of unhealthy instances.
- IAM, Minimal, least-privilege IAM roles/instance profiles for Pulumi and app instances (e.g., S3 read-only, CloudWatch PutMetric, Secrets Manager access).
- Security, Security Groups/NACLs with least-privilege rules; app instances in private subnets with controlled egress through NAT.
- Logging & monitoring, CloudWatch Logs (log groups/retention), metrics, CloudWatch alarms (CPU utilization, instance health), SNS alerting; VPC Flow Logs for network audit.
- Recovery & HA, Multi-AZ NAT/ASG/subnets, ASG health checks & lifecycle for auto-recovery, documented backup strategy for stateful services (RDS snapshots or S3 lifecycle).
- Secrets & config, Use Pulumi config + Pulumi secrets, integrate AWS Secrets Manager or SSM Parameter Store for app secrets.
- Modularity & quality with, clean docstrings/comments.
- Automation & safety, deploy/teardown automation, basic validation and error handling in scripts, tag schemes applied consistently.

Please make sure you regard the following: No hard-coded secrets. Use Pulumi secrets/Random generation, AWS Secrets Manager or SSM as well as make sure to Keep the code modular and human-readable.
