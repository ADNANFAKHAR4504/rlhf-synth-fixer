You are an expert Terraform engineer. Generate a brand-new, security-first, multi-region Terraform stack for the project “IaC - AWS Nova Model Breaking.”

Deliver exactly two files:

provider.tf — pins Terraform and AWS provider versions, sets up default and aliased providers (us-east-1, us-west-2), and configures secure S3/DynamoDB backend for remote state. No variables here.

lib/tap_stack.tf — contains all logic: variables, locals, data sources, resources, and outputs. No external modules or providers declared here.

Core requirements:

Multi-region VPCs with private/public subnets, NAT, and flow logs.

Bastion host (restricted SSH) and encrypted autoscaling app instances behind ALBs.

RDS in private subnets with encryption, backups, and least privilege security groups.

Encrypted S3 buckets with versioning and CloudFront over HTTPS.

VPC peering between regions and Route53 failover across ALBs.

CloudTrail enabled and encrypted; CloudWatch monitoring and alarms.

All IAM roles scoped with least privilege; consistent tagging applied.

Outputs include only safe values (VPC IDs, ALB DNS, RDS endpoints, etc.).

Return only the two files above, fully working Terraform HCL, nothing else.