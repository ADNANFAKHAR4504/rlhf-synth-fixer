Create a production-ready AWS CDKTF TypeScript project in us-west-2 with only:

lib/tap-stack.ts (main stack wiring modules)

lib/modules.ts (reusable modules: ASG, ELB, RDS, S3, IAM, CloudWatch, SNS)

Requirements are:

VPC use default spanning at least two Availability Zones

Auto Scaling Group with EC2 instances across AZs, detailed monitoring, CPU-based scaling policies

Elastic Load Balancer distributing traffic across the ASG

CloudWatch alarms on CPU utilization triggering scaling actions and notifying the operations team via SNS

RDS configured Multi-AZ with automated backups and credentials stored in Secrets Manager

S3 bucket for logs with versioning enabled

IAM roles designed with least privilege for EC2, RDS, and other services

Tags applied to all resources with Environment=Production

Constraints:

Only two TypeScript files must be output with filename headers

Code must run with cdktf synth without placeholders or TODOs

Must be modular, clean, and deployable end to end